// Pure Slack unread logic (no network), so the two different unread rules are testable.
//
// DMs      : a message is unread when it is not mine and I have not replied *in the same thread*
//            since (top-level messages form one "main" group; each thread is its own group).
//            A threaded reply of mine must never suppress unrelated top-level messages (trap 7).
// Channels : exclude only my own messages, bots, and empty ones.

const NOISE_SUBTYPES = new Set(['channel_join', 'channel_leave', 'channel_topic', 'channel_purpose', 'channel_name', 'pinned_item']);
const hasText = (m) => !!(m.text && m.text.trim());

function dmUnread(messages, replies, myId) {
  const groups = new Map(); // groupKey -> messages
  const add = (key, m) => (groups.get(key) || groups.set(key, []).get(key)).push(m);
  for (const m of messages || []) add('main', m);
  for (const [threadTs, rs] of Object.entries(replies || {})) for (const m of rs) if (m.ts !== threadTs) add(threadTs, m);
  const unread = [];
  for (const ms of groups.values()) {
    const myLast = Math.max(0, ...ms.filter((m) => m.user === myId).map((m) => Number(m.ts)));
    for (const m of ms) if (m.user !== myId && hasText(m) && !NOISE_SUBTYPES.has(m.subtype) && Number(m.ts) > myLast) unread.push(m);
  }
  return unread.sort((a, b) => Number(a.ts) - Number(b.ts));
}

function channelUnread(messages, myId) {
  return (messages || []).filter((m) => m.user !== myId && !m.bot_id && m.subtype !== 'bot_message' && !NOISE_SUBTYPES.has(m.subtype) && hasText(m))
    .sort((a, b) => Number(a.ts) - Number(b.ts));
}

// Unix seconds for local midnight `daysBack` days before the given YYYY-MM-DD in a timezone.
function oldestTs(todayStr, daysBack, tz) {
  const off = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(new Date()).find((x) => x.type === 'timeZoneName').value.replace('GMT', '') || '+00:00';
  const d = new Date(`${todayStr}T00:00:00${off}`);
  return Math.floor(d.getTime() / 1000) - daysBack * 86400;
}

module.exports = { dmUnread, channelUnread, oldestTs };
