const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const { render } = require('../server/template');
const { config } = require('../server/lib');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'agents', 'slack-flag-to-task');
const prompt = fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8');
const tools = JSON.parse(fs.readFileSync(path.join(dir, 'allowed-tools.json'), 'utf8'));

test('prompt renders fully and carries no hand-typed IDs', () => {
  const out = render(prompt, config);
  assert.ok(!/\{\{/.test(out));
  assert.ok(!/\bD[0-9A-Z]{9,}\b/.test(prompt) && !/\bgroup_mm[0-9a-z]{5,}\b/.test(prompt));
  assert.ok(!/\b(?:18416855289|29607541|U0[0-9A-Z]{8,}|U038UEUQC1Y)\b/.test(prompt));
  assert.match(out, new RegExp(config.pepper.userId));
});

test('prompt carries the rules and markers at the source', () => {
  for (const r of ['R-07', 'R-09', 'R-10', 'R-13', 'S-004', 'S-005']) assert.ok(prompt.includes(r), r);
  for (const s of ['AWAITING_DUE_DATE', 'PEPPER_ASK_TS:', 'DUE_DATE_SET', 'DUE_DATE_SKIPPED', 'ASK_FAILED', 'after:YYYY-MM-DD', 'at most 90 characters', 'Sent using Claude', 'RESULT:']) assert.ok(prompt.includes(s), s);
  assert.match(prompt, /hasmy::\{\{slack\.flagEmoji\}\}: -has::\{\{slack\.doneEmoji\}\}:/);
});

test('the Hebrew texts exist', () => {
  for (const h of ['📌 פפר', '✅ תאריך נקבע', '✅ בלי תאריך']) assert.ok(prompt.includes(h), h);
});

test('tools: scoped, nothing that moves, sends mail or edits the calendar', () => {
  assert.ok(tools.every((t) => !t.includes('*')));
  for (const bad of ['Bash', 'Edit', 'Write', 'mcp__monday_com__all_monday_api', 'mcp__monday_com__move_object', 'mcp__Gmail__send_message', 'mcp__Gmail__create_draft', 'mcp__Google_Calendar__create_event']) assert.ok(!tools.includes(bad), bad);
  for (const need of ['mcp__Slack__slack_search_public_and_private', 'mcp__Slack__slack_add_reaction', 'mcp__Slack__slack_send_message', 'mcp__monday_com__create_item', 'mcp__monday_com__change_item_column_values']) assert.ok(tools.includes(need), need);
});

test('schedule is the build-prompt cron; agent ported but disabled until a clean dry-run', () => {
  const s = JSON.parse(fs.readFileSync(path.join(dir, 'schedule.json'), 'utf8'));
  assert.equal(s.cron, '0 9-18/2 * * 0-4'); assert.equal(s.enabled, false);
  process.env.AGENTS_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-'));
  delete require.cache[require.resolve('../server/agents')];
  const agents = require('../server/agents');
  assert.equal(agents.registry().find((a) => a.id === 'slack-flag-to-task').ported, true);
  assert.throws(() => agents.setEnabled('slack-flag-to-task', true), /dry-run first/);
});

test('runner: a dry run hands the model the rendered prompt and scoped tools', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-run-')), out = path.join(tmp, 'p.txt'), stub = path.join(tmp, 'claude.js');
  fs.writeFileSync(stub, `#!/usr/bin/env node\nrequire('fs').writeFileSync(process.env.PROMPT_OUT, process.argv[3] + '\\nTOOLS=' + process.argv[5]);\nconsole.log('RESULT: {"delivery":"n/a","summary":"nothing to do"}');\n`); fs.chmodSync(stub, 0o755);
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-agent.js'), 'slack-flag-to-task', '--force', '--dry-run'], { env: { ...process.env, AGENTS_DATA_DIR: tmp, CLAUDE_BIN: stub, PROMPT_OUT: out }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const sent = fs.readFileSync(out, 'utf8');
  assert.match(sent, /^Today is \d{4}-\d{2}-\d{2}/); assert.match(sent, /DRY RUN: do not write anywhere/); assert.ok(!/\{\{/.test(sent));
  assert.match(sent, /TOOLS=.*slack_add_reaction/);
  const run = JSON.parse(fs.readFileSync(path.join(tmp, 'runs', 'slack-flag-to-task.json'), 'utf8'))[0];
  assert.equal(run.ok, true); assert.equal(run.dryRun, true);
});
