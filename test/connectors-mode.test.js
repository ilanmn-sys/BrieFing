const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');

// Connectors mode for everything, with a fake `claude` that answers like the real connectors.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-'));
const root = path.join(__dirname, '..');
Object.assign(process.env, { DATA_MODE: 'connectors', SNAPSHOT_DIR: path.join(tmp, 'snap'), MCP_NAMES_FILE: path.join(tmp, 'mcp.json'), CLAUDE_BIN: path.join(__dirname, 'fixtures', 'fake-claude.js'),
  FAKE_RESPONDER: path.join(__dirname, 'fixtures', 'fake-responder.js'), FAKE_LOG: path.join(tmp, 'calls.log'), AGENTS_DATA_DIR: path.join(tmp, 'agents'), DECISIONS_FILE: path.join(tmp, 'd.json'), SNAPSHOT_AFTER_WRITE: '0' });
delete process.env.DRY_RUN;
const calls = () => { try { return fs.readFileSync(process.env.FAKE_LOG, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch (_) { return []; } };
const claude = require('../server/via/claude');
const mcpNames = require('../server/mcpNames');

test('parseStream reads tool calls and results from a real `claude -p` stream', () => {
  const p = claude.parseStream(fs.readFileSync(path.join(__dirname, 'fixtures', 'claude-stream-real.jsonl'), 'utf8'));
  assert.equal(p.calls.length, 1); assert.equal(p.calls[0].name, 'Bash'); assert.equal(p.calls[0].result, 'hello-snapshot'); assert.equal(p.ok, true); assert.equal(p.finalText, 'DONE');
});

test('mcpNames: logical tool names map to this machine\'s server names; run-agent uses the map', () => {
  mcpNames.save({ Gmail: 'claude_ai_Gmail', monday_com: 'monday_com' });
  assert.equal(mcpNames.mapToolName('mcp__Gmail__search_threads'), 'mcp__claude_ai_Gmail__search_threads');
  assert.equal(mcpNames.mapToolName('Bash(node x)'), 'Bash(node x)'); assert.equal(mcpNames.mapToolName('mcp__Slack__x'), 'mcp__Slack__x');
  assert.equal(mcpNames.sanitize('claude.ai Gmail'), 'claude_ai_Gmail');
  const stub = path.join(tmp, 'stub.js'), out = path.join(tmp, 'p.txt');
  fs.writeFileSync(stub, `#!/usr/bin/env node\nrequire('fs').writeFileSync(process.env.PROMPT_OUT, process.argv[5]);\nconsole.log('RESULT: {"delivery":"n/a","summary":"x"}');\n`); fs.chmodSync(stub, 0o755);
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-agent.js'), 'coverage-inbox-cycle', '--force', '--dry-run'], { env: { ...process.env, CLAUDE_BIN: stub, PROMPT_OUT: out }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(fs.readFileSync(out, 'utf8'), /mcp__claude_ai_Gmail__search_threads/);
  fs.unlinkSync(process.env.MCP_NAMES_FILE);
});

test('fetchAll: exact arguments are enforced; a deviating or missing call is an error, never silently accepted', async () => {
  const ok = await claude.fetchAll([{ key: 'a', server: 'Gmail', tool: 'search_threads', args: { query: 'x', pageSize: 5 } }]);
  assert.equal(ok.get('a').ok, true); assert.match(ok.get('a').result, /threads/);
  const resp = path.join(tmp, 'deviate.js');
  fs.writeFileSync(resp, `const base=require(${JSON.stringify(process.env.FAKE_RESPONDER)});module.exports={...base,mutate:(c)=>c.name.endsWith('create_draft')?{...c.input,to:['evil@x.com']}:c.name.endsWith('get_thread')?null:c.input};`);
  const old = process.env.FAKE_RESPONDER; process.env.FAKE_RESPONDER = resp;
  const r = await claude.fetchAll([{ key: 'd', server: 'Gmail', tool: 'create_draft', args: { to: ['dana@partner.com'], subject: 's', body: 'b' } }, { key: 'g', server: 'Gmail', tool: 'get_thread', args: { threadId: 't1' } }]);
  process.env.FAKE_RESPONDER = old;
  assert.equal(r.get('d').ok, false); assert.match(r.get('d').error, /was not made/);
  assert.equal(r.get('g').ok, false);
  const e = await claude.fetchAll([{ key: 'u', server: 'Gmail', tool: 'nope', args: {} }]);
  assert.equal(e.get('u').ok, false); assert.match(e.get('u').error, /unknown tool/);
});

test('snapshot: one job fills monday, Gmail, Calendar, Slack and Drive through the connectors', () => {
  const start = calls().length;
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'snapshot.js'), '--force'], { env: process.env, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const st = JSON.parse(fs.readFileSync(path.join(process.env.SNAPSHOT_DIR, 'status.json'), 'utf8')).sources;
  for (const s of ['monday', 'gmail', 'calendar', 'slack', 'drive']) assert.equal(st[s].ok, true, `${s}: ${st[s].error}`);
  assert.ok(calls().slice(start).every((c) => c.complete || !/send_message|create_draft|"query":"mutation/.test(JSON.stringify(c))), 'the snapshot never writes');
  assert.match(r.stdout, /round 1/);
});

test('reads after the snapshot come from the cache: no claude call on page load', async () => {
  const before = calls().length;
  const tasks = await require('../server/tasksApi').load();
  assert.equal(tasks.items.length, 2); assert.equal(tasks.items[0].name, 'Send the quote to Dana');
  const email = await require('../server/emailApi').load();
  const dana = email.threads.find((t) => t.id === 't1');
  assert.equal(dana.verdict, 'decision', 'triage came from the cached completion'); assert.equal(email.threads.find((t) => t.id === 't2').verdict, 'automated');
  const cal = await require('../server/connectors/google').listEvents(4, 'Asia/Jerusalem', require('../server/lib').today());
  assert.equal(cal.events.length, 1); assert.equal(cal.declinedHidden, 1);
  const sl = await require('../server/slackApi').load();
  assert.equal(sl.dms.length, 1); assert.equal(sl.dms[0].who, 'Dana Cohen'); assert.equal(sl.source, 'connectors');
  assert.equal(calls().length, before, 'page loads made no claude call');
});

test('health in connectors mode reports the snapshot age; a missing snapshot reads as not configured', async () => {
  const { health } = require('../server/index');
  const h = await health();
  for (const c of h.connectors) { assert.equal(c.status, 'ok', `${c.name}: ${c.error}`); assert.match(c.detail, /via Claude Code connectors; snapshot just now/); }
  const store = require('../server/via/store');
  const keep = process.env.SNAPSHOT_DIR; process.env.SNAPSHOT_DIR = path.join(tmp, 'empty');
  const h2 = await health('monday'); process.env.SNAPSHOT_DIR = keep;
  assert.equal(h2.connectors[0].status, 'not_configured'); assert.match(h2.connectors[0].error, /node scripts\/snapshot\.js/);
  assert.throws(() => store.health('monday', Date.now() + 3600000), /old/);
});

test('writes run live through the connectors: done-sync (monday + Pepper), a Gmail draft, a Slack DM', async () => {
  process.env.DRY_RUN = '0';
  try {
    const before = calls().length;
    const r = await require('../server/done').doneSync({ id: '1234567890', name: 'Send the quote to Dana' });
    assert.equal(r.board, 'ok'); assert.equal(r.pepper, 'ok');
    const made = calls().slice(before).filter((c) => c.name);
    assert.ok(made.some((c) => c.name.endsWith('all_monday_api') && /^mutation/.test(c.input.query) && JSON.parse(c.input.variables).i === '1234567890'));
    assert.ok(made.some((c) => c.name.endsWith('slack_send_message') && c.input.channel_id === 'U0BBLHZH4DC' && /משימה הושלמה/.test(c.input.message)), 'Pepper is DMed by user id');
    const id = await require('../server/connectors/gmail').createDraft({ to: 'dana@partner.com', subject: 'Re: Quote approval', body: 'Approved.', inReplyTo: 'm1' });
    assert.equal(id, 'r-draft-1');
    assert.ok(calls().some((c) => c.name && c.name.endsWith('create_draft') && c.input.replyToMessageId === 'm1' && c.input.to[0] === 'dana@partner.com'));
    await assert.rejects(require('../server/via/slack').sendDm('D0BCAGJV0AD', 'x'), /user id/);
  } finally { delete process.env.DRY_RUN; }
});

test('a live monday read that is not cached is fetched once, then served from the cache', async () => {
  const via = require('../server/via/monday');
  const q = 'query($ids:[ID!]){ items(ids:$ids){ id updates(limit:3){ text_body } } }';
  const before = calls().length;
  const a = await via.gql(q, { ids: ['1000002'] });
  const b = await via.gql(q, { ids: ['1000002'] });
  assert.deepEqual(a, b); assert.match(JSON.stringify(a), /בעל אחריות/);
  assert.ok(calls().length - before <= 1, 'fetched at most once');
});
