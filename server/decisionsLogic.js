// Decisions are Ilan's to make, never drafts (principle 8 / R-19). Pure detection logic.
const META = /comms calendar sync|daily inbox digest|morning-board|pepper-eod/i;
const WORDS = /decision|approv|go\/no-?go|sign[- ]?off|budget|extend\/end|החלטה|אישור|לאשר|לאשרר/i;
const AMOUNT = /([$€₪£])\s?(\d+(?:[.,]\d+)?)\s?([kKmM])?/;

function parseAmount(text) {
  const m = String(text || '').match(AMOUNT);
  if (!m) return null;
  const n = Number(m[2].replace(',', '.')) * ({ k: 1e3, m: 1e6 }[(m[3] || '').toLowerCase()] || 1);
  return { text: m[0].replace(/\s/g, ''), value: n };
}

// Board items whose substance is a decision. Same visibility rules as the Tasks tab.
function detectBoard(items, g) {
  const hidden = new Set([g.canonical.completed.id, g.parking.recurring, g.parking.noise]);
  const out = [];
  for (const t of items) {
    if (hidden.has(t.group) || t.status === 'Done' || t.status === 'Not Relevant' || META.test(t.name)) continue;
    const amount = parseAmount(t.name);
    if (!WORDS.test(t.name) && !amount) continue;
    out.push({ key: 'board:' + t.id, source: 'board', itemId: t.id, name: t.name, amount: amount ? amount.text : '', value: amount ? amount.value : 0,
      deadline: t.deadline || '', reason: WORDS.test(t.name) ? 'Name reads as a decision' : 'Carries a budget figure' });
  }
  return out;
}

// A seed disappears once a board item or an email already covers it, so nothing shows twice.
function liveSeeds(seeds, boardItems, extraNames = []) {
  const pool = [...boardItems.map((b) => b.name), ...extraNames].join('\n').toLowerCase();
  return seeds.filter((s) => !pool.includes(s.match.toLowerCase()))
    .map((s) => ({ key: s.key, source: 'seed', match: s.match, name: s.name, amount: s.amount, value: parseAmount(s.amount) ? parseAmount(s.amount).value : 0, deadline: '', reason: 'Open since 2026-09-22 (S-006)' }));
}

function order(items) {
  return [...items].sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999') || b.value - a.value || a.name.localeCompare(b.name));
}

const OUTCOMES = ['approved', 'declined', 'deferred'];
const KEY = /^(board|email|seed):[\w.\-]+$/;
module.exports = { parseAmount, detectBoard, liveSeeds, order, OUTCOMES, KEY };
