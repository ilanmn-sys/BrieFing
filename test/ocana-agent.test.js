const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { load, buildCreate, buildUpdate, todos, CREATE_ONLY } = require('../scripts/ocana-agent');

const a = load(path.join(__dirname, '..', 'ocana', 'elevate-concierge'));

test('memoryMd carries every knowledge-base file, in order', () => {
  const m = a.memoryMd;
  for (const h of ['# Event overview', '# Agenda', '# Venue & logistics', '# FAQ', '# Guest list']) assert.ok(m.includes(h), h);
  assert.ok(m.indexOf('# Event overview') < m.indexOf('# Guest list'));
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
  for (const s of ['system clock', 'embargoed', 'ai assistant', 'never guess', 'human']) assert.ok(p.includes(s), s);
});
