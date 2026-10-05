const { config, today } = require('./lib');
const slack = require('./connectors/slack');
const llm = require('./llm');
const { dmUnread, channelUnread, oldestTs } = require('./slackLogic');
const { isDryRun } = require('./done');

const DM_DAYS = 7, CH_DAYS = 2, MAX_CONVS = 200;
const compact = async (m) => ({ ts: m.ts, from: await slack.userName(m.user), text: String(m.text || '').slice(0, 600) });

// Unread DMs + unread counts for the key channels. Reads only; nothing here writes.
async function load() {
  const myId = await slack.me();
  const t = today(), tz = config.me.tz;
  const dmOldest = oldestTs(t, DM_DAYS, tz), chOldest = oldestTs(t, CH_DAYS, tz);

  // DMs: channel_types im,mpim. Never a mention search (nobody @-tags you in a 1:1).
  const convs = await slack.paged('conversations.list', { types: 'im,mpim', exclude_archived: true }, 'channels');
  const scanList = convs.items.filter((c) => c.id !== config.pepper.dmChannel).slice(0, MAX_CONVS);
  const dmResults = await slack.mapLimit(scanList, 8, async (c) => {
    const msgs = await slack.history(c.id, dmOldest, 30);
    if (!msgs.length) return null;
    const threadReplies = {};
    for (const m of msgs.filter((x) => x.reply_count > 0 && Number(x.latest_reply) >= dmOldest).slice(0, 10)) {
      threadReplies[m.thread_ts || m.ts] = await slack.replies(c.id, m.thread_ts || m.ts);
    }
    const un = dmUnread(msgs, threadReplies, myId);
    if (!un.length) return null;
    const who = c.is_im ? await slack.userName(c.user) : (c.name || 'group DM');
    return { channel: c.id, userId: c.is_im ? c.user : null, who, count: un.length, messages: await Promise.all(un.slice(-5).map(compact)), lastTs: un[un.length - 1].ts };
  });
  const dms = dmResults.filter(Boolean).sort((a, b) => Number(b.lastTs) - Number(a.lastTs));

  // Channels: exclude only mine / bots / empty. Summaries are fetched per channel by the client.
  const wanted = new Set(config.slackChannels.map((c) => c.replace(/^#/, '')));
  const chans = await slack.paged('conversations.list', { types: 'public_channel,private_channel', exclude_archived: true }, 'channels', 10);
  const notFound = [...wanted].filter((n) => !chans.items.some((c) => c.name === n));
  const channels = (await slack.mapLimit(chans.items.filter((c) => wanted.has(c.name)), 4, async (c) => {
    const un = channelUnread(await slack.history(c.id, chOldest, 100), myId);
    return un.length ? { id: c.id, name: c.name, count: un.length } : null;
  })).filter(Boolean);

  console.log(`loaded: ${dms.length} DMs, ${channels.length} channels`);
  return { dms, channels, notFound, scanned: scanList.length, truncated: convs.truncated || scanList.length < convs.items.filter((c) => c.id !== config.pepper.dmChannel).length, dryRun: isDryRun() };
}

async function summarize(channelId) {
  const myId = await slack.me();
  const un = channelUnread(await slack.history(channelId, oldestTs(today(), CH_DAYS, config.me.tz), 100), myId);
  if (!un.length) return { summary: 'Nothing new.' };
  const lines = await Promise.all(un.slice(-60).map(async (m) => `${await slack.userName(m.user)}: ${String(m.text).slice(0, 400)}`));
  const summary = await llm.complete(`Summarise these Slack messages in 2-3 short bullet points for Ilan (comms lead). Flag anything that needs him.\n\n${lines.join('\n')}`, { maxTokens: 400 });
  return { summary: summary.trim() };
}

// Draft uses the last ~12 messages of the conversation as context. Drafting never sends.
async function draftReply(channelId) {
  const msgs = (await slack.history(channelId, 0, 12)).reverse();
  const lines = await Promise.all(msgs.map(async (m) => `${await slack.userName(m.user)}: ${String(m.text || '').slice(0, 400)}`));
  const draft = await llm.complete(`Write Ilan's next reply in this Slack DM. Match the language and tone. Short. Never invent facts or commitments. Return ONLY the reply text.\n\n${lines.join('\n')}`, { maxTokens: 400 });
  return { draft: draft.trim() };
}

// Sent only on an explicit click, and only with DRY_RUN=0.
async function send(userId, text) {
  if (!String(text || '').trim()) throw Object.assign(new Error('empty message'), { code: 400 });
  if (isDryRun()) return { dryRun: true, would: `slack: DM user:${userId} "${String(text).slice(0, 80)}" (not sent)` };
  return { dryRun: false, ts: await slack.sendDm(userId, text) };
}

// "Ask Pepper" round trip (Slack has no callback): capture her latest message as a baseline,
// send the request, and let the client re-read and compare. Compare content, never timestamps.
async function latestFromPepper() {
  const myId = await slack.me();
  const m = (await slack.history(config.pepper.dmChannel, 0, 15)).find((x) => x.user !== myId && hasText(x));
  return m ? { ts: m.ts, text: String(m.text).slice(0, 4000) } : null;
}
const hasText = (m) => !!(m.text && m.text.trim());

async function askPepper(text) {
  if (!String(text || '').trim()) throw Object.assign(new Error('empty message'), { code: 400 });
  const baseline = await latestFromPepper();
  if (isDryRun()) return { dryRun: true, baseline, would: `slack: DM Pepper user:${config.pepper.userId} "${String(text).slice(0, 80)}" (not sent)` };
  await slack.sendDm(config.pepper.userId, text);
  return { dryRun: false, baseline };
}

module.exports = { load, summarize, draftReply, send, latestFromPepper, askPepper };
