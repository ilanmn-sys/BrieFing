const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const { cronToIntervals, buildAll } = require('../server/launchd');
const { evaluate } = require('../server/syncStatus');
const { connected, check } = require('../scripts/check-tools');

const root = path.join(__dirname, '..');
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));
const sh = (args, env = {}, opts = {}) => spawnSync(args[0], args.slice(1), { env: { ...process.env, ...env }, encoding: 'utf8', ...opts });

test('cronToIntervals: every real schedule expands to the right launchd intervals', () => {
  assert.deepEqual(cronToIntervals('0 8 * * 0-4').map((d) => d.Weekday), [0, 1, 2, 3, 4]);
  const intake = cronToIntervals('0 8-18/2 * * 0-5');
  assert.equal(intake.length, 36); assert.deepEqual([...new Set(intake.map((d) => d.Hour))], [8, 10, 12, 14, 16, 18]);
  assert.equal(cronToIntervals('0 9 * * *').length, 1); assert.deepEqual(cronToIntervals('0 9 * * *')[0], { Hour: 9, Minute: 0 });
  assert.deepEqual(cronToIntervals('0 9 1 * *'), [{ Day: 1, Hour: 9, Minute: 0 }]);
  assert.deepEqual(cronToIntervals('0 9 1 1,4,7,10 *').map((d) => d.Month), [1, 4, 7, 10]);
  assert.deepEqual(cronToIntervals('0 16 * * 4'), [{ Weekday: 4, Hour: 16, Minute: 0 }]);
  assert.deepEqual(cronToIntervals('30 17 * * 7').map((d) => d.Weekday), [0]); // 7 is Sunday
  assert.equal(cronToIntervals('0 8 * * 1-5').length, 5);
});

test('cronToIntervals: refuses what launchd cannot express', () => {
  assert.throws(() => cronToIntervals('0 9 1 * 1'), /both day-of-month and day-of-week/);
  assert.throws(() => cronToIntervals('0 9 * *'), /5 fields/);
  assert.throws(() => cronToIntervals('61 9 * * *'), /bad cron minute/);
  assert.throws(() => cronToIntervals('* * * * *'), /expands to/);
});

const agentsList = [{ id: 'a-one', cron: '0 8 * * 0-4', tz: 'Asia/Jerusalem', ported: true }, { id: 'a-two', cron: '0 9 * * *', tz: 'Asia/Jerusalem', ported: false }];
const base = { agents: agentsList, root: '/Users/ilan/BrieFing', nodePath: '/opt/homebrew/bin/node', envPath: '/opt/homebrew/bin:/usr/bin', home: '/Users/ilan', systemTz: 'Asia/Jerusalem' };

test('buildAll: one plist per ported agent, plus the sync and the server; unported skipped; labels unique', () => {
  const r = buildAll(base);
  assert.deepEqual(r.files.map((f) => f.label), ['com.ilan.cc.a-one', 'com.ilan.learninglog-sync', 'com.ilan.cc.server']);
  assert.deepEqual(r.skipped, [{ id: 'a-two', reason: 'not ported (no prompt.md)' }]);
  const a = r.files[0].body;
  assert.match(a, /<string>\/opt\/homebrew\/bin\/node<\/string>\s*<string>\/Users\/ilan\/BrieFing\/scripts\/run-agent\.js<\/string>\s*<string>a-one<\/string>/);
  assert.match(a, /<key>WorkingDirectory<\/key>\s*<string>\/Users\/ilan\/BrieFing<\/string>/); assert.match(a, /<key>RunAtLoad<\/key>\s*<false\/>/);
  const sync = r.files[1].body; assert.match(sync, /sync-learning-log\.sh/); assert.deepEqual(cronToIntervals('0 18 * * 0-4').length, 5);
  const server = r.files[2].body; assert.match(server, /<key>KeepAlive<\/key>\s*<true\/>/); assert.match(server, /<key>RunAtLoad<\/key>\s*<true\/>/); assert.ok(!/StartCalendarInterval/.test(server));
  assert.ok(!/DRY_RUN/.test(a + server), 'the plists must not switch dry-run off: that is a deliberate choice in .env');
});

