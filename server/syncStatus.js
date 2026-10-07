// Status of the learning-log sync (written by scripts/sync-learning-log.sh) for /health. Pure + one file read.
// A stale page means Pepper is working from old rules, so a failed or missing sync is flagged, not hidden.
const fs = require('fs');
const path = require('path');
const STALE_MS = 4 * 24 * 3600e3; // the sync runs Sun-Thu; a Friday/Saturday gap plus a missed Sunday is the limit

const file = () => path.join(process.env.SYNC_STATE_DIR || path.join(__dirname, '..', 'data', 'learninglog-sync'), 'status.json');

function evaluate(status, now = Date.now()) {
  if (!status) return { state: 'never_run', ok: false, message: 'the learning-log sync has never run (is com.ilan.learninglog-sync installed?)' };
  const last = Date.parse(status.lastSuccessAt || '');
  if (status.ok === false) return { state: 'failed', ok: false, at: status.at, lastSuccessAt: status.lastSuccessAt || null, message: status.message };
  if (Number.isNaN(last) || now - last > STALE_MS) return { state: 'stale', ok: false, at: status.at, lastSuccessAt: status.lastSuccessAt || null, message: 'no successful sync in over 4 days' };
  return { state: 'ok', ok: true, at: status.at, lastSuccessAt: status.lastSuccessAt, message: status.message };
}

function read(now) {
  let s = null; try { s = JSON.parse(fs.readFileSync(file(), 'utf8')); } catch (_) {}
  return evaluate(s, now);
}
module.exports = { evaluate, read };
