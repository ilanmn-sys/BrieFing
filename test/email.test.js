const test = require('node:test');
const assert = require('node:assert');
const { triage, extractJson, classify } = require('../server/triage');
const { QUERY, buildMime } = require('../server/connectors/gmail');

const T = (id, o = {}) => ({ id, from: 'A', subject: 's', messageCount: 1, lastFromMe: false, lastSnippet: 'x', ...o });

test('extractJson pulls the array out of chatter and rejects junk', () => {
  assert.deepEqual(extractJson('Sure!\n[{"id":"1"}]\nthanks'), [{ id: '1' }]);
  assert.equal(extractJson('no json here'), null);
  assert.equal(extractJson('[not json]'), null);
});

test('one batched model call for the whole list', async () => {
  let calls = 0;
  const llm = async () => { calls++; return JSON.stringify([{ id: 'a', action: 'reply', urgency: 'high' }, { id: 'b', action: 'fyi' }]); };
  const r = await triage([T('a'), T('b'), T('c')], llm);
  assert.equal(calls, 1); assert.equal(r.ok, true);
  assert.equal(r.results.get('a').urgency, 'high');
  assert.equal(r.results.get('c').action, 'untriaged'); // model skipped it -> fail-open
});

test('model failure fails open: every thread stays visible as untriaged', async () => {
  const r = await triage([T('a'), T('b')], async () => { throw new Error('API down'); });
  assert.equal(r.ok, false); assert.match(r.error, /API down/);
  assert.equal([...r.results.values()].every((x) => x.action === 'untriaged'), true);
  const bad = await triage([T('a')], async () => 'garbage');
  assert.equal(bad.ok, false); assert.equal(bad.results.get('a').action, 'untriaged');
});

test('decision threads never carry a draft (R-19), even if the model wrote one', async () => {
  const llm = async () => JSON.stringify([{ id: 'a', action: 'decision', proposedBody: 'Approved!' }]);
  const r = await triage([T('a')], llm);
  assert.equal(r.results.get('a').proposedBody, '');
  assert.equal(classify(T('a'), r.results.get('a')).verdict, 'decision');
});

test('R-22: last message from me is never "unreplied", whatever the model guessed', () => {
  const c = classify(T('a', { lastFromMe: true }), { action: 'reply', unreplied: true, proposedBody: 'hi', urgency: 'high' });
  assert.equal(c.verdict, 'waiting'); assert.equal(c.unreplied, false); assert.equal(c.proposedBody, '');
});

test('reply verdict keeps the proposed body; fyi is not unreplied', () => {
  assert.equal(classify(T('a'), { action: 'reply', proposedBody: 'hi' }).proposedBody, 'hi');
  assert.equal(classify(T('a'), { action: 'fyi', unreplied: true }).unreplied, false);
});

test('calendar noise is filtered in the Gmail query itself', () => {
  for (const s of ['in:inbox', 'newer_than:7d', '-filename:ics', 'calendar-notification@google.com', '-subject:invitation', '-subject:"accepted:"']) assert.ok(QUERY.includes(s), s);
});

test('MIME: Hebrew subject is RFC2047-encoded, body base64 UTF-8, threading headers set', () => {
  const m = buildMime({ to: 'a@b.com', cc: 'c@d.com', subject: 'תשובה: בדיקה', body: 'שלום', inReplyTo: '<id@x>' });
  assert.match(m, /^To: a@b\.com/m); assert.match(m, /^Cc: c@d\.com/m);
  assert.match(m, /^Subject: =\?UTF-8\?B\?/m);
  assert.match(m, /^In-Reply-To: <id@x>/m); assert.match(m, /^References: <id@x>/m);
  assert.match(m, /charset=UTF-8/);
  assert.equal(Buffer.from(m.split('\r\n\r\n')[1], 'base64').toString('utf8'), 'שלום');
});

// ---- found on the real inbox: bulk mail, notes to self, broadcasts, cc-only ----
const { AUTOMATED, emails } = require('../server/connectors/gmail');

