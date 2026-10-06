const test = require('node:test');
const assert = require('node:assert');
process.env.SLACK_TOKEN = 'x';
const { dmUnread, channelUnread, oldestTs, cleanText } = require('../server/slackLogic');

const ME = 'UME';
const m = (ts, user, text = 'hi', o = {}) => ({ ts: String(ts), user, text, ...o });

test('DM: only messages after my last reply count', () => {
  const un = dmUnread([m(1, 'UA'), m(2, ME), m(3, 'UA', 'later')], {}, ME);
  assert.deepEqual(un.map((x) => x.ts), ['3']);
});

test('DM: nothing unread when I spoke last', () => {
  assert.equal(dmUnread([m(1, 'UA'), m(2, ME)], {}, ME).length, 0);
});

test('trap 7: my threaded reply must not suppress unrelated top-level messages', () => {
  // Top-level from them at ts 10 and 30; I replied inside the thread of ts 10 at ts 20.
  const msgs = [m(10, 'UA', 'parent', { reply_count: 1, thread_ts: '10' }), m(30, 'UA', 'unrelated one'), m(31, 'UA', 'unrelated two')];
  const replies = { 10: [m(10, 'UA', 'parent'), m(20, ME, 'my threaded reply')] };
  const un = dmUnread(msgs, replies, ME);
  assert.deepEqual(un.map((x) => x.ts).sort(), ['10', '30', '31']); // all still unread at top level
});

test('a reply from them inside a thread after my threaded reply is unread', () => {
  const msgs = [m(10, 'UA', 'parent', { reply_count: 2, thread_ts: '10' })];
  const replies = { 10: [m(10, 'UA'), m(20, ME, 'mine'), m(25, 'UA', 'their follow-up')] };
  assert.ok(dmUnread(msgs, replies, ME).some((x) => x.ts === '25'));
});

test('DM keeps bot messages (rule differs from channels); drops empty and join noise', () => {
  const un = dmUnread([m(1, 'UB', 'from a bot', { bot_id: 'B1' }), m(2, 'UA', '   '), m(3, 'UA', 'joined', { subtype: 'channel_join' })], {}, ME);
  assert.deepEqual(un.map((x) => x.ts), ['1']);
});

test('channels: exclude only mine, bots and empty', () => {
  const un = channelUnread([m(1, ME), m(2, 'UB', 'bot', { bot_id: 'B1' }), m(3, 'UA', ''), m(4, 'UA', 'real'), m(5, 'UC', 'also real')], ME);
  assert.deepEqual(un.map((x) => x.ts), ['4', '5']);
});

test('channels: my earlier reply does not hide later messages (no "after my last message" rule)', () => {
  assert.equal(channelUnread([m(1, 'UA'), m(2, ME), m(3, 'UA')], ME).length, 2);
});

test('oldestTs is local midnight N days back, as epoch seconds', () => {
  const a = oldestTs('2026-10-05', 0, 'UTC'), b = oldestTs('2026-10-05', 2, 'UTC');
  assert.equal(a, Date.parse('2026-10-05T00:00:00Z') / 1000);
  assert.equal(a - b, 2 * 86400);
});

// ---- send safety ----
let calls = [];
global.fetch = async (url, opts = {}) => {
  calls.push(String(url).split('/api/')[1] + ' ' + String(opts.body || ''));
  const j = (o) => ({ ok: true, status: 200, text: async () => JSON.stringify(o) });
  const u = String(url);
  if (u.includes('auth.test')) return j({ ok: true, user_id: 'UME' });
  if (u.includes('conversations.history')) return j({ ok: true, messages: [{ ts: '5', user: 'UPEP', text: 'latest from pepper' }, { ts: '4', user: 'UME', text: 'mine' }] });
  if (u.includes('conversations.open')) return j({ ok: true, channel: { id: 'D9' } });
  if (u.includes('chat.postMessage')) return j({ ok: true, ts: '9.9' });
  throw new Error('unexpected ' + u);
};
const api = require('../server/slackApi');
const slack = require('../server/connectors/slack');

test('sending to a DM channel id is refused (S-005)', async () => {
  await assert.rejects(() => slack.sendDm('D0BCAGJV0AD', 'x'), /never a channel id/);
});

