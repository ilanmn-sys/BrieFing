// Slack through Claude Code's Slack connector. The connector has no unread markers, so "needs you" is inferred:
// a DM needs you when its latest message is not yours (and not a bot); a channel shows how many messages others
// posted in the last 2 days. Search results come back as structured text, parsed here.
const claude = require('./claude');
const store = require('./store');
const { config, today } = require('../lib');
const { isDryRun } = require('../done');

const DM_DAYS = 7, CH_DAYS = 2, MAX_PAGES = 5;
const dayMinus = (d, n) => { const t = new Date(`${d}T12:00:00Z`); t.setUTCDate(t.getUTCDate() - n); return t.toISOString().slice(0, 10); };

// Pure: the connector's search text -> [{ channel, channelName, participants:[{name,id}], from, fromId, bot, ts, time, permalink, replyCount, text }]
function parseSearch(raw) {
  let text = raw;
  try { const j = JSON.parse(raw); text = typeof j === 'string' ? j : j.results || ''; } catch (_) {} // results arrive JSON-wrapped (trap 1)
  const cursor = (String(raw).match(/use cursor [`'"]?([A-Za-z0-9=_-]+)/) || [])[1] || null;
  const out = [];
  for (const block of String(text).split(/\n### Result \d+ of \d+\n/).slice(1)) {
    const f = (re) => (block.match(re) || [])[1];
    const chan = block.match(/^Channel: (.*?) \(ID: ([A-Z0-9]+)\)/m);
    const from = block.match(/^From: (.*?)\(ID: ([A-Z0-9]+)\)(.*)$/m);
    const parts = [...String(f(/^Participants: (.*)$/m) || '').matchAll(/([^,(]+?) \(ID: ([A-Z0-9]+)\)/g)].map((m) => ({ name: m[1].trim(), id: m[2] }));
    const body = (block.split(/^Text: ?\n?/m)[1] || '').replace(/\n---\s*$/s, '').trim();
    out.push({ channelName: chan ? chan[1] : '', channel: chan ? chan[2] : '', participants: parts,
      from: from ? from[1].replace(/<[^>]*>/, '').trim() : '', fromId: from ? from[2] : '', bot: from ? /\[BOT\]/.test(from[3]) : false,
      ts: f(/^Message_ts: ([\d.]+)/m) || '', time: f(/^Time: (.*)$/m) || '', permalink: (f(/^Permalink: \[link\]\((.*?)\)/m) || '').replace(/\\\//g, '/'),
      replyCount: Number(f(/^Reply count: (\d+)/m) || 0), text: body.slice(0, 600) });
  }
  return { messages: out, cursor };
}

const dmSpec = (todayStr, cursor) => ({ key: `slack:dm:${cursor || 'first'}`, server: 'Slack', tool: 'slack_search_public_and_private',
  args: { filters: `after:${dayMinus(todayStr, DM_DAYS)}`, channel_types: 'im,mpim', sort: 'timestamp', limit: 20, include_context: false, natural_language_query: '', ...(cursor ? { cursor } : {}) } });
const channelSpec = (todayStr, id) => ({ key: `slack:ch:${id}`, server: 'Slack', tool: 'slack_search_public_and_private',
  args: { filters: `in:<#${id}> after:${dayMinus(todayStr, CH_DAYS)}`, sort: 'timestamp', limit: 20, include_context: false, natural_language_query: '' } });

// Pure: parsed results -> the same shape slackApi.load() returns.
function build(dmMessages, channelResults, myId) {
  const byChan = new Map();
  for (const m of dmMessages) { if (!m.channel || m.channel === config.pepper.dmChannel) continue; if (!byChan.has(m.channel)) byChan.set(m.channel, []); byChan.get(m.channel).push(m); }
  const dms = [];
  for (const [channel, msgs] of byChan) {
    msgs.sort((a, b) => Number(a.ts) - Number(b.ts));
    const lastMine = msgs.map((m) => m.fromId).lastIndexOf(myId);
    const un = msgs.slice(lastMine + 1).filter((m) => m.fromId !== myId && !m.bot);
    if (!un.length) continue;
    const others = (msgs[0].participants || []).filter((p) => p.id !== myId);
    dms.push({ channel, userId: others.length === 1 ? others[0].id : null, who: others.map((p) => p.name).join(', ') || un[0].from, count: un.length,
      messages: un.slice(-5).map((m) => ({ ts: m.ts, from: m.from, text: m.text })), lastTs: un[un.length - 1].ts });
  }
  dms.sort((a, b) => Number(b.lastTs) - Number(a.lastTs));
  const channels = [], notFound = [];
  for (const { name, id, result } of channelResults) {
    if (!result) { notFound.push(`${name} (not read)`); continue; }
    const n = result.messages.filter((m) => m.fromId !== myId && !m.bot).length;
    if (n) channels.push({ id, name, count: n, capped: result.messages.length >= 20 });
  }
  return { dms, channels, notFound };
}

async function load() {
  const snap = store.read('slack');
  if (!snap) throw new store.SnapshotMissing('no Slack snapshot yet: run "node scripts/snapshot.js"');
  return { ...snap.data, dryRun: isDryRun(), source: 'connectors', snapshotAt: snap.at };
}

// Live reads/writes (each is one short claude -p run).
async function one(spec, label) { const r = (await claude.fetchAll([{ key: 'x', ...spec }], { label })).get('x'); if (!r.ok) throw new Error(r.error); return r.result; }
async function history(channelId, limit = 60) { return one({ server: 'Slack', tool: 'slack_read_channel', args: { channel_id: channelId, limit, response_format: 'concise' } }, 'slack read'); }
async function sendDm(userId, text) {
  if (!/^U[A-Z0-9]+$/.test(String(userId))) throw new Error('DM target must be a user id (user:<id>), never a channel id');
  const res = await one({ server: 'Slack', tool: 'slack_send_message', args: { channel_id: userId, message: String(text) } }, 'slack send');
  const ts = (String(res).match(/p(\d{10})(\d{6})/) || []).slice(1).join('.') || (String(res).match(/"ts"\s*:\s*"([\d.]+)"/) || [])[1];
  if (/error|not_in_channel|failed/i.test(res) && !ts) throw new Error(`slack send: ${String(res).slice(0, 200)}`);
  return ts || 'sent';
}
async function latestFromPepper() {
  const raw = await one({ server: 'Slack', tool: 'slack_search_public_and_private', args: { filters: `in:<#${config.pepper.dmChannel}> from:<@${config.pepper.userId}>`, channel_types: 'im', sort: 'timestamp', limit: 1, include_context: false, natural_language_query: '' } }, 'slack pepper');
  const m = parseSearch(raw).messages[0];
  return m ? { ts: m.ts, text: m.text } : null;
}

module.exports = { parseSearch, build, dmSpec, channelSpec, load, history, sendDm, latestFromPepper, DM_DAYS, CH_DAYS, MAX_PAGES, dayMinus };
