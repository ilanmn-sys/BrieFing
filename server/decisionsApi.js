const fs = require('fs');
const path = require('path');
const { config } = require('./lib');
const monday = require('./connectors/monday');
const { detectBoard, liveSeeds, order, OUTCOMES, KEY } = require('./decisionsLogic');
const { isDryRun } = require('./done');

const file = () => process.env.DECISIONS_FILE || path.join(__dirname, '..', 'data', 'decisions.json');
const bad = (msg, code = 400) => Object.assign(new Error(msg), { code });

function readState() { try { return JSON.parse(fs.readFileSync(file(), 'utf8')); } catch (_) { return {}; } }
function writeState(s) { fs.mkdirSync(path.dirname(file()), { recursive: true }); const tmp = file() + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(s, null, 2)); fs.renameSync(tmp, file()); }

async function load(emailNames = []) {
  const t = await monday.listTasks();
  const board = detectBoard(t.items, config.groups);
  const seeds = liveSeeds(config.decisionSeeds, board, emailNames);
  console.log(`decisions loaded: ${board.length} board, ${seeds.length} seeds${t.truncated ? ' (TRUNCATED)' : ''}`);
  return { items: order([...board, ...seeds]), resolved: readState(), truncated: t.truncated, pages: t.pages, dryRun: isDryRun() };
}

// Recording a decision. Board-sourced: the outcome is posted on the item first (so the board is the
// record); only if that works is it saved locally. Email/seed decisions have no board item, so they
// are local-only and the reply says so.
async function resolve({ key, outcome, note, itemId }) {
  if (!KEY.test(String(key))) throw bad('invalid key');
  if (!OUTCOMES.includes(outcome)) throw bad('invalid outcome');
  const text = `Decision: ${outcome[0].toUpperCase() + outcome.slice(1)}${note ? '. ' + String(note).slice(0, 1000) : ''}`;
  const onBoard = String(key).startsWith('board:');
  if (onBoard && !/^\d+$/.test(String(itemId))) throw bad('board decisions need an item id');
  if (isDryRun()) return { dryRun: true, would: [onBoard ? `monday: post update on item ${itemId}: "${text}"` : 'local only: no board item for this decision', `save outcome "${outcome}" for ${key}`] };
  let boardUpdate = 'n/a';
  if (onBoard) { await monday.postUpdate(itemId, text); boardUpdate = 'ok'; }
  const s = readState(); s[key] = { outcome, note: note || '', at: new Date().toISOString() }; writeState(s);
  return { dryRun: false, boardUpdate, local: 'saved', localOnly: !onBoard };
}

module.exports = { load, resolve, readState };
