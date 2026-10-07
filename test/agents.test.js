const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agents-'));
process.env.AGENTS_DIR = path.join(tmp, 'agents'); process.env.AGENTS_DATA_DIR = path.join(tmp, 'data');
const cron = require('../server/cron');
const agents = require('../server/agents');
const TZ = 'Asia/Jerusalem';
const NOW = Date.parse('2026-10-06T08:00:00Z'); // Tue 06/10 11:00 in Jerusalem

const mk = (id, o = {}, files = {}) => {
  const d = path.join(process.env.AGENTS_DIR, id); fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'schedule.json'), JSON.stringify({ id, name: id, group: 'g', cron: '0 7-12 * * 0-4', tz: TZ, enabled: false, ...o }));
  for (const [f, c] of Object.entries(files)) fs.writeFileSync(path.join(d, f), c);
};
const H = 3600000;

test('cron: next/prev in the configured timezone, steps, dow, dom, months', () => {
  const at = (t) => new Date(t).toLocaleString('en-GB', { timeZone: TZ, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  assert.equal(at(cron.next('0 7-12 * * 0-4', NOW, TZ)), 'Tue 06/10, 12:00');
  assert.deepEqual(cron.prevFires('0 7-12 * * 0-4', NOW, TZ, 2).map(at), ['Tue 06/10, 11:00', 'Tue 06/10, 10:00']);
  assert.equal(at(cron.next('0 9-18/2 * * 0-4', NOW, TZ)), 'Tue 06/10, 13:00');
  assert.equal(at(cron.next('0 8 * * 0', NOW, TZ)), 'Sun 11/10, 08:00');             // weekly
  assert.equal(at(cron.next('0 9 1 * *', NOW, TZ)), 'Sun 01/11, 09:00');             // monthly
  assert.equal(at(cron.next('0 9 1 1,4,7,10 *', NOW, TZ)), 'Fri 01/01, 09:00');      // quarterly
  assert.equal(at(cron.next('0 8 * * 0-4', Date.parse('2026-10-08T10:00:00Z'), TZ)), 'Sun 11/10, 08:00'); // Thu -> skips Fri/Sat
  assert.throws(() => cron.parse('* * *'), /5 fields/); assert.throws(() => cron.parse('61 * * * *'), /bad cron/);
});

test('every shipped schedule.json parses and has a next run', () => {
  const real = path.join(__dirname, '..', 'agents');
  const ids = fs.readdirSync(real).filter((d) => fs.existsSync(path.join(real, d, 'schedule.json')));
  assert.equal(ids.length, 19); // morning-board-task-sync dropped 2026-10-07
  for (const id of ids) { const s = JSON.parse(fs.readFileSync(path.join(real, id, 'schedule.json'))); assert.ok(cron.next(s.cron, NOW, s.tz), id); assert.equal(s.enabled, false); }
});

test('evaluate: not ported / disabled agents carry no flag and no next run', () => {
  const a = { id: 'x', name: 'x', cron: '0 7-12 * * 0-4', tz: TZ };
  assert.equal(agents.evaluate({ ...a, ported: false }, [], true, NOW).flag, null);
  const d = agents.evaluate({ ...a, ported: true }, [], false, NOW);
  assert.equal(d.flag, null); assert.equal(d.nextRun, null);
});

test('evaluate: never run, failed, delivery failed, stale (2 missed), unknown result, healthy', () => {
  const a = { id: 'x', name: 'x', cron: '0 7-12 * * 0-4', tz: TZ, ported: true };
  const ev = (hist) => agents.evaluate(a, hist, true, NOW).flag;
  const late = NOW + 15 * 60000; // 11:15, the 11:00 fire is past its 10-minute grace
  assert.match(agents.evaluate(a, [], true, late).flag.reason, /Never run/); assert.equal(agents.evaluate(a, [], true, late).flag.level, 'red');
  assert.equal(ev([]), null); // exactly at the fire: still inside the grace window
  assert.equal(agents.evaluate(a, [], true, late, false, late - 60000).flag, null); // enabled after the last fire: nothing to miss yet
  assert.equal(agents.evaluate(a, [{ startedAt: NOW - 30 * H, ok: true, delivery: 'ok', dryRun: true }], true, NOW, false, NOW - 30 * 60000).flag, null); // dry-run before enabling is not "stale"
  assert.match(ev([{ startedAt: NOW - H, ok: false, error: 'boom' }]).reason, /Last run failed: boom/);
  assert.match(ev([{ startedAt: NOW - H, ok: true, delivery: 'failed', error: 'channel_not_found' }]).reason, /Delivery failed: channel_not_found/);
  assert.match(ev([{ startedAt: NOW - 30 * H, ok: true, delivery: 'ok' }]).reason, /Missed its last 2/);
  const amber = ev([{ startedAt: NOW - 3600000 + 60000, ok: true, delivery: 'unknown' }]);
  assert.equal(amber.level, 'amber');
  assert.equal(ev([{ startedAt: NOW - H, ok: true, delivery: 'ok' }]), null);                // ran at the 10:00 fire
  assert.equal(ev([{ startedAt: NOW - H - 5 * 60000, ok: true, delivery: 'ok' }]), null); // 09:55 run: inside grace of the 2nd-last fire
  assert.ok(agents.evaluate(a, [{ startedAt: NOW - H, ok: true, delivery: 'ok' }], true, NOW).nextRun > NOW);
});

test('enabling needs a ported agent AND a clean dry-run on record', () => {
  mk('notported'); mk('ported', {}, { 'prompt.md': 'p', 'allowed-tools.json': '[]' });
  assert.throws(() => agents.setEnabled('notported', true), /not ported/);
  assert.throws(() => agents.setEnabled('ported', true), /dry-run first/);
  agents.recordRun('ported', { startedAt: NOW, ok: true, delivery: 'ok', dryRun: false });
  assert.throws(() => agents.setEnabled('ported', true), /dry-run first/); // a live run is not a dry-run
  agents.recordRun('ported', { startedAt: NOW, ok: true, delivery: 'failed', dryRun: true });
  assert.throws(() => agents.setEnabled('ported', true), /dry-run first/); // failed delivery does not count
  agents.recordRun('ported', { startedAt: NOW, ok: true, delivery: 'ok', dryRun: true });
  assert.equal(agents.setEnabled('ported', true).enabled, true);
  assert.equal(agents.enabledFor(agents.find('ported')), true);
  assert.equal(agents.setEnabled('ported', false).enabled, false); // disabling is always allowed
  assert.throws(() => agents.find('../x'), /invalid agent id/); assert.throws(() => agents.find('nope'), /unknown agent/);
});

// ---- runner, with a stub standing in for the claude CLI ----
const stub = path.join(tmp, 'claude-stub.js');
fs.writeFileSync(stub, `#!/usr/bin/env node
const m = process.env.STUB_MODE;
if (m === 'ok') console.log('working...\\nRESULT: {"delivery":"ok","summary":"sent brief"}');
else if (m === 'dfail') console.log('RESULT: {"delivery":"failed","summary":"slack refused"}');
else if (m === 'noresult') console.log('did stuff, forgot the result line');
else if (m === 'crash') { console.error('kaboom'); process.exit(3); }
else if (m === 'echo') console.log('RESULT: {"delivery":"n/a","summary":' + JSON.stringify(process.argv[3].includes('DRY RUN') ? 'dry' : 'live') + '}');
`); fs.chmodSync(stub, 0o755);
const run = (id, mode, ...flags) => { const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'run-agent.js'), id, ...flags], { env: { ...process.env, CLAUDE_BIN: stub, STUB_MODE: mode }, encoding: 'utf8' }); return { code: r.status, last: agents.runs(id)[0], out: r.stdout + r.stderr }; };

