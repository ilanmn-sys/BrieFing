const { config, http, need } = require('../lib');

async function gql(query, variables) {
  return http('https://api.monday.com/v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: need('MONDAY_API_TOKEN'), 'API-Version': '2024-10' },
    body: JSON.stringify({ query, variables }),
  });
}

// Read-only: confirms auth and that the projects board is reachable.
async function health() {
  const r = await gql('query($id:[ID!]){ me{ id name } boards(ids:$id){ id name } }', { id: [String(config.boards.projects)] });
  if (r.errors) throw new Error(JSON.stringify(r.errors).slice(0, 200));
  const board = r.data.boards[0];
  if (!board) throw new Error('projects board not visible to this token');
  return `user ${r.data.me.id}; board "${board.name}"`;
}

const COLS = ['status', 'date4', 'color_mm5wqmy7', 'person']; // never the duplicate columns (config.columns.neverUse)
const ITEM = `id name updated_at group { id } column_values(ids: ${JSON.stringify(COLS)}) { id text }`;
const MAX_PAGES = 20; // cap per spec; hitting it is reported, never silent (trap 8)

// Paginates the cursor to exhaustion (or the cap). Read-only.
async function listTasks() {
  const items = [];
  let pages = 0, truncated = false;
  let r = await gql(`query($id:[ID!]){ boards(ids:$id){ items_page(limit:500){ cursor items{ ${ITEM} } } } }`, { id: [String(config.boards.projects)] });
  let page = r.data && r.data.boards[0] && r.data.boards[0].items_page;
  while (page) {
    if (r.errors) throw new Error(JSON.stringify(r.errors).slice(0, 200));
    pages++;
    for (const it of page.items) {
      const cv = Object.fromEntries(it.column_values.map((c) => [c.id, c.text || '']));
      items.push({ id: it.id, name: it.name, group: it.group.id, status: cv.status, deadline: cv.date4,
        priority: cv.color_mm5wqmy7, owner: cv.person, updated_at: it.updated_at });
    }
    if (!page.cursor) break;
    if (pages >= MAX_PAGES) { truncated = true; break; }
    r = await gql(`query($c:String!){ next_items_page(limit:500, cursor:$c){ cursor items{ ${ITEM} } } }`, { c: page.cursor });
    page = r.data && r.data.next_items_page;
  }
  if (!pages) throw new Error('board returned no pages');
  return { items, pages, truncated };
}

// Sets the status column to Done. Throws on any API-level error.
async function setDone(itemId) {
  const r = await gql(
    'mutation($b:ID!,$i:ID!,$c:String!,$v:JSON!){ change_column_value(board_id:$b,item_id:$i,column_id:$c,value:$v){ id } }',
    { b: String(config.boards.projects), i: String(itemId), c: config.columns.status, v: JSON.stringify({ label: 'Done' }) });
  if (r.errors || !r.data || !r.data.change_column_value) throw new Error(`monday: ${JSON.stringify(r.errors || r).slice(0, 200)}`);
  return r.data.change_column_value.id;
}

module.exports = { gql, health, listTasks, setDone };
