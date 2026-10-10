// Gmail through Claude Code's Gmail connector. Same output shape as connectors/gmail.js (the API version),
// so the Email tab, triage and classification are unchanged.
// search_threads previews only the ~5 OLDEST messages of a thread, so longer threads are re-read with get_thread
// before deciding who wrote last (R-22: never call a thread unreplied from a preview).
const claude = require('./claude');
const store = require('./store');
const { config } = require('../lib');
const { QUERY, AUTOMATED, emails } = require('../connectors/gmail');

const BROADCAST_AT = 15;
const addr = (v) => ((String(v || '').match(/<([^>]+)>/) || [null, v])[1] || '').trim().toLowerCase();
const nameOf = (v) => String(v || '').replace(/<[^>]*>/, '').replace(/"/g, '').trim() || addr(v);
const list = (v) => (Array.isArray(v) ? v : v ? [v] : []).flatMap((x) => emails(x));

const searchSpec = () => ({ key: 'gmail:search', server: 'Gmail', tool: 'search_threads', args: { query: QUERY, pageSize: 50, view: 'THREAD_VIEW_MINIMAL' } });
const threadSpec = (id) => ({ key: `gmail:thread:${id}`, server: 'Gmail', tool: 'get_thread', args: { threadId: id, messageFormat: 'MINIMAL' } });

// Pure. search: parsed search_threads JSON; full: Map threadId -> parsed get_thread JSON (for long threads).
function build(search, full = new Map(), me = config.me.email) {
  me = String(me || '').toLowerCase();
  const out = [];
  for (const t of (search && search.threads) || []) {
    const msgs = ((full.get(t.id) || {}).messages || t.messages || []).slice().sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    if (!msgs.length) continue;
    const first = msgs[0], last = msgs[msgs.length - 1];
    const fromAddr = addr(last.sender), to = list(last.toRecipients), cc = list(last.ccRecipients);
    const everyone = new Set([...to, ...cc, fromAddr]);
    out.push({
      id: t.id, subject: first.subject || last.subject || '(no subject)', messageCount: t.messageCount || msgs.length,
      from: nameOf(last.sender), fromEmail: fromAddr, date: Date.parse(last.date) || 0,
      lastFromMe: fromAddr === me, lastSnippet: last.snippet || '',
      replyTo: fromAddr, lastMessageId: last.id, // via the connector, a reply draft references the Gmail message id
      unread: (last.labelIds || []).includes('UNREAD'),
      recipientCount: to.length + cc.length, ccOnly: !to.includes(me) && cc.includes(me), broadcast: to.length + cc.length > BROADCAST_AT,
      selfOnly: [...everyone].every((x) => x === me), automated: AUTOMATED.test(fromAddr),
      complete: (t.messageCount || msgs.length) <= msgs.length,
    });
  }
  out.sort((a, b) => b.date - a.date);
  return { threads: out, estimate: Number(search && search.resultCountEstimate) || out.length };
}

// Which threads need a full read (more messages than the preview showed).
const needFull = (search) => ((search && search.threads) || []).filter((t) => (t.messageCount || 0) > (t.messages || []).length).map((t) => t.id);

async function listThreads() {
  const snap = store.read('gmail');
  if (!snap) throw new store.SnapshotMissing('no Gmail snapshot yet: run "node scripts/snapshot.js"');
  return { ...snap.data, snapshotAt: snap.at };
}

async function getThread(id) {
  const r = (await claude.fetchAll([{ key: 't', server: 'Gmail', tool: 'get_thread', args: { threadId: String(id), messageFormat: 'PLAIN_TEXT' } }], { label: 'gmail thread' })).get('t');
  if (!r.ok) throw new Error(r.error);
  const j = JSON.parse(r.result);
  return (j.messages || []).map((m) => ({ from: nameOf(m.sender), date: Date.parse(m.date) || 0, body: String(m.plaintextBody || m.plaintext_body || m.snippet || '').slice(0, 6000) }));
}

// Draft only (the connector's create_draft never sends). inReplyTo is the Gmail message id from build().
async function createDraft({ to, cc, subject, body, inReplyTo }) {
  const args = { to: [String(to).trim()], subject: String(subject || ''), body: String(body || '') };
  const ccs = String(cc || '').split(/[,\s]+/).filter(Boolean); if (ccs.length) args.cc = ccs;
  if (inReplyTo && /^[A-Za-z0-9]+$/.test(String(inReplyTo))) args.replyToMessageId = String(inReplyTo);
  const r = (await claude.fetchAll([{ key: 'd', server: 'Gmail', tool: 'create_draft', args }], { label: 'gmail draft' })).get('d');
  if (!r.ok) throw new Error(r.error);
  let j = {}; try { j = JSON.parse(r.result); } catch (_) {}
  if (!j.id) throw new Error(`create_draft returned no draft id: ${String(r.result).slice(0, 200)}`);
  return j.id;
}

module.exports = { build, needFull, searchSpec, threadSpec, listThreads, getThread, createDraft };