test('buildAll: a timezone mismatch is an error unless allowed, then a warning', () => {
  assert.throws(() => buildAll({ ...base, systemTz: 'America/New_York' }), /Asia\/Jerusalem but this Mac is America\/New_York/);
  const r = buildAll({ ...base, systemTz: 'America/New_York', allowTzMismatch: true });
  assert.ok(r.warnings.length >= 2);
});

test('buildAll: XML-escapes paths and every generated plist is valid', () => {
  const r = buildAll({ ...base, root: '/Users/a&b/<x>', claudeBin: '/bin/c"laude' });
  const dir = tmp('plist-');
  for (const f of r.files) fs.writeFileSync(path.join(dir, f.name), f.body);
  const py = sh(['python3', '-I', '-c', 'import plistlib,glob,sys\nfor f in glob.glob(sys.argv[1]+"/*.plist"): d=plistlib.load(open(f,"rb")); assert d["Label"]\nprint("ok")', dir]);
  assert.equal(py.stdout.trim(), 'ok', py.stderr);
  const a = JSON.stringify(require('child_process').spawnSync('python3', ['-I', '-c', 'import plistlib,sys;print(plistlib.load(open(sys.argv[1],"rb"))["WorkingDirectory"])', path.join(dir, 'com.ilan.cc.a-one.plist')], { encoding: 'utf8' }).stdout.trim());
  assert.equal(a, JSON.stringify('/Users/a&b/<x>'));
});

test('gen-launchd CLI: writes the real fleet, parses, skips the unported agent, refuses a wrong timezone', () => {
  const out = tmp('gen-');
  const r = sh([process.execPath, path.join(root, 'scripts', 'gen-launchd.js'), '--out', out], { GEN_SYSTEM_TZ: 'Asia/Jerusalem' });
  assert.equal(r.status, 0, r.stderr);
  const files = fs.readdirSync(out).sort();
  const ported = fs.readdirSync(path.join(root, 'agents')).filter((a) => fs.existsSync(path.join(root, 'agents', a, 'prompt.md')));
  assert.equal(files.length, ported.length + 2);
  for (const id of ported) assert.ok(files.includes(`com.ilan.cc.${id}.plist`), id);
  assert.ok(files.includes('com.ilan.learninglog-sync.plist') && files.includes('com.ilan.cc.server.plist'));
  assert.ok(!/skipped/.test(r.stdout), 'every agent folder is ported');
  const py = sh(['python3', '-I', '-c', 'import plistlib,glob,sys\nn=0\nfor f in glob.glob(sys.argv[1]+"/*.plist"): plistlib.load(open(f,"rb")); n+=1\nprint(n)', out]);
  assert.equal(Number(py.stdout.trim()), files.length);
  const bad = sh([process.execPath, path.join(root, 'scripts', 'gen-launchd.js'), '--out', tmp('gen-')], { GEN_SYSTEM_TZ: 'Europe/London' });
  assert.equal(bad.status, 1); assert.match(bad.stderr, /Europe\/London/);
});

