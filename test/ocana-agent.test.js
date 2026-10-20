const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { load, activeEdition, buildCreate, buildUpdate, todos, CREATE_ONLY } = require('../scripts/ocana-agent');

const DIR = path.join(__dirname, '..', 'ocana', 'elevate-concierge');
const a = load(DIR, { edition: 'nyc' });

test('the active edition follows the clock in the edition time zone', () => {
  const eds = a.spec.editions;
  assert.equal(activeEdition(eds, new Date('2026-10-20T12:00:00Z')).id, 'nyc');
  assert.equal(activeEdition(eds, new Date('2026-10-30T03:00:00Z')).id, 'nyc'); // still 29 Oct, 23:00 in New York
  assert.equal(activeEdition(eds, new Date('2026-10-30T05:00:00Z')).id, 'london');
  assert.equal(activeEdition(eds, new Date('2026-12-15T12:00:00Z')).id, 'london'); // after the last one, stay on it
});

test('NYC build: full NYC files, London summary only, common files', () => {
  const m = a.memoryMd;
  for (const h of ['Active edition: **Elevate \'26 New York**', '# Agenda: New York', '# Venue & logistics: New York', '# FAQ: New York', '# Elevate EMEA London: summary', '# Guest list']) assert.ok(m.includes(h), h);
  assert.ok(!m.includes('# Agenda: London') && !m.includes('(event over)'));
  assert.ok(m.indexOf('# Event overview: New York') < m.indexOf('# Guest list'));
});

test('London build: full London files, NYC summary only', () => {
  const m = load(DIR, { edition: 'london' }).memoryMd;
  for (const h of ['# Agenda: London', '# Elevate \'26 New York: summary (event over)', '# Guest list']) assert.ok(m.includes(h), h);
  assert.ok(!m.includes('# Agenda: New York'));
  assert.throws(() => load(DIR, { edition: 'paris' }), /unknown edition/);
});

test('update payload sends only fields UpdateAgent accepts', () => {
  const body = buildUpdate(a);
  for (const k of CREATE_ONLY) assert.equal(body[k], undefined, k);
  assert.deepEqual(Object.keys(body).sort(), ['agentName', 'agentsMd', 'basePrompt', 'memoryMd', 'userMd']);
});

test('placeholders are reported: config ones separately from text ones', () => {
  const t = todos(buildCreate(a));
  assert.ok(t.config.includes('channels') && t.config.includes('selectedPlugins'));
  assert.ok(t.text.some((x) => x.startsWith('memoryMd')));
  const clean = { agentName: 'x', basePrompt: 'ok', channels: [{ channelType: 'whatsapp', config: { n: 1 } }] };
  assert.deepEqual(todos(clean), { config: [], text: [] });
});

test('the prompt keeps the guardrails that make the external carve-out safe', () => {
  const p = a.basePrompt.toLowerCase();
  for (const s of ['system clock', 'embargoed', 'ai assistant', 'never guess', 'human', 'active edition']) assert.ok(p.includes(s), s);
});
