const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
process.env.MONDAY_API_TOKEN = 'x'; process.env.SLACK_TOKEN = 'x';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'strat-'));
process.env.LEARNING_LOG_FILE = path.join(tmp, 'LEARNING-LOG.md');
const { config, today } = require('../server/lib');
const { parseStrategy, validateProposal, validateAll, select, stale } = require('../server/strategyLogic');
const { appendSignal } = require('../server/learningLog');

const G = config.groups, C = G.canonical, T = today();
const op = { move: (id, from, to) => ({ type: 'move', itemId: id, fromGroup: from, toGroup: to }), date: (id, from, d) => ({ type: 'date', itemId: id, fromDate: from, date: d }) };
const prop = (n, text, ...ops) => ({ n, text, ops });

// ---------- pure logic ----------
test('parse: finds the marker and the JSON line; never reads prose', () => {
  const json = JSON.stringify([prop(1, 'a', op.move('1000001', 'g', C.today.id))]);
  const mk = (extra = '') => ({ text_body: `Proposals\n1. something\nPROPOSALS_JSON: ${json}\n\nAWAITING_APPROVAL | strategy_date:${T} | ask_ts:1791150382.263069${extra}` });
  const r = parseStrategy([mk()], T);
  assert.equal(r.state, 'awaiting'); assert.equal(r.askTs, '1791150382.263069'); assert.equal(r.proposals.length, 1);
  assert.equal(parseStrategy([{ text_body: 'bullets only\nAWAITING_APPROVAL | strategy_date:' + T + ' | ask_ts:1.2' }], T).state, 'no_json');   // the old prose format
  assert.equal(parseStrategy([{ text_body: 'AWAITING_APPROVAL | strategy_date:2020-01-01 | ask_ts:1.2' }], T).state, 'no_marker');           // yesterday's marker
  assert.equal(parseStrategy([{ text_body: 'PROPOSALS_JSON: [broken\nAWAITING_APPROVAL | strategy_date:' + T + ' | ask_ts:1.2' }], T).state, 'no_json');
  assert.equal(parseStrategy([{ text_body: 'PROPOSALS_JSON: [{"n":1\nAWAITING_APPROVAL | strategy_date:' + T + ' | ask_ts:1.2' }, { text_body: 'PROPOSALS_JSON: [nope]' }], T).state, 'bad_json');
  assert.equal(parseStrategy([mk(), { text_body: `APPLIED | strategy_date:${T} | applied:3 | skipped:0 | by:dashboard` }], T).state, 'applied');
});

test('validate: moves only into allowed groups, never legacy or excluded; strict dates, labels, ids', () => {
  const ok = (p) => validateProposal(p, config).ok;
  assert.ok(ok(prop(1, 't', op.move('1000001', C.pepperTasks.id, C.today.id))));
  assert.ok(ok(prop(2, 't', op.move('1000001', 'x', 'topics'), op.date('1000001', null, '2026-10-11'))));
  assert.ok(!ok(prop(3, 't', op.move('1000001', 'x', G.legacy[0]))), 'legacy group');
  assert.ok(!ok(prop(4, 't', op.move('1000001', 'x', G.excluded[0]))), 'excluded group');
  assert.ok(!ok(prop(5, 't', op.move('1000001', 'x', 'group_made_up'))), 'unknown group');
  assert.ok(!ok(prop(6, 't', op.move('abc', 'x', C.today.id))), 'bad id');
  assert.ok(!ok(prop(7, 't', op.date('1000001', null, '11.10.2026'))), 'bad date format');
  assert.ok(!ok(prop(8, 't', { type: 'priority', itemId: '1000001', from: '', label: 'Urgent!!' })), 'unknown label');
  assert.ok(!ok(prop(9, 't', { type: 'delete', itemId: '1000001' })), 'unknown type');
  assert.ok(!ok(prop(10, 't', { type: 'email_task', name: 'not an email task', due: null })), 'email task prefix');
  assert.ok(!ok(prop(11, 't', { type: 'move', itemId: '1000001', toGroup: C.today.id })), 'missing fromGroup');
  assert.ok(!ok({ n: 12, text: 't', ops: [] }) && !ok({ n: 13, ops: [op.move('1000001', 'x', C.today.id)] }) && !ok({ text: 't', ops: [op.move('1000001', 'x', C.today.id)] }));
  assert.ok(!ok(prop(14, 't', ...Array.from({ length: 6 }, () => op.move('1000001', 'x', C.today.id)))), 'too many ops');
  const { valid, invalid } = validateAll([prop(1, 'a', op.move('1000001', 'x', C.today.id)), prop(1, 'dup', op.move('1000002', 'x', C.today.id)), prop(3, 'bad', op.move('1000001', 'x', G.legacy[1]))], config);
  assert.equal(valid.length, 1); assert.deepEqual(invalid.map((x) => x.error).sort(), ['cannot move into group ' + G.legacy[1], 'duplicate proposal number'].sort());
});

