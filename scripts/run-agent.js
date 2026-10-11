#!/usr/bin/env node
// Runs one agent headlessly: `node scripts/run-agent.js <id> [--dry-run] [--force]`
// Records every run (success or failure) so the Agents tab can show it. launchd calls this.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const agents = require('../server/agents');
const agentPrompt = require('../server/agentPrompt');
const mcpNames = require('../server/mcpNames');

const [id, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run'), force = flags.includes('--force');
const TIMEOUT = Number(process.env.AGENT_TIMEOUT_MS || 15 * 60000);

const finish = (run) => { agents.recordRun(id, run); agents.clearRunning(id); console.log(`${id}: ${run.ok ? 'ok' : 'FAILED'} delivery=${run.delivery}${run.error ? ' error=' + run.error : ''}`); process.exit(run.ok ? 0 : 1); };

(async () => {
  const startedAt = Date.now();
  const fail = (error) => finish({ startedAt, finishedAt: Date.now(), durationMs: Date.now() - startedAt, ok: false, delivery: 'n/a', dryRun, error });
  let a;
  try { a = agents.find(id); } catch (e) { console.error(e.message); process.exit(2); }
  if (!force && !agents.enabledFor(a)) { console.log(`${id}: disabled, skipping`); process.exit(0); } // scheduled runs respect the toggle
  agents.markRunning(id);
  const dir = path.join(agents.agentsDir(), id);
  let body, tools;
  try { ({ body, tools } = agentPrompt.load(dir)); } catch (e) { return fail(e.message); }
  const prompt = agentPrompt.build({ body, dryRun });

  const bin = process.env.CLAUDE_BIN || 'claude';
  let out = '', err = '', timedOut = false, spawnError = null;
  const mapped = tools.map((t) => mcpNames.mapToolName(t)); // this machine's real MCP server names
  const child = spawn(bin, ['-p', prompt, '--allowedTools', mapped.join(',')], { cwd: agents.root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] }); // stdin closed: never hang on an interactive prompt
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, TIMEOUT);
  child.stdout.on('data', (d) => { out = (out + d).slice(-20000); });
  child.stderr.on('data', (d) => { err = (err + d).slice(-4000); });
  child.on('error', (e) => { spawnError = e; });
  child.on('close', (code) => {
    clearTimeout(timer);
    const base = { startedAt, finishedAt: Date.now(), durationMs: Date.now() - startedAt, dryRun };
    if (spawnError) return finish({ ...base, ok: false, delivery: 'n/a', error: `could not start "${bin}": ${spawnError.message}` });
    if (timedOut) return finish({ ...base, ok: false, delivery: 'n/a', error: `timed out after ${Math.round(TIMEOUT / 1000)}s` });
    if (code !== 0) return finish({ ...base, ok: false, delivery: 'n/a', error: `exit ${code}: ${(err || out).trim().slice(-300)}` });
    const m = [...out.matchAll(/^RESULT:\s*(\{.*\})\s*$/gm)].pop();
    let r = null; try { r = m && JSON.parse(m[1]); } catch (_) {}
    if (!r || !['ok', 'failed', 'n/a'].includes(r.delivery)) return finish({ ...base, ok: true, delivery: 'unknown', summary: out.trim().slice(-200) });
    finish({ ...base, ok: r.delivery !== 'failed', delivery: r.delivery, summary: String(r.summary || '').slice(0, 300), error: r.delivery === 'failed' ? String(r.summary || 'delivery failed') : undefined });
  });
})();
