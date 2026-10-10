// Where connector data fetched through Claude Code is kept between snapshot runs, and how fresh it is.
const fs = require('fs');
const path = require('path');
const { config, NotConfigured } = require('../lib');

const dir = () => process.env.SNAPSHOT_DIR || path.join(__dirname, '..', '..', (config.dataMode && config.dataMode.snapshotDir) || 'data/snapshot');
const file = (name) => path.join(dir(), name + '.json');
function read(name, fallback = null) { try { return JSON.parse(fs.readFileSync(file(name), 'utf8')); } catch (_) { return fallback; } }
function write(name, value) { fs.mkdirSync(dir(), { recursive: true }); const f = file(name), t = f + '.tmp'; fs.writeFileSync(t, JSON.stringify(value)); fs.renameSync(t, f); }

// status.json: { sources: { monday:{ok,at,error}, gmail:..., calendar:..., slack:..., drive:... }, ranAt }
const status = () => read('status', { sources: {} });
function setSource(source, s) { const st = status(); st.sources[source] = { ...s, at: s.at || new Date().toISOString() }; st.ranAt = new Date().toISOString(); write('status', st); }

class SnapshotMissing extends NotConfigured {} // no snapshot yet reads as "not configured", not as a failure
// The health line for a connector that runs through Claude Code. Throws when there is no usable snapshot.
function health(source, now = Date.now()) {
  const s = status().sources[source];
  const stale = ((config.dataMode && config.dataMode.staleMinutes) || 45) * 60000;
  if (!s) throw new SnapshotMissing(`no snapshot yet: run "node scripts/snapshot.js" (connectors mode, no ${source} token)`);
  if (!s.ok) throw new Error(`last snapshot failed ${ago(now - Date.parse(s.at))}: ${s.error}`);
  if (now - Date.parse(s.at) > stale) throw new Error(`snapshot is ${ago(now - Date.parse(s.at))} old (the snapshot job may not be running)`);
  return `via Claude Code connectors; snapshot ${ago(now - Date.parse(s.at))}${s.detail ? '; ' + s.detail : ''}`;
}
const ago = (ms) => (ms < 90000 ? 'just now' : ms < 5400000 ? `${Math.round(ms / 60000)} min ago` : `${Math.round(ms / 3600000)} h ago`);

module.exports = { dir, read, write, status, setSource, health, SnapshotMissing };
