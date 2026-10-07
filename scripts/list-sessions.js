#!/usr/bin/env node
// Lists Claude Code sessions (from the local transcripts) that log-claude-work-to-board has not logged yet.
//   node scripts/list-sessions.js [--since ISO] [--max N]        -> JSON on stdout
//   node scripts/list-sessions.js --mark <id> [--lines N] [--note matched|unmatched|skipped]
//   node scripts/list-sessions.js --remote-ledger                 -> what was logged of cloud sessions (JSON)
//   node scripts/list-sessions.js --mark-remote <session_id> --last <event_id> [--note ...]
// Only what the person typed and what Claude said is extracted: never tool results (web pages, mail, board text).
// Sessions started by the scheduled agents themselves (first prompt "Today is ...") are skipped.
// Ledger: data/agents/log-claude-work.ledger.json (override LEDGER_FILE). Transcripts: ~/.claude/projects (override CLAUDE_PROJECTS_DIR).
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const projectsDir = () => process.env.CLAUDE_PROJECTS_DIR || path.join(os.homedir(), '.claude', 'projects');
const ledgerFile = () => process.env.LEDGER_FILE || path.join(process.env.AGENTS_DATA_DIR || path.join(root, 'data', 'agents'), 'log-claude-work.ledger.json');
const readLedger = () => { try { return JSON.parse(fs.readFileSync(ledgerFile(), 'utf8')); } catch (_) { return {}; } };
const writeLedger = (l) => { fs.mkdirSync(path.dirname(ledgerFile()), { recursive: true }); const t = ledgerFile() + '.tmp'; fs.writeFileSync(t, JSON.stringify(l, null, 2)); fs.renameSync(t, ledgerFile()); };

const SECRET = /\b(?:xox[abprs]-[\w-]{10,}|sk-ant-[\w-]{10,}|sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AIza[\w-]{30,}|eyJ[\w-]{20,}\.[\w-]{10,}\.[\w-]{10,})\b|(?:bearer|token|secret|password|api[_-]?key)\s*[:=]\s*\S+/gi;
const redact = (s) => String(s).replace(SECRET, '[redacted]');
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const NOISE = /^<(command-|system-reminder|local-command|user-prompt-submit-hook)/;

function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.filter((b) => b && b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n');
}

function parseSession(file, fromLine = 0) {
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  const s = { id: path.basename(file, '.jsonl'), lines: lines.length, cwd: null, branch: null, start: null, end: null, prompts: [], lastAssistant: '', tools: {}, files: new Set(), firstPrompt: null };
  lines.forEach((ln, i) => {
    let e; try { e = JSON.parse(ln); } catch (_) { return; }
    if (e.sessionId && /^[\w-]+$/.test(e.sessionId)) s.id = e.sessionId;
    if (e.cwd && !s.cwd) s.cwd = e.cwd;
    if (e.gitBranch && !s.branch) s.branch = e.gitBranch;
    if (e.isSidechain) return;
    if (e.type === 'user' && !e.isMeta) {
      const t = textOf(e.message && e.message.content).trim();
      if (t && !NOISE.test(t) && s.firstPrompt === null) s.firstPrompt = t;
      if (i < fromLine) return;
      if (t && !NOISE.test(t)) s.prompts.push(clip(redact(t), 600));
    } else if (e.type === 'assistant' && i >= fromLine) {
      const c = e.message && e.message.content;
      const t = textOf(c).trim();
      if (t) s.lastAssistant = clip(redact(t), 1500);
      if (Array.isArray(c)) for (const b of c) if (b && b.type === 'tool_use') {
        s.tools[b.name] = (s.tools[b.name] || 0) + 1;
        const fp = b.input && (b.input.file_path || b.input.path);
        if (fp && /^(Edit|Write|NotebookEdit)$/.test(b.name)) s.files.add(String(fp));
      }
    }
    if (i >= fromLine && e.timestamp) { if (!s.start) s.start = e.timestamp; s.end = e.timestamp; }
  });
  return s;
}

