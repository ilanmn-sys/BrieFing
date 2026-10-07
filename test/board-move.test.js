const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
process.env.MONDAY_API_TOKEN = 'x'; process.env.SLACK_TOKEN = 'x';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-'));
process.env.BOARD_MOVES_LOG = path.join(tmp, 'board-moves.log');
const { config, today } = require('../server/lib');
const { decide, move, movesTodayFrom, validateInput } = require('../server/boardMove');
const { server } = require('../server/index');

const G = config.groups, C = G.canonical, T = today();
const ID = '1234567890';
const proposal = (n, ...ops) => ({ n, text: `proposal ${n}`, ops });
const mv = (itemId, fromGroup, toGroup) => ({ type: 'move', itemId, fromGroup, toGroup });
const ctx = (over = {}) => ({ today: T, strategy: { state: 'awaiting', proposals: [proposal(1, mv(ID, C.pepperTasks.id, C.thisWeek.id)), proposal(2, mv(ID, C.pepperTasks.id, C.today.id))] },
  item: { group: C.pepperTasks.id, status: 'Working on it' }, todayOpen: 3, movesToday: 0, ...over });
const req = (over = {}) => ({ reason: 'strategy', strategyDate: T, n: 1, itemId: ID, toGroup: C.thisWeek.id, ...over });
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };

test('decide: an approved strategy move is allowed and carries from/to/n', () => {
  assert.deepEqual(decide(req(), ctx()), { from: C.pepperTasks.id, to: C.thisWeek.id, reason: 'strategy', n: 1 });
});

test('decide: refuses everything that is not exactly an operation of an awaiting, current proposal', () => {
  assert.equal(code(() => decide(req({ n: 2 }), ctx())), 403, 'proposal 2 moves into Today, not This Week');
  assert.equal(code(() => decide(req({ n: 9 }), ctx())), 403, 'no such proposal');
  assert.equal(code(() => decide(req({ itemId: '9999999999' }), ctx())), 403, 'an item that is not in the proposal');
  assert.equal(code(() => decide(req({ strategyDate: '2020-01-01' }), ctx())), 409, 'yesterday');
  for (const state of ['applied', 'done', 'none', 'no_marker', 'no_json', 'bad_json']) assert.equal(code(() => decide(req(), ctx({ strategy: { state } }))), 409, state);
  assert.equal(code(() => decide(req({ n: 0 }), ctx())), 400);
  assert.equal(code(() => decide(req({ n: undefined }), ctx())), 400);
});

test('decide: stale item, missing item, legacy sources and forbidden destinations', () => {
  assert.equal(code(() => decide(req(), ctx({ item: { group: C.waiting.id, status: '' } }))), 409, 'moved since the proposal');
  assert.equal(code(() => decide(req(), ctx({ item: undefined }))), 404);
  assert.equal(code(() => decide(req(), ctx({ item: { group: G.legacy[0], status: '' } }))), 403, 'legacy source');
  assert.equal(code(() => decide(req(), ctx({ item: { group: G.excluded[0], status: '' } }))), 403, 'excluded source');
  for (const to of [G.legacy[0], G.excluded[0], 'group_made_up', G.commsCalendarInternal]) assert.equal(code(() => decide(req({ toGroup: to }), ctx())), 403, to);
  assert.equal(code(() => decide(req({ toGroup: 'x'.repeat(10) }), ctx())), 403);
});

test('decide: idempotent when the item is already in the destination; 🔥 Today is capped', () => {
  const there = decide(req(), ctx({ item: { group: C.thisWeek.id, status: '' } }));
  assert.equal(there.idempotent, true);
  assert.equal(code(() => decide(req({ n: 2, toGroup: C.today.id }), ctx({ todayOpen: C.today.cap }))), 409);
  assert.ok(decide(req({ n: 2, toGroup: C.today.id }), ctx({ todayOpen: C.today.cap - 1 })).to === C.today.id);
});

test('decide: the done-sweep exception is only Done -> ✅ Completed', () => {
  const sweep = (over = {}) => ({ reason: 'done-sweep', itemId: ID, toGroup: C.completed.id, ...over });
  assert.equal(decide(sweep(), ctx({ item: { group: C.thisWeek.id, status: 'Done' }, strategy: { state: 'none' } })).to, C.completed.id);
  assert.equal(code(() => decide(sweep(), ctx({ item: { group: C.thisWeek.id, status: 'Working on it' } }))), 403, 'not Done');
  assert.equal(code(() => decide(sweep({ toGroup: C.today.id }), ctx({ item: { group: C.thisWeek.id, status: 'Done' } }))), 403, 'wrong destination');
  assert.equal(decide(sweep(), ctx({ item: { group: C.completed.id, status: 'Done' } })).idempotent, true);
  assert.equal(code(() => decide(sweep(), ctx({ item: { group: G.legacy[0], status: 'Done' } }))), 403);
});