test('automated-sender detection: system mail yes, colleagues and contacts no', () => {
  for (const a of ['notifications@monday.ziphq.com', 'no_reply@monday.com', 'newsletter@techmeme.com', 'alerts@muckrack.com', 'noreply@github.com',
    'googlealerts-noreply@google.com', 'hello@mail.grammarly.com', 'help@sproutsocial.com', 'DoNotReply@hilantech.co.il', 'postmaster@microsoft.com']) assert.ok(AUTOMATED.test(a), a);
  for (const a of ['megan.kusch@muckrack.com', 'alicesi@monday.com', 'noamsa@monday.com', 'sharons@signaltours.com', 'povursarah@gmail.com', 'ore@monday.com']) assert.ok(!AUTOMATED.test(a), a);
});

test('emails() pulls addresses out of header text, including names and quotes', () => {
  assert.deepEqual(emails('"Cohen, Dana" <Dana@Example.com>, other@x.co.il'), ['dana@example.com', 'other@x.co.il']);
  assert.deepEqual(emails(''), []);
});

test('classify: automated and self-only threads are never reply/waiting; broadcasts and cc-only are FYI', () => {
  const tri = { action: 'reply', proposedBody: 'hi', urgency: 'high' };
  assert.equal(classify(T('a', { automated: true }), tri).verdict, 'automated');
  assert.equal(classify(T('a', { selfOnly: true, lastFromMe: true }), tri).verdict, 'automated');   // a note to myself is not "waiting on them"
  assert.equal(classify(T('a', { broadcast: true }), tri).verdict, 'fyi');
  assert.equal(classify(T('a', { broadcast: true }), { action: 'decision' }).verdict, 'fyi');
  const cc = classify(T('a', { ccOnly: true }), tri); assert.equal(cc.verdict, 'fyi'); assert.equal(cc.proposedBody, '');
  assert.equal(classify(T('a', { ccOnly: true }), { action: 'decision' }).verdict, 'decision'); // a decision in a cc'd thread still reaches me
  assert.equal(classify(T('a'), tri).verdict, 'reply');
});

test('listThreads: flags cc-only, broadcast, self-only and automated; reports the size estimate; follows the query', async () => {
  process.env.GOOGLE_CLIENT_ID = 'c'; process.env.GOOGLE_CLIENT_SECRET = 's'; process.env.GOOGLE_REFRESH_TOKEN = 'r';
  const ME = 'me@monday.com', real = global.fetch, urls = [];
  const msg = (from, to, cc, labels = ['INBOX']) => ({ internalDate: '1790000000000', snippet: 's', labelIds: labels, payload: { headers: [{ name: 'From', value: from }, { name: 'To', value: to }, { name: 'Cc', value: cc }, { name: 'Subject', value: 'subj' }, { name: 'Message-ID', value: '<m@x>' }] } });
  const big = Array.from({ length: 20 }, (_, i) => `p${i}@monday.com`).join(', ');
  const threads = { t1: [msg('Megan <megan@muckrack.com>', 'noam@monday.com', ME)], t2: [msg('boss@monday.com', big + ', ' + ME, '')], t3: [msg(ME, ME, '', ['SENT', 'INBOX'])], t4: [msg('notifications@monday.ziphq.com', ME, '')], t5: [msg('dana@monday.com', ME, '')] };
  const j = (o) => ({ ok: true, status: 200, text: async () => JSON.stringify(o) });
  global.fetch = async (url) => {
    const u = String(url); urls.push(u);
    if (u.includes('oauth2.googleapis.com')) return j({ access_token: 'tok' });
    if (u.endsWith('/profile')) return j({ emailAddress: ME });
    if (u.includes('/threads?')) return j({ threads: Object.keys(threads).map((id) => ({ id })), resultSizeEstimate: 201 });
    const id = u.match(/threads\/(t\d)/)[1]; return j({ id, messages: threads[id] });
  };
  try {
    const r = await require('../server/connectors/gmail').listThreads(50);
    const by = Object.fromEntries(r.threads.map((t) => [t.id, t]));
    assert.equal(r.estimate, 201);
    assert.equal(by.t1.ccOnly, true); assert.equal(by.t2.broadcast, true); assert.equal(by.t3.selfOnly, true);
    assert.equal(by.t4.automated, true); assert.equal(by.t5.ccOnly, false); assert.equal(by.t5.automated, false);
    assert.ok(urls.some((u) => u.includes('/threads?') && decodeURIComponent(u).includes('newer_than:7d')));
  } finally { global.fetch = real; }
});
