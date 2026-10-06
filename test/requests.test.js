const test = require('node:test');
const assert = require('node:assert');
process.env.MONDAY_API_TOKEN = 'x';
const { isBot, turn, rank } = require('../server/requestsLogic');
const { config } = require('../server/lib');

const BOTS = config.requests.botNames, ME = 29607541, TODAY = '2026-10-06';
const ctx = { myId: ME, bots: BOTS, today: TODAY, touched: new Set() };
const u = (name, id, at) => ({ creatorName: name, creatorId: id, createdAt: at });
const item = (id, o = {}) => ({ id, name: 'item ' + id, deadline: '', tier: '', updates: [], ...o });

test('bot filter matches the configured names, case-insensitively, plus empty authors', () => {
  for (const n of ['Pepper Ocana', 'Clark', 'Brie Fing', 'airflow-sync', 'n8n bot', 'Monday Infra Admin', 'Claude', 'monday.com', '']) assert.equal(isBot(n, BOTS), true, n);
  for (const n of ['Ilan Manassen', 'Noam Safier', 'Guy Saban']) assert.equal(isBot(n, BOTS), false, n);
});

test('rung 0: no updates, or only bot updates', () => {
  assert.equal(turn(item('1'), ctx).rung, 0);
  assert.equal(turn(item('1', { updates: [u('Brie Fing', 1, '2026-10-01T10:00:00Z'), u('Clark', 2, '2026-10-02T10:00:00Z')] }), ctx).rung, 0);
});

test('rung 1: a human other than me spoke last (bots after them do not matter)', () => {
  const r = turn(item('1', { updates: [u('Ilan Manassen', ME, '2026-10-01T10:00:00Z'), u('Guy Saban', 9, '2026-10-02T10:00:00Z'), u('Brie Fing', 1, '2026-10-03T10:00:00Z')] }), ctx);
  assert.equal(r.rung, 1);
});

test('rung 2 vs 3: I replied last; deadline within 3 days (or overdue) is rung 2', () => {
  const mine = [u('Guy Saban', 9, '2026-10-01T10:00:00Z'), u('Ilan Manassen', ME, '2026-10-02T10:00:00Z')];
  assert.equal(turn(item('1', { updates: mine, deadline: '2026-10-09' }), ctx).rung, 2);  // exactly +3d
  assert.equal(turn(item('1', { updates: mine, deadline: '2026-09-01' }), ctx).rung, 2);  // overdue
  assert.equal(turn(item('1', { updates: mine, deadline: '2026-10-10' }), ctx).rung, 3);  // +4d
  assert.equal(turn(item('1', { updates: mine }), ctx).rung, 3);                          // undated
});

test('rung 4: touched this session sinks below everything', () => {
  const ranked = rank([item('a', { updates: [u('Guy', 9, '2026-10-01T10:00:00Z')] }), item('b')], { ...ctx, touched: new Set(['b']) });
  assert.deepEqual(ranked.map((x) => [x.id, x.rung]), [['a', 1], ['b', 4]]);
});

test('within a rung: earlier deadline first, undated last, then tier', () => {
  const ranked = rank([item('c', { deadline: '' }), item('a', { deadline: '2026-10-10', tier: 'T2 Standard' }), item('b', { deadline: '2026-10-10', tier: 'T0 Live' }), item('d', { deadline: '2026-10-08' })], ctx);
  assert.deepEqual(ranked.map((x) => x.id), ['d', 'b', 'a', 'c']);
});

// ---- writes ----
let calls = [];
global.fetch = async (url, opts = {}) => { calls.push(String(opts.body || '')); return { ok: true, status: 200, text: async () => JSON.stringify({ data: { create_update: { id: '77' }, change_column_value: { id: '1' } } }) }; };
const api = require('../server/requestsApi');

test('post update: dry-run by default, nothing sent', async () => {
  delete process.env.DRY_RUN; calls = [];
  const r = await api.update('123', 'hello'); assert.equal(r.dryRun, true); assert.equal(calls.length, 0);
});
test('post update: live path calls create_update', async () => {
  process.env.DRY_RUN = '0'; calls = [];
  const r = await api.update('123', 'hello'); assert.equal(r.updateId, '77'); assert.match(calls[0], /create_update/);
});
test('status: only known labels, only numeric ids, targets the Status column', async () => {
  process.env.DRY_RUN = '0'; calls = [];
  await assert.rejects(() => api.status('123', 'Hacked'), /unknown status label/);
  await assert.rejects(() => api.status('1; x', 'Done'), /invalid item id/);
  await api.status('123', 'In progress');
  assert.match(calls[0], /color_mm77yyq9/); assert.match(calls[0], /18431118484/);
});
test('empty or oversized updates are rejected', async () => {
  await assert.rejects(() => api.update('123', '  '), /empty/);
  await assert.rejects(() => api.update('123', 'x'.repeat(4001)), /too long/);
});