test('runner: success is recorded with the RESULT line', () => {
  mk('r1', {}, { 'prompt.md': 'do it', 'allowed-tools.json': '["Read"]' });
  const r = run('r1', 'ok', '--force'); assert.equal(r.code, 0);
  assert.equal(r.last.ok, true); assert.equal(r.last.delivery, 'ok'); assert.equal(r.last.summary, 'sent brief');
});
test('runner: a failed delivery is a failed run, loudly', () => {
  mk('r2', {}, { 'prompt.md': 'p', 'allowed-tools.json': '[]' });
  const r = run('r2', 'dfail', '--force'); assert.equal(r.code, 1);
  assert.equal(r.last.ok, false); assert.equal(r.last.delivery, 'failed'); assert.match(r.last.error, /slack refused/);
});
test('runner: no RESULT line means delivery unknown (flagged amber), not a clean pass', () => {
  mk('r3', {}, { 'prompt.md': 'p', 'allowed-tools.json': '[]' });
  const r = run('r3', 'noresult', '--force'); assert.equal(r.last.delivery, 'unknown');
});
test('runner: crash, missing CLI, not ported and missing tool list are all recorded as failures', () => {
  mk('r4', {}, { 'prompt.md': 'p', 'allowed-tools.json': '[]' });
  assert.match(run('r4', 'crash', '--force').last.error, /exit 3.*kaboom/);
  const missing = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'run-agent.js'), 'r4', '--force'], { env: { ...process.env, CLAUDE_BIN: '/no/such/claude' }, encoding: 'utf8' });
  assert.equal(missing.status, 1); assert.match(agents.runs('r4')[0].error, /could not start/);
  mk('r5'); assert.match(run('r5', 'ok', '--force').last.error, /not ported/);
  mk('r6', {}, { 'prompt.md': 'p' }); assert.match(run('r6', 'ok', '--force').last.error, /allowed-tools\.json is required/);
});
test('runner: scheduled runs skip a disabled agent; --force overrides; --dry-run is passed to the model', () => {
  mk('r7', {}, { 'prompt.md': 'p', 'allowed-tools.json': '[]' });
  const skipped = run('r7', 'ok'); assert.equal(skipped.code, 0); assert.match(skipped.out, /disabled, skipping/); assert.equal(agents.runs('r7').length, 0);
  assert.equal(run('r7', 'echo', '--force', '--dry-run').last.summary, 'dry');
  assert.equal(run('r7', 'echo', '--force').last.summary, 'live');
  assert.equal(agents.runs('r7')[0].dryRun, false); assert.equal(agents.isRunning('r7', Date.now()), false); // running marker is cleared
});
