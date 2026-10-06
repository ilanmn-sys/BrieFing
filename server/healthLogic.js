// Board health: counts of known rule violations (R-04, R-05, R-06, R-16, R-21). Read-only.
// Every entry is a PROPOSAL for the user to approve; nothing here changes the board (principle 2).
const META = /comms calendar sync|daily inbox digest|morning-board|pepper-eod/i;

// A deadline written in the title: "עד 10.8", "by 10/8", "due 5.9", "48h מקבלה".
const TITLE_DATE = /((?:עד|by|due|until|before)\s*\d{1,2}[./-]\d{1,2})|(\b\d{1,3}\s?h\b\s*(?:מקבלה|from|after)?)/i;
const AUTOMATION = /automation|scheduled task|cron|daily digest|weekly (?:review|report|roundup|digest)|\bsync\b.*\b(?:daily|weekly)\b/i;
const HOLDER = /(?:[Ww]aiting (?:on|for)|[Bb]locked (?:on|by)|[Hh]eld by|[Ww]ith|ממתי(?:ן|נה|נים) (?:ל|על|מ))\s*-?\s*[A-Z֐-׿][\w֐-׿.'-]+|(?:בעל אחריות|[Hh]older)\s*:\s*\*?[\w֐-׿]/;

const isBlocked = (t, g) => t.group === g.canonical.waiting.id || t.status === 'With steakholder' || t.status === 'Stuck';

function health(items, { groups: g, today, agentNames = [], holderText = new Map() }) {
  const parked = new Set([g.canonical.completed.id, g.parking.recurring, g.parking.noise, ...(g.excluded || [])]);
  const names = agentNames.map((n) => n.toLowerCase());
  const open = items.filter((t) => !parked.has(t.group) && t.status !== 'Done' && !META.test(t.name));
  const live = open.filter((t) => t.status !== 'Not Relevant');
  const entry = (t, proposal) => ({ id: t.id, name: t.name, proposal });

  const r21 = live.filter((t) => t.group === g.canonical.today.id && t.deadline && t.deadline < today)
    .map((t) => entry(t, 'Move out of 🔥 Today to 📅 This Week (R-21).'));
  const r05 = live.filter((t) => !t.deadline && TITLE_DATE.test(t.name))
    .map((t) => entry(t, `The title says «${t.name.match(TITLE_DATE)[0].trim()}». Propose putting that date in the Date column (R-05).`));
  const r04 = live.filter((t) => t.deadline && (AUTOMATION.test(t.name) || names.some((n) => t.name.toLowerCase().includes(n))))
    .map((t) => entry(t, 'Looks like an automation carrying a date. Propose moving it to 🔁 Recurring and clearing the date (R-04).'));
  const r06 = open.filter((t) => t.status === 'Not Relevant')
    .map((t) => entry(t, 'Marked Not Relevant but still in an active group. Propose moving it to 🚫 Noise (R-06).'));
  const blocked = live.filter((t) => isBlocked(t, g));
  const r16 = blocked.filter((t) => !HOLDER.test(t.name + '\n' + (holderText.get(t.id) || '')))
    .map((t) => entry(t, 'Blocked, but no one is named as holding it. Add who holds it on the item (R-16).'));

  const rule = (id, label, list, extra = {}) => ({ id, label, count: list.length, items: list, ...extra });
  return [
    rule('R-21', 'Past date in 🔥 Today', r21),
    rule('R-05', 'Deadline only in the title', r05),
    rule('R-04', 'Automations with dates', r04, { heuristic: true }),
    rule('R-06', 'Not Relevant in active groups', r06),
    rule('R-16', 'Blocked, holder not named', r16, { heuristic: true }),
  ];
}

module.exports = { health, TITLE_DATE, HOLDER, isBlocked };
