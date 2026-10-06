const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
process.env.MONDAY_API_TOKEN = 'x';
process.env.DECISIONS_FILE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dec-')), 'decisions.json');
const { parseAmount, detectBoard, liveSeeds, order } = require('../server/decisionsLogic');
const { config } = require('../server/lib');
const G = config.groups;

const t = (id, name, o = {}) => ({ id: String(id), name, group: 'A', status: '', deadline: '', ...o });

test('amounts: $27K, $12.5K, €1,200 style, ₪ and no-amount', () => {
  assert.equal(parseAmount('Ruben Hassid $27K').value, 27000);
  assert.equal(parseAmount('Sebastian $12.5K').value, 12500);
  assert.equal(parseAmount('budget €1.2M').value, 1200000);
  assert.equal(parseAmount('₪500 לאשר').value, 500);
  assert.equal(parseAmount('no money here'), null);
});

test('board detection: decision words or an amount; honours the Tasks-tab visibility rules', () => {
  const items = [
    t(1, 'Nuno dos Santos — DECISION extend/end'), t(2, 'Approve $27K proposal'), t(3, 'Plain task'),
    t(4, 'DECISION done already', { status: 'Done' }), t(5, 'Noise decision', { group: G.parking.noise }),
    t(6, 'Daily inbox digest approval'), t(7, 'החלטה על הספק'), t(8, 'Budget review'),
  ];
  const d = detectBoard(items, G).map((x) => x.itemId);
  assert.deepEqual(d.sort(), ['1', '2', '7', '8']);
});

test('seeds hide themselves once a board item or email covers them', () => {
  const board = detectBoard([t(1, 'Wes Roth $13.5K approval')], G);
  const left = liveSeeds(config.decisionSeeds, board, ['Re: Emma Steuer proposal']).map((s) => s.key);
  assert.ok(!left.includes('seed:narrative-wes-roth')); assert.ok(!left.includes('seed:emma-steuer'));
  assert.ok(left.includes('seed:narrative-riley-brown'));
  assert.equal(config.decisionSeeds.length, 6);
});

test('ordering: earliest deadline, then biggest amount', () => {
  const o = order([{ name: 'c', deadline: '', value: 5 }, { name: 'a', deadline: '2026-10-10', value: 1 }, { name: 'b', deadline: '', value: 40000 }, { name: 'd', deadline: '2026-10-09', value: 0 }]);
  assert.deepEqual(o.map((x) => x.name), ['d', 'a', 'b', 'c']);
});

// ---- resolve ----
let calls = [], fail = false;
global.fetch = async (url, opts = {}) => { calls.push(String(opts.body || '')); return { ok: true, status: 200, text: async () => JSON.stringify(fail ? { errors: [{ message: 'boom' }] } : { data: { create_update: { id: '9' } } }) }; };
const api = require('../server/decisionsApi');
const reset = () => { calls = []; fail = false; try { fs.unlinkSync(process.env.DECISIONS_FILE); } catch (_) {} };

test('dry-run (default): no board call, nothing saved', async () => {
  delete process.env.DRY_RUN; reset();
  const r = await api.resolve({ key: 'board:5', itemId: '5', outcome: 'approved', note: 'ok' });
  assert.equal(r.dryRun, true); assert.equal(calls.length, 0); assert.deepEqual(api.readState(), {});
});

test('live board decision: update is posted on the item, then saved locally', async () => {
  process.env.DRY_RUN = '0'; reset();
  const r = await api.resolve({ key: 'board:5', itemId: '5', outcome: 'approved', note: 'within budget' });
  assert.equal(r.boardUpdate, 'ok'); assert.equal(r.localOnly, false);
  assert.match(calls[0], /Decision: Approved\. within budget/);
  assert.equal(api.readState()['board:5'].outcome, 'approved');
});

test('live: if the board update fails nothing is saved locally', async () => {
  process.env.DRY_RUN = '0'; reset(); fail = true;
  await assert.rejects(() => api.resolve({ key: 'board:5', itemId: '5', outcome: 'declined' }), /boom/);
  assert.deepEqual(api.readState(), {});
});

test('email and seed decisions are saved locally and flagged local-only', async () => {
  process.env.DRY_RUN = '0'; reset();
  const r = await api.resolve({ key: 'seed:emma-steuer', outcome: 'deferred' });
  assert.equal(r.localOnly, true); assert.equal(calls.length, 0);
});

test('validation: key format, outcome, board item id', async () => {
  process.env.DRY_RUN = '0'; reset();
  await assert.rejects(() => api.resolve({ key: '../etc', outcome: 'approved' }), /invalid key/);
  await assert.rejects(() => api.resolve({ key: 'seed:x', outcome: 'maybe' }), /invalid outcome/);
  await assert.rejects(() => api.resolve({ key: 'board:5', itemId: 'x', outcome: 'approved' }), /item id/);
});
