#!/usr/bin/env node
// Generates launchd plists for the agent fleet, the dashboard server and the learning-log sync.
//   node scripts/gen-launchd.js [--out DIR] [--only ID] [--allow-tz-mismatch]
// Writes files only. Install them with scripts/launchd.sh. The agents run `scripts/run-agent.js`, which skips a
// disabled agent, so installing every plist is safe: nothing runs until you enable the agent in the dashboard.
const fs = require('fs');
const os = require('os');
const path = require('path');
const agents = require('../server/agents');
const { buildAll } = require('../server/launchd');
const root = path.join(__dirname, '..');

const a = process.argv.slice(2), get = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const out = path.resolve(get('--out') || path.join(root, 'launchd', 'out'));
const only = get('--only');
const home = process.env.HOME || os.homedir();
const envPath = [path.dirname(process.execPath), '/opt/homebrew/bin', '/usr/local/bin', `${home}/.local/bin`, `${home}/.claude/local`, '/usr/bin', '/bin', '/usr/sbin', '/sbin'].filter((v, i, x) => x.indexOf(v) === i).join(':');
const systemTz = process.env.GEN_SYSTEM_TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;

try {
  const built = buildAll({ agents: agents.registry(), root, nodePath: process.execPath, envPath, home, claudeBin: process.env.CLAUDE_BIN, systemTz, allowTzMismatch: a.includes('--allow-tz-mismatch') });
  const files = only ? built.files.filter((f) => f.id === only) : built.files;
  if (only && !files.length) throw new Error(`no plist for "${only}"`);
  fs.mkdirSync(out, { recursive: true });
  if (!only) for (const f of fs.readdirSync(out)) if (f.startsWith('com.ilan.') && f.endsWith('.plist')) fs.unlinkSync(path.join(out, f)); // drop plists of removed agents
  for (const f of files) fs.writeFileSync(path.join(out, f.name), f.body);
  console.log(`wrote ${files.length} plists to ${out}`);
  for (const s of built.skipped) console.log(`skipped ${s.id}: ${s.reason}`);
  for (const w of built.warnings) console.warn('WARNING: ' + w);
  console.log(`node: ${process.execPath}\nclaude: ${process.env.CLAUDE_BIN || '(found on PATH at run time)'}\nNext: scripts/launchd.sh install`);
} catch (e) { console.error('gen-launchd: ' + e.message); process.exit(1); }
