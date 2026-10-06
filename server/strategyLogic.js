// Strategy proposals: parse what daily-board-strategy wrote on today's strategy item, and validate every
// operation before anything touches the board. Pure logic, no network.
//
// The agent writes, on the strategy item, a human numbered list plus ONE machine-readable line:
//   PROPOSALS_JSON: [{"n":1,"text":"...","ops":[{"type":"move","itemId":"123","fromGroup":"g1","toGroup":"g2"}, ...]}, ...]
// and the approval marker:
//   AWAITING_APPROVAL | strategy_date:YYYY-MM-DD | ask_ts:1791150382.263069
// Free text is never interpreted: only this JSON is applied (a regex over prose would eventually move the wrong item).

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^\d{6,}$/;
const MARK_WAIT = /AWAITING_APPROVAL \| strategy_date:(\d{4}-\d{2}-\d{2}) \| ask_ts:([\d.]+)/;
const MARK_DONE = /APPLIED \| strategy_date:(\d{4}-\d{2}-\d{2})/;
const PRIORITIES = ['🔥 High', '🟡 Medium', '🟢 Low'];
const MAX_PROPOSALS = 60, MAX_OPS = 5;

function parseStrategy(updates, today) {
  const bodies = (updates || []).map((u) => String(u.text_body || u.text || ''));
  const done = bodies.map((b) => b.match(MARK_DONE)).find((m) => m && m[1] === today);
  if (done) return { state: 'applied' };
  const wait = bodies.map((b) => b.match(MARK_WAIT)).find((m) => m && m[1] === today);
  if (!wait) return { state: 'no_marker' };
  const line = bodies.map((b) => b.match(/PROPOSALS_JSON:\s*(\[.*\])/)).find(Boolean);
  if (!line) return { state: 'no_json', askTs: wait[2] };
  let arr; try { arr = JSON.parse(line[1]); } catch (e) { return { state: 'bad_json', askTs: wait[2], error: e.message }; }
  if (!Array.isArray(arr)) return { state: 'bad_json', askTs: wait[2], error: 'not an array' };
  return { state: 'awaiting', askTs: wait[2], proposals: arr };
}

// Returns { ok, error, proposal }. A proposal is all-or-nothing: one bad operation rejects that numbered proposal.
function validateProposal(p, cfg) {
  const g = cfg.groups, c = g.canonical;
  const allowedTo = new Set([c.today.id, c.thisWeek.id, c.waiting.id, c.pepperTasks.id, c.completed.id, 'topics', g.parking.recurring, g.parking.noise, g.personal]);
  const banned = new Set([...(g.legacy || []), ...(g.excluded || [])]);
  const fail = (error) => ({ ok: false, error });
  if (!p || !Number.isInteger(p.n) || p.n < 1) return fail('missing proposal number');
  if (typeof p.text !== 'string' || !p.text.trim()) return fail('missing text');
  if (!Array.isArray(p.ops) || !p.ops.length || p.ops.length > MAX_OPS) return fail(`needs 1-${MAX_OPS} operations`);
  const ops = [];
  for (const o of p.ops) {
    if (!o || typeof o !== 'object') return fail('bad operation');
    if (o.type === 'move') {
      if (!ID.test(String(o.itemId)) || typeof o.fromGroup !== 'string' || !o.fromGroup) return fail('move needs itemId and fromGroup');
      if (!allowedTo.has(o.toGroup) || banned.has(o.toGroup)) return fail(`cannot move into group ${o.toGroup}`);
      ops.push({ type: 'move', itemId: String(o.itemId), fromGroup: o.fromGroup, toGroup: o.toGroup });
    } else if (o.type === 'date') {
      if (!ID.test(String(o.itemId))) return fail('date needs itemId');
      if (o.date !== null && !(typeof o.date === 'string' && DATE.test(o.date))) return fail('date must be YYYY-MM-DD or null');
      if (!(o.fromDate === null || (typeof o.fromDate === 'string' && DATE.test(o.fromDate)))) return fail('date needs fromDate (YYYY-MM-DD or null)');
      ops.push({ type: 'date', itemId: String(o.itemId), fromDate: o.fromDate, date: o.date });
    } else if (o.type === 'priority') {
      if (!ID.test(String(o.itemId)) || !PRIORITIES.includes(o.label)) return fail('priority needs itemId and a known label');
      if (!(o.from === '' || o.from === null || PRIORITIES.includes(o.from))) return fail('priority needs from');
      ops.push({ type: 'priority', itemId: String(o.itemId), from: o.from || '', label: o.label });
    } else if (o.type === 'email_task') {
      const name = String(o.name || '');
      if (!name.startsWith('📧 מענה למייל:') || name.length > 255) return fail('email task name must start with "📧 מענה למייל:" and be at most 255 characters');
      if (!(o.due === null || (typeof o.due === 'string' && DATE.test(o.due)))) return fail('email task due must be YYYY-MM-DD or null');
      ops.push({ type: 'email_task', name, due: o.due, body: String(o.body || '').slice(0, 4000) });
    } else return fail(`unknown operation "${o && o.type}"`);
  }
  return { ok: true, proposal: { n: p.n, text: p.text.trim().slice(0, 400), ops } };
}

function validateAll(proposals, cfg) {
  if (proposals.length > MAX_PROPOSALS) return { valid: [], invalid: [{ n: 0, error: `more than ${MAX_PROPOSALS} proposals` }] };
  const valid = [], invalid = [], seen = new Set();
  for (const p of proposals) {
    const r = validateProposal(p, cfg);
    if (!r.ok) invalid.push({ n: p && p.n, error: r.error, text: p && p.text });
    else if (seen.has(r.proposal.n)) invalid.push({ n: r.proposal.n, error: 'duplicate proposal number' });
    else { seen.add(r.proposal.n); valid.push(r.proposal); }
  }
  return { valid, invalid };
}

// 'all' or a list of numbers -> the proposals chosen and the ones left out.
function select(valid, numbers) {
  if (numbers === 'all') return { chosen: valid, rejected: [] };
  const want = new Set((numbers || []).map(Number));
  return { chosen: valid.filter((p) => want.has(p.n)), rejected: valid.filter((p) => !want.has(p.n)) };
}

// Does the board still look the way the proposal assumed? (R-: apply only to what has not changed since.)
function stale(op, state) {
  if (!state) return 'item not found on the projects board';
  if (op.type === 'move' && state.group !== op.fromGroup) return 'it was moved since the proposal';
  if (op.type === 'date' && (state.date || null) !== op.fromDate) return 'its date changed since the proposal';
  if (op.type === 'priority' && (state.priority || '') !== op.from) return 'its priority changed since the proposal';
  return null;
}

module.exports = { parseStrategy, validateProposal, validateAll, select, stale, PRIORITIES, MARK_WAIT };
