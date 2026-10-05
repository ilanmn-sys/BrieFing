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
        const events = await google.listEvents(days, config.me.tz, today());
        return send(200, { today: today(), tz: config.me.tz, days, events });
      } catch (e) {
        const status = e instanceof NotConfigured ? 'not_configured' : 'error';
        return send(502, { status, error: e.message, retry: '/api/calendar' });
      }
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
        return send(200, { today: today(), tz: config.me.tz, dryRun: isDryRun(), config: { groups: config.groups, board: config.boards.projects }, ...t });
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
