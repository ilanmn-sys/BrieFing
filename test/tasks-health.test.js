const test = require('node:test');
const assert = require('node:assert');
process.env.MONDAY_API_TOKEN = 'x';
const realFetch = global.fetch;
let failUpdates = false;
const item = (id, name, group, status = '', date = '') => ({ id, name, updated_at: '', group: { id: group }, column_values: [{ id: 'status', text: status }, { id: 'date4', text: date }, { id: 'color_mm5wqmy7', text: '' }, { id: 'person', text: '' }] });
global.fetch = async (url, opts = {}) => {
  if (!String(url).includes('api.monday.com')) return realFetch(url, opts);
  const q = JSON.parse(opts.body).query, ok = (d) => ({ ok: true, status: 200, text: async () => JSON.stringify(d) });
  if (q.includes('items_page')) return ok({ data: { boards: [{ items_page: { cursor: null, items: [
    item('1', 'late in today', 'group_mm4rgvq6', '', '2026-01-01'),
    item('2', 'שליחה עד 10.8', 'topics'),
    item('3', 'Quote request', 'group_title'),
    item('4', 'Waiting on Dana', 'group_title'),
    item('5', 'old thing', 'topics', 'Not Relevant'),
  ] } }] } });
  if (q.includes('items(ids')) return failUpdates ? ok({ errors: [{ message: 'updates boom' }] }) : ok({ data: { items: [{ id: '3', updates: [{ text_body: 'ping' }] }, { id: '4', updates: [] }] } });
  throw new Error('unexpected query ' + q.slice(0, 40));
};
const { server } = require('../server/index.js');

const get = async () => { await new Promise((r) => server.listen(0, '127.0.0.1', r)); const port = server.address().port; const j = await (await realFetch(`http://127.0.0.1:${port}/api/tasks`)).json(); await new Promise((r) => server.close(r)); return j; };

test('/api/tasks carries board health computed from the same read', async () => {
  failUpdates = false;
  const j = await get();
  assert.equal(j.healthError, null);
  const c = Object.fromEntries(j.health.map((r) => [r.id, r.count]));
  assert.deepEqual(c, { 'R-21': 1, 'R-05': 1, 'R-04': 0, 'R-06': 1, 'R-16': 1 }); // only item 3 lacks a named holder
  assert.equal(j.items.length, 5);
});

test('if the health step fails, tasks still load and the failure is reported, not hidden', async () => {
  failUpdates = true;
  const j = await get();
  assert.equal(j.items.length, 5); assert.equal(j.health, null); assert.match(j.healthError, /updates boom/);
});
