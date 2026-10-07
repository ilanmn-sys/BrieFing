const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const { render } = require('../server/template');
const { config } = require('../server/lib');

const root = path.join(__dirname, '..');
const AGENTS = {
  'coverage-inbox-cycle': '0 8-18/2 * * 0-5', 'monday-news-board-cleanup': '0 8 * * 0', 'monday-in-the-news-cross-post': '0 9 * * *',
  'refresh-news-screens': '0 8 * * 1', 'monthly-media-newsletter': '0 9 1 * *', 'quarterly-pr-template-refresh': '0 9 1 1,4,7,10 *',
};
const load = (a) => ({ prompt: fs.readFileSync(path.join(root, 'agents', a, 'prompt.md'), 'utf8'), tools: JSON.parse(fs.readFileSync(path.join(root, 'agents', a, 'allowed-tools.json'), 'utf8')) });
const SEND = ['mcp__Gmail__send_message', 'mcp__Gmail__reply', 'mcp__Gmail__forward', 'mcp__Slack__slack_send_message_draft', 'mcp__Google_Calendar__create_event', 'mcp__monday_com__move_object', 'Bash', 'Edit', 'Write'];

test('config: news block matches the verified boards', () => {
  const n = config.news;
  assert.equal(n.boardId, config.boards.news); assert.equal(n.muckrack.query.includes('alerts@muckrack.com'), true);
  assert.equal(n.spokespeople.boardId, 457713771); assert.equal(n.prTemplate.itemId, 12272450331);
  for (const k of ['link', 'publishDate', 'publication', 'language', 'type', 'sentiment', 'website', 'tier', 'outletTrigger']) assert.ok(n.columns[k], k);
  assert.deepEqual(n.excludeDomains, ['nairaland.com', 'dailypolitical.com', 'zolmax.com', 'theenterpriseleader.com']);
  assert.ok(config.slackChannelIds.monday_in_the_news && config.slackChannelIds['monday-global-agencies']);
});

