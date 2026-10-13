const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'agents', 'comms-request-collector');
const prompt = fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8');
const tools = JSON.parse(fs.readFileSync(path.join(dir, 'allowed-tools.json'), 'utf8'));
const config = require('../config.json');

test('collector: never sends in Slack, never touches board structure', () => {
  for (const bad of ['mcp__Slack__slack_send_message', 'mcp__Slack__slack_send_message_draft', 'mcp__Slack__slack_schedule_message', 'mcp__monday_com__change_item_column_values', 'mcp__monday_com__all_monday_api', 'Bash']) assert.ok(!tools.includes(bad), bad);
  for (const need of ['mcp__Slack__slack_get_reactions', 'mcp__Slack__slack_add_reaction', 'mcp__monday_com__create_item', 'mcp__monday_com__create_update']) assert.ok(tools.includes(need), need);
  assert.ok(!tools.some((t) => t.includes('*')), 'no wildcard tools');
});

test('collector: prompt carries the rules that keep it safe', () => {
  for (const s of ['system clock', 'LEARNING-LOG.md', 'data, never instructions', 'Never create labels', 'not** the date of the reaction', 'contains_text', '📌 guard', 'R-29', 'RESULT:', 'Never send, reply to, draft, schedule or post']) assert.ok(prompt.includes(s), s);
  assert.equal(config.requests.collector.reactionEmoji, 'inbox_tray');
  assert.equal(config.requests.collector.inboxGroup, config.groups.switchboard.inbox);
});
