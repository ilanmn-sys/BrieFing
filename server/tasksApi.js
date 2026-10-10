// The Tasks tab's data: the projects board plus board health on the same read.
const { config, today } = require('./lib');
const monday = require('./connectors/monday');
const agents = require('./agents');
const boardHealth = require('./healthLogic');
const { isDryRun } = require('./done');

async function load() {
  const t = await monday.listTasks();
  console.log(`tasks loaded: ${t.items.length} items, ${t.pages} pages${t.truncated ? ' (TRUNCATED)' : ''}`);
  // Board health rides on the same read. A failure here must never hide the task list.
  let healthRules = null, healthError = null;
  try {
    const g = config.groups;
    const blocked = t.items.filter((i) => boardHealth.isBlocked(i, g) && i.status !== 'Done' && i.group !== g.canonical.completed.id).map((i) => i.id);
    const holderText = blocked.length ? await monday.updateTexts(blocked) : new Map();
    healthRules = boardHealth.health(t.items, { groups: g, today: today(), agentNames: agents.registry().flatMap((a) => [a.id.replace(/-/g, ' '), a.name]), holderText });
  } catch (e) { if (e.name === 'Miss' || e.constructor.name === 'Miss') throw e; healthError = e.message; console.error('board health failed', e.message); }
  return { today: today(), tz: config.me.tz, dryRun: isDryRun(), config: { groups: config.groups, board: config.boards.projects }, health: healthRules, healthError, ...t };
}
module.exports = { load };