test('select and stale', () => {
  const v = [prop(1, 'a', op.move('1000001', 'x', C.today.id)), prop(2, 'b', op.move('1000002', 'x', C.today.id)), prop(3, 'c', op.move('1000003', 'x', C.today.id))];
  assert.deepEqual(select(v, 'all').chosen.map((p) => p.n), [1, 2, 3]);
  const s = select(v, [1, 3]); assert.deepEqual(s.chosen.map((p) => p.n), [1, 3]); assert.deepEqual(s.rejected.map((p) => p.n), [2]);
  const st = { group: 'g1', date: '2026-10-06', priority: '🔥 High' };
  assert.equal(stale({ type: 'move', fromGroup: 'g1' }, st), null); assert.match(stale({ type: 'move', fromGroup: 'g2' }, st), /moved/);
  assert.equal(stale({ type: 'date', fromDate: '2026-10-06' }, st), null); assert.match(stale({ type: 'date', fromDate: null }, st), /date changed/);
  assert.equal(stale({ type: 'date', fromDate: null }, { ...st, date: null }), null);
  assert.match(stale({ type: 'priority', from: '' }, st), /priority changed/); assert.match(stale({ type: 'move', fromGroup: 'g1' }, undefined), /not found/);
});

test('learning log: entry numbered above the highest S-number, newest first, file otherwise intact', () => {
  fs.writeFileSync(process.env.LEARNING_LOG_FILE, '# Log\n\n## §2 — Signal Log\n\nNewest first. Types: `approval`.\n\n### S-007 · 2026-09-22 · `slippage`\nold\n\n---\n\n### S-005 · x\nold\n\n## §3\n');
  const id = appendSignal({ date: T, type: 'approval', body: '**What happened.** test' });
  assert.equal(id, 'S-008');
  const t = fs.readFileSync(process.env.LEARNING_LOG_FILE, 'utf8');
  assert.ok(t.indexOf('S-008') < t.indexOf('S-007') && t.indexOf('S-007') < t.indexOf('S-005') && t.includes('## §3'));
  assert.equal(appendSignal({ date: T, type: 'approval', body: 'x' }), 'S-009');
  fs.writeFileSync(process.env.LEARNING_LOG_FILE, 'no section here');
  assert.throws(() => appendSignal({ date: T, type: 'approval', body: 'x' }), /Newest first/);
});

