#!/usr/bin/env node
// Builds and deploys an Ocana agent from a folder: `node scripts/ocana-agent.js <command> [dir] [--allow-todo] [--edition=<id>]`
//   build (default)  print the payload summary, write data/ocana/<agent>.json; never calls the API
//   create | update  POST / PATCH the agent; real call only with DRY_RUN=0
//   start | stop     lifecycle (stop is the kill switch); real call only with DRY_RUN=0
//   get <agentId> | snapshot <agentId> | packages [search]   read-only lookups
// Env: OCANA_API_URL, OCANA_TOKEN. The folder defaults to ocana/elevate-concierge.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const UPDATABLE = ['agentName', 'basePrompt', 'agentsMd', 'userMd', 'memoryMd']; // UpdateAgentRequest, minus agentImage
const CREATE_ONLY = ['ownerUserId', 'llmProvider', 'llmModel', 'fallbackProvider', 'fallbackModel', 'temperature', 'maxTokens', 'selectedPlugins', 'channels'];

// The edition whose `until` date (in its own time zone) has not passed; after the last one, the last one.
function activeEdition(editions, now = new Date()) {
  const day = (tz) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return editions.find((e) => day(e.tz) <= e.until) || editions[editions.length - 1];
}

function load(dir, { edition, now } = {}) {
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'agent.json'), 'utf8'));
  const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
  const kbDir = path.join(dir, spec.files.memoryKb);
  const md = (sub, keep) => fs.readdirSync(path.join(kbDir, sub)).filter((f) => f.endsWith('.md') && keep(f)).sort()
    .map((f) => fs.readFileSync(path.join(kbDir, sub, f), 'utf8').trim());
  const active = edition ? spec.editions.find((e) => e.id === edition) : activeEdition(spec.editions, now);
  if (!active) throw new Error(`unknown edition: ${edition}`);
  const kb = [
    ...md(active.id, (f) => !f.startsWith('_')),
    ...spec.editions.filter((e) => e !== active).flatMap((e) => md(e.id, (f) => f === '_summary.md')),
    ...md('common', () => true),
  ];
  return {
    spec, edition: active.id,
    basePrompt: read(spec.files.basePrompt),
    agentsMd: read(spec.files.agentsMd),
    userMd: read(spec.files.userMd),
    memoryMd: `# Elevate knowledge base\nActive edition: **${active.name}** (times in ${active.tz}). Other editions: summary only.\nApproved facts only. If something is not here or says TODO, you don't know it.\n\n${kb.join('\n\n---\n\n')}\n`,
  };
}

function buildCreate(a) {
  const body = { agentName: a.spec.agentName, basePrompt: a.basePrompt, agentsMd: a.agentsMd, userMd: a.userMd, memoryMd: a.memoryMd };
  for (const k of CREATE_ONLY) if (a.spec[k] !== undefined) body[k] = a.spec[k];
  return body;
}

function buildUpdate(a) {
  const full = buildCreate(a), body = {};
  for (const k of UPDATABLE) body[k] = full[k];
  return body;
}

// Placeholders left in the payload. Config TODOs (owner, plugins, channels) always block;
// text TODOs block unless --allow-todo (an internal pilot with gaps).
function todos(body) {
  const hits = (v) => (JSON.stringify(v ?? '').match(/TODO/g) || []).length;
  const config = CREATE_ONLY.filter((k) => hits(body[k]));
  const text = UPDATABLE.filter((k) => hits(body[k])).map((k) => `${k} (${hits(body[k])})`);
  return { config, text };
}

