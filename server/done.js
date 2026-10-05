// Done-sync (principle 3): board status AND Pepper notification as one action.
// Board first; Pepper is only told if the board write succeeded. Each leg is reported
// separately so the UI can say exactly what failed instead of marking local-only.
const monday = require('./connectors/monday');
const slack = require('./connectors/slack');

// Dry-run is the default. Real writes need DRY_RUN=0 in the environment.
const isDryRun = () => process.env.DRY_RUN !== '0';

async function doneSync({ id, name }) {
  if (!/^\d+$/.test(String(id))) throw Object.assign(new Error('invalid item id'), { code: 400 });
  const title = String(name || '').slice(0, 200);
  const message = `✅ משימה הושלמה: «${title}»`;
  if (isDryRun()) {
    return { dryRun: true, would: [`monday: set status=Done on item ${id}`, `slack: DM Pepper "${message}"`], board: 'skipped', pepper: 'skipped' };
  }
  const out = { dryRun: false, board: 'pending', pepper: 'pending' };
  try { await monday.setDone(id); out.board = 'ok'; }
  catch (e) { out.board = 'failed'; out.pepper = 'not_attempted'; out.error = e.message; return out; }
  try { out.ts = await slack.dmPepper(message); out.pepper = 'ok'; }
  catch (e) { out.pepper = 'failed'; out.error = e.message; }
  return out;
}

module.exports = { doneSync, isDryRun };
