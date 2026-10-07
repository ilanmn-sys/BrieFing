// The narrow board-move endpoint: POST /api/board/move. It exists so agents do not need `all_monday_api`
// (which can run any monday mutation) to move an item between groups. It does exactly one thing, and only when
// the move is justified by something that already carries Ilan's approval or the standing exception:
//
//   reason "strategy"    the move is one of the operations of today's strategy proposal n, that proposal is
//                        still awaiting approval, the item is still where the proposal saw it, and the
//                        destination is an allowed group. (Principle 2: group moves are propose-only.)
//   reason "done-sweep"  a Done item moves to ✅ Completed (the one silent exception).
//
// Everything else is refused. Dry-run is the default: without DRY_RUN=0 nothing is written, the call still runs
// every check and returns what it would do. Every call is appended to data/board-moves.log.
const fs = require('fs');
const path = require('path');
const { config, today } = require('./lib');
const { validateAll, validateProposal } = require('./strategyLogic');

const ID = /^\d{6,}$/;
const bad = (code, error) => Object.assign(new Error(error), { code });
const logFile = () => process.env.BOARD_MOVES_LOG || path.join(__dirname, '..', 'data', 'board-moves.log');

// Pure. ctx: { today, strategy:{state,proposals}, item:{group,status}|undefined, todayOpen, movesToday }
// Returns { idempotent?, from, to, reason, n? }, or throws an error carrying an HTTP status in .code.
function validateInput(req) {
  const { itemId, toGroup, reason } = req || {};
  if (!ID.test(String(itemId))) throw bad(400, 'itemId must be a monday item id');
  if (typeof toGroup !== 'string' || !toGroup) throw bad(400, 'toGroup is required');
  if (reason !== 'strategy' && reason !== 'done-sweep') throw bad(400, 'reason must be "strategy" or "done-sweep"');
}

function decide(req, ctx, cfg = config) {
  const g = cfg.groups, c = g.canonical;
  const { itemId, toGroup, reason, n, strategyDate } = req || {};
  validateInput(req);
  const max = (cfg.boardMove && cfg.boardMove.maxPerDay) || 40;
  if (ctx.movesToday >= max) throw bad(429, `daily limit of ${max} board moves reached`);

  // Same destination rule as the dashboard's Apply all: one definition, not two.
  const probe = validateProposal({ n: 1, text: 'x', ops: [{ type: 'move', itemId: String(itemId), fromGroup: 'x', toGroup }] }, cfg);
  if (!probe.ok) throw bad(403, probe.error);
  const item = ctx.item;
  if (!item) throw bad(404, 'item not found on the projects board');
  const banned = new Set([...(g.legacy || []), ...(g.excluded || [])]);
  if (banned.has(item.group)) throw bad(403, 'the item sits in a legacy or excluded group');

  const out = { from: item.group, to: toGroup, reason };
  if (reason === 'done-sweep') {
    if (toGroup !== c.completed.id) throw bad(403, 'a done-sweep only moves into ✅ Completed');
    if (item.status !== 'Done') throw bad(403, 'a done-sweep only moves items whose status is Done');
    return item.group === toGroup ? { ...out, idempotent: true } : out;
  }

  // reason === 'strategy'
  if (strategyDate !== ctx.today) throw bad(409, `strategyDate must be today (${ctx.today})`);
  if (!Number.isInteger(n) || n < 1) throw bad(400, 'n (the proposal number) is required');
  if (ctx.strategy.state !== 'awaiting') throw bad(409, `today's proposals are not awaiting approval (${ctx.strategy.state})`);
  const { valid } = validateAll(ctx.strategy.proposals || [], cfg);
  const proposal = valid.find((p) => p.n === n);
  if (!proposal) throw bad(403, `proposal ${n} does not exist or is invalid`);
  const op = proposal.ops.find((o) => o.type === 'move' && o.itemId === String(itemId) && o.toGroup === toGroup);
  if (!op) throw bad(403, `proposal ${n} does not contain that move`);
  if (item.group === toGroup) return { ...out, idempotent: true, n };
  if (item.group !== op.fromGroup) throw bad(409, 'it was moved since the proposal');
  if (toGroup === c.today.id && ctx.todayOpen >= c.today.cap) throw bad(409, `🔥 Today is full (${ctx.todayOpen} of ${c.today.cap})`);
  return { ...out, n };
}

function movesTodayFrom(text, day) {
  return String(text || '').split('\n').filter(Boolean).reduce((k, l) => { try { const e = JSON.parse(l); return k + (e.day === day && e.outcome === 'moved' ? 1 : 0); } catch (_) { return k; } }, 0);
}
function audit(entry) {
  try { fs.mkdirSync(path.dirname(logFile()), { recursive: true }); fs.appendFileSync(logFile(), JSON.stringify(entry) + '\n'); } catch (e) { console.error('board-move: could not write the audit log: ' + e.message); }
}
const readLog = () => { try { return fs.readFileSync(logFile(), 'utf8'); } catch (_) { return ''; } };

// deps (injectable for tests): monday {itemStates, groupItems, moveToGroup}, findStrategy(), isDryRun()
async function move(req, deps) {
  const day = today(), r = req || {};
  const entry = { at: new Date().toISOString(), day, reason: r.reason, itemId: r.itemId, toGroup: r.toGroup, n: r.n };
  try {
    validateInput(r); // cheap shape checks before any network call
    const states = await deps.monday.itemStates([String(r.itemId)]);
    const strategy = r.reason === 'strategy' ? await deps.findStrategy() : { state: 'n/a' };
    const todayOpen = r.reason === 'strategy' && r.toGroup === config.groups.canonical.today.id
      ? (await deps.monday.groupItems(config.groups.canonical.today.id)).filter((i) => i.status !== 'Done').length : 0;
    const d = decide(r, { today: day, strategy, item: states.get(String(r.itemId)), todayOpen, movesToday: movesTodayFrom(readLog(), day) });
    if (d.idempotent) { audit({ ...entry, from: d.from, outcome: 'already-there', dryRun: deps.isDryRun() }); return { ok: true, dryRun: deps.isDryRun(), moved: false, alreadyThere: true, itemId: String(r.itemId), group: d.to }; }
    if (deps.isDryRun()) { audit({ ...entry, from: d.from, outcome: 'dry-run', dryRun: true }); return { ok: true, dryRun: true, moved: false, would: `move ${r.itemId} from ${d.from} to ${d.to}`, itemId: String(r.itemId), from: d.from, to: d.to }; }
    await deps.monday.moveToGroup(String(r.itemId), r.toGroup);
    audit({ ...entry, from: d.from, outcome: 'moved', dryRun: false });
    return { ok: true, dryRun: false, moved: true, itemId: String(r.itemId), from: d.from, to: d.to };
  } catch (e) {
    audit({ ...entry, outcome: 'refused', error: e.message, code: e.code || 500 });
    throw e;
  }
}

module.exports = { decide, move, movesTodayFrom, validateInput };
