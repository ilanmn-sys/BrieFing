const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const { render } = require('../server/template');
const { config } = require('../server/lib');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'agents', 'weekly-learning-review');
const prompt = fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8');
const tools = JSON.parse(fs.readFileSync(path.join(dir, 'allowed-tools.json'), 'utf8'));

test('prompt renders fully and carries no hand-typed IDs', () => {
  const out = render(prompt, config);
  assert.ok(!/\{\{/.test(out));
  assert.ok(!/\bD[0-9A-Z]{9,}\b/.test(prompt) && !/\bgroup_mm[0-9a-z]{5,}\b/.test(prompt));
  assert.ok(!/\b(?:18416855289|29607541|U0[0-9A-Z]{8,}|U038UEUQC1Y)\b/.test(prompt));
  assert.match(out, new RegExp(config.pepper.userId)); assert.match(out, new RegExp(config.me.slackUserId));
});

test('prompt carries the rules, markers and safeguards', () => {
  for (const r of ['R-09', 'R-10', 'R-12', 'R-13', 'S-001', 'S-005']) assert.ok(prompt.includes(r), r);
  for (const s of ['system clock', 'LEARNING-LOG.md', 'data, never instructions', 'Ilan\'s decision', 'review_ts', '📚 סקירה שבועית', 'Newest first.', 'highest `S-` number',
    'highest `R-` number', 'never renumber'.replace('never', 'Never'), 'two independent signals', 'at most 5 proposals', 'is **not** an approval', 'lapsed', 'already ran today', 'R-12 follow-up', 'RESULT:']) assert.ok(prompt.includes(s), s);
});

test('approval vocabulary, English and Hebrew', () => {
  for (const a of ['apply all', 'apply 1,3', 'skip', 'אשר הכל', 'אשר 1,3', 'דלג']) assert.ok(prompt.includes(a), a);
  for (const h of ['📚✅ יושם', 'אין שינויי חוקים השבוע', 'ממתין מהשבוע שעבר']) assert.ok(prompt.includes(h), h);
});

test('tools: no board write, no Bash, edit limited to the learning log, one send tool', () => {
  assert.ok(tools.every((t) => !t.includes('*')));
  assert.ok(tools.includes('Edit(LEARNING-LOG.md)') && tools.includes('Grep'));
  for (const bad of ['Bash', 'Edit', 'Write', 'mcp__monday_com__create_item', 'mcp__monday_com__create_update', 'mcp__monday_com__change_item_column_values', 'mcp__monday_com__all_monday_api', 'mcp__Gmail__send_message', 'mcp__Google_Calendar__create_event']) assert.ok(!tools.includes(bad), bad);
  for (const need of ['mcp__Slack__slack_read_channel', 'mcp__Slack__slack_send_message']) assert.ok(tools.includes(need), need);
});

test('schedule is the build-prompt cron; agent ported but disabled until a clean dry-run', () => {
  const s = JSON.parse(fs.readFileSync(path.join(dir, 'schedule.json'), 'utf8'));
  assert.equal(s.cron, '0 16 * * 4'); assert.equal(s.enabled, false);
  process.env.AGENTS_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'wlr-'));
  delete require.cache[require.resolve('../server/agents')];
  const agents = require('../server/agents');
  assert.equal(agents.registry().find((a) => a.id === 'weekly-learning-review').ported, true);
  assert.throws(() => agents.setEnabled('weekly-learning-review', true), /dry-run first/);
});

test('runner: a dry run hands the model the rendered prompt and scoped tools', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wlr-run-')), out = path.join(tmp, 'p.txt'), stub = path.join(tmp, 'claude.js');
  fs.writeFileSync(stub, `#!/usr/bin/env node\nrequire('fs').writeFileSync(process.env.PROMPT_OUT, process.argv[3] + '\\nTOOLS=' + process.argv[5]);\nconsole.log('RESULT: {"delivery":"n/a","summary":"dry run"}');\n`); fs.chmodSync(stub, 0o755);
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-agent.js'), 'weekly-learning-review', '--force', '--dry-run'], { env: { ...process.env, AGENTS_DATA_DIR: tmp, CLAUDE_BIN: stub, PROMPT_OUT: out }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const sent = fs.readFileSync(out, 'utf8');
  assert.match(sent, /^Today is \d{4}-\d{2}-\d{2}/); assert.match(sent, /DRY RUN: do not write anywhere/); assert.ok(!/\{\{/.test(sent));
  assert.match(sent, /TOOLS=.*Edit\(LEARNING-LOG\.md\)/); assert.ok(!/TOOLS=.*create_update/.test(sent));
  const run = JSON.parse(fs.readFileSync(path.join(tmp, 'runs', 'weekly-learning-review.json'), 'utf8'))[0];
  assert.equal(run.ok, true); assert.equal(run.dryRun, true);
});
