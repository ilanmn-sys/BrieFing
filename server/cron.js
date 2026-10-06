// Tiny cron evaluator (5 fields: minute hour day-of-month month day-of-week), timezone-aware.
// Supports *, lists, ranges, steps (*/n, a-b/n). Day-of-month and day-of-week combine with OR when
// both are restricted (standard cron). Enough for every schedule in agents/*/schedule.json.
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function field(str, min, max) {
  const out = new Set();
  for (const part of String(str).split(',')) {
    const [range, stepStr] = part.split('/');
    const step = stepStr ? Number(stepStr) : 1;
    let lo, hi;
    if (range === '*') { lo = min; hi = max; }
    else if (range.includes('-')) { [lo, hi] = range.split('-').map(Number); }
    else { lo = Number(range); hi = stepStr ? max : lo; }
    if (![lo, hi, step].every(Number.isInteger) || lo < min || hi > max || lo > hi || step < 1) throw new Error(`bad cron field "${str}"`);
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out;
}

function parse(expr) {
  const f = String(expr).trim().split(/\s+/);
  if (f.length !== 5) throw new Error(`cron needs 5 fields: "${expr}"`);
  const dow = field(f[4].replace(/7/g, '0'), 0, 6);
  return { min: field(f[0], 0, 59), hour: field(f[1], 0, 23), dom: field(f[2], 1, 31), mon: field(f[3], 1, 12), dow, domStar: f[2] === '*', dowStar: f[4] === '*' };
}

const fmts = new Map();
function local(ms, tz) {
  if (!fmts.has(tz)) fmts.set(tz, new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'short', hourCycle: 'h23' }));
  const p = Object.fromEntries(fmts.get(tz).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { min: +p.minute, hour: +p.hour, dom: +p.day, mon: +p.month, dow: DOW[p.weekday] };
}

function dayOk(c, l) {
  if (!c.mon.has(l.mon)) return false;
  const d = c.dom.has(l.dom), w = c.dow.has(l.dow);
  if (c.domStar && c.dowStar) return true;
  if (c.domStar) return w;
  if (c.dowStar) return d;
  return d || w; // both restricted: OR
}
const matches = (c, l) => dayOk(c, l) && c.hour.has(l.hour) && c.min.has(l.min);

const MIN = 60000, LIMIT = 400 * 24 * 60 * MIN;

// Strictly after `afterMs`.
function next(expr, afterMs, tz) {
  const c = parse(expr);
  let t = (Math.floor(afterMs / MIN) + 1) * MIN;
  for (const end = t + LIMIT; t < end;) {
    const l = local(t, tz);
    if (matches(c, l)) return t;
    t += (!dayOk(c, l) || !c.hour.has(l.hour)) ? (60 - l.min) * MIN : MIN; // skip to the next hour when the hour can't match
  }
  return null;
}

// Latest fire at or before `atMs`, then the one before it, ... (newest first).
function prevFires(expr, atMs, tz, n = 2) {
  const c = parse(expr), out = [];
  let t = Math.floor(atMs / MIN) * MIN;
  for (const end = t - LIMIT; t > end && out.length < n;) {
    const l = local(t, tz);
    if (matches(c, l)) { out.push(t); t -= MIN; continue; }
    t -= (!dayOk(c, l) || !c.hour.has(l.hour)) ? (l.min + 1) * MIN : MIN;
  }
  return out;
}

module.exports = { parse, next, prevFires };