test('decide: input shape and the daily limit', () => {
  assert.equal(code(() => decide(req({ itemId: 'abc' }), ctx())), 400);
  assert.equal(code(() => decide(req({ itemId: '12' }), ctx())), 400);
  assert.equal(code(() => decide(req({ toGroup: '' }), ctx())), 400);
  assert.equal(code(() => decide(req({ reason: 'because' }), ctx())), 400);
  assert.equal(code(() => validateInput(null)), 400);
  assert.equal(code(() => decide(req(), ctx({ movesToday: config.boardMove.maxPerDay }))), 429);
  assert.equal(movesTodayFrom('{"day":"2026-10-07","outcome":"moved"}\nnot json\n{"day":"2026-10-07","outcome":"dry-run"}\n{"day":"2026-10-06","outcome":"moved"}', '2026-10-07'), 1);
});

// ---- the wrapper, with fakes ----
function fakes(over = {}) {
  const calls = [], writes = [];
  const monday = { itemStates: async (ids) => { calls.push('states'); return new Map([[ID, { group: C.pepperTasks.id, status: '' }]]); }, groupItems: async () => [{ id: '1', status: 'Working on it' }, { id: '2', status: 'Done' }],
    moveToGroup: async (i, g) => { writes.push([i, g]); } };
  return { calls, writes, deps: { monday, findStrategy: async () => ctx().strategy, isDryRun: () => false, ...over } };
}
const log = () => fs.readFileSync(process.env.BOARD_MOVES_LOG, 'utf8').trim().split('\n').map((l) => JSON.parse(l));

test('move: dry-run runs every check, writes nothing, and says what it would do', async () => {
  const f = fakes({ isDryRun: () => true });
  const r = await move(req(), f.deps);
  assert.equal(r.dryRun, true); assert.equal(r.moved, false); assert.match(r.would, /move 1234567890 from .* to /); assert.equal(f.writes.length, 0);
  assert.equal(log().at(-1).outcome, 'dry-run');
  await assert.rejects(move(req({ n: 9 }), { ...f.deps, isDryRun: () => true }), /does not exist/); // a dry run still refuses what a real run would refuse
});

test('move: a real run writes exactly one move and audits it; refusals are audited and write nothing', async () => {
  const f = fakes();
  const r = await move(req(), f.deps);
  assert.equal(r.moved, true); assert.deepEqual(f.writes, [[ID, C.thisWeek.id]]);
  assert.equal(log().at(-1).outcome, 'moved'); assert.equal(log().at(-1).from, C.pepperTasks.id);
  const g = fakes();
  await assert.rejects(move(req({ toGroup: G.legacy[0] }), g.deps), (e) => e.code === 403);
  assert.equal(g.writes.length, 0); assert.equal(log().at(-1).outcome, 'refused'); assert.equal(log().at(-1).code, 403);
  const h = fakes();
  const same = await move(req(), { ...h.deps, monday: { ...h.deps.monday, itemStates: async () => new Map([[ID, { group: C.thisWeek.id, status: '' }]]) } });
  assert.equal(same.alreadyThere, true); assert.equal(h.writes.length, 0);
});

test('move: bad input fails before any network call', async () => {
  const f = fakes({ findStrategy: async () => { throw new Error('must not be called'); } });
  await assert.rejects(move({ reason: 'strategy', itemId: 'nope', toGroup: 'x' }, f.deps), (e) => e.code === 400);
  assert.equal(f.calls.length, 0);
});

test('move: the daily limit counts real moves from the audit log', async () => {
  const day = today();
  fs.appendFileSync(process.env.BOARD_MOVES_LOG, Array.from({ length: config.boardMove.maxPerDay }, () => JSON.stringify({ day, outcome: 'moved' })).join('\n') + '\n');
  const f = fakes();
  await assert.rejects(move(req(), f.deps), (e) => e.code === 429);
  assert.equal(f.writes.length, 0);
});

// ---- the HTTP route (checks that return before any network call) ----
async function call(method, body, headers = {}) {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try { const res = await fetch(`http://127.0.0.1:${server.address().port}/api/board/move`, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) }); return { status: res.status, json: await res.json() }; }
  finally { await new Promise((r) => server.close(r)); }
}
test('route: POST only, local origins only, JSON only, small bodies, shape errors are 400', async () => {
  assert.equal((await call('GET')).status, 405);
  assert.equal((await call('POST', {}, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await call('POST', 'not json')).status, 400);
  assert.equal((await call('POST', { pad: 'x'.repeat(3000) })).status, 413);
  const r = await call('POST', { reason: 'strategy', itemId: 'zzz', toGroup: 'x' });
  assert.equal(r.status, 400); assert.equal(r.json.ok, false);
  assert.equal((await call('POST', { reason: 'strategy', itemId: 'zzz', toGroup: 'x' }, { Origin: 'http://localhost:3737' })).status, 400, 'a local origin is accepted, then the shape check answers');
});

test('config and server: the port comes from config; the endpoint is the only move path the strategy agent has', () => {
  assert.equal(config.server.port, 3737); assert.equal(config.server.host, '127.0.0.1');
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'index.js'), 'utf8');
  assert.match(src, /config\.server\.port/); assert.match(src, /config\.server\.host/);
  const prompt = fs.readFileSync(path.join(__dirname, '..', 'agents', 'daily-board-strategy', 'prompt.md'), 'utf8');
  assert.ok(!prompt.includes('all_monday_api') && prompt.includes('/api/board/move') && prompt.includes('{{server.port}}'));
});
