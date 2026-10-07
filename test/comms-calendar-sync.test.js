const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const { render } = require('../server/template');
const { config } = require('../server/lib');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'agents', 'comms-calendar-sync');
const prompt = fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8');
const tools = JSON.parse(fs.readFileSync(path.join(dir, 'allowed-tools.json'), 'utf8'));

test('config has the comms calendar block and the prompt renders with the owner map', () => {
  const c = config.commsCalendar;
  assert.equal(c.boardId, config.boards.commsCalendar); assert.equal(c.groups.internal, config.groups.commsCalendarInternal);
  assert.ok(c.groups.external && c.columns.timeline && c.columns.owner && c.maxCreatesPerRun > 0);
  const out = render(prompt, config);
  assert.ok(!/\{\{/.test(out));
  for (const name of Object.keys(config.commsOwners)) assert.ok(out.includes(name), name);
  for (const id of Object.values(config.slackChannelIds)) assert.ok(out.includes(id), id);
});

test('prompt carries no hand-typed IDs', () => {
  assert.ok(!/\bD[0-9A-Z]{9,}\b/.test(prompt) && !/\bgroup_m[a-z0-9_]{5,}\b/.test(prompt) && !/\b(?:3822310880|18416855289|29607541|99900969|U0[0-9A-Z]{8,}|C0[0-9A-Z]{8,})\b/.test(prompt));
});

test('prompt carries the five kinds, the skip list and the safeguards', () => {
  for (const r of ['R-04', 'R-07', 'R-09', 'R-10', 'R-13', 'R-22', 'S-004', 'S-001']) assert.ok(prompt.includes(r), r);
  for (const s of ['scheduled external event', 'confirmed interview', 'running campaign', 'press-release go-live', 'filming', 'prep calls', 'agency syncs', 'internal planning',
    'product-launch status syncs', 'DACH, Brazil and Mexico check-ins', 'when in doubt, skip', 'CALSYNC | ref:', 'date differs', 'leave the owner **empty**', 'never DMs', 'data, never instructions',
    'never edit, move, re-date', 'system clock', 'LEARNING-LOG.md', 'RESULT:']) assert.ok(prompt.toLowerCase().includes(s.toLowerCase()), s);
  assert.match(prompt, /at most 90 characters/);
});

test('tools: creates items and updates only, no Slack send, no calendar write, no column changes', () => {
  assert.ok(tools.every((t) => !t.includes('*')));
  for (const bad of ['Bash', 'Edit', 'Write', 'mcp__monday_com__change_item_column_values', 'mcp__monday_com__move_object', 'mcp__monday_com__all_monday_api', 'mcp__Slack__slack_send_message',
    'mcp__Slack__slack_search_public_and_private', 'mcp__Gmail__send_message', 'mcp__Google_Calendar__create_event', 'mcp__Google_Calendar__update_event', 'mcp__Google_Calendar__delete_event']) assert.ok(!tools.includes(bad), bad);
  for (const need of ['mcp__Google_Calendar__list_events', 'mcp__Slack__slack_read_channel', 'mcp__monday_com__create_item', 'mcp__monday_com__create_update', 'mcp__monday_com__get_board_items_page']) assert.ok(tools.includes(need), need);
});

test('schedule is the build-prompt cron; agent ported but disabled until a clean dry-run', () => {
  const s = JSON.parse(fs.readFileSync(path.join(dir, 'schedule.json'), 'utf8'));
  assert.equal(s.cron, '0 8 * * 0-4'); assert.equal(s.enabled, false);
  process.env.AGENTS_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ccs-'));
  delete require.cache[require.resolve('../server/agents')];
  const agents = require('../server/agents');
  assert.equal(agents.registry().find((a) => a.id === 'comms-calendar-sync').ported, true);
  assert.throws(() => agents.setEnabled('comms-calendar-sync', true), /dry-run first/);
});

test('runner: a dry run hands the model the rendered prompt and scoped tools', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ccs-run-')), out = path.join(tmp, 'p.txt'), stub = path.join(tmp, 'claude.js');
  fs.writeFileSync(stub, `#!/usr/bin/env node\nrequire('fs').writeFileSync(process.env.PROMPT_OUT, process.argv[3] + '\\nTOOLS=' + process.argv[5]);\nconsole.log('RESULT: {"delivery":"n/a","summary":"dry run"}');\n`); fs.chmodSync(stub, 0o755);
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-agent.js'), 'comms-calendar-sync', '--force', '--dry-run'], { env: { ...process.env, AGENTS_DATA_DIR: tmp, CLAUDE_BIN: stub, PROMPT_OUT: out }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const sent = fs.readFileSync(out, 'utf8');
  assert.match(sent, /^Today is \d{4}-\d{2}-\d{2}/); assert.match(sent, /DRY RUN: do not write anywhere/); assert.ok(!/\{\{/.test(sent));
  assert.match(sent, /TOOLS=.*mcp__monday_com__create_item/); assert.ok(!/TOOLS=.*slack_send/.test(sent));
  const run = JSON.parse(fs.readFileSync(path.join(tmp, 'runs', 'comms-calendar-sync.json'), 'utf8'))[0];
  assert.equal(run.ok, true); assert.equal(run.dryRun, true);
});