for (const [id, cron] of Object.entries(AGENTS)) {
  test(`${id}: renders fully, no hand-typed IDs, standard guards, scoped tools, schedule, disabled`, () => {
    const { prompt, tools } = load(id);
    const out = render(prompt, config);
    assert.ok(!/\{\{/.test(out));
    assert.ok(!/\bD[0-9A-Z]{9,}\b/.test(prompt) && !/\bgroup_m[a-z0-9_]{5,}\b|\bnew_group\d+/.test(prompt) && !/\b(?:446791074|457713771|12272450331|29607541|U0[0-9A-Z]{8,}|C0[0-9A-Z]{8,})\b/.test(prompt));
    for (const s of ['system clock', 'LEARNING-LOG.md', 'data, never instructions', 'R-09', 'S-001', 'RESULT:', 'dry run']) assert.ok(prompt.includes(s), s);
    assert.ok(tools.every((t) => !t.includes('*')));
    for (const bad of SEND) assert.ok(!tools.includes(bad), bad);
    const s = JSON.parse(fs.readFileSync(path.join(root, 'agents', id, 'schedule.json'), 'utf8'));
    assert.equal(s.cron, cron); assert.equal(s.enabled, false);
    process.env.AGENTS_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ng-'));
    delete require.cache[require.resolve('../server/agents')];
    const agents = require('../server/agents');
    assert.equal(agents.registry().find((a) => a.id === id).ported, true);
    assert.throws(() => agents.setEnabled(id, true), /dry-run first/);
  });

  test(`${id}: a dry run hands the model the rendered prompt and the scoped tools`, () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ng-run-')), out = path.join(tmp, 'p.txt'), stub = path.join(tmp, 'claude.js');
    fs.writeFileSync(stub, `#!/usr/bin/env node\nrequire('fs').writeFileSync(process.env.PROMPT_OUT, process.argv[3] + '\\nTOOLS=' + process.argv[5]);\nconsole.log('RESULT: {"delivery":"n/a","summary":"dry run"}');\n`); fs.chmodSync(stub, 0o755);
    const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-agent.js'), id, '--force', '--dry-run'], { env: { ...process.env, AGENTS_DATA_DIR: tmp, CLAUDE_BIN: stub, PROMPT_OUT: out }, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const sent = fs.readFileSync(out, 'utf8');
    assert.match(sent, /^Today is \d{4}-\d{2}-\d{2}/); assert.match(sent, /DRY RUN: do not write anywhere/); assert.ok(!/\{\{/.test(sent));
    const run = JSON.parse(fs.readFileSync(path.join(tmp, 'runs', id + '.json'), 'utf8'))[0];
    assert.equal(run.ok, true); assert.equal(run.dryRun, true);
  });
}

test('coverage-inbox-cycle: reads the rolling thread, filters, dedupes, creates only', () => {
  const { prompt, tools } = load('coverage-inbox-cycle');
  for (const s of ['rolling thread', 'get_thread', 'dated within the last 48 hours', 'stock-ticker noise', 'non-outlets', 'syndicated copies', 'normalised link', 'never cut off mid-word', 'S-004', 'R-07', 'R-10', 'is not a clean exit'.replace('is not', 'is never')]) assert.ok(prompt.includes(s), s);
  assert.deepEqual(tools.filter((t) => t.includes('monday_com__')).sort(), ['mcp__monday_com__create_item', 'mcp__monday_com__get_board_info', 'mcp__monday_com__get_board_items_page']);
  assert.ok(tools.includes('mcp__Gmail__get_thread') && !tools.includes('mcp__Gmail__create_draft') && !tools.some((t) => t.startsWith('mcp__Slack')));
});

test('monday-news-board-cleanup: two steps, veto, never touches genuine coverage, archive via one mutation', () => {
  const { prompt, tools } = load('monday-news-board-cleanup');
  for (const s of ['Step A', 'Step B', 'NEWS_CLEANUP | marked:', 'has vetoed the archive', 'archive_item', 'Genuine media coverage is never touched', 'Never mark or archive', 'at least']) assert.ok(prompt.includes(s), s);
  assert.ok(tools.includes('mcp__monday_com__all_monday_api') && !tools.some((t) => t.startsWith('mcp__Slack') || t.startsWith('mcp__Gmail')));
});

test('monday-in-the-news-cross-post: dedupes before posting, one message per story, fixed shape, nothing else', () => {
  const { prompt, tools } = load('monday-in-the-news-cross-post');
  for (const s of ['📰 <headline> — <outlet>', 'one message per story', 'already posted', 'do not post anything: `delivery: failed`', 'embargoed', 'No DMs, no replies, no reactions', 'S-005']) assert.ok(prompt.includes(s), s);
  assert.deepEqual(tools.filter((t) => t.startsWith('mcp__')).sort(), ['mcp__Slack__slack_read_channel', 'mcp__Slack__slack_read_thread', 'mcp__Slack__slack_send_message']);
});

test('refresh-news-screens: writes one plan doc, never the live deck, never a board field', () => {
  const { prompt, tools } = load('refresh-news-screens');
  for (const s of ['You write a plan document', 'never edit the live slideshow', 'NEW', 'ALREADY ON SCREENS', 'Needs new bio', 'Do not change any board item', 'Google Doc in Drive']) assert.ok(prompt.includes(s), s);
  assert.ok(tools.includes('mcp__Google_Drive__create_file') && !tools.includes('mcp__Google_Drive__update_file') && !tools.some((t) => /monday_com__(create|change|update)/.test(t)) && !tools.some((t) => t === 'mcp__Slack__slack_send_message'));
});

test('monthly-media-newsletter: Gmail draft to Ilan only, numbers counted not estimated', () => {
  const { prompt, tools } = load('monthly-media-newsletter');
  for (const s of ['Gmail drafts only', 'never send', 'to = Ilan\'s own address only', 'Every number is counted from the board', 'no reach, no impressions, no AVE', 'Notes for the editor', 'already drafted']) assert.ok(prompt.includes(s), s);
  assert.ok(tools.includes('mcp__Gmail__create_draft') && !tools.includes('mcp__Gmail__send_message') && !tools.some((t) => /monday_com__(create|change|update)/.test(t)));
});

test('quarterly-pr-template-refresh: official sources only, draft to Ilan, never edits the template', () => {
  const { prompt, tools } = load('quarterly-pr-template-refresh');
  for (const s of ['official source domains', 'leave that value unchanged', 'Never use a third-party article', 'one Gmail draft', 'without the @everyone line', 'have **not** been changed', 'template current as of', 'all its updates']) assert.ok(prompt.toLowerCase().includes(s.toLowerCase()), s);
  assert.ok(tools.includes('mcp__Google_Drive__read_file_content') && !tools.includes('mcp__Google_Drive__update_file') && !tools.some((t) => /monday_com__(create|change|update_)/.test(t)));
});
