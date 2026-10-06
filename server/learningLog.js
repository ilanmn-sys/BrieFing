// Appends a signal to section 2 of LEARNING-LOG.md (newest first). The repository file is the source of truth;
// the Mac sync publishes it. Entry number = highest existing S-number + 1 (some numbers appear twice in the file).
const fs = require('fs');
const path = require('path');
const file = () => process.env.LEARNING_LOG_FILE || path.join(__dirname, '..', 'LEARNING-LOG.md');

function appendSignal({ date, type, severity = 'low', body }) {
  const f = file(), text = fs.readFileSync(f, 'utf8');
  const next = Math.max(0, ...[...text.matchAll(/\bS-(\d+)\b/g)].map((m) => Number(m[1]))) + 1;
  const entry = `### S-${String(next).padStart(3, '0')} · ${date} · \`${type}\` · severity: ${severity}\n${body.trim()}\n\n---\n\n`;
  const anchor = text.match(/^Newest first\..*$/m);
  if (!anchor) throw new Error('could not find the "Newest first" line in section 2 of the learning log');
  const at = text.indexOf(anchor[0]) + anchor[0].length;
  const out = text.slice(0, at) + '\n\n' + entry.trimEnd() + '\n' + text.slice(at).replace(/^\n+/, '\n');
  const tmp = f + '.tmp'; fs.writeFileSync(tmp, out); fs.renameSync(tmp, f);
  return `S-${String(next).padStart(3, '0')}`;
}
module.exports = { appendSignal };
