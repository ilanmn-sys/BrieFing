// Gmail: read inbox threads, read one thread, create DRAFTS. Never sends (principle 1).
const { http } = require('../lib');
const { accessToken } = require('./google');
const { viaClaude } = require('../via/mode');
const via = () => require('../via/gmail');

// Calendar noise is filtered in the query itself, not after the fact (trap 9).
const QUERY = 'in:inbox newer_than:7d -filename:ics -filename:invite.ics -from:calendar-notification@google.com '
  + '-subject:invitation -subject:"updated invitation" -subject:"accepted:" -subject:"declined:" -subject:"tentatively accepted:" -category:promotions';

const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const auth = async () => ({ Authorization: `Bearer ${await accessToken()}` });
let meCache = null;
async function me() { if (!meCache) meCache = (await http(`${API}/profile`, { headers: await auth() })).emailAddress.toLowerCase(); return meCache; }

const EMAILS = /[\w.+'-]+@[\w-]+(?:\.[\w-]+)+/g;
const emails = (v) => (String(v || '').match(EMAILS) || []).map((x) => x.toLowerCase());
// Bulk and system mail (checked on the real inbox: ~half of the latest threads are notifications and newsletters).
const AUTOMATED = /(?:^|[^a-z])(?:no[-_.]?reply|do[-_.]?not[-_.]?reply|notifications?|newsletter|alerts?|mailer-daemon|postmaster|bounce|digest|help|support|billing)@|@(?:mail|email|news|notify|notifications|e)\./i;
const BROADCAST_AT = 15; // more recipients than this = a broadcast, not a conversation with me

const hdr = (m, n) => ((m.payload.headers || []).find((h) => h.name.toLowerCase() === n.toLowerCase()) || {}).value || '';
const addr = (v) => ((v.match(/<([^>]+)>/) || [null, v])[1] || '').trim().toLowerCase();
const name = (v) => v.replace(/<[^>]*>/, '').replace(/"/g, '').trim() || addr(v);

async function listThreads(max = 50) {
  if (viaClaude('gmail')) return via().listThreads();
  const h = await auth(), mine = await me();
  const listed = await http(`${API}/threads?${new URLSearchParams({ q: QUERY, maxResults: String(max) })}`, { headers: h });
  const ids = listed.threads || [];
  const meta = new URLSearchParams([['format', 'metadata'], ...['From', 'To', 'Cc', 'Subject', 'Date', 'Message-ID'].map((x) => ['metadataHeaders', x])]);
  const threads = await mapLimit(ids, 8, (t) => http(`${API}/threads/${t.id}?${meta}`, { headers: h }));
  const out = threads.map((t) => {
    const msgs = t.messages, last = msgs[msgs.length - 1], first = msgs[0];
    const lastFrom = hdr(last, 'From');
    const to = emails(hdr(last, 'To')), cc = emails(hdr(last, 'Cc')), fromAddr = addr(lastFrom);
    const everyone = new Set([...to, ...cc, fromAddr]);
    return {
      id: t.id, subject: hdr(first, 'Subject') || '(no subject)', messageCount: msgs.length,
      from: name(lastFrom), fromEmail: addr(lastFrom), date: Number(last.internalDate),
      lastFromMe: addr(lastFrom) === mine, lastSnippet: last.snippet || '',
      // Reply targets come from the real thread, so a draft goes to the right people.
      replyTo: addr(hdr(last, 'Reply-To') || lastFrom), lastMessageId: hdr(last, 'Message-ID'),
      unread: (last.labelIds || []).includes('UNREAD'),
      recipientCount: to.length + cc.length,
      ccOnly: !to.includes(mine) && cc.includes(mine),                        // I am copied, not addressed
      broadcast: to.length + cc.length > BROADCAST_AT,
      selfOnly: [...everyone].every((x) => x === mine),                        // a note to myself
      automated: AUTOMATED.test(fromAddr),
    };
  }).sort((a, b) => b.date - a.date);
  return { threads: out, estimate: Number(listed.resultSizeEstimate) || out.length };
}

async function mapLimit(arr, n, fn) {
  const res = new Array(arr.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, arr.length) }, async () => { while (i < arr.length) { const k = i++; res[k] = await fn(arr[k]); } }));
  return res;
}

function bodyText(payload) {
  const parts = []; (function walk(p) { (p.parts || []).forEach(walk); if (p.body && p.body.data) parts.push(p); })(payload);
  const pick = parts.find((p) => p.mimeType === 'text/plain') || parts.find((p) => p.mimeType === 'text/html') || parts[0];
  if (!pick) return '';
  const t = Buffer.from(pick.body.data, 'base64url').toString('utf8');
  return pick.mimeType === 'text/html' ? t.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : t;
}

async function getThread(id) {
  if (viaClaude('gmail')) return via().getThread(id);
  const t = await http(`${API}/threads/${encodeURIComponent(id)}?format=full`, { headers: await auth() });
  return t.messages.map((m) => ({ from: name(hdr(m, 'From')), date: Number(m.internalDate), body: bodyText(m.payload).slice(0, 6000) }));
}

const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
const encHeader = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);

function buildMime({ to, cc, subject, body, inReplyTo }) {
  const lines = [`To: ${to}`, cc ? `Cc: ${cc}` : null, `Subject: ${encHeader(subject)}`,
    inReplyTo ? `In-Reply-To: ${inReplyTo}` : null, inReplyTo ? `References: ${inReplyTo}` : null,
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64(body)];
  return lines.filter((l) => l !== null).join('\r\n');
}

// Creates a draft only. Needs the gmail.compose scope.
async function createDraft({ threadId, to, cc, subject, body, inReplyTo }) {
  if (viaClaude('gmail')) return via().createDraft({ to, cc, subject, body, inReplyTo });
  const raw = Buffer.from(buildMime({ to, cc, subject, body, inReplyTo })).toString('base64url');
  const r = await http(`${API}/drafts`, {
    method: 'POST', headers: { ...(await auth()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { raw, threadId } }),
  });
  return r.id;
}

module.exports = { QUERY, listThreads, getThread, createDraft, buildMime, AUTOMATED, emails };
