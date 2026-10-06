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

// ---- Requests (Switchboard board) ----
const RQ = config.requests;
const RCOLS = [RQ.columns.status, RQ.columns.deadline, RQ.columns.tier, RQ.columns.region];
const RITEM = `id name group { id } column_values(ids: ${JSON.stringify(RCOLS)}) { id text } updates(limit: 10) { created_at text_body creator { id name } }`;

// Open items I own. Owner filter and terminal-status filter run server-side in monday AND again
// here, so a changed filter semantic can never leak closed items into the list.
async function listRequests() {
  // Checked against the real board: owner AND status-not-terminal in one server-side filter returns exactly the open items
  // (the owner filter alone returned ~97% closed items). The terminal check is repeated below as a safety net.
  const rules = `query_params:{rules:[{column_id:"${RQ.columns.owner}",compare_value:["assigned_to_me"],operator:any_of},{column_id:"${RQ.columns.status}",compare_value:${JSON.stringify(RQ.terminalStatusIds)},operator:not_any_of}],operator:and}`;
  const items = []; let pages = 0, truncated = false;
  let r = await gql(`query($id:[ID!]){ boards(ids:$id){ items_page(limit:100, ${rules}){ cursor items{ ${RITEM} } } } }`, { id: [String(RQ.boardId)] });
  let page = r.data && r.data.boards[0] && r.data.boards[0].items_page;
  while (page) {
    if (r.errors) throw new Error(JSON.stringify(r.errors).slice(0, 200));
    pages++;
    for (const it of page.items) {
      const cv = Object.fromEntries(it.column_values.map((c) => [c.id, c.text || '']));
      const status = cv[RQ.columns.status];
      if (it.group.id === RQ.closedGroup || RQ.terminalStatuses.includes(status)) continue;
      items.push({ id: it.id, name: it.name, group: it.group.id, status, deadline: cv[RQ.columns.deadline], tier: cv[RQ.columns.tier], region: cv[RQ.columns.region],
        updates: (it.updates || []).map((u) => ({ createdAt: u.created_at, text: String(u.text_body || '').slice(0, 300), creatorId: u.creator && u.creator.id, creatorName: u.creator && u.creator.name })) });
    }
    if (!page.cursor) break;
    if (pages >= MAX_PAGES) { truncated = true; break; }
    r = await gql(`query($c:String!){ next_items_page(limit:100, cursor:$c){ cursor items{ ${RITEM} } } }`, { c: page.cursor });
    page = r.data && r.data.next_items_page;
  }
  if (!pages) throw new Error('requests board returned no pages');
  return { items, pages, truncated };
}

async function postUpdate(itemId, text) {
  const r = await gql('mutation($i:ID!,$b:String!){ create_update(item_id:$i, body:$b){ id } }', { i: String(itemId), b: text });
  if (r.errors || !r.data || !r.data.create_update) throw new Error(`monday: ${JSON.stringify(r.errors || r).slice(0, 200)}`);
  return r.data.create_update.id;
}

async function setRequestStatus(itemId, label) {
  const r = await gql('mutation($b:ID!,$i:ID!,$c:String!,$v:JSON!){ change_column_value(board_id:$b,item_id:$i,column_id:$c,value:$v){ id } }',
    { b: String(RQ.boardId), i: String(itemId), c: RQ.columns.status, v: JSON.stringify({ label }) });
  if (r.errors || !r.data || !r.data.change_column_value) throw new Error(`monday: ${JSON.stringify(r.errors || r).slice(0, 200)}`);
  return r.data.change_column_value.id;
}

// Latest update text for a set of items (used to find whether a blocked item names who holds it).
async function updateTexts(ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    const r = await gql('query($ids:[ID!]){ items(ids:$ids){ id updates(limit:3){ text_body } } }', { ids: ids.slice(i, i + 100).map(String) });
    if (r.errors) throw new Error(JSON.stringify(r.errors).slice(0, 200));
    for (const it of r.data.items) out.set(it.id, (it.updates || []).map((u) => u.text_body || '').join('\n'));
  }
  return out;
}

// ---- Strategy proposals (Apply all) ----
const C = config.columns;
const names = (d) => (d.errors ? (() => { throw new Error(JSON.stringify(d.errors).slice(0, 200)); })() : d.data);

