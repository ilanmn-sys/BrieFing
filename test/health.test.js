const test = require('node:test');
const assert = require('node:assert');
const { health, TITLE_DATE, HOLDER } = require('../server/healthLogic');
const { config } = require('../server/lib');
const G = config.groups, C = G.canonical;
const TODAY = '2026-10-06';

const t = (id, name, o = {}) => ({ id: String(id), name, group: 'topics', status: '', deadline: '', ...o });
const by = (res) => Object.fromEntries(res.map((r) => [r.id, r]));
const ids = (r) => r.items.map((i) => i.id).sort();

test('R-21: only items in 🔥 Today whose date is before today (today itself and undated are fine)', () => {
  const r = by(health([
    t(1, 'late', { group: C.today.id, deadline: '2026-10-01' }), t(2, 'due today', { group: C.today.id, deadline: TODAY }),
    t(3, 'undated', { group: C.today.id }), t(4, 'late elsewhere', { group: C.thisWeek.id, deadline: '2026-10-01' }),
    t(5, 'late but done', { group: C.today.id, deadline: '2026-10-01', status: 'Done' }),
  ], { groups: G, today: TODAY }));
  assert.deepEqual(ids(r['R-21']), ['1']); assert.equal(r['R-21'].count, 1);
});

test('R-05: dateless items whose title carries a deadline', () => {
  for (const n of ['עד 10.8 לשלוח', 'send by 10/8', 'due 5.9', '48h מקבלה']) assert.ok(TITLE_DATE.test(n), n);
  for (const n of ['Plan the week', 'Meet at 3pm', 'Ruben Hassid $27K']) assert.ok(!TITLE_DATE.test(n), n);
  const r = by(health([t(1, 'עד 10.8 לשלוח'), t(2, 'עד 10.8 עם תאריך', { deadline: '2026-08-10' }), t(3, 'Plain'), t(4, 'by 5.9 noise', { group: G.parking.noise })], { groups: G, today: TODAY }));
  assert.deepEqual(ids(r['R-05']), ['1']);
  assert.match(r['R-05'].items[0].proposal, /«עד 10\.8»/);
});

test('R-04: automations carrying dates (by keyword or by agent name); undated ones are fine', () => {
  const r = by(health([
    t(1, 'Daily digest automation', { deadline: '2026-10-06' }), t(2, 'Pepper inbox poller', { deadline: '2026-10-06' }),
    t(3, 'Daily digest automation'), t(4, 'Ordinary project', { deadline: '2026-10-06' }),
  ], { groups: G, today: TODAY, agentNames: ['pepper inbox'] }));
  assert.deepEqual(ids(r['R-04']), ['1', '2']); assert.equal(r['R-04'].heuristic, true);
});

test('R-06: Not Relevant items still sitting in active groups (not in Noise/Completed/Recurring)', () => {
  const r = by(health([
    t(1, 'nr active', { status: 'Not Relevant' }), t(2, 'nr in today', { status: 'Not Relevant', group: C.today.id }),
    t(3, 'nr in noise', { status: 'Not Relevant', group: G.parking.noise }), t(4, 'nr completed', { status: 'Not Relevant', group: C.completed.id }),
  ], { groups: G, today: TODAY }));
  assert.deepEqual(ids(r['R-06']), ['1', '2']);
});

test('R-16: blocked items need a named holder in the title or recent updates', () => {
  for (const n of ['Waiting on Dana', 'blocked by Legal', 'with Or', 'ממתין ל-דנה', 'Held by Noam', '👤 בעל אחריות: *אילן*', 'Holder: Dana']) assert.ok(HOLDER.test(n), n);
  for (const n of ['Waiting on approval', 'Blocked', 'waiting for a quote', 'Stuck']) assert.ok(!HOLDER.test(n), n); // no name, no holder
  const holderText = new Map([['2', 'Update: waiting on Dana for the quote']]);
  const r = by(health([
    t(1, 'Quote request', { group: C.waiting.id }),                      // blocked, no holder -> flagged
    t(2, 'Quote request 2', { group: C.waiting.id }),                    // holder named in an update -> fine
    t(3, 'Legal review', { status: 'With steakholder' }),                // flagged
    t(4, 'Stuck thing', { status: 'Stuck' }),                            // flagged
    t(5, 'Waiting on Dana', { group: C.waiting.id }),                    // named in title -> fine
    t(6, 'Not blocked'),
  ], { groups: G, today: TODAY, holderText }));
  assert.deepEqual(ids(r['R-16']), ['1', '3', '4']);
});

test('all five rules are always reported, in a stable order, with counts that equal their lists', () => {
  const res = health([], { groups: G, today: TODAY });
  assert.deepEqual(res.map((r) => r.id), ['R-21', 'R-05', 'R-04', 'R-06', 'R-16']);
  for (const r of res) assert.equal(r.count, r.items.length);
});

test('meta items and Done items never count; one item may appear under two rules', () => {
  const r = by(health([
    t(1, 'Daily inbox digest', { group: C.today.id, deadline: '2026-10-01' }),
    t(2, 'Done thing עד 1.1', { status: 'Done' }),
    t(3, 'Stuck, by 5.9', { status: 'Stuck' }),
  ], { groups: G, today: TODAY }));
  assert.equal(r['R-21'].count, 0); assert.equal(r['R-05'].count, 1); assert.deepEqual(ids(r['R-16']), ['3']);
});

test('the excluded 🛒 shopping group never counts toward board health', () => {
  const shop = G.excluded[0];
  const r = by(health([t(1, 'late', { group: shop, deadline: '2026-01-01' }), t(2, 'nr', { group: shop, status: 'Not Relevant' }), t(3, 'Waiting on approval', { group: shop, status: 'Stuck' })], { groups: G, today: TODAY }));
  for (const rule of Object.values(r)) assert.equal(rule.count, 0, rule.id);
});
