#!/usr/bin/env node
// Builds the dashboard snapshot page: web/snapshot/template.html + one JSON file of today's data.
//   node scripts/build-snapshot.js <data.json> <out.html>
// The dashboard-snapshot agent collects the data, runs this, and publishes <out.html> to the dashboard artifact.
// The JSON is checked against the shape the template expects, so a malformed file fails here and not on the page.
const fs = require('fs');
const path = require('path');

const MARKS = ['crit', 'warn', 'ok', 'acc', 'idle'];
const STATES = ['ok', 'idle', 'acc', 'warn', 'crit'];
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;

function validate(d) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(msg); };
  need(d && typeof d === 'object', 'data must be an object');
  if (errs.length) return errs;
  need(typeof d.subtitle === 'string' && d.subtitle, 'subtitle is required (e.g. "Snapshot from Monday 12.10, 08:30")');
  need(Array.isArray(d.tiles) && d.tiles.length >= 1 && d.tiles.length <= 4, 'tiles: 1 to 4 summary tiles');
  for (const t of d.tiles || []) need(t.label && t.value != null && MARKS.includes(t.kind), `tile needs label, value and kind (${MARKS.join('|')}): ${JSON.stringify(t)}`);
  const a = d.agenda || {};
  need(typeof a.title === 'string', 'agenda.title is required');
  for (const e of a.events || []) need(e.t && HM.test(e.s) && HM.test(e.e) && e.e > e.s, `agenda event needs t and s<e as HH:MM: ${JSON.stringify(e)}`);
  need(Array.isArray(d.tabs) && d.tabs.length >= 1, 'tabs: at least one tab');
  const ids = new Set();
  for (const t of d.tabs || []) {
    need(/^[a-z][a-z0-9-]*$/.test(t.id || '') && !ids.has(t.id), `tab id must be a unique lowercase token: ${t.id}`);
    ids.add(t.id);
    need(t.label, `tab ${t.id} needs a label`);
    if (t.type === 'agents') continue;
    for (const s of t.sections || []) {
      need(s.title, `a section in tab ${t.id} needs a title`);
      for (const r of s.rows || []) need(r.t && (r.mark == null || MARKS.includes(r.mark)), `row in ${t.id}/${s.title} needs t and a valid mark: ${JSON.stringify(r)}`);
    }
  }
  for (const g of d.agents || []) need(g.id && STATES.includes(g.state), `agent needs id and state (${STATES.join('|')}): ${JSON.stringify(g)}`);
  return errs;
}

function build(data, template) {
  const errs = validate(data);
  if (errs.length) throw new Error('snapshot data is invalid:\n- ' + errs.join('\n- '));
  // Safe inside <script type="application/json">: no "</script", no "<!--".
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  if (!template.includes('__SNAPSHOT_DATA__')) throw new Error('template has no __SNAPSHOT_DATA__ placeholder');
  return template.replace('__SNAPSHOT_DATA__', () => json);
}

module.exports = { validate, build };

if (require.main === module) {
  const [dataPath, outPath] = process.argv.slice(2);
  if (!dataPath || !outPath) { console.error('usage: node scripts/build-snapshot.js <data.json> <out.html>'); process.exit(2); }
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const template = fs.readFileSync(path.join(__dirname, '..', 'web', 'snapshot', 'template.html'), 'utf8');
    fs.writeFileSync(outPath, build(data, template));
    console.log(`built ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
  } catch (e) { console.error(e.message); process.exit(1); }
}
