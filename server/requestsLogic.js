// "Whose turn" ladder for the Requests tab (pure logic, no network).
//   0  only bots touched it
//   1  a human replied, and it was not me      (ball in my court)
//   2  I replied last, deadline within 3 days  (or already past)
//   3  I replied last, no pressure
//   4  touched this session                    (sinks)
const isBot = (name, bots) => { const n = String(name || '').toLowerCase(); return !n || bots.some((b) => n.includes(b)); };

const addDays = (key, n) => { const d = new Date(key + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

function turn(item, { myId, bots, today, touched }) {
  if (touched && touched.has(item.id)) return { rung: 4, label: 'TOUCHED' };
  const humans = (item.updates || []).filter((u) => !isBot(u.creatorName, bots)).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  if (!humans.length) return { rung: 0, label: 'BOT ONLY' };
  if (String(humans[0].creatorId) !== String(myId)) return { rung: 1, label: 'THEIR REPLY' };
  const pressing = item.deadline && item.deadline <= addDays(today, 3);
  return pressing ? { rung: 2, label: 'YOU REPLIED, DUE SOON' } : { rung: 3, label: 'YOU REPLIED' };
}

const TIER = { 'T0 Live': 0, 'T1 Fast lane': 1, 'T2 Standard': 2, 'T3 Project': 3, 'T4 Parked': 4 };
function rank(items, ctx) {
  return items.map((i) => ({ ...i, ...turn(i, ctx) })).sort((a, b) =>
    a.rung - b.rung || (a.deadline || '9999').localeCompare(b.deadline || '9999') || (TIER[a.tier] ?? 9) - (TIER[b.tier] ?? 9) || a.name.localeCompare(b.name));
}
module.exports = { isBot, turn, rank };