// ---------- the apply flow against a simulated monday + Slack ----------
let world, calls;
const fresh = (over = {}) => {
  fs.writeFileSync(process.env.LEARNING_LOG_FILE, '## §2 — Signal Log\n\nNewest first. Types: x.\n\n### S-001 · old\n');
  calls = [];
  const json = JSON.stringify(over.proposals || [
    prop(1, 'Move A to Today', op.move('1000001', C.thisWeek.id, C.today.id), op.date('1000001', null, T)),
    prop(2, 'Move B (changed meanwhile)', op.move('1000002', C.thisWeek.id, C.today.id)),
    prop(3, 'Clear date on C', op.date('1000003', '2026-09-01', null)),
    prop(4, 'Email task', { type: 'email_task', name: '📧 מענה למייל: Luke', due: T, body: 'draft' }),
    prop(5, 'Email task already there', { type: 'email_task', name: '📧 מענה למייל: existing', due: null, body: '' }),
    prop(6, 'Priority D', { type: 'priority', itemId: '1000004', from: '', label: '🔥 High' }),
    prop(7, 'Bad: into legacy', op.move('1000001', 'x', G.legacy[0])),
  ]);
  world = {
    strategy: { id: '900', name: `🗓️ Daily Strategy — ${T}`, status: over.status || 'Working on it' },
    updates: over.updates || [{ text_body: `list\nPROPOSALS_JSON: ${json}\nAWAITING_APPROVAL | strategy_date:${T} | ask_ts:1791150382.263069`, created_at: 'x' }],
    state: { 1000001: { group: C.thisWeek.id, date: null, priority: '' }, 1000002: { group: C.waiting.id, date: null, priority: '' }, 1000003: { group: 'topics', date: '2026-09-01', priority: '' }, 1000004: { group: 'topics', date: null, priority: '' } },
    failMove: over.failMove, failDm: over.failDm,
  };
};
const j = (o) => ({ ok: true, status: 200, text: async () => JSON.stringify(o) });
global.fetch = async (url, opts = {}) => {
  const u = String(url), body = opts.body ? String(opts.body) : '';
  if (u.includes('conversations.open')) { calls.push('slack:open ' + body); return j({ ok: true, channel: { id: 'D1' } }); }
  if (u.includes('chat.postMessage')) { calls.push('slack:post ' + decodeURIComponent(body.replace(/\+/g, ' '))); return world.failDm ? j({ ok: false, error: 'channel_not_found' }) : j({ ok: true, ts: '1.1' }); }
  const q = JSON.parse(body).query, v = JSON.parse(body).variables || {};
  if (q.includes('items_page') && q.includes('"group"')) return j({ data: { boards: [{ items_page: { items: [
    { id: '900', name: world.strategy.name, column_values: [{ text: world.strategy.status }] }, { id: '901', name: '📧 מענה למייל: existing', column_values: [{ text: 'Working on it' }] }] } }] } });
  if (q.includes('updates(limit')) return j({ data: { items: [{ id: '900', updates: world.updates }] } });
  if (q.includes('board{ id }')) return j({ data: { items: (v.ids || []).map((id) => ({ id, board: { id: String(config.boards.projects) }, group: { id: world.state[id].group }, column_values: [{ id: 'date4', text: world.state[id].date || '' }, { id: 'color_mm5wqmy7', text: world.state[id].priority }] })) } });
  if (q.includes('move_item_to_group')) { if (world.failMove === v.i) return j({ errors: [{ message: 'move boom' }] }); calls.push(`move ${v.i} -> ${v.g}`); return j({ data: { move_item_to_group: { id: v.i } } }); }
  if (q.includes('change_multiple_column_values')) { calls.push(`date ${v.i} ${v.v}`); return j({ data: { change_multiple_column_values: { id: v.i } } }); }
  if (q.includes('change_column_value')) { calls.push(`col ${v.i} ${v.c} ${v.v}`); return j({ data: { change_column_value: { id: v.i } } }); }
  if (q.includes('create_item')) { calls.push(`create ${v.n}`); return j({ data: { create_item: { id: '999' } } }); }
  if (q.includes('create_update')) { calls.push(`update ${v.i} ${v.b}`); return j({ data: { create_update: { id: '5' } } }); }
  throw new Error('unexpected query ' + q.slice(0, 60));
};
const api = require('../server/strategyApi');
const mutations = () => calls.filter((c) => /^(move|date|col|create|update|slack:post)/.test(c));
world = null;

test('load: lists the valid proposals and reports the invalid one', async () => {
  fresh(); const r = await api.load();
  assert.equal(r.state, 'awaiting'); assert.equal(r.proposals.length, 6); assert.equal(r.invalid.length, 1); assert.equal(r.invalid[0].n, 7);
  assert.match(r.itemUrl, /pulses\/900$/);
});

test('load: no item, done item, old prose format and applied marker are each reported honestly', async () => {
  fresh({ updates: [{ text_body: `bullets\nAWAITING_APPROVAL | strategy_date:${T} | ask_ts:1.2` }] }); assert.equal((await api.load()).state, 'no_json');
  fresh({ status: 'Done' }); assert.equal((await api.load()).state, 'done');
  fresh({ updates: [{ text_body: `APPLIED | strategy_date:${T} | applied:2 | skipped:0 | by:dashboard` }] }); assert.equal((await api.load()).state, 'applied');
});

test('dry-run (default): checks everything, predicts applied/skipped, writes NOTHING', async () => {
  delete process.env.DRY_RUN; fresh(); world.state['1000002'].group = C.today.id; // B changed meanwhile
  const r = await api.apply('all');
  assert.equal(r.dryRun, true); assert.equal(mutations().length, 0);
  assert.deepEqual(r.applied.map((x) => x.n), [1, 3, 4, 6]); assert.deepEqual(r.skipped.map((x) => x.n), [2, 5]);
  assert.match(r.skipped.find((x) => x.n === 2).reason, /moved/); assert.match(r.skipped.find((x) => x.n === 5).reason, /already exists/);
});