test('send is dry-run by default: no Slack write happens', async () => {
  delete process.env.DRY_RUN; calls = [];
  const r = await api.send('UABC123', 'hello');
  assert.equal(r.dryRun, true); assert.ok(!calls.some((c) => c.startsWith('chat.postMessage')));
});

test('live send opens the DM by user id and posts', async () => {
  process.env.DRY_RUN = '0'; calls = [];
  const r = await api.send('UABC123', 'hello');
  assert.equal(r.ts, '9.9');
  assert.ok(calls.some((c) => c.startsWith('conversations.open') && c.includes('users=UABC123')));
});

test('Ask Pepper captures her latest message as the baseline before sending', async () => {
  process.env.DRY_RUN = '0'; calls = [];
  const r = await api.askPepper('בקשה');
  assert.equal(r.baseline.text, 'latest from pepper');
  const order = calls.map((c) => c.split(' ')[0]);
  assert.ok(order.indexOf('conversations.history') < order.indexOf('chat.postMessage'));
});

test('empty messages are rejected', async () => {
  await assert.rejects(() => api.send('UABC123', '  '), /empty/);
  await assert.rejects(() => api.askPepper(''), /empty/);
});

test('real-world noise: joins and leaves never count as unread, even without a subtype', () => {
  const noise = [m(1, 'UA', '<@UA|Alexis Pumerantz> has left the channel'), m(2, 'UB', '<@UB|Luis> has joined the channel', { subtype: 'channel_join' }), m(3, 'UC', '<@UC> has joined the group')];
  assert.equal(channelUnread(noise, ME).length, 0); assert.equal(dmUnread(noise, {}, ME).length, 0);
  assert.equal(channelUnread([...noise, m(4, 'UD', 'a real post that mentions has left the channel in passing')], ME).length, 1);
});

test('cleanText turns Slack markup into readable text', () => {
  assert.equal(cleanText('On it <@U08EGV5CKQX|Gilad Livnat>'), 'On it @Gilad Livnat');
  assert.equal(cleanText('<!here>\n :mega: <http://Startups.com.br|Startups.com.br> piece'), '@here\n :mega: Startups.com.br piece');
  assert.equal(cleanText('see <https://x.com/a?b=1&amp;c=2>'), 'see https://x.com/a?b=1&c=2');
  assert.equal(cleanText('ping <@U123> in <#C1|ask-comms>'), 'ping @someone in #ask-comms');
  assert.equal(cleanText(null), '');
});

test('load(): configured channel IDs are read directly (no channel-list scan); one unreadable channel is reported, not fatal', async () => {
  process.env.DRY_RUN = '0'; calls = [];
  const { config } = require('../server/lib');
  const ids = Object.values(config.slackChannelIds), bad = config.slackChannelIds['communications-team'];
  const realFetch = global.fetch;
  global.fetch = async (url, opts = {}) => {
    const u = String(url), body = String(opts.body || '');
    calls.push(u.split('/api/')[1] + ' ' + body);
    const j = (o) => ({ ok: true, status: 200, text: async () => JSON.stringify(o) });
    if (u.includes('auth.test')) return j({ ok: true, user_id: 'UME' });
    if (u.includes('conversations.list')) return j({ ok: true, channels: [], response_metadata: {} });
    if (u.includes('conversations.history')) return body.includes(`channel=${bad}`) ? j({ ok: false, error: 'channel_not_found' })
      : j({ ok: true, messages: [{ ts: String(Date.now() / 1000), user: 'UOTHER', text: 'hello team' }, { ts: String(Date.now() / 1000 - 5), user: 'UX', text: '<@UX|Joe> has joined the channel', subtype: 'channel_join' }] });
    throw new Error('unexpected ' + u);
  };
  const r = await require('../server/slackApi').load();
  global.fetch = realFetch;
  assert.equal(r.channels.length, ids.length - 1);                 // every readable channel, the join message not counted
  assert.ok(r.channels.every((c) => c.count === 1));
  assert.deepEqual(r.notFound, ['communications-team (channel_not_found)']);
  assert.ok(!calls.some((c) => c.startsWith('conversations.list') && c.includes('public_channel')), 'no scan of the channel list');
});
