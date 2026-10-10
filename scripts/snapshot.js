#!/usr/bin/env node
// Refreshes the dashboard's data through Claude Code's connectors (used for every connector that has no API token).
//   node scripts/snapshot.js [--force]     --force runs outside working hours too
// launchd runs it every 15 minutes (com.ilan.cc.snapshot). It is read-only: it never writes to monday, Gmail or Slack.
// Each round is ONE `claude -p` run that makes all the calls still needed; dependent calls (next pages, long
// threads, updates of blocked items) come in the next round. monday reads replay the dashboard's own GraphQL.
const fs = require('fs');
const path = require('path');
const { config, today } = require('../server/lib');
const { viaClaude } = require('../server/via/mode');
const store = require('../server/via/store');
const claude = require('../server/via/claude');
const viaMonday = require('../server/via/monday');
const viaGmail = require('../server/via/gmail');
const viaCal = require('../server/via/calendar');
const viaSlack = require('../server/via/slack');

const ROUNDS = 5, MAX_FULL_THREADS = 25, LOCK_MS = 20 * 60000;
const force = process.argv.includes('--force');
const tz = config.me.tz;

function inWorkHours(now = new Date()) {
  const w = (config.dataMode && config.dataMode.workHours) || { from: 7, to: 21, days: [0, 1, 2, 3, 4, 5] };
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', weekday: 'short', hourCycle: 'h23' }).formatToParts(now).map((x) => [x.type, x.value]));
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return w.days.includes(day) && +p.hour >= w.from && +p.hour < w.to;
}

const parse = (r) => { if (!r || !r.ok) return null; try { return JSON.parse(r.result); } catch (_) { return null; } };

async function mondayReaders() {
  // The same reads the dashboard makes, so every query it will ask is in the cache.
  const readers = { tasks: () => require('../server/tasksApi').load(), requests: () => require('../server/requestsApi').load(), strategy: () => require('../server/strategyApi').load() };
  const errors = [];
  for (const [name, fn] of Object.entries(readers)) {
    try { await fn(); } catch (e) { if (!(e instanceof viaMonday.Miss)) errors.push(`${name}: ${e.message}`); }
  }
  return errors;
}

async function main() {
  const use = { monday: viaClaude('monday'), gmail: viaClaude('gmail'), calendar: viaClaude('calendar'), slack: viaClaude('slack'), drive: viaClaude('drive') };
  if (!Object.values(use).some(Boolean)) { console.log('snapshot: every connector has an API token; nothing to do'); return 0; }
  if (!force && !inWorkHours()) { console.log('snapshot: outside working hours, skipping (use --force)'); return 0; }
  fs.mkdirSync(store.dir(), { recursive: true });
  const lock = path.join(store.dir(), '.lock');
  try { if (Date.now() - fs.statSync(lock).mtimeMs < LOCK_MS) { console.log('snapshot: another run is in progress, skipping'); return 0; } } catch (_) {}
  fs.writeFileSync(lock, String(process.pid));
  try { return await snapshot(use); } finally { try { fs.unlinkSync(lock); } catch (_) {} }
}

