#!/usr/bin/env node
// Verifies that every MCP server named in agents/*/allowed-tools.json is actually connected on this machine.
//   node scripts/check-tools.js            runs `claude mcp list` (CLAUDE_BIN overrides the binary)
//   node scripts/check-tools.js --from FILE  reads the `claude mcp list` output from a file (for tests)
// Tool names look like mcp__<server>__<tool>; the server part must match a connected server name. This catches the
// "tool names must be checked against `claude mcp list`" risk before an agent silently runs without its tools.
// It cannot see individual tool names, only servers; the dry-run of each agent is the check for those.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const mcpNames = require('../server/mcpNames');
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
// Servers an agent can do without (it reports the source as unavailable instead of failing).
const OPTIONAL = new Set(['claude-code-remote']);

function wanted(agentsDir) {
  const need = new Map(); // server -> Set(agent ids)
  for (const d of fs.readdirSync(agentsDir, { withFileTypes: true })) {
    const f = path.join(agentsDir, d.name, 'allowed-tools.json');
    if (!d.isDirectory() || !fs.existsSync(f)) continue;
    for (const t of JSON.parse(fs.readFileSync(f, 'utf8'))) {
      const m = String(t).match(/^mcp__(.+?)__.+$/);
      if (m) { if (!need.has(m[1])) need.set(m[1], new Set()); need.get(m[1]).add(d.name); }
    }
  }
  return need;
}

// `claude mcp list` prints one server per line: "<name>: <command or url> - <status>". Names may contain colons (plugin:x:y).
function connected(text) {
  const out = new Map();
  for (const line of String(text).split('\n')) {
    const m = line.match(/^(.+?):\s+(\S.*?)\s+-\s+(.*)$/);
    if (m) out.set(m[1].trim(), /✓|connected/i.test(m[3]) && !/✗|failed|needs auth/i.test(m[3]));
  }
  return out;
}

function check(agentsDir, listText) {
  const have = connected(listText), need = wanted(agentsDir), rows = [];
  for (const [server, agents] of [...need].sort()) {
    const hit = [...have].find(([n]) => norm(n) === norm(server) || norm(n).endsWith(norm(server)));
    rows.push({ server, agents: [...agents].sort(), found: hit ? hit[0] : null, connected: hit ? hit[1] : false, optional: OPTIONAL.has(server) });
  }
  return rows;
}
module.exports = { wanted, connected, check };

if (require.main === module) {
  const i = process.argv.indexOf('--from');
  let text;
  if (i >= 0) text = fs.readFileSync(process.argv[i + 1], 'utf8');
  else {
    const r = spawnSync(process.env.CLAUDE_BIN || 'claude', ['mcp', 'list'], { encoding: 'utf8', timeout: 60000 });
    if (r.error || r.status !== 0) { console.error('check-tools: could not run `claude mcp list`: ' + (r.error ? r.error.message : (r.stderr || r.stdout).trim().slice(-300))); process.exit(2); }
    text = r.stdout;
  }
  const rows = check(path.join(root, 'agents'), text);
  // Remember the real server names so agents and the dashboard call the tools by the names this machine uses.
  const map = Object.fromEntries(rows.filter((r) => r.found).map((r) => [r.server, mcpNames.sanitize(r.found)]));
  if (!process.argv.includes('--no-save')) mcpNames.save(map);
  let bad = 0;
  for (const r of rows) {
    const ok = r.found && r.connected; if (!ok && !r.optional) bad++;
    console.log(`${ok ? 'OK     ' : r.optional ? 'OPTIONAL (not connected)' : r.found ? 'NOT CONNECTED' : 'MISSING'}  ${r.server}${r.found && r.found !== r.server ? ` (as "${r.found}")` : ''}  used by ${r.agents.length} agent(s): ${r.agents.join(', ')}`);
  }
  const renamed = Object.entries(map).filter(([k, v]) => k !== v);
  if (renamed.length) console.log(`\nTool names on this machine: ${renamed.map(([k, v]) => `mcp__${k}__* -> mcp__${v}__*`).join(', ')} (saved to data/mcp-servers.json)`);
  console.log(bad ? `\n${bad} MCP server(s) need attention. Agents that use them will run without those tools.` : '\nAll MCP servers the agents use are connected.');
  process.exit(bad ? 1 : 0);
}
