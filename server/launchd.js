// launchd plist generation (pure). Cron -> StartCalendarInterval, one plist per agent plus the server and the
// learning-log sync. launchd has no timezone setting: it fires in the Mac's local time, so the generator refuses
// to run when that differs from the schedule's timezone (a silent 1-2 hour drift would be worse than an error).
const PREFIX = 'com.ilan.cc';
const MAX_INTERVALS = 200;

function expand(str, min, max, name) {
  const out = new Set();
  for (const part of String(str).split(',')) {
    const [range, stepStr] = part.split('/');
    const step = stepStr ? Number(stepStr) : 1;
    let lo, hi;
    if (range === '*') { lo = min; hi = max; }
    else if (range.includes('-')) { [lo, hi] = range.split('-').map(Number); }
    else { lo = Number(range); hi = stepStr ? max : lo; }
    if (![lo, hi, step].every(Number.isInteger) || lo < min || hi > max || lo > hi || step < 1) throw new Error(`bad cron ${name} field "${str}"`);
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return [...out].sort((a, b) => a - b);
}

// Returns the list of StartCalendarInterval dicts for a 5-field cron expression.
function cronToIntervals(expr) {
  const f = String(expr).trim().split(/\s+/);
  if (f.length !== 5) throw new Error(`cron needs 5 fields: "${expr}"`);
  const domStar = f[2] === '*', dowStar = f[4] === '*';
  if (!domStar && !dowStar) throw new Error(`cron "${expr}" restricts both day-of-month and day-of-week: cron ORs them, launchd cannot`);
  const minutes = expand(f[0], 0, 59, 'minute'), hours = expand(f[1], 0, 23, 'hour');
  const doms = domStar ? [null] : expand(f[2], 1, 31, 'day-of-month');
  const months = f[3] === '*' ? [null] : expand(f[3], 1, 12, 'month');
  const dows = dowStar ? [null] : [...new Set(expand(f[4].replace(/\b7\b/g, '0'), 0, 6, 'day-of-week'))];
  const out = [];
  for (const Month of months) for (const Day of doms) for (const Weekday of dows) for (const Hour of hours) for (const Minute of minutes) {
    const d = {}; if (Month !== null) d.Month = Month; if (Day !== null) d.Day = Day; if (Weekday !== null) d.Weekday = Weekday; d.Hour = Hour; d.Minute = Minute; out.push(d);
  }
  if (out.length > MAX_INTERVALS) throw new Error(`cron "${expr}" expands to ${out.length} launchd intervals (max ${MAX_INTERVALS})`);
  return out;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strs = (a) => a.map((s) => `    <string>${esc(s)}</string>`).join('\n');
function envDict(env) { return Object.entries(env).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `    <key>${esc(k)}</key>\n    <string>${esc(v)}</string>`).join('\n'); }
function intervalXml(list) {
  const one = (d) => `    <dict>\n${Object.entries(d).map(([k, v]) => `      <key>${k}</key>\n      <integer>${v}</integer>`).join('\n')}\n    </dict>`;
  return `  <key>StartCalendarInterval</key>\n  <array>\n${list.map(one).join('\n')}\n  </array>`;
}

// spec: { label, args[], root, env{}, intervals?[], keepAlive?, runAtLoad?, log }
function plist(spec) {
  const parts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">', '<dict>',
    `  <key>Label</key>\n  <string>${esc(spec.label)}</string>`,
    `  <key>ProgramArguments</key>\n  <array>\n${strs(spec.args)}\n  </array>`,
    `  <key>WorkingDirectory</key>\n  <string>${esc(spec.root)}</string>`,
    `  <key>EnvironmentVariables</key>\n  <dict>\n${envDict(spec.env)}\n  </dict>`,
  ];
  if (spec.intervals) parts.push(intervalXml(spec.intervals));
  if (spec.startInterval) parts.push(`  <key>StartInterval</key>\n  <integer>${spec.startInterval}</integer>`);
  if (spec.keepAlive) parts.push('  <key>KeepAlive</key>\n  <true/>');
  parts.push(`  <key>RunAtLoad</key>\n  <${spec.runAtLoad ? 'true' : 'false'}/>`);
  parts.push(`  <key>StandardOutPath</key>\n  <string>${esc(spec.log)}</string>`, `  <key>StandardErrorPath</key>\n  <string>${esc(spec.log)}</string>`);
  parts.push('</dict>', '</plist>', '');
  return parts.join('\n');
}

const labelFor = (id) => `${PREFIX}.${id}`;

// Builds every plist. agents: [{id, cron, tz, ported}], returns { files:[{name,label,body,kind}], skipped:[{id,reason}], warnings[] }.
function buildAll({ agents, root, nodePath, envPath, home, claudeBin, systemTz, allowTzMismatch = false, syncSchedule = { cron: '0 18 * * 0-4', tz: 'Asia/Jerusalem' }, snapshotEverySec = 900 }) {
  const files = [], skipped = [], warnings = [];
  const env = { PATH: envPath, HOME: home, CLAUDE_BIN: claudeBin };
  const logDir = `${root}/logs/launchd`;
  const checkTz = (what, tz) => {
    if (systemTz && tz && systemTz !== tz) {
      const msg = `${what}: schedule is ${tz} but this Mac is ${systemTz}. launchd fires in local time, so every time would be wrong.`;
      if (!allowTzMismatch) throw new Error(msg + ' Change the Mac timezone or pass --allow-tz-mismatch.');
      warnings.push(msg);
    }
  };
  for (const a of agents) {
    if (!a.ported) { skipped.push({ id: a.id, reason: 'not ported (no prompt.md)' }); continue; }
    checkTz(a.id, a.tz);
    files.push({ kind: 'agent', id: a.id, label: labelFor(a.id), name: `${labelFor(a.id)}.plist`,
      body: plist({ label: labelFor(a.id), args: [nodePath, `${root}/scripts/run-agent.js`, a.id], root, env, intervals: cronToIntervals(a.cron), log: `${logDir}/${a.id}.log` }) });
  }
  checkTz('learning-log sync', syncSchedule.tz);
  files.push({ kind: 'sync', id: 'learninglog-sync', label: 'com.ilan.learninglog-sync', name: 'com.ilan.learninglog-sync.plist',
    body: plist({ label: 'com.ilan.learninglog-sync', args: ['/bin/bash', `${root}/scripts/sync-learning-log.sh`], root, env, intervals: cronToIntervals(syncSchedule.cron), log: `${logDir}/learninglog-sync.log` }) });
  // Dashboard data through Claude Code's connectors (only does work for connectors without a token; it skips
  // itself outside working hours, so a fixed interval is fine).
  files.push({ kind: 'snapshot', id: 'snapshot', label: labelFor('snapshot'), name: `${labelFor('snapshot')}.plist`,
    body: plist({ label: labelFor('snapshot'), args: [nodePath, `${root}/scripts/snapshot.js`], root, env, startInterval: snapshotEverySec, runAtLoad: true, log: `${logDir}/snapshot.log` }) });
  files.push({ kind: 'server', id: 'server', label: labelFor('server'), name: `${labelFor('server')}.plist`,
    body: plist({ label: labelFor('server'), args: [nodePath, `${root}/server/index.js`], root, env, keepAlive: true, runAtLoad: true, log: `${logDir}/server.log` }) });
  return { files, skipped, warnings };
}

module.exports = { cronToIntervals, plist, buildAll, labelFor, PREFIX };
