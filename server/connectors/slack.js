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

module.exports = { health, dmPepper };
