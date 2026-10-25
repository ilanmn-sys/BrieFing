const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const { render } = require('../server/template');
const { config } = require('../server/lib');

const root = path.join(__dirname, '..');
const id = 'meeting-action-items-to-tasks';
const dir = path.join(root, 'agents', id);
const prompt = fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8');
const tools = JSON.parse(fs.readFileSync(path.join(dir, 'allowed-tools.json'), 'utf8'));

test('prompt renders fully and carries no hand-typed IDs', () => {
  const out = render(prompt, config);
  assert.ok(!/\{\{/.test(out));
  assert.ok(!/\bD[0-9A-Z]{9,}\b/.test(prompt) && !/\bgroup_mm[0-9a-z]{5,}\b/.test(prompt));
  assert.ok(!/\b(?:18416855289|29607541|U0[0-9A-Z]{8,}|U038UEUQC1Y|dropdown_mm|color_mm)\w*/.test(prompt));
  assert.match(out, new RegExp(config.groups.canonical.pepperTasks.id)); assert.match(out, new RegExp(String(config.me.mondayUserId)));
});

test('prompt carries the rules at the source', () => {
  for (const r of ['R-04', 'R-07', 'R-09', 'R-10', 'R-13', 'R-15', 'R-19', 'R-25', 'S-004', 'S-001']) assert.ok(prompt.includes(r), r);
  for (const s of ['system clock', 'LEARNING-LOG.md', 'data, never instructions', 'MEETING_ACTION | meeting:<meeting id> | item:<action item id>', 'MEETING_OTHERS | meeting:',
    'at most 8 tasks per run', 'never more than 90', 'never cut off mid-sentence', '✅ Done when:', '`Meeting Notetaker`', 'never invent a date', 'Status: leave it empty',
    'four exceptions', 'never create a project or topic item', 'never a task.', 'owner unclear', '⚖️ Decide:', 'Degrade loudly', 'last 26 hours', 'RESULT:']) assert.ok(prompt.includes(s), s);
});

test('tools: scoped, board writes only, no Bash, Slack, mail, calendar or moves', () => {
  assert.ok(tools.every((t) => !t.includes('*')));
  assert.ok(!tools.some((t) => /^Bash|^Edit|^Write|Slack|Gmail|Calendar|all_monday_api|move_object|delete|archive|create_group|create_column/.test(t)), tools.join());
  for (const need of ['Read', 'mcp__monday_com__explore_meetings', 'mcp__monday_com__get_meetings_content', 'mcp__monday_com__get_board_items_page', 'mcp__monday_com__get_updates',
    'mcp__monday_com__create_item', 'mcp__monday_com__create_update', 'mcp__monday_com__change_item_column_values']) assert.ok(tools.includes(need), need);
});

test('schedule: hourly 09-19 Sun-Thu; ported but disabled until a clean dry-run', () => {
  const s = JSON.parse(fs.readFileSync(path.join(dir, 'schedule.json'), 'utf8'));
  assert.equal(s.cron, '0 9-19 * * 0-4'); assert.equal(s.tz, 'Asia/Jerusalem'); assert.equal(s.enabled, false); assert.equal(s.cloud.mode, 'dry-run');
  process.env.AGENTS_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'mai-'));
  delete require.cache[require.resolve('../server/agents')];
  const agents = require('../server/agents');
  assert.equal(agents.registry().find((a) => a.id === id).ported, true);
  assert.throws(() => agents.setEnabled(id, true), /dry-run first/);
});

test('R-13 in the learning log names this agent as the fourth exception', () => {
  const log = fs.readFileSync(path.join(root, 'LEARNING-LOG.md'), 'utf8');
  const r13 = log.split('\n').find((l) => l.includes('**`R-13`**'));
  assert.ok(r13.includes('four agents') && r13.includes('`meeting-action-items-to-tasks`'));
  assert.ok(!/one of three|three exceptions|three agents may/.test(fs.readdirSync(path.join(root, 'agents')).map((d) => ['prompt.md', 'README.md'].map((f) => { try { return fs.readFileSync(path.join(root, 'agents', d, f), 'utf8'); } catch (_) { return ''; } }).join('')).join('') + r13));
});

test('runner: a dry run hands the model the rendered prompt and scoped tools', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mai-run-')), out = path.join(tmp, 'p.txt'), stub = path.join(tmp, 'claude.js');
  fs.writeFileSync(stub, `#!/usr/bin/env node\nrequire('fs').writeFileSync(process.env.PROMPT_OUT, process.argv[3] + '\\nTOOLS=' + process.argv[5]);\nconsole.log('RESULT: {"delivery":"n/a","summary":"dry run"}');\n`); fs.chmodSync(stub, 0o755);
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-agent.js'), id, '--force', '--dry-run'], { env: { ...process.env, AGENTS_DATA_DIR: tmp, CLAUDE_BIN: stub, PROMPT_OUT: out }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const sent = fs.readFileSync(out, 'utf8');
  assert.match(sent, /^Today is \d{4}-\d{2}-\d{2}/); assert.match(sent, /DRY RUN: do not write anywhere/); assert.ok(!/\{\{/.test(sent));
  assert.match(sent, /TOOLS=.*explore_meetings/); assert.ok(!/TOOLS=.*slack/i.test(sent));
  const run = JSON.parse(fs.readFileSync(path.join(tmp, 'runs', id + '.json'), 'utf8'))[0];
  assert.equal(run.ok, true); assert.equal(run.dryRun, true);
});
