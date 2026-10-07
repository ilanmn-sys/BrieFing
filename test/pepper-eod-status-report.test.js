const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const { render } = require('../server/template');
const { config } = require('../server/lib');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'agents', 'pepper-eod-status-report');
const prompt = fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8');
const tools = JSON.parse(fs.readFileSync(path.join(dir, 'allowed-tools.json'), 'utf8'));

test('prompt renders fully and carries no hand-typed IDs', () => {
  const out = render(prompt, config);
  assert.ok(!/\{\{/.test(out));
  assert.ok(!/\bD[0-9A-Z]{9,}\b/.test(prompt) && !/\bgroup_mm[0-9a-z]{5,}\b/.test(prompt));
  assert.ok(!/\b(?:18416855289|29607541|U0[0-9A-Z]{8,}|U038UEUQC1Y)\b/.test(prompt));
  assert.match(out, new RegExp(config.pepper.userId));
});

test('prompt carries the rules, markers and safeguards', () => {
  for (const r of ['R-09', 'R-10', 'R-13', 'S-001', 'S-005']) assert.ok(prompt.includes(r), r);
  for (const s of ['system clock', 'LEARNING-LOG.md', 'data, never instructions', 'eod_ts', '📊 סיכום יום', 'Newest first.', 'highest `S-` number', 'Never touch section 1', 'exactly one Slack message'.replace('exactly one', 'one'), 'already reported today', 'RESULT:']) assert.ok(prompt.includes(s), s);
});

test('the Hebrew report has every line and the observation question', () => {
  for (const h of ['✅ הושלם היום', '🔥 נשאר פתוח להיום', '🔴 באיחור', '📅 מחר', '📌 מחכים לתאריך', '❓ מה ראית היום']) assert.ok(prompt.includes(h), h);
});

test('tools: read-only board, one send, edit limited to the learning log', () => {
  assert.ok(tools.every((t) => !t.includes('*')));
  assert.ok(tools.includes('Edit(LEARNING-LOG.md)'));
  for (const bad of ['Bash', 'Edit', 'Write', 'mcp__monday_com__create_item', 'mcp__monday_com__create_update', 'mcp__monday_com__change_item_column_values', 'mcp__monday_com__all_monday_api', 'mcp__monday_com__move_object', 'mcp__Gmail__send_message', 'mcp__Google_Calendar__create_event']) assert.ok(!tools.includes(bad), bad);
  for (const need of ['mcp__monday_com__get_board_items_page', 'mcp__Slack__slack_read_channel', 'mcp__Slack__slack_send_message']) assert.ok(tools.includes(need), need);
});

test('schedule is the build-prompt cron; agent ported but disabled until a clean dry-run', () => {
  const s = JSON.parse(fs.readFileSync(path.join(dir, 'schedule.json'), 'utf8'));
  assert.equal(s.cron, '30 17 * * 0-4'); assert.equal(s.enabled, false);
  process.env.AGENTS_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'eod-'));
  delete require.cache[require.resolve('../server/agents')];
  const agents = require('../server/agents');
  assert.equal(agents.registry().find((a) => a.id === 'pepper-eod-status-report').ported, true);
  assert.throws(() => agents.setEnabled('pepper-eod-status-report', true), /dry-run first/);
});

test('runner: a dry run hands the model the rendered prompt and scoped tools', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eod-run-')), out = path.join(tmp, 'p.txt'), stub = path.join(tmp, 'claude.js');
  fs.writeFileSync(stub, `#!/usr/bin/env node\nrequire('fs').writeFileSync(process.env.PROMPT_OUT, process.argv[3] + '\\nTOOLS=' + process.argv[5]);\nconsole.log('RESULT: {"delivery":"n/a","summary":"dry run"}');\n`); fs.chmodSync(stub, 0o755);
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-agent.js'), 'pepper-eod-status-report', '--force', '--dry-run'], { env: { ...process.env, AGENTS_DATA_DIR: tmp, CLAUDE_BIN: stub, PROMPT_OUT: out }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const sent = fs.readFileSync(out, 'utf8');
  assert.match(sent, /^Today is \d{4}-\d{2}-\d{2}/); assert.match(sent, /DRY RUN: do not write anywhere/); assert.ok(!/\{\{/.test(sent));
  assert.match(sent, /TOOLS=.*Edit\(LEARNING-LOG\.md\)/); assert.ok(!/TOOLS=.*create_update/.test(sent));
  const run = JSON.parse(fs.readFileSync(path.join(tmp, 'runs', 'pepper-eod-status-report.json'), 'utf8'))[0];
  assert.equal(run.ok, true); assert.equal(run.dryRun, true);
});