async function call(method, url, body) {
  const base = process.env.OCANA_API_URL, token = process.env.OCANA_TOKEN;
  if (!base || !token) throw new Error('OCANA_API_URL and OCANA_TOKEN must be set');
  const res = await fetch(base.replace(/\/$/, '') + url, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} → HTTP ${res.status}: ${text.slice(0, 500)}`);
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  const args = process.argv.slice(2).filter((x) => !x.startsWith('--'));
  const allowTodo = process.argv.includes('--allow-todo');
  const [cmd = 'build', arg] = args;
  const live = process.env.DRY_RUN === '0';
  const print = (x) => console.log(typeof x === 'string' ? x : JSON.stringify(x, null, 2));

  if (cmd === 'get') return print(await call('GET', `/api/v1/agents/${arg}`));
  if (cmd === 'snapshot') return print(await call('GET', `/api/v1/agents/${arg}/clone-snapshot`));
  if (cmd === 'packages') return print(await call('GET', `/api/v1/community/packages${arg ? `?search=${encodeURIComponent(arg)}` : ''}`));

  const dir = path.resolve(root, (['start', 'stop', 'create', 'update', 'build'].includes(cmd) && arg) || 'ocana/elevate-concierge');
  const flag = process.argv.find((x) => x.startsWith('--edition='));
  const a = load(dir, { edition: flag && flag.split('=')[1] }), id = a.spec.agentId;
  console.log(`edition: ${a.edition}${flag ? ' (forced)' : ' (from the clock)'}`);

  if (cmd === 'start' || cmd === 'stop') {
    if (!id) throw new Error('agent.json has no agentId yet: run create first');
    if (!live) return print(`[dry-run] would POST /api/v1/agents/${id}/${cmd}. Set DRY_RUN=0 to do it.`);
    return print(await call('POST', `/api/v1/agents/${id}/${cmd}`));
  }

  const body = cmd === 'update' ? buildUpdate(a) : buildCreate(a);
  const t = todos(body);
  for (const k of Object.keys(body)) if (typeof body[k] === 'string') console.log(`${k}: ${Buffer.byteLength(body[k])} bytes`);
  if (t.config.length) console.log(`BLOCKING: TODO left in ${t.config.join(', ')}`);
  if (t.text.length) console.log(`${allowTodo ? 'WARNING' : 'BLOCKING'}: TODO left in ${t.text.join(', ')}`);

  if (cmd === 'build') {
    const out = path.join(root, 'data', 'ocana', `${path.basename(dir)}.json`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(body, null, 2));
    return print(`payload written to ${path.relative(root, out)}`);
  }
  if (cmd !== 'create' && cmd !== 'update') throw new Error(`unknown command: ${cmd}`);
  const blocked = (cmd === 'create' && t.config.length) || (t.text.length && !allowTodo);
  if (blocked) { console.error('refusing to deploy with placeholders (see BLOCKING above)'); process.exit(1); }
  if (cmd === 'create' && id) throw new Error(`agent.json already has agentId ${id}: use update`);
  if (cmd === 'update' && !id) throw new Error('agent.json has no agentId yet: run create first');
  if (cmd === 'update') console.log(`note: PATCH cannot change ${CREATE_ONLY.join(', ')}; change those in the Ocana portal`);
  if (!live) return print(`[dry-run] would ${cmd} the agent. Set DRY_RUN=0 to do it.`);

  const res = cmd === 'create' ? await call('POST', '/api/v1/agents', body) : await call('PATCH', `/api/v1/agents/${id}`, body);
  if (cmd === 'create') {
    const newId = res?.agentId || res?.id || res?.agent?.id;
    if (!newId) throw new Error(`created, but no agent id in the response; set agentId in agent.json by hand: ${JSON.stringify(res).slice(0, 300)}`);
    a.spec.agentId = String(newId);
    fs.writeFileSync(path.join(dir, 'agent.json'), JSON.stringify(a.spec, null, 2) + '\n');
    print(`created ${newId}; saved to agent.json. It is not started: run start when ready.`);
  } else print(res);
}

if (require.main === module) main().catch((e) => { console.error(`FAILED: ${e.message}`); process.exit(1); });
module.exports = { load, activeEdition, buildCreate, buildUpdate, todos, UPDATABLE, CREATE_ONLY };
