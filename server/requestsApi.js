const { config, today } = require('./lib');
const monday = require('./connectors/monday');
const { rank } = require('./requestsLogic');
const { isDryRun } = require('./done');

const RQ = config.requests;
const ME = config.me.mondayUserId;
const bad = (msg, code = 400) => Object.assign(new Error(msg), { code });
const checkId = (id) => { if (!/^\d+$/.test(String(id))) throw bad('invalid item id'); };

async function load(touched = new Set()) {
  const t = await monday.listRequests();
  const items = rank(t.items, { myId: ME, bots: RQ.botNames, today: today(), touched });
  console.log(`requests loaded: ${items.length} open items, ${t.pages} pages${t.truncated ? ' (TRUNCATED)' : ''}`);
  return { today: today(), items, pages: t.pages, truncated: t.truncated, statusLabels: RQ.statusLabels, dryRun: isDryRun() };
}

async function update(id, text) {
  checkId(id);
  const body = String(text || '').trim();
  if (!body) throw bad('empty update');
  if (body.length > 4000) throw bad('update too long');
  if (isDryRun()) return { dryRun: true, would: `monday: post update on item ${id}: "${body.slice(0, 80)}"` };
  return { dryRun: false, updateId: await monday.postUpdate(id, body) };
}

async function status(id, label) {
  checkId(id);
  if (!RQ.statusLabels.includes(label)) throw bad('unknown status label');
  if (isDryRun()) return { dryRun: true, would: `monday: set Status="${label}" on item ${id}` };
  await monday.setRequestStatus(id, label);
  return { dryRun: false, label };
}

module.exports = { load, update, status };
