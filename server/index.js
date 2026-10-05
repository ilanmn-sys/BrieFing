// Local proxy for the Command Center. Zero dependencies. Run: node server/index.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { config, today, NotConfigured } = require('./lib');
const monday = require('./connectors/monday');
const google = require('./connectors/google');
const slack = require('./connectors/slack');
const drive = require('./connectors/drive');

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
    if (url.pathname === '/api/tasks') {
      try {
        const t = await monday.listTasks();
        console.log(`tasks loaded: ${t.items.length} items, ${t.pages} pages${t.truncated ? ' (TRUNCATED)' : ''}`);
        return send(200, { today: today(), tz: config.me.tz, config: { groups: config.groups, board: config.boards.projects }, ...t });
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
