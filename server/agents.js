// Agent fleet registry, run history and health evaluation ("degrade loudly" applied to the fleet).
const fs = require('fs');
const path = require('path');
const cron = require('./cron');
const root = path.join(__dirname, '..');
const dataDir = () => process.env.AGENTS_DATA_DIR || path.join(root, 'data', 'agents');
const agentsDir = () => process.env.AGENTS_DIR || path.join(root, 'agents');
const GRACE = 10 * 60000, MAX_RUNS = 30, RUNNING_TTL = 20 * 60000;
const ID = /^[a-z0-9][a-z0-9-]*$/;
const bad = (msg, code = 400) => Object.assign(new Error(msg), { code });

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { return d; } };
function writeJson(f, v) { fs.mkdirSync(path.dirname(f), { recursive: true }); const t = f + '.tmp'; fs.writeFileSync(t, JSON.stringify(v, null, 2)); fs.renameSync(t, f); }

function registry() {
  return fs.readdirSync(agentsDir(), { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(agentsDir(), d.name, 'schedule.json')))
    .map((d) => ({ ...readJson(path.join(agentsDir(), d.name, 'schedule.json'), {}), ported: fs.existsSync(path.join(agentsDir(), d.name, 'prompt.md')) }));
}
const find = (id) => { if (!ID.test(String(id))) throw bad('invalid agent id'); const a = registry().find((x) => x.id === id); if (!a) throw bad('unknown agent', 404); return a; };

const runsFile = (id) => path.join(dataDir(), 'runs', id + '.json');
const runs = (id) => readJson(runsFile(id), []);
function recordRun(id, run) { const all = [run, ...runs(id)].slice(0, MAX_RUNS); writeJson(runsFile(id), all); return run; }
const enabledOverrides = () => readJson(path.join(dataDir(), 'enabled.json'), {});
const runningFile = (id) => path.join(dataDir(), 'running', id + '.json');
const markRunning = (id) => writeJson(runningFile(id), { startedAt: Date.now(), pid: process.pid });
const clearRunning = (id) => { try { fs.unlinkSync(runningFile(id)); } catch (_) {} };
const isRunning = (id, now) => { const r = readJson(runningFile(id), null); return !!r && now - r.startedAt < RUNNING_TTL; };

function enabledFor(a) { const o = enabledOverrides(); return Object.prototype.hasOwnProperty.call(o, a.id) ? !!o[a.id] : !!a.enabled; }

const fmt = (ms, tz) => new Date(ms).toLocaleString('en-GB', { timeZone: tz, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// Pure: everything needed to judge one agent. Flags are loud by design.
function evaluate(a, history, enabled, now, running = false, enabledAt = 0) {
  const tz = a.tz || 'Asia/Jerusalem';
  const out = { id: a.id, name: a.name, group: a.group, schedule: a.schedule, cron: a.cron, ported: a.ported, enabled, running, nextRun: null, lastRun: null, flag: null };
  const last = history[0];
  if (last) out.lastRun = { at: last.startedAt, ok: last.ok, delivery: last.delivery, summary: last.summary || '', error: last.error || '', dryRun: !!last.dryRun, durationMs: last.durationMs };
  if (!a.ported) return out;
  if (enabled) out.nextRun = cron.next(a.cron, now, tz);
  if (!enabled) return out;
  const [f1, f2] = cron.prevFires(a.cron, now, tz, 2);
  // Only fires after the agent was enabled can be "missed" (a dry-run before enabling is expected).
  if (!last) { if (f1 && f1 > enabledAt && now - f1 > GRACE) out.flag = { level: 'red', reason: `Never run (was due ${fmt(f1, tz)})` }; return out; }
  if (last.ok === false) out.flag = { level: 'red', reason: `Last run failed: ${last.error || 'unknown error'}` };
  else if (last.delivery === 'failed') out.flag = { level: 'red', reason: `Delivery failed: ${last.error || last.summary || 'no detail'}` };
  else if (f2 && f2 > enabledAt && last.startedAt < f2 - GRACE) out.flag = { level: 'red', reason: `Missed its last 2 scheduled runs (last ran ${fmt(last.startedAt, tz)})` };
  else if (last.delivery === 'unknown') out.flag = { level: 'amber', reason: 'Finished but reported no result, so delivery is unconfirmed' };
  return out;
}

function list(now = Date.now()) {
  const at = readJson(path.join(dataDir(), 'enabled-at.json'), {});
  return registry().map((a) => evaluate(a, runs(a.id), enabledFor(a), now, isRunning(a.id, now), at[a.id] || 0));
}

// Enabling needs a ported agent and at least one clean dry-run on record ("--dry-run before enabling").
function setEnabled(id, enabled) {
  const a = find(id);
  if (enabled) {
    if (!a.ported) throw bad('This agent is not ported yet (no prompt.md), so it cannot be enabled');
    if (!runs(id).some((r) => r.dryRun && r.ok && r.delivery !== 'failed')) throw bad('Run a successful dry-run first, then enable it');
  }
  const o = enabledOverrides(); o[id] = !!enabled; writeJson(path.join(dataDir(), 'enabled.json'), o);
  if (enabled) { const f = path.join(dataDir(), 'enabled-at.json'); const at = readJson(f, {}); at[id] = Date.now(); writeJson(f, at); }
  return { id, enabled: !!enabled };
}

module.exports = { registry, find, runs, recordRun, markRunning, clearRunning, isRunning, enabledFor, evaluate, list, setEnabled, agentsDir, root };
