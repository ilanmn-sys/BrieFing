const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const { render } = require('../server/template');
const { config } = require('../server/lib');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'agents', 'daily-board-strategy');
const prompt = fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8');

test('template: fills values, joins arrays, and refuses unknown or object placeholders', () => {
  assert.equal(render('a {{me.mondayUserId}} b', config), 'a 29607541 b');
  assert.equal(render('{{vips}}', config), 'Roy Segev, Eran Zinman, Or Elmaliah');
  assert.throws(() => render('{{nope.x}}', config), /unresolved placeholder \{\{nope\.x\}\}/);
  assert.throws(() => render('{{me}}', config), /is an object/);
});

test('prompt renders with every placeholder resolved and no ID typed into the prompt by hand', () => {
  const out = render(prompt, config);
  assert.ok(!/\{\{/.test(out));
  assert.ok(!/\bD[0-9A-Z]{9,}\b/.test(prompt), 'no DM channel id in the source prompt');
  assert.ok(!/\bgroup_mm[0-9a-z]{5,}\b/.test(prompt), 'no group id typed in the source prompt');
  assert.ok(!/\b(?:18416855289|29607541|U0[0-9A-Z]{8,}|U038UEUQC1Y)\b/.test(prompt), 'no board or user id typed in the source prompt');
  assert.match(out, new RegExp(config.pepper.userId)); assert.match(out, new RegExp(config.groups.canonical.today.id));
});

test('prompt carries the mechanical rules at the source (R-12) and the lessons from the real checks', () => {
  for (const r of ['R-04', 'R-05', 'R-06', 'R-10', 'R-13', 'R-14', 'R-16', 'R-17', 'R-19', 'R-20', 'R-21', 'R-22']) assert.ok(prompt.includes(r), r);
  for (const s of ['system clock', 'LEARNING-LOG.md', 'AWAITING_APPROVAL', 'never use a DM channel id'.replace('never use', 'Never use'), 'Never more than', 'RESULT:', 'declined', 'Out of Office']) assert.ok(prompt.includes(s), s);
  assert.match(prompt, /24 hours|more than 15 recipients/); // broadcast filter from the Gmail check
  assert.match(prompt, /-filename:ics/);                     // calendar noise removed in the query
  assert.match(prompt, /PROPOSALS_JSON:/); assert.match(prompt, /APPLIED \| strategy_date/); // the dashboard contract
});

test('allowed tools: a scoped list, no wildcards, nothing that can delete or send mail', () => {
  const tools = JSON.parse(fs.readFileSync(path.join(dir, 'allowed-tools.json'), 'utf8'));
  assert.ok(Array.isArray(tools) && tools.length > 5);
  assert.ok(tools.every((t) => !t.includes('*')), 'no wildcards');
  for (const bad of ['Bash', 'mcp__Gmail__send_message', 'mcp__Gmail__reply', 'mcp__Gmail__forward', 'mcp__Gmail__trash_thread', 'mcp__Gmail__create_draft', 'mcp__Google_Calendar__create_event', 'mcp__Google_Calendar__delete_event']) assert.ok(!tools.includes(bad), bad);
  for (const need of ['mcp__monday_com__get_board_items_page', 'mcp__Gmail__search_threads', 'mcp__Gmail__get_thread', 'mcp__Google_Calendar__list_events', 'mcp__Slack__slack_send_message']) assert.ok(tools.includes(need), need);
});

test('the agent is ported (shows up as such) but stays disabled until a clean dry-run exists', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dbs-'));
  process.env.AGENTS_DATA_DIR = tmp;
  delete require.cache[require.resolve('../server/agents')];
  const agents = require('../server/agents');
  const a = agents.registry().find((x) => x.id === 'daily-board-strategy');
  assert.equal(a.ported, true); assert.equal(a.enabled, false);
  assert.throws(() => agents.setEnabled('daily-board-strategy', true), /dry-run first/);
});

test('runner hands the model a fully rendered prompt: date, dry-run order, no placeholders', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dbs-run-'));
  const out = path.join(tmp, 'prompt.txt'), stub = path.join(tmp, 'claude.js');
  fs.writeFileSync(stub, `#!/usr/bin/env node\nrequire('fs').writeFileSync(process.env.PROMPT_OUT, process.argv[3] + '\\nTOOLS=' + process.argv[5]);\nconsole.log('RESULT: {"delivery":"n/a","summary":"dry run printed the brief"}');\n`);
  fs.chmodSync(stub, 0o755);
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-agent.js'), 'daily-board-strategy', '--force', '--dry-run'],
    { env: { ...process.env, AGENTS_DATA_DIR: tmp, CLAUDE_BIN: stub, PROMPT_OUT: out }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const sent = fs.readFileSync(out, 'utf8');
  assert.match(sent, /^Today is \d{4}-\d{2}-\d{2}/);
  assert.match(sent, /DRY RUN: do not write anywhere/);
  assert.ok(!/\{\{/.test(sent)); assert.match(sent, /29607541/);
  assert.match(sent, /TOOLS=.*mcp__Slack__slack_send_message/);
  const run = JSON.parse(fs.readFileSync(path.join(tmp, 'runs', 'daily-board-strategy.json'), 'utf8'))[0];
  assert.equal(run.dryRun, true); assert.equal(run.ok, true); assert.equal(run.delivery, 'n/a');
});

test('a broken placeholder fails the run loudly instead of sending a half-filled prompt', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dbs-bad-'));
  const ad = path.join(tmp, 'agents', 'bad'); fs.mkdirSync(ad, { recursive: true });
  fs.writeFileSync(path.join(ad, 'schedule.json'), JSON.stringify({ id: 'bad', name: 'bad', cron: '0 8 * * *', tz: 'Asia/Jerusalem', enabled: false }));
  fs.writeFileSync(path.join(ad, 'prompt.md'), 'use {{pepper.nothing}}'); fs.writeFileSync(path.join(ad, 'allowed-tools.json'), '[]');
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-agent.js'), 'bad', '--force'], { env: { ...process.env, AGENTS_DIR: path.join(tmp, 'agents'), AGENTS_DATA_DIR: tmp }, encoding: 'utf8' });
  assert.equal(r.status, 1); assert.match(r.stdout, /unresolved placeholder/);
});

test('the prompt, rendered, teaches exactly the operation types and groups the dashboard accepts', () => {
  const out = render(prompt, config);
  for (const t of ['"type":"move"', '`date`', '`priority`', '`email_task`', 'fromGroup', 'fromDate']) assert.ok(out.includes(t), t);
  for (const id of [config.groups.canonical.today.id, config.groups.canonical.thisWeek.id, config.groups.parking.noise]) assert.ok(out.includes(id), id);
  const toGroupLine = out.split('\n').find((l) => l.includes('A `toGroup` may be')) || out.match(/A `toGroup` may be[^.]*\./)[0];
  for (const bad of [...config.groups.legacy, ...config.groups.excluded]) assert.ok(!toGroupLine.includes(bad), 'legacy/excluded group offered as a target: ' + bad);
});
