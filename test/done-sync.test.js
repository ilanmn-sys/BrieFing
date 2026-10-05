const test = require('node:test');
const assert = require('node:assert');
process.env.MONDAY_API_TOKEN = 'x'; process.env.SLACK_TOKEN = 'x';

let calls = [], mode = {};
global.fetch = async (url, opts = {}) => {
  const u = String(url), body = opts.body ? String(opts.body) : '';
  calls.push(u + ' ' + body.slice(0, 80));
  const json = (o) => ({ ok: true, status: 200, text: async () => JSON.stringify(o) });
  if (u.includes('api.monday.com')) return json(mode.boardFail ? { errors: [{ message: 'boom' }] } : { data: { change_column_value: { id: '1' } } });
  if (u.includes('conversations.open')) return json({ ok: true, channel: { id: 'D1' } });
  if (u.includes('chat.postMessage')) return json(mode.dmFail ? { ok: false, error: 'channel_not_found' } : { ok: true, ts: '1.1' });
  throw new Error('unexpected ' + u);
};
const { doneSync } = require('../server/done');
const reset = (m = {}) => { calls = []; mode = m; };

test('dry-run is the default and makes no calls', async () => {
  delete process.env.DRY_RUN; reset();
  const r = await doneSync({ id: '123', name: 't' });
  assert.equal(r.dryRun, true); assert.equal(calls.length, 0); assert.equal(r.would.length, 2);
});
test('live: both legs succeed, DM goes to user id not channel id', async () => {
  process.env.DRY_RUN = '0'; reset();
  const r = await doneSync({ id: '123', name: 't' });
  assert.equal(r.board, 'ok'); assert.equal(r.pepper, 'ok');
  assert.ok(calls.some((c) => c.includes('conversations.open') && c.includes('U0BBLHZH4DC')));
});
test('live: board failure means Pepper is NOT told', async () => {
  process.env.DRY_RUN = '0'; reset({ boardFail: true });
  const r = await doneSync({ id: '123', name: 't' });
  assert.equal(r.board, 'failed'); assert.equal(r.pepper, 'not_attempted');
  assert.ok(!calls.some((c) => c.includes('chat.postMessage')));
});
test('live: DM failure is reported, board stays done', async () => {
  process.env.DRY_RUN = '0'; reset({ dmFail: true });
  const r = await doneSync({ id: '123', name: 't' });
  assert.equal(r.board, 'ok'); assert.equal(r.pepper, 'failed'); assert.match(r.error, /channel_not_found/);
});
test('rejects non-numeric ids', async () => {
  process.env.DRY_RUN = '0'; reset();
  await assert.rejects(() => doneSync({ id: '1; drop', name: 't' }), /invalid item id/);
  assert.equal(calls.length, 0);
});
