// Local proxy for the Command Center. Zero dependencies. Run: node server/index.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { config, today, NotConfigured } = require('./lib');
const monday = require('./connectors/monday');
const google = require('./connectors/google');
const slack = require('./connectors/slack');
const drive = require('./connectors/drive');
const { doneSync, isDryRun } = require('./done');
const gmail = require('./connectors/gmail');
const { triage, classify } = require('./triage');
const llm = require('./llm');
const slackApi = require('./slackApi');
const requests = require('./requestsApi');
const decisions = require('./decisionsApi');
const agents = require('./agents');
const boardHealth = require('./healthLogic');
const { spawn } = require('child_process');

const CHECKS = {
  monday: monday.health,
  gmail: google.gmailHealth,
  calendar: google.calendarHealth,
  slack: slack.health,
  drive: drive.health,
};

// One failing connector never takes down the rest (principle 4: degrade loudly).
async function runCheck(name, fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    return { name, status: 'ok', detail, ms: Date.now() - t0 };
  } catch (e) {
    const status = e instanceof NotConfigured ? 'not_configured' : 'error';
    return { name, status, error: e.message, retry: `/health/${name}`, ms: Date.now() - t0 };
  }
}

async function health(only) {
  const names = only ? [only] : Object.keys(CHECKS);
  const results = await Promise.all(names.map((n) => runCheck(n, CHECKS[n])));
  return { today: today(), tz: config.me.tz, checked_at: new Date().toISOString(), connectors: results };
}

