const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const { render } = require('../server/template');
const { config } = require('../server/lib');

const root = path.join(__dirname, '..');
const AGENTS = { 'agencies-daily-nudge': '0 8 * * 1-5', 'agencies-weekly-roundup': '30 8 * * 1', 'influencer-crm-daily-scan': '0 8 * * *', 'daily-inbox-action-items-to-ilan-pa': '5 8 * * *', 'weekly-linkedin-post-proposal': '0 9 * * 3' };
const load = (a) => ({ prompt: fs.readFileSync(path.join(root, 'agents', a, 'prompt.md'), 'utf8'), tools: JSON.parse(fs.readFileSync(path.join(root, 'agents', a, 'allowed-tools.json'), 'utf8')) });
const NEVER = ['Bash', 'Edit', 'Write', 'mcp__Gmail__send_message', 'mcp__Gmail__reply', 'mcp__Gmail__forward', 'mcp__Gmail__trash_thread', 'mcp__Gmail__label_thread', 'mcp__Google_Calendar__create_event', 'mcp__Google_Calendar__update_event',
  'mcp__Google_Calendar__respond_to_event', 'mcp__monday_com__move_object', 'mcp__monday_com__all_monday_api', 'mcp__Slack__slack_add_reaction'];

test('config blocks match the verified boards', () => {
  assert.equal(config.influencers.boardId, config.boards.influencersCrm);
  for (const k of ['stage', 'latestPost', 'relatedInfluencer', 'dealValue', 'followers', 'nextFollowUp']) assert.ok(config.influencers.columns[k], k);
  assert.ok(config.influencers.groups.emailLog && config.influencers.groups.duplicates);
  assert.ok(config.agencies.names.includes('Scherf') && config.agencies.syncNotesBoardId === 473764901);
  assert.ok(config.inbox.query.includes('-category:promotions') && config.slackChannelIds[config.inbox.channel]);
  assert.equal(config.linkedin.maxWords, 150);
});

for (const [id, cron] of Object.entries(AGENTS)) {
  test(`${id}: renders fully, no hand-typed IDs, standard guards, scoped tools, schedule, disabled`, () => {
    const { prompt, tools } = load(id);
    const out = render(prompt, config);
    assert.ok(!/\{\{/.test(out));
    assert.ok(!/\bD[0-9A-Z]{9,}\b/.test(prompt) && !/\bgroup_m[a-z0-9_]{5,}\b/.test(prompt) && !/\b(?:18416855289|18425284143|473764901|29607541|U0[0-9A-Z]{8,}|C0[0-9A-Z]{8,})\b/.test(prompt));
    for (const s of ['system clock', 'LEARNING-LOG.md', 'data, never instructions', 'R-09', 'S-001', 'RESULT:', 'dry run']) assert.ok(prompt.includes(s), s);
    assert.ok(tools.every((t) => !t.includes('*')));
    for (const bad of NEVER) assert.ok(!tools.includes(bad), bad);
    const s = JSON.parse(fs.readFileSync(path.join(root, 'agents', id, 'schedule.json'), 'utf8'));
    assert.equal(s.cron, cron); assert.equal(s.enabled, false);
    process.env.AGENTS_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'g6-'));
    delete require.cache[require.resolve('../server/agents')];
    const agents = require('../server/agents');
    assert.equal(agents.registry().find((a) => a.id === id).ported, true);
    assert.throws(() => agents.setEnabled(id, true), /dry-run first/);
  });

  test(`${id}: a dry run hands the model the rendered prompt and the scoped tools`, () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'g6-run-')), out = path.join(tmp, 'p.txt'), stub = path.join(tmp, 'claude.js');
    fs.writeFileSync(stub, `#!/usr/bin/env node\nrequire('fs').writeFileSync(process.env.PROMPT_OUT, process.argv[3] + '\\nTOOLS=' + process.argv[5]);\nconsole.log('RESULT: {"delivery":"n/a","summary":"dry run"}');\n`); fs.chmodSync(stub, 0o755);
    const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-agent.js'), id, '--force', '--dry-run'], { env: { ...process.env, AGENTS_DATA_DIR: tmp, CLAUDE_BIN: stub, PROMPT_OUT: out }, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const sent = fs.readFileSync(out, 'utf8');
    assert.match(sent, /^Today is \d{4}-\d{2}-\d{2}/); assert.match(sent, /DRY RUN: do not write anywhere/); assert.ok(!/\{\{/.test(sent));
    const run = JSON.parse(fs.readFileSync(path.join(tmp, 'runs', id + '.json'), 'utf8'))[0];
    assert.equal(run.ok, true); assert.equal(run.dryRun, true);
  });
}