async function snapshot(use) {
  const t = today(), fresh = new Map(), mondayFresh = new Map(), started = Date.now();
  const channels = config.slackChannels.map((c) => c.replace(/^#/, '')).map((name) => ({ name, id: (config.slackChannelIds || {})[name] })).filter((c) => c.id);
  let mondayErrors = [], rounds = 0;
  for (; rounds < ROUNDS; rounds++) {
    const specs = [];
    if (use.monday) {
      const c = viaMonday.collect(mondayFresh);
      mondayErrors = await mondayReaders();
      specs.push(...viaMonday.stopCollecting().misses.values());
    }
    if (use.gmail) {
      if (!fresh.has('gmail:search')) specs.push(viaGmail.searchSpec());
      else for (const id of viaGmail.needFull(parse(fresh.get('gmail:search'))).slice(0, MAX_FULL_THREADS)) if (!fresh.has(`gmail:thread:${id}`)) specs.push(viaGmail.threadSpec(id));
    }
    if (use.calendar && !fresh.has('calendar:events')) specs.push(viaCal.spec(t, tz));
    if (use.slack) {
      let cursor = null, page = 0;
      for (; page < viaSlack.MAX_PAGES; page++) {
        const k = `slack:dm:${cursor || 'first'}`;
        if (!fresh.has(k)) { specs.push(viaSlack.dmSpec(t, cursor)); break; }
        const r = fresh.get(k); if (!r.ok) break;
        cursor = viaSlack.parseSearch(r.result).cursor; if (!cursor) break;
      }
      for (const ch of channels) if (!fresh.has(`slack:ch:${ch.id}`)) specs.push(viaSlack.channelSpec(t, ch.id));
    }
    if (use.drive && !fresh.has('drive:recent')) specs.push({ key: 'drive:recent', server: 'Google_Drive', tool: 'list_recent_files', instruction: 'list the single most recently modified file (one result is enough; this is a connection check).' });
    if (!specs.length) break;
    console.log(`snapshot round ${rounds + 1}: ${specs.length} call(s)`);
    const res = await claude.fetchAll(specs, { label: 'snapshot' });
    for (const s of specs) {
      const r = res.get(s.key); fresh.set(s.key, r);
      if (s.server === 'monday_com') mondayFresh.set(s.key, viaMonday.toGql(r));
    }
  }

  const report = {};
  // monday: the replayed answers become the cache the dashboard reads.
  if (use.monday) {
    const bad = [...mondayFresh.values()].filter((v) => v.errors).map((v) => JSON.stringify(v.errors).slice(0, 200));
    const errs = [...mondayErrors, ...bad];
    const cache = store.read('monday-cache', {}), now = new Date().toISOString();
    for (const [k, v] of mondayFresh) if (!v.errors) cache[k] = { at: now, value: v };
    for (const [k, v] of Object.entries(cache)) if (Date.now() - Date.parse(v.at) > 2 * 86400000) delete cache[k];
    store.write('monday-cache', cache);
    report.monday = errs.length ? { ok: false, error: errs.join(' | ') } : { ok: true, detail: `${mondayFresh.size} queries` };
  }
  if (use.gmail) {
    const search = parse(fresh.get('gmail:search'));
    if (!search) report.gmail = { ok: false, error: (fresh.get('gmail:search') || {}).error || 'search_threads failed' };
    else {
      const full = new Map(); for (const [k, r] of fresh) if (k.startsWith('gmail:thread:') && parse(r)) full.set(k.slice(13), parse(r));
      const data = viaGmail.build(search, full);
      store.write('gmail', { at: new Date().toISOString(), data });
      const partial = data.threads.filter((x) => !x.complete).length;
      report.gmail = { ok: true, detail: `${data.threads.length} threads${partial ? `, ${partial} long threads only partly read` : ''}` };
    }
  }
  if (use.calendar) {
    const r = fresh.get('calendar:events'), j = parse(r);
    if (!j) report.calendar = { ok: false, error: (r && r.error) || 'list_events returned no JSON' };
    else { const items = viaCal.events(j); store.write('calendar', { at: new Date().toISOString(), data: { items } }); report.calendar = { ok: true, detail: `${items.length} events` }; }
  }
  if (use.slack) {
    const dmMsgs = [], errs = [];
    for (const [k, r] of fresh) if (k.startsWith('slack:dm:')) { if (r.ok) dmMsgs.push(...viaSlack.parseSearch(r.result).messages); else errs.push(r.error); }
    const chans = channels.map((ch) => { const r = fresh.get(`slack:ch:${ch.id}`); if (r && !r.ok) errs.push(`${ch.name}: ${r.error}`); return { ...ch, result: r && r.ok ? viaSlack.parseSearch(r.result) : null }; });
    if (!fresh.get('slack:dm:first') || !fresh.get('slack:dm:first').ok) report.slack = { ok: false, error: errs[0] || 'DM search failed' };
    else {
      const data = viaSlack.build(dmMsgs, chans, config.me.slackUserId);
      store.write('slack', { at: new Date().toISOString(), data: { ...data, scanned: new Set(dmMsgs.map((m) => m.channel)).size, truncated: false } });
      report.slack = { ok: true, detail: `${data.dms.length} DMs need you, ${data.channels.length} channels active${errs.length ? `; ${errs.length} channel(s) not read` : ''}` };
    }
  }
  if (use.drive) { const r = fresh.get('drive:recent'); report.drive = r && r.ok ? { ok: true } : { ok: false, error: (r && r.error) || 'not checked' }; }

  for (const [source, s] of Object.entries(report)) store.setSource(source, s);
  // Warm the email triage so the Email tab opens instantly (completions are cached for 6 hours).
  if (report.gmail && report.gmail.ok) { try { await require('../server/emailApi').load(); } catch (e) { console.log(`email triage warm-up failed: ${e.message}`); } }

  const failed = Object.entries(report).filter(([, s]) => !s.ok);
  for (const [k, s] of Object.entries(report)) console.log(`${k}: ${s.ok ? 'ok' : 'FAILED'}${s.detail ? ' (' + s.detail + ')' : ''}${s.error ? ' ' + s.error : ''}`);
  console.log(`snapshot: ${rounds} round(s), ${Math.round((Date.now() - started) / 1000)}s${failed.length ? `, ${failed.length} source(s) failed` : ''}`);
  return failed.length ? 1 : 0;
}

if (require.main === module) main().then((c) => process.exit(c), (e) => { console.error('snapshot: ' + (e.stack || e.message)); process.exit(1); });
module.exports = { main, inWorkHours };