test('live apply: stale and duplicate proposals skipped, the rest applied in order, then recorded everywhere', async () => {
  process.env.DRY_RUN = '0'; fresh(); world.state['1000002'].group = C.today.id;
  const r = await api.apply('all');
  assert.deepEqual(r.applied.map((x) => x.n), [1, 3, 4, 6]); assert.deepEqual(r.skipped.map((x) => x.n), [2, 5]); assert.equal(r.failed.length, 0);
  const m = mutations();
  assert.equal(m[0], `move 1000001 -> ${C.today.id}`); assert.match(m[1], new RegExp(`^date 1000001 .*"date4":\\{"date":"${T}"\\}`));
  assert.match(m.find((c) => c.startsWith('date 1000003')), /"date4":null/);                  // clearing sends null
  assert.ok(m.some((c) => c === 'create 📧 מענה למייל: Luke')); assert.ok(!m.some((c) => c.includes('existing')));
  assert.ok(m.some((c) => c.startsWith('col 1000004 color_mm5wqmy7') && c.includes('🔥 High')));
  // recorded: confirmation with the marker, item Done, Pepper by user id, learning log
  const confirm = m.find((c) => c.startsWith('update 900')); assert.match(confirm, /APPLIED \| strategy_date:/); assert.match(confirm, /by:dashboard/);
  assert.ok(m.some((c) => c.startsWith('col 900 status') && c.includes('Done')));
  const dm = calls.find((c) => c.startsWith('slack:open')); assert.match(dm, new RegExp('users=' + config.pepper.userId)); assert.ok(!/D0BCAGJV0AD/.test(dm));
  assert.match(calls.find((c) => c.startsWith('slack:post')), /✅ הוחל: 4 שינויים/);
  assert.deepEqual(Object.keys(r.record), ['board', 'pepper', 'learningLog']); assert.ok(Object.values(r.record).every((x) => x.startsWith('ok')));
  const log = fs.readFileSync(process.env.LEARNING_LOG_FILE, 'utf8'); assert.match(log, /S-002 · .*`approval`/); assert.match(log, /Applied 4 of 6|applied 4 of 6/i);
  // and a second press does nothing, because the board now carries the marker / Done status
  world.strategy.status = 'Done'; calls.length = 0;
  await assert.rejects(() => api.apply('all'), /already handled/); assert.equal(mutations().length, 0);
});

test('selected numbers: the unselected are logged as rejected, by name', async () => {
  process.env.DRY_RUN = '0'; fresh();
  const r = await api.apply([1, 3]);
  assert.deepEqual(r.applied.map((x) => x.n), [1, 3]); assert.deepEqual(r.rejected.map((x) => x.n), [2, 4, 5, 6]);
  const log = fs.readFileSync(process.env.LEARNING_LOG_FILE, 'utf8'); assert.match(log, /Rejected\.\*\* "Move B/); assert.match(log, /"Email task"/);
  await assert.rejects(() => api.apply([99]), /No proposals selected/);
});

test('one failing operation fails only its own proposal; the rest still apply and the failure is reported', async () => {
  process.env.DRY_RUN = '0'; fresh({ failMove: '1000001' });
  const r = await api.apply('all');
  assert.deepEqual(r.failed.map((x) => x.n), [1]); assert.match(r.failed[0].error, /move boom/); assert.ok(r.applied.some((x) => x.n === 3));
  assert.match(mutations().find((c) => c.startsWith('update 900')), /Failed/);
});

test('if Pepper cannot be told, the board still records the result and the failure is visible', async () => {
  process.env.DRY_RUN = '0'; fresh({ failDm: true });
  const r = await api.apply([3]);
  assert.match(r.record.pepper, /^FAILED: .*channel_not_found/); assert.match(r.record.board, /^ok/); assert.match(r.record.learningLog, /^ok/);
});

test('skip all: marker, Done, Pepper, and every proposal logged as rejected', async () => {
  process.env.DRY_RUN = '0'; fresh();
  const r = await api.skip();
  assert.equal(r.skipped, 6); assert.ok(Object.values(r.record).every((x) => x.startsWith('ok')));
  assert.match(mutations().find((c) => c.startsWith('update 900')), /applied:0 \| skipped:6/);
  assert.match(calls.find((c) => c.startsWith('slack:post')), /⏭/);
  assert.match(fs.readFileSync(process.env.LEARNING_LOG_FILE, 'utf8'), /skipped all 6/);
  fresh(); delete process.env.DRY_RUN; calls.length = 0; assert.equal((await api.skip()).dryRun, true); assert.equal(mutations().length, 0);
});

test('items on another board are never touched (they are simply not found)', async () => {
  process.env.DRY_RUN = '0'; fresh();
  const real = global.fetch;
  global.fetch = async (url, opts = {}) => { const b = opts.body ? JSON.parse(opts.body) : {}; if ((b.query || '').includes('board{ id }')) return j({ data: { items: [{ id: '1000001', board: { id: '1' }, group: { id: C.thisWeek.id }, column_values: [] }] } }); return real(url, opts); };
  try { const r = await api.apply([1]); assert.equal(r.applied.length, 0); assert.match(r.skipped[0].reason, /not found on the projects board/); assert.ok(!mutations().some((c) => c.startsWith('move'))); }
  finally { global.fetch = real; }
});