// Items in a group (id, name, status). One page of 500 is plenty for 📥 Pepper Tasks.
async function groupItems(groupId) {
  const q = `query($id:[ID!]){ boards(ids:$id){ items_page(limit:500, query_params:{rules:[{column_id:"group",compare_value:["${groupId}"],operator:any_of}]}){ items{ id name column_values(ids:["${C.status}"]){ text } } } } }`;
  const d = names(await gql(q, { id: [String(config.boards.projects)] }));
  return d.boards[0].items_page.items.map((i) => ({ id: i.id, name: i.name, status: (i.column_values[0] || {}).text || '' }));
}

async function itemUpdates(itemId, limit = 30) {
  const d = names(await gql('query($ids:[ID!]){ items(ids:$ids){ id updates(limit:' + limit + '){ text_body created_at } } }', { ids: [String(itemId)] }));
  return d.items[0] ? d.items[0].updates : [];
}

// Current group / date / priority for a set of items, and which board they are on.
async function itemStates(ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    const q = `query($ids:[ID!]){ items(ids:$ids){ id board{ id } group{ id } column_values(ids:["${C.deadline}","${C.priority}"]){ id text } } }`;
    const d = names(await gql(q, { ids: ids.slice(i, i + 100).map(String) }));
    for (const it of d.items) {
      if (String(it.board.id) !== String(config.boards.projects)) continue; // never touch another board
      const cv = Object.fromEntries(it.column_values.map((c) => [c.id, c.text || '']));
      out.set(it.id, { group: it.group.id, date: cv[C.deadline] || null, priority: cv[C.priority] || '' });
    }
  }
  return out;
}

async function moveToGroup(itemId, groupId) {
  const d = names(await gql('mutation($i:ID!,$g:String!){ move_item_to_group(item_id:$i, group_id:$g){ id } }', { i: String(itemId), g: groupId }));
  if (!d.move_item_to_group) throw new Error('monday: move returned nothing');
}

// date === null clears the Date column (null clears a column in change_multiple_column_values).
async function setDate(itemId, date) {
  const v = JSON.stringify({ [C.deadline]: date ? { date } : null });
  const d = names(await gql('mutation($b:ID!,$i:ID!,$v:JSON!){ change_multiple_column_values(board_id:$b,item_id:$i,column_values:$v){ id } }', { b: String(config.boards.projects), i: String(itemId), v }));
  if (!d.change_multiple_column_values) throw new Error('monday: date change returned nothing');
}

async function setPriority(itemId, label) {
  const d = names(await gql('mutation($b:ID!,$i:ID!,$c:String!,$v:JSON!){ change_column_value(board_id:$b,item_id:$i,column_id:$c,value:$v){ id } }',
    { b: String(config.boards.projects), i: String(itemId), c: C.priority, v: JSON.stringify({ label }) }));
  if (!d.change_column_value) throw new Error('monday: priority change returned nothing');
}

// An email task for Pepper: in 📥 Pepper Tasks, owner Ilan, "Working on it".
async function createEmailTask({ name, due, body }) {
  const cv = { [C.status]: { label: 'Working on it' }, [C.person]: { personsAndTeams: [{ id: config.me.mondayUserId, kind: 'person' }] } };
  if (due) cv[C.deadline] = { date: due };
  const d = names(await gql('mutation($b:ID!,$g:String!,$n:String!,$v:JSON!){ create_item(board_id:$b, group_id:$g, item_name:$n, column_values:$v){ id } }',
    { b: String(config.boards.projects), g: config.groups.canonical.pepperTasks.id, n: name, v: JSON.stringify(cv) }));
  if (!d.create_item) throw new Error('monday: create_item returned nothing');
  if (body) await postUpdate(d.create_item.id, body);
  return d.create_item.id;
}

// Sets the Status column on a projects-board item (e.g. the strategy item to Done).
async function setRequestStatusOn(itemId, label) {
  const d = names(await gql('mutation($b:ID!,$i:ID!,$c:String!,$v:JSON!){ change_column_value(board_id:$b,item_id:$i,column_id:$c,value:$v){ id } }',
    { b: String(config.boards.projects), i: String(itemId), c: config.columns.status, v: JSON.stringify({ label }) }));
  if (!d.change_column_value) throw new Error('monday: status change returned nothing');
}

module.exports = { setRequestStatusOn, gql, health, listTasks, setDone, listRequests, postUpdate, setRequestStatus, updateTexts, groupItems, itemUpdates, itemStates, moveToGroup, setDate, setPriority, createEmailTask };
