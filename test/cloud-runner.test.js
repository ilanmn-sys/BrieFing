const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const path = require('path');
const { spawnSync } = require('child_process');
const { renderFor } = require('../scripts/render-agent');

const root = path.join(__dirname, '..');
const ids = fs.readdirSync(path.join(root, 'agents')).filter((d) => fs.existsSync(path.join(root, 'agents', d, 'prompt.md')));

test('every agent renders for the cloud, in DRY RUN unless its schedule.json says live', () => {
  for (const id of ids) {
    const s = JSON.parse(fs.readFileSync(path.join(root, 'agents', id, 'schedule.json'), 'utf8'));
    const r = renderFor(id);
    assert.equal(r.mode, s.cloud && s.cloud.mode === 'live' ? 'live' : 'dry-run', id);
    assert.ok(!/\{\{/.test(r.prompt), id);
    assert.match(r.prompt, /^Today is \d{4}-\d{2}-\d{2}/, id);
    assert.match(r.prompt, /Hard rule: use only these tools/, id);
    assert.match(r.prompt, /RESULT:/, id);
    if (r.mode === 'dry-run') assert.match(r.prompt, /DRY RUN: do not write anywhere/, id);
  }
});

test('Mac-only pieces are mapped: the move endpoint, the session ledger, data/ and the learning log', () => {
  const strat = renderFor('daily-board-strategy').prompt;
  assert.match(strat, /Cloud note: The local move endpoint .* does not exist in the cloud/);
  assert.match(strat, /move_item_to_group/); assert.match(strat, /mcp__monday_com__all_monday_api \(only the move_item_to_group mutation/);
  assert.ok(!/the shell command curl/.test(strat));
  assert.match(strat, /Cloud note: If you edit LEARNING-LOG\.md/);
  const log = renderFor('log-claude-work-to-board').prompt;
  assert.match(log, /Mac sessions: not available in the cloud/); assert.ok(!/the shell command node scripts\/list-sessions/.test(log));
  const inbox = renderFor('pepper-inbox').prompt;
  assert.ok(!/move endpoint|LEARNING-LOG\.md, commit/.test(inbox.split('\n').filter((l) => l.startsWith('Cloud note')).join('\n')));
  assert.match(inbox, /Files under data\/ do not persist/);
});

test('a live mode in schedule.json switches off the dry-run line; the CLI prints the prompt', () => {
  const f = path.join(root, 'agents', 'pepper-inbox', 'schedule.json'), keep = fs.readFileSync(f, 'utf8');
  try {
    fs.writeFileSync(f, JSON.stringify({ ...JSON.parse(keep), cloud: { mode: 'live' } }));
    const r = renderFor('pepper-inbox');
    assert.equal(r.mode, 'live'); assert.ok(!/DRY RUN/.test(r.prompt)); assert.match(r.prompt, /mode: LIVE/);
  } finally { fs.writeFileSync(f, keep); }
  const cli = spawnSync(process.execPath, [path.join(root, 'scripts', 'render-agent.js'), 'pepper-inbox'], { encoding: 'utf8' });
  assert.equal(cli.status, 0); assert.match(cli.stdout, /mode: DRY-RUN/);
  assert.equal(spawnSync(process.execPath, [path.join(root, 'scripts', 'render-agent.js'), 'nope'], { encoding: 'utf8' }).status, 1);
});