test('launchd.sh: install loads every plist, removes stale ones; uninstall removes all; nothing outside the target folder is touched', () => {
  const dest = tmp('la-'), bin = tmp('bin-'), log = path.join(bin, 'calls.log');
  fs.writeFileSync(path.join(bin, 'launchctl'), `#!/bin/bash\necho "$@" >> "${log}"\nif [ "$1" = list ]; then echo "123 0 com.ilan.cc.server"; fi\n`); fs.chmodSync(path.join(bin, 'launchctl'), 0o755);
  fs.writeFileSync(path.join(dest, 'com.ilan.cc.removed-agent.plist'), '<plist/>'); fs.writeFileSync(path.join(dest, 'com.other.app.plist'), '<plist/>');
  const env = { LAUNCH_AGENTS_DIR: dest, LAUNCHCTL: path.join(bin, 'launchctl'), GEN_SYSTEM_TZ: 'Asia/Jerusalem' };
  const r = sh(['bash', path.join(root, 'scripts', 'launchd.sh'), 'install'], env);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const files = fs.readdirSync(dest);
  assert.ok(!files.includes('com.ilan.cc.removed-agent.plist'), 'stale job removed'); assert.ok(files.includes('com.other.app.plist'), 'unrelated plist untouched');
  const calls = fs.readFileSync(log, 'utf8');
  const n = files.filter((f) => f.startsWith('com.ilan.')).length;
  assert.equal((calls.match(/bootstrap /g) || []).length, n); assert.match(calls, /bootout gui\/\d+\/com\.ilan\.cc\.removed-agent/);
  assert.match(sh(['bash', path.join(root, 'scripts', 'launchd.sh'), 'status'], env).stdout, /com\.ilan\.cc\.server/);
  const u = sh(['bash', path.join(root, 'scripts', 'launchd.sh'), 'uninstall'], env);
  assert.equal(u.status, 0, u.stderr);
  assert.deepEqual(fs.readdirSync(dest), ['com.other.app.plist']);
  assert.equal(sh(['bash', path.join(root, 'scripts', 'launchd.sh'), 'nonsense'], env).status, 2);
});

// ---- sync-learning-log.sh ----
function syncEnv(over = {}) {
  const d = tmp('sync-'), logFile = path.join(d, 'LEARNING-LOG.md'), state = path.join(d, 'state'), marker = path.join(d, 'published.txt');
  fs.writeFileSync(logFile, '# Pepper x Claude\n\nRules and signals.\n');
  const env = { LEARNING_LOG_FILE: logFile, SYNC_STATE_DIR: state, LEARNINGLOG_PUBLISH_CMD: `cp "$LEARNINGLOG_FILE" "${marker}"`, ...over };
  const run = () => sh(['bash', path.join(root, 'scripts', 'sync-learning-log.sh')], env);
  const status = () => JSON.parse(fs.readFileSync(path.join(state, 'status.json'), 'utf8'));
  return { d, logFile, state, marker, env, run, status };
}

test('sync: publishes through the configured command, records success, then skips while unchanged', () => {
  const s = syncEnv();
  let r = s.run(); assert.equal(r.status, 0, r.stderr); assert.ok(fs.existsSync(s.marker)); assert.equal(s.status().ok, true);
  fs.unlinkSync(s.marker);
  r = s.run(); assert.equal(r.status, 0); assert.match(r.stdout, /unchanged/); assert.ok(!fs.existsSync(s.marker), 'unchanged file is not published again');
  fs.appendFileSync(s.logFile, '\nnew signal\n');
  r = s.run(); assert.equal(r.status, 0); assert.ok(fs.existsSync(s.marker));
});

test('sync: nothing is published without a configured command, and that fails loudly', () => {
  const s = syncEnv({ LEARNINGLOG_PUBLISH_CMD: '' });
  const r = s.run();
  assert.equal(r.status, 3); assert.match(r.stderr, /LEARNINGLOG_PUBLISH_CMD is not set/);
  assert.equal(s.status().ok, false); assert.ok(!fs.existsSync(path.join(s.state, 'published.sha256')));
});

test('sync: refuses an empty file, an oversized file and a file with a secret (reporting the line, not the secret)', () => {
  let s = syncEnv(); fs.writeFileSync(s.logFile, ''); let r = s.run();
  assert.equal(r.status, 1); assert.match(r.stderr, /empty/); assert.ok(!fs.existsSync(s.marker));
  s = syncEnv(); fs.writeFileSync(s.logFile, 'x'.repeat(500001)); r = s.run();
  assert.equal(r.status, 1); assert.match(r.stderr, /over the 500000 limit/);
  s = syncEnv(); fs.writeFileSync(s.logFile, '# Log\nfine\ntoken xoxb-1234567890-abcdefghijkl here\n'); r = s.run();
  assert.equal(r.status, 1); assert.match(r.stderr, /line\(s\) 3/); assert.ok(!/xoxb-1234567890/.test(r.stderr + r.stdout + fs.readFileSync(path.join(s.state, 'status.json'), 'utf8')));
  assert.ok(!fs.existsSync(s.marker));
  s = syncEnv(); fs.writeFileSync(s.logFile, '-----BEGIN RSA PRIVATE KEY-----\n'); assert.equal(s.run().status, 1);
  s = syncEnv({ LEARNING_LOG_FILE: path.join(os.tmpdir(), 'definitely-missing-log.md') }); assert.equal(s.run().status, 1);
});