function* transcripts(dir) {
  if (!fs.existsSync(dir)) return;
  for (const p of fs.readdirSync(dir)) {
    const pd = path.join(dir, p);
    let st; try { st = fs.statSync(pd); } catch (_) { continue; }
    if (!st.isDirectory()) continue;
    for (const f of fs.readdirSync(pd)) if (f.endsWith('.jsonl')) { const full = path.join(pd, f); yield { file: full, mtime: fs.statSync(full).mtimeMs }; }
  }
}

function list({ since, max = 15, now = Date.now() } = {}) {
  const dir = projectsDir(), ledger = readLedger();
  const floor = since ? Date.parse(since) : now - 48 * 3600e3;
  if (Number.isNaN(floor)) throw new Error('bad --since');
  const out = []; let skippedAgents = 0, unreadable = 0;
  for (const { file, mtime } of transcripts(dir)) {
    if (mtime < floor) continue;
    let s; const id0 = path.basename(file, '.jsonl'), seen = ledger[id0];
    if (seen && seen.mtime >= mtime) continue;
    try { s = parseSession(file, seen ? seen.lines : 0); } catch (_) { unreadable++; continue; }
    if (s.firstPrompt && /^Today is \d{4}-\d{2}-\d{2}/.test(s.firstPrompt)) { skippedAgents++; continue; }
    if (!s.prompts.length && !s.lastAssistant) continue;
    out.push({ id: s.id, continued: Boolean(seen), cwd: s.cwd, branch: s.branch, start: s.start, end: s.end, lines: s.lines, mtime: new Date(mtime).toISOString(),
      prompts: s.prompts.slice(0, 12), promptCount: s.prompts.length, lastAssistant: s.lastAssistant, tools: s.tools, filesEdited: [...s.files].slice(0, 20), _file: id0 });
  }
  out.sort((a, b) => String(a.end).localeCompare(String(b.end)));
  return { generatedAt: new Date(now).toISOString(), transcriptsDir: dir, found: out.length, skippedAgentRuns: skippedAgents, unreadable, truncated: out.length > max, sessions: out.slice(0, max).map(({ _file, ...x }) => x) };
}

function mark(id, { lines, note = 'matched' } = {}) {
  if (!/^[\w-]+$/.test(id)) throw new Error('bad session id');
  let file = null;
  for (const t of transcripts(projectsDir())) if (path.basename(t.file, '.jsonl') === id) file = t;
  if (!file) throw new Error('no transcript for ' + id);
  const l = readLedger();
  l[id] = { lines: lines ?? fs.readFileSync(file.file, 'utf8').split('\n').filter(Boolean).length, mtime: file.mtime, note, loggedAt: new Date().toISOString() };
  writeLedger(l);
  return l[id];
}

// Cloud sessions are read by the agent through the claude-code-remote MCP tools; only their ledger lives here.
const REMOTE_ID = /^session_[A-Za-z0-9]+$/, EVENT_ID = /^[A-Za-z0-9_-]{1,80}$/;
function remoteLedger() { const l = readLedger(); return Object.fromEntries(Object.entries(l).filter(([k]) => k.startsWith('remote:')).map(([k, v]) => [k.slice(7), v])); }
function markRemote(id, { last, note = 'matched' } = {}) {
  if (!REMOTE_ID.test(String(id))) throw new Error('bad cloud session id');
  if (!last || !EVENT_ID.test(String(last))) throw new Error('--last needs the id of the last event logged');
  const l = readLedger(); l['remote:' + id] = { last: String(last), note, loggedAt: new Date().toISOString() }; writeLedger(l); return l['remote:' + id];
}

module.exports = { list, mark, parseSession, remoteLedger, markRemote };

if (require.main === module) {
  const a = process.argv.slice(2), get = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  try {
    if (a.includes('--remote-ledger')) console.log(JSON.stringify(remoteLedger(), null, 2));
    else if (a.includes('--mark-remote')) console.log(JSON.stringify(markRemote(get('--mark-remote'), { last: get('--last'), note: get('--note') })));
    else if (a.includes('--mark')) console.log(JSON.stringify(mark(get('--mark'), { lines: get('--lines') ? Number(get('--lines')) : undefined, note: get('--note') })));
    else console.log(JSON.stringify(list({ since: get('--since'), max: get('--max') ? Number(get('--max')) : 15 }), null, 2));
  } catch (e) { console.error('list-sessions: ' + e.message); process.exit(1); }
}
