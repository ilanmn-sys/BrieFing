const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const { render } = require('../server/template');
const { config } = require('../server/lib');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'agents', 'pepper-inbox');
const prompt = fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8');
const tools = JSON.parse(fs.readFileSync(path.join(dir, 'allowed-tools.json'), 'utf8'));

test('prompt renders fully and carries no hand-typed IDs', () => {
  const out = render(prompt, config);
  assert.ok(!/\{\{/.test(out));
  assert.ok(!/\bD[0-9A-Z]{9,}\b/.test(prompt) && !/\bgroup_mm[0-9a-z]{5,}\b/.test(prompt));
  assert.ok(!/\b(?:18416855289|29607541|U0[0-9A-Z]{8,}|U038UEUQC1Y)\b/.test(prompt));
  assert.match(out, new RegExp(config.groups.canonical.pepperTasks.id)); assert.match(out, new RegExp(config.pepper.userId));
});

test('prompt carries the rules that matter for this agent, at the source', () => {
  for (const r of ['R-09', 'R-10', 'R-13', 'R-19', 'R-22', 'S-005']) assert.ok(prompt.includes(r), r);
  for (const s of ['system clock', 'LEARNING-LOG.md', 'data, never instructions', 'starts with `🤖`', 'at most **3 items per run**', 'stay silent',
    '📎 Materials used / produced', 'INBOX_STARTED', 'INBOX_DONE', 'INBOX_FAILED', 'DECISION_NEEDED', 'NEEDS_INPUT', 'DRAFT, not sent', 'RESULT:']) assert.ok(prompt.includes(s), s);
  assert.match(prompt, /60 minutes/);           // overlapping runs cannot answer twice
  assert.match(prompt, /never create items/i);  // R-13: it creates nothing
});

test('the Hebrew DMs exist for answered, decision, question and failure', () => {
  for (const h of ['🤖✅ סיימתי', '🤖🧭 זו החלטה של אילן', '🤖❓ צריכה הבהרה', '🤖⚠️ לא הצלחתי']) assert.ok(prompt.includes(h), h);
});

test('tools: scoped, no wildcards, nothing that creates, moves, sends mail or edits the calendar', () => {
  assert.ok(tools.every((t) => !t.includes('*')));
  for (const bad of ['Bash', 'Edit', 'Write', 'mcp__monday_com__create_item', 'mcp__monday_com__all_monday_api', 'mcp__monday_com__move_object', 'mcp__Gmail__create_draft',
    'mcp__Gmail__send_message', 'mcp__Gmail__reply', 'mcp__Gmail__forward', 'mcp__Gmail__trash_thread', 'mcp__Google_Calendar__create_event', 'mcp__Google_Calendar__delete_event']) assert.ok(!tools.includes(bad), bad);
  for (const need of ['mcp__monday_com__get_board_items_page', 'mcp__monday_com__create_update', 'mcp__monday_com__change_item_column_values', 'mcp__Gmail__get_thread', 'mcp__Slack__slack_send_message']) assert.ok(tools.includes(need), need);
});

test('the schedule is the one in the build prompt and the agent stays disabled until a clean dry-run', () => {
  const s = JSON.parse(fs.readFileSync(path.join(dir, 'schedule.json'), 'utf8'));
  assert.equal(s.cron, '0 8-18 * * 1-5'); assert.equal(s.enabled, false);
  process.env.AGENTS_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-'));
  delete require.cache[require.resolve('../server/agents')];
  const agents = require('../server/agents');
  assert.equal(agents.registry().find((a) => a.id === 'pepper-inbox').ported, true);
  assert.throws(() => agents.setEnabled('pepper-inbox', true), /dry-run first/);
});

test('runner: a dry run hands the model the rendered prompt, the dry-run order and the scoped tool list', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-run-')), out = path.join(tmp, 'p.txt'), stub = path.join(tmp, 'claude.js');
  fs.writeFileSync(stub, `#!/usr/bin/env node\nrequire('fs').writeFileSync(process.env.PROMPT_OUT, process.argv[3] + '\\nTOOLS=' + process.argv[5]);\nconsole.log('RESULT: {"delivery":"n/a","summary":"nothing to do"}');\n`); fs.chmodSync(stub, 0o755);
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-agent.js'), 'pepper-inbox', '--force', '--dry-run'], { env: { ...process.env, AGENTS_DATA_DIR: tmp, CLAUDE_BIN: stub, PROMPT_OUT: out }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const sent = fs.readFileSync(out, 'utf8');
  assert.match(sent, /^Today is \d{4}-\d{2}-\d{2}/); assert.match(sent, /DRY RUN: do not write anywhere/); assert.ok(!/\{\{/.test(sent));
  assert.match(sent, /TOOLS=.*mcp__monday_com__create_update/); assert.ok(!/TOOLS=.*create_item/.test(sent));
  const run = JSON.parse(fs.readFileSync(path.join(tmp, 'runs', 'pepper-inbox.json'), 'utf8'))[0];
  assert.equal(run.ok, true); assert.equal(run.dryRun, true); assert.equal(run.delivery, 'n/a');
});