test('sync: a failing publish command fails loudly and does not mark the file as published', () => {
  const s = syncEnv({ LEARNINGLOG_PUBLISH_CMD: 'echo upstream said no >&2; exit 7' });
  let r = s.run();
  assert.equal(r.status, 4); assert.match(r.stderr, /exited 7/); assert.match(r.stderr, /upstream said no/);
  assert.equal(s.status().ok, false); assert.ok(!fs.existsSync(path.join(s.state, 'published.sha256')));
  s.env.LEARNINGLOG_PUBLISH_CMD = `cp "$LEARNINGLOG_FILE" "${s.marker}"`;
  r = sh(['bash', path.join(root, 'scripts', 'sync-learning-log.sh')], s.env); assert.equal(r.status, 0, 'the next run retries and succeeds');
  assert.equal(s.status().ok, true);
});

test('syncStatus: never run, failed, stale, ok', () => {
  const NOW = Date.parse('2026-10-08T12:00:00Z');
  assert.equal(evaluate(null, NOW).state, 'never_run');
  assert.equal(evaluate({ ok: false, message: 'boom', lastSuccessAt: '2026-10-07T15:00:00Z', at: '2026-10-08T15:00:00Z' }, NOW).state, 'failed');
  assert.equal(evaluate({ ok: true, lastSuccessAt: '2026-10-01T15:00:00Z', at: '2026-10-01T15:00:00Z' }, NOW).state, 'stale');
  const ok = evaluate({ ok: true, lastSuccessAt: '2026-10-07T15:00:00Z', at: '2026-10-07T15:00:00Z', message: 'published' }, NOW);
  assert.equal(ok.state, 'ok'); assert.equal(ok.ok, true);
});

test('check-tools: parses `claude mcp list`, matches servers by name, flags missing and unconnected', () => {
  const text = [
    'Checking MCP server health...', '',
    'claude.ai Gmail: https://gmailmcp.googleapis.com/mcp/v1 - ✓ Connected',
    'monday_com: https://mcp.monday.com/mcp - ✓ Connected',
    'Slack: https://mcp.slack.com/mcp - ! Needs authentication',
    'plugin:finance:bigquery: https://x/mcp - ✗ Failed to connect',
  ].join('\n');
  const have = connected(text);
  assert.equal(have.get('claude.ai Gmail'), true); assert.equal(have.get('monday_com'), true); assert.equal(have.get('Slack'), false); assert.equal(have.get('plugin:finance:bigquery'), false);
  const rows = check(path.join(root, 'agents'), text), by = Object.fromEntries(rows.map((r) => [r.server, r]));
  assert.equal(by.Gmail.connected, true); assert.equal(by.Gmail.found, 'claude.ai Gmail'); assert.equal(by.monday_com.connected, true);
  assert.equal(by.Slack.found, 'Slack'); assert.equal(by.Slack.connected, false);
  assert.equal(by.Google_Calendar.found, null); assert.ok(by.monday_com.agents.length >= 10);
  assert.equal(by['claude-code-remote'].optional, true);
  const f = path.join(tmp('ct-'), 'list.txt'); fs.writeFileSync(f, text);
  const r = sh([process.execPath, path.join(root, 'scripts', 'check-tools.js'), '--from', f]);
  assert.equal(r.status, 1); assert.match(r.stdout, /MISSING\s+Google_Calendar/); assert.match(r.stdout, /NOT CONNECTED\s+Slack/); assert.match(r.stdout, /OK\s+monday_com/); assert.match(r.stdout, /OPTIONAL \(not connected\)\s+claude-code-remote/);
});