const server = http.createServer(async (req, res) => {
  const send = (code, obj, type = 'application/json') => {
    res.writeHead(code, { 'Content-Type': type });
    res.end(type === 'application/json' ? JSON.stringify(obj, null, 2) : obj);
  };
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/health') return send(200, await health());
    if (url.pathname === '/api/calendar') {
      const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '4', 10), 1), 14);
      try {
        const cal = await google.listEvents(days, config.me.tz, today());
        return send(200, { today: today(), tz: config.me.tz, days, ...cal });
      } catch (e) {
        const status = e instanceof NotConfigured ? 'not_configured' : 'error';
        return send(502, { status, error: e.message, retry: '/api/calendar' });
      }
    }
    // ---- Agents (registry, health, enable toggle, Run now) ----
    if (url.pathname.startsWith('/api/agents')) {
      try {
        if (req.method === 'GET' && url.pathname === '/api/agents') return send(200, { now: Date.now(), tz: config.me.tz, dryRun: isDryRun(), agents: agents.list() });
        if (req.method !== 'POST') return send(405, { error: 'GET or POST only' });
        const origin = req.headers.origin;
        if (origin && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) return send(403, { error: 'bad origin' });
        let raw = ''; for await (const c of req) { raw += c; if (raw.length > 5000) return send(413, { error: 'too large' }); }
        const b = JSON.parse(raw || '{}');
        if (url.pathname === '/api/agents/toggle') return send(200, agents.setEnabled(String(b.id), !!b.enabled));
        if (url.pathname === '/api/agents/run') {
          const a = agents.find(String(b.id)); // validated against the registry; no shell, fixed argv
          if (agents.isRunning(a.id, Date.now())) return send(409, { error: 'already running' });
          const args = ['scripts/run-agent.js', a.id, '--force', ...(isDryRun() ? ['--dry-run'] : [])];
          spawn(process.execPath, args, { cwd: agents.root, detached: true, stdio: 'ignore' }).unref();
          return send(202, { started: true, dryRun: isDryRun() });
        }
        return send(404, { error: 'not found' });
      } catch (e) { return send(e.code || 500, { error: e.message }); }
    }
    // ---- Decisions (never drafts; board-sourced outcomes are posted on the item) ----
    if (url.pathname.startsWith('/api/decisions')) {
      try {
        if (req.method === 'GET' && url.pathname === '/api/decisions') return send(200, await decisions.load((url.searchParams.get('emails') || '').split('|').filter(Boolean)));
        if (req.method !== 'POST' || url.pathname !== '/api/decisions/resolve') return send(405, { error: 'GET /api/decisions or POST /api/decisions/resolve only' });
        const origin = req.headers.origin;
        if (origin && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) return send(403, { error: 'bad origin' });
        let raw = ''; for await (const c of req) { raw += c; if (raw.length > 20000) return send(413, { error: 'too large' }); }
        return send(200, await decisions.resolve(JSON.parse(raw || '{}')));
      } catch (e) { return send(e.code || (e instanceof NotConfigured ? 503 : 502), { status: e instanceof NotConfigured ? 'not_configured' : 'error', error: e.message }); }
    }
    // ---- Requests (Switchboard board; writes are dry-run unless DRY_RUN=0) ----
    if (url.pathname.startsWith('/api/requests')) {
      const fail = (e) => send(e.code || (e instanceof NotConfigured ? 503 : 502), { status: e instanceof NotConfigured ? 'not_configured' : 'error', error: e.message });
      try {
        if (req.method === 'GET' && url.pathname === '/api/requests') return send(200, await requests.load());
        if (req.method !== 'POST') return send(405, { error: 'GET /api/requests or POST only' });
        const origin = req.headers.origin;
        if (origin && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) return send(403, { error: 'bad origin' });
        let raw = ''; for await (const c of req) { raw += c; if (raw.length > 20000) return send(413, { error: 'too large' }); }
        const b = JSON.parse(raw || '{}');
        if (url.pathname === '/api/requests/update') return send(200, await requests.update(b.id, b.text));
        if (url.pathname === '/api/requests/status') return send(200, await requests.status(b.id, b.label));
        return send(404, { error: 'not found' });
      } catch (e) { return fail(e); }
    }
    // ---- Slack (reads; sends only on explicit click and only with DRY_RUN=0) ----
    if (url.pathname.startsWith('/api/slack')) {
      const fail = (e) => send(e.code || (e instanceof NotConfigured ? 503 : 502), { status: e instanceof NotConfigured ? 'not_configured' : 'error', error: e.message });
      try {
        if (req.method === 'GET') {
          if (url.pathname === '/api/slack') return send(200, await slackApi.load());
          if (url.pathname === '/api/slack/summary') return send(200, await slackApi.summarize(url.searchParams.get('channel') || ''));
          if (url.pathname === '/api/slack/pepper') return send(200, { latest: await slackApi.latestFromPepper() });
          return send(404, { error: 'not found' });
        }
        if (req.method !== 'POST') return send(405, { error: 'GET or POST only' });
        const origin = req.headers.origin;
        if (origin && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) return send(403, { error: 'bad origin' });
        let raw = ''; for await (const c of req) { raw += c; if (raw.length > 20000) return send(413, { error: 'too large' }); }
        const b = JSON.parse(raw || '{}');
        if (url.pathname === '/api/slack/draft') return send(200, await slackApi.draftReply(String(b.channel || '')));
        if (url.pathname === '/api/slack/send') return send(200, await slackApi.send(String(b.userId || ''), b.text));
        if (url.pathname === '/api/slack/pepper/ask') return send(200, await slackApi.askPepper(b.text));
        return send(404, { error: 'not found' });
      } catch (e) { return fail(e); }
    }
    // ---- Email (drafts only: nothing here can send) ----
    if (url.pathname === '/api/email') {
      try {
        const threads = await gmail.listThreads(30);
        const tri = await triage(threads);
        const out = threads.map((t) => ({ ...t, ...classify(t, tri.results.get(t.id)) }));
        console.log(`email loaded: ${out.length} threads, triage ${tri.ok ? 'ok' : 'FAILED (' + tri.error + ')'}`);
        return send(200, { threads: out, triageOk: tri.ok, triageError: tri.error || null, dryRun: isDryRun() });
      } catch (e) { return send(e instanceof NotConfigured ? 503 : 502, { status: e instanceof NotConfigured ? 'not_configured' : 'error', error: e.message }); }
    }
    if (url.pathname === '/api/email/thread') {
      try { return send(200, { messages: await gmail.getThread(url.searchParams.get('id') || '') }); }
      catch (e) { return send(e instanceof NotConfigured ? 503 : 502, { error: e.message }); }
    }
    if (url.pathname === '/api/email/draft' || url.pathname === '/api/email/revise') {
      if (req.method !== 'POST') return send(405, { error: 'POST only' });
      const origin = req.headers.origin;
      if (origin && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) return send(403, { error: 'bad origin' });
      let raw = ''; for await (const c of req) { raw += c; if (raw.length > 100000) return send(413, { error: 'too large' }); }
      try {
        const b = JSON.parse(raw || '{}');
        if (url.pathname === '/api/email/revise') {
          const text = await llm.complete(`Revise this email draft per the instruction. Return ONLY the revised body, same language.\n\nInstruction: ${String(b.prompt || '').slice(0, 1000)}\n\nDraft:\n${String(b.body || '')}`);
          return send(200, { body: text.trim() });
        }
        if (!/^[^\s@,]+@[^\s@,]+$/.test(String(b.to || '').trim()) || !String(b.body || '').trim()) return send(400, { error: 'a valid To address and a body are required' });
        if (isDryRun()) return send(200, { dryRun: true, would: `gmail: create DRAFT to ${b.to} re "${b.subject}" (not sent)` });
        const id = await gmail.createDraft(b);
        console.log(`draft created ${id}`);
        return send(200, { dryRun: false, draftId: id });
      } catch (e) { return send(e instanceof NotConfigured ? 503 : 502, { error: e.message }); }
    }
    if (url.pathname === '/api/done') {
      if (req.method !== 'POST') return send(405, { error: 'POST only' });
      // Local-only server: refuse cross-site requests (CSRF) that could trigger board writes.
      const origin = req.headers.origin;
      if (origin && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) return send(403, { error: 'bad origin' });
      let raw = ''; for await (const c of req) { raw += c; if (raw.length > 10000) return send(413, { error: 'too large' }); }
      try {
        const body = JSON.parse(raw || '{}');
        const r = await doneSync(body);
        console.log(`done-sync item=${body.id} dry=${r.dryRun} board=${r.board} pepper=${r.pepper}`);
        return send(r.board === 'failed' || r.pepper === 'failed' ? 502 : 200, r);
      } catch (e) {
        return send(e.code || (e instanceof NotConfigured ? 503 : 500), { error: e.message, notConfigured: e instanceof NotConfigured });
      }
    }
    if (url.pathname === '/api/tasks') {
      try {
        const t = await monday.listTasks();
        console.log(`tasks loaded: ${t.items.length} items, ${t.pages} pages${t.truncated ? ' (TRUNCATED)' : ''}`);
        // Board health rides on the same read. A failure here must never hide the task list.
        let healthRules = null, healthError = null;
        try {
          const g = config.groups;
          const blocked = t.items.filter((i) => boardHealth.isBlocked(i, g) && i.status !== 'Done' && i.group !== g.canonical.completed.id).map((i) => i.id);
          const holderText = blocked.length ? await monday.updateTexts(blocked) : new Map();
          healthRules = boardHealth.health(t.items, { groups: g, today: today(), agentNames: agents.registry().flatMap((a) => [a.id.replace(/-/g, ' '), a.name]), holderText });
        } catch (e) { healthError = e.message; console.error('board health failed', e); }
        return send(200, { today: today(), tz: config.me.tz, dryRun: isDryRun(), config: { groups: config.groups, board: config.boards.projects }, health: healthRules, healthError, ...t });
      } catch (e) {
        const status = e instanceof NotConfigured ? 'not_configured' : 'error';
        return send(502, { status, error: e.message, retry: '/api/tasks' });
      }
    }
    const m = url.pathname.match(/^\/health\/(\w+)$/);
    if (m) {
      if (!CHECKS[m[1]]) return send(404, { error: 'unknown connector' });
      return send(200, await health(m[1]));
    }
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const f = path.join(__dirname, '..', 'web', 'index.html');
      if (fs.existsSync(f)) return send(200, fs.readFileSync(f, 'utf8'), 'text/html; charset=utf-8');
      return send(200, 'Dashboard not built yet. See /health', 'text/plain');
    }
    send(404, { error: 'not found' });
  } catch (e) {
    console.error('unhandled', e); // log uncaught errors ourselves (trap 19)
    send(500, { error: e.message });
  }
});

const port = process.env.PORT || 3737;
if (require.main === module) {
  server.listen(port, '127.0.0.1', () => console.log(`command-center listening on http://127.0.0.1:${port} (today=${today()})`));
}
module.exports = { health, server };
