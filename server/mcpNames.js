// MCP tool names differ by machine: the same connector can be "Gmail" in one place and "claude.ai Gmail" on the
// Mac, which Claude Code exposes as mcp__claude_ai_Gmail__<tool>. Prompts and allowed-tools.json use the logical
// names (mcp__Gmail__..., mcp__monday_com__...); this maps them to what this machine really has.
// The mapping is written by scripts/check-tools.js (data/mcp-servers.json). No file = names used as written.
const fs = require('fs');
const path = require('path');
const file = () => process.env.MCP_NAMES_FILE || path.join(__dirname, '..', 'data', 'mcp-servers.json');
const sanitize = (name) => String(name).replace(/[^A-Za-z0-9_-]/g, '_');

function load() { try { return JSON.parse(fs.readFileSync(file(), 'utf8')); } catch (_) { return {}; } }
function save(map) { fs.mkdirSync(path.dirname(file()), { recursive: true }); fs.writeFileSync(file(), JSON.stringify(map, null, 2) + '\n'); }
const serverName = (logical, map = load()) => map[logical] || logical;
const tool = (logical, name, map = load()) => `mcp__${serverName(logical, map)}__${name}`;
function mapToolName(t, map = load()) {
  const m = String(t).match(/^mcp__(.+?)__(.+)$/);
  return m ? tool(m[1], m[2], map) : t;
}
module.exports = { load, save, sanitize, serverName, tool, mapToolName };
