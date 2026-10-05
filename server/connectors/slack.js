const { config, http, need } = require('../lib');

async function health() {
  const r = await http('https://slack.com/api/auth.test', { method: 'POST', headers: { Authorization: `Bearer ${need('SLACK_TOKEN')}` } });
  if (!r.ok) throw new Error(`slack: ${r.error}`);
  return `workspace ${r.team}; user ${r.user_id}`;
}

// Principle: DM targets are user:<id>, never a DM-channel id (S-005); always check the send result.
async function dmPepper(text) {
  const target = config.pepper.userId;
  if (!target || target === 'VERIFY') throw new Error('pepper.userId not set');
  const open = await http('https://slack.com/api/conversations.open', {
    method: 'POST',
    headers: { Authorization: `Bearer ${need('SLACK_TOKEN')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ users: target }),
  });
  if (!open.ok) throw new Error(`conversations.open failed: ${open.error}`);
  const sent = await http('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { Authorization: `Bearer ${need('SLACK_TOKEN')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: open.channel.id, text }),
  });
  if (!sent.ok) throw new Error(`chat.postMessage failed: ${sent.error}`);
  return sent.ts;
}

// ---- Reading (needs a user token with im/mpim/channels/groups history + users:read) ----
async function call(method, params = {}) {
  const body = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)]));
  const r = await http(`https://slack.com/api/${method}`, { method: 'POST', headers: { Authorization: `Bearer ${need('SLACK_TOKEN')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!r.ok) throw new Error(`slack ${method}: ${r.error}`);
  return r;
}

let meId = null;
async function me() { if (!meId) meId = (await call('auth.test')).user_id; return meId; }

const names = new Map();
async function userName(id) {
  if (!id) return 'unknown';
  if (!names.has(id)) { try { const u = (await call('users.info', { user: id })).user; names.set(id, u.real_name || u.name || id); } catch (_) { names.set(id, id); } }
  return names.get(id);
}

async function paged(method, params, key, cap = 5) {
  const out = []; let cursor, truncated = false;
  for (let i = 0; i < cap; i++) {
    const r = await call(method, { ...params, limit: 200, cursor });
    out.push(...r[key]); cursor = r.response_metadata && r.response_metadata.next_cursor;
    if (!cursor) return { items: out, truncated: false };
  }
  return { items: out, truncated: true };
}

async function mapLimit(arr, n, fn) {
  const out = new Array(arr.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, arr.length) }, async () => { while (i < arr.length) { const k = i++; out[k] = await fn(arr[k]); } }));
  return out;
}

async function history(channel, oldest, limit = 50) { return (await call('conversations.history', { channel, oldest, limit })).messages || []; }
async function replies(channel, ts) { try { return (await call('conversations.replies', { channel, ts, limit: 50 })).messages || []; } catch (_) { return []; } }

async function sendDm(userId, text) {
  if (!/^U[A-Z0-9]+$/.test(userId)) throw new Error('DM target must be a user id (user:<id>), never a channel id');
  const open = await call('conversations.open', { users: userId });
  const sent = await call('chat.postMessage', { channel: open.channel.id, text });
  return sent.ts;
}

module.exports = { health, dmPepper, call, me, userName, paged, mapLimit, history, replies, sendDm };
