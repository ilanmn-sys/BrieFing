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