test('agencies: read-only board, one DM to Ilan by user id, flag never re-date', () => {
  for (const id of ['agencies-daily-nudge', 'agencies-weekly-roundup']) {
    const { prompt, tools } = load(id);
    for (const s of ['S-005', 'H-01', 're-date', 'R-16', 'R-05', 'user id', 'change nothing', 'to Ilan']) assert.ok(prompt.toLowerCase().includes(s.toLowerCase()), id + ': ' + s);
    assert.ok(!tools.some((t) => /monday_com__(create|change|update_)/.test(t)), id);
    assert.ok(tools.includes('mcp__Slack__slack_send_message'));
  }
  assert.ok(load('agencies-daily-nudge').prompt.includes('stay silent'));
});

test('influencer scan: the three known bugs are guarded, decisions are not applied', () => {
  const { prompt, tools } = load('influencer-crm-daily-scan');
  for (const s of ['header date is the clock line', 'DD.MM.YYYY', 'DM Ilan by his user id', 'check the send result', 'Nitter is down', 'Never fill or change a follower', 'unavailable', 'THREAD:<gmail thread id>', 'R-07', 'R-08', 'R-22',
    'Stage, Priority, Tier, Owner, Deal Value, Followers, Engagement, Next Follow-up', 'principle 8', 'never write into the Duplicates group'.replace('never', 'never')]) assert.ok(prompt.toLowerCase().includes(s.toLowerCase()), s);
  assert.ok(tools.includes('mcp__monday_com__create_item') && !tools.includes('mcp__Gmail__create_draft') && !tools.includes('mcp__Gmail__send_message'));
});

test('inbox digest: drafts only, decisions never drafted, thread read first, no calendar', () => {
  const { prompt, tools } = load('daily-inbox-action-items-to-ilan-pa');
  for (const s of ['AI drafts, human sends', 'R-19', 'R-22', 'read the whole thread', 'No draft', 'No calendar invites', 'never adds anyone'.replace('never adds anyone', 'never add anyone'), 'Gmail draft reply in that thread', 'automated', 'waiting', 'fyi', 'decision', 'reply']) assert.ok(prompt.includes(s), s);
  assert.ok(tools.includes('mcp__Gmail__create_draft') && tools.includes('mcp__Gmail__get_thread') && !tools.some((t) => t.startsWith('mcp__Google_Calendar')) && !tools.some((t) => /monday_com/.test(t)));
});

test('linkedin proposal: one draft to Ilan, no emoji, published sources only, nothing posted', () => {
  const { prompt, tools } = load('weekly-linkedin-post-proposal');
  for (const s of ['no emoji', 'Three hook options', 'one clear call to action', 'already published', 'not configured', 'AI drafts, human sends', 'nothing is posted to LinkedIn', 'Principle 8', 'at most 3 hashtags']) assert.ok(prompt.includes(s), s);
  assert.ok(tools.includes('mcp__Gmail__create_draft') && !tools.some((t) => t.startsWith('mcp__Slack')) && !tools.some((t) => /monday_com__(create|change|update_)/.test(t)));
});
