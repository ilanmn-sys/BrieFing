// Shared helpers. today() is the single source of "today" (principle 5 / R-09).
const fs = require('fs');
const path = require('path');

// Load .env (KEY=VALUE per line) without overriding variables already set in the shell.
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch (_) { /* no .env is fine: connectors report "not configured" */ }

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

function today() {
  // YYYY-MM-DD in the configured timezone, from the system clock.
  return new Intl.DateTimeFormat('en-CA', { timeZone: config.me.tz }).format(new Date());
}

async function http(url, opts = {}, timeoutMs = 10000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctl.signal });
    const text = await res.text();
    let body = text;
    try { body = JSON.parse(text); } catch (_) { /* leave as text */ }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${String(text).slice(0, 200)}`);
    return body;
  } finally { clearTimeout(t); }
}

class NotConfigured extends Error {}

function need(name) {
  const v = process.env[name];
  if (!v) throw new NotConfigured(`missing env ${name}`);
  return v;
}

module.exports = { config, today, http, need, NotConfigured };
