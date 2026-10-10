// monday.com through Claude Code: the server's own GraphQL, run by the monday connector's all_monday_api tool.
// Reads are served from the snapshot cache (refreshed every 15 minutes by scripts/snapshot.js); a read that is not
// in the cache is fetched live (slow, ~15-30 s) and cached. Mutations always run live and are never cached.
// all_monday_api returns the GraphQL `data` object itself, so the result is wrapped back into { data }.
const claude = require('./claude');
const store = require('./store');

const key = (query, variables) => claude.hash(`${query.trim()}\n${JSON.stringify(variables || {})}`);
const isMutation = (q) => /^\s*mutation\b/.test(q);
const spec = (query, variables, k) => ({ key: k || key(query, variables), server: 'monday_com', tool: 'all_monday_api', args: { query: query.trim(), variables: JSON.stringify(variables || {}) } });

function toGql(r) {
  if (!r.ok) return { errors: [{ message: r.error }] };
  let j; try { j = JSON.parse(r.result); } catch (_) { return { errors: [{ message: `not JSON: ${String(r.result).slice(0, 200)}` }] }; }
  if (j && (j.errors || j.error_message)) return { errors: j.errors || [{ message: j.error_message }] };
  const wrapped = j && typeof j === 'object' && 'data' in j && Object.keys(j).every((x) => x === 'data' || x === 'extensions' || x === 'account_id');
  return { data: wrapped ? j.data : j };
}

// Collector mode (used only by the snapshot job): reads come from `fresh`, misses are recorded instead of fetched.
let collector = null;
class Miss extends Error {}
function collect(fresh) { collector = { fresh, misses: new Map() }; return collector; }
function stopCollecting() { const c = collector; collector = null; return c; }

// After a successful write, refresh the snapshot in the background so the board view catches up within ~2 minutes.
function refreshSoon() {
  if (process.env.SNAPSHOT_AFTER_WRITE === '0') return;
  const path = require('path'), { spawn } = require('child_process');
  const child = spawn(process.execPath, [path.join(__dirname, '..', '..', 'scripts', 'snapshot.js'), '--force'], { detached: true, stdio: 'ignore', env: process.env });
  child.unref();
}

async function gql(query, variables) {
  if (isMutation(query)) {
    const value = toGql((await claude.fetchAll([spec(query, variables)], { label: 'monday write' })).values().next().value);
    if (!value.errors) refreshSoon();
    return value;
  }
  const k = key(query, variables);
  if (collector) {
    if (collector.fresh.has(k)) return collector.fresh.get(k);
    collector.misses.set(k, spec(query, variables, k));
    throw new Miss('not fetched yet');
  }
  const cache = store.read('monday-cache', {});
  if (cache[k]) return cache[k].value;
  const value = toGql((await claude.fetchAll([spec(query, variables, k)], { label: 'monday read' })).get(k));
  if (!value.errors) { const c = store.read('monday-cache', {}); c[k] = { at: new Date().toISOString(), value }; store.write('monday-cache', c); }
  return value;
}

module.exports = { gql, key, spec, toGql, collect, stopCollecting, Miss, isMutation };
