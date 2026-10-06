// Batched email triage: ONE model call for the whole list (trap 11), JSON pulled out with a
// regex (trap 10), and fail-open to "untriaged" so a bad model reply never hides the inbox.
const { complete } = require('./llm');

const SYSTEM = `You triage Ilan Manassen's inbox (Senior Communications Manager at monday.com).
Return ONLY a JSON array, one object per thread: {"id","urgency":"high|med|low","action":"reply|decision|fyi|none","unreplied":true|false,"reason","proposedBody"}.
Rules:
- action "decision" when the real content is an approval, budget, go/no-go or commitment. Such threads get NO proposedBody (empty string): a decision is Ilan's, not a draft.
- action "reply" only when words are enough. proposedBody is a short draft in the language of the thread. Never invent facts, prices or commitments.
- unreplied is your guess; the server verifies it against the thread.
- VIPs raise urgency: Roy Segev, Eran Zinman, Or Elmaliah.`;

function extractJson(text) {
  const m = String(text || '').match(/\[[\s\S]*\]/);
  if (!m) return null;
  try { const a = JSON.parse(m[0]); return Array.isArray(a) ? a : null; } catch (_) { return null; }
}

const UNTRIAGED = { urgency: 'low', action: 'untriaged', unreplied: null, reason: '', proposedBody: '' };

async function triage(threads, llm = complete) {
  if (!threads.length) return { results: new Map(), ok: true };
  const compact = threads.slice(0, 30).map((t) => ({
    id: t.id, from: t.from, subject: t.subject, messages: t.messageCount, lastFromMe: t.lastFromMe, snippet: t.lastSnippet,
  }));
  let arr = null, error = null;
  try { arr = extractJson(await llm(JSON.stringify(compact), { system: SYSTEM })); if (!arr) error = 'model reply had no JSON array'; }
  catch (e) { error = e.message; }
  const byId = new Map((arr || []).filter((x) => x && x.id).map((x) => [String(x.id), x]));
  const results = new Map(threads.map((t) => {
    const r = byId.get(String(t.id));
    return [t.id, r ? { ...UNTRIAGED, ...r, proposedBody: r.action === 'decision' ? '' : r.proposedBody || '' } : { ...UNTRIAGED }];
  }));
  return { results, ok: !error, error };
}
// Server-side verdict. The model's `unreplied` is a guess (R-22); the thread decides.
//  - last message is mine            -> 'waiting' (the ball is with them, never "unreplied")
//  - action 'decision' (R-19)        -> 'decision' (Ilan's to make; no draft is offered)
//  - action 'reply', last not mine   -> 'reply'
function classify(thread, tri) {
  const t = tri || UNTRIAGED;
  let verdict;
  if (thread.automated || thread.selfOnly) verdict = 'automated';       // system mail and notes to myself are never "unreplied"
  else if (thread.lastFromMe) verdict = 'waiting';
  else if (thread.broadcast) verdict = 'fyi';                            // sent to a big list: not a conversation with me
  else if (t.action === 'decision') verdict = 'decision';
  else if (t.action === 'reply') verdict = thread.ccOnly ? 'fyi' : 'reply'; // copied, not addressed: no reply expected
  else if (t.action === 'untriaged') verdict = 'untriaged';
  else verdict = 'fyi';
  return { verdict, urgency: t.urgency, reason: t.reason, proposedBody: verdict === 'reply' ? t.proposedBody : '', unreplied: verdict === 'reply' || verdict === 'decision' };
}

module.exports = { triage, extractJson, classify, UNTRIAGED };
