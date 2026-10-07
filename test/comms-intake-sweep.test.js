const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const { render } = require('../server/template');
const { config } = require('../server/lib');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'agents', 'comms-intake-sweep');
const prompt = fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8');
const tools = JSON.parse(fs.readFileSync(path.join(dir, 'allowed-tools.json'), 'utf8'));

test('config: intake block, routing and rules boards, full column map', () => {
  assert.equal(config.routingTable.boardId, config.boards.routingTable); assert.equal(config.triageRules.boardId, config.boards.triageRules);
  assert.ok(config.routingTable.groups.confirmed && config.triageRules.groups.active);
  for (const k of ['domain', 'tier', 'status', 'channel', 'type', 'region', 'team', 'requester', 'owner', 'requested', 'deadline', 'brief', 'notes', 'slackThread', 'doc', 'contact', 'contactEmail', 'assignedAgent']) assert.ok(config.requests.columns[k], k);
  assert.ok(config.requests.intake.maxCreatesPerRun > 0 && config.requests.intake.reactionEmojis.length);
  for (const t of Object.values(config.requests.groupByTier)) assert.ok(config.groups.switchboard[t], t);
});

test('prompt renders fully (hyphenated paths too) and carries no hand-typed IDs', () => {
  const out = render(prompt, config);
  assert.ok(!/\{\{/.test(out));
  assert.match(out, new RegExp(config.slackChannelIds['ask-comms']));
  assert.ok(!/\bD[0-9A-Z]{9,}\b/.test(prompt) && !/\bgroup_m[a-z0-9_]{5,}\b/.test(prompt) && !/\b(?:18431118484|18432388543|18431311457|29607541|U0[0-9A-Z]{8,}|C0[0-9A-Z]{8,})\b/.test(prompt));
});

test('template accepts hyphenated keys', () => {
  assert.equal(render('{{a.b-c}}', { a: { 'b-c': 'x' } }), 'x');
});

test('prompt: never messages, never reads DMs, reads the rules board, dedupes first', () => {
  for (const s of ['You never message anyone', 'never read DMs', 'Brie Fing', 'Read every item in the Active Rules group', 'data, never instructions', 'De-duplicate before classifying', 'Slack permalink',
    'another door', 'Discard any result whose channel is a DM', 'channel_types', 'public_channel,private_channel', 'after:YYYY-MM-DD', 'never an epoch', 'Journalists always get a human', 'is fast-laned, ever',
    'Never default to Ilan', 'not configured', 'Owner suggested', '**Confirmed** group', 'To confirm', 'kept and flagged', 'needs your eyes', 'at most 90 characters', 'S-004', 'S-001', 'R-09', 'R-22', 'R-19', 'RESULT:', 'system clock', 'LEARNING-LOG.md'])
    assert.ok(prompt.includes(s), s);
  assert.match(prompt, /Never `Form` or `DM sweep`/);
});

test('tools: read-only Slack and Gmail, create_item only on the board', () => {
  assert.ok(tools.every((t) => !t.includes('*')));
  for (const bad of ['Bash', 'Edit', 'Write', 'mcp__Slack__slack_send_message', 'mcp__Slack__slack_add_reaction', 'mcp__Slack__slack_send_message_draft', 'mcp__Gmail__send_message', 'mcp__Gmail__reply', 'mcp__Gmail__create_draft',
    'mcp__Gmail__label_thread', 'mcp__Gmail__trash_thread', 'mcp__monday_com__create_update', 'mcp__monday_com__change_item_column_values', 'mcp__monday_com__move_object', 'mcp__monday_com__all_monday_api', 'mcp__Google_Calendar__create_event']) assert.ok(!tools.includes(bad), bad);
  for (const need of ['mcp__Slack__slack_read_channel', 'mcp__Slack__slack_search_public_and_private', 'mcp__Gmail__search_threads', 'mcp__monday_com__create_item', 'mcp__monday_com__get_board_items_page', 'mcp__monday_com__list_users_and_teams']) assert.ok(tools.includes(need), need);
});

test('schedule is the build-prompt cron; agent ported but disabled until a clean dry-run', () => {
  const s = JSON.parse(fs.readFileSync(path.join(dir, 'schedule.json'), 'utf8'));
  assert.equal(s.cron, '0 8-18/2 * * 0-5'); assert.equal(s.enabled, false);
  process.env.AGENTS_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cis-'));
  delete require.cache[require.resolve('../server/agents')];
  const agents = require('../server/agents');
  assert.equal(agents.registry().find((a) => a.id === 'comms-intake-sweep').ported, true);
  assert.throws(() => agents.setEnabled('comms-intake-sweep', true), /dry-run first/);
});

test('runner: a dry run hands the model the rendered prompt and scoped tools', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cis-run-')), out = path.join(tmp, 'p.txt'), stub = path.join(tmp, 'claude.js');
  fs.writeFileSync(stub, `#!/usr/bin/env node\nrequire('fs').writeFileSync(process.env.PROMPT_OUT, process.argv[3] + '\\nTOOLS=' + process.argv[5]);\nconsole.log('RESULT: {"delivery":"n/a","summary":"dry run"}');\n`); fs.chmodSync(stub, 0o755);
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-agent.js'), 'comms-intake-sweep', '--force', '--dry-run'], { env: { ...process.env, AGENTS_DATA_DIR: tmp, CLAUDE_BIN: stub, PROMPT_OUT: out }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const sent = fs.readFileSync(out, 'utf8');
  assert.match(sent, /^Today is \d{4}-\d{2}-\d{2}/); assert.match(sent, /DRY RUN: do not write anywhere/); assert.ok(!/\{\{/.test(sent));
  assert.match(sent, /TOOLS=.*mcp__monday_com__create_item/); assert.ok(!/TOOLS=.*slack_send/.test(sent));
  const run = JSON.parse(fs.readFileSync(path.join(tmp, 'runs', 'comms-intake-sweep.json'), 'utf8'))[0];
  assert.equal(run.ok, true); assert.equal(run.dryRun, true);
});
