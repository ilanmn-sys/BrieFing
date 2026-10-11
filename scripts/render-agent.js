#!/usr/bin/env node
// Cloud runner: prints the full instructions for one agent, for a cloud Routine session to follow.
//   node scripts/render-agent.js <id>
// The mode comes from agents/<id>/schedule.json -> "cloud": { "mode": "dry-run" | "live" } (default dry-run),
// committed in the repo, so a Routine can never run an agent live unless that file says so.
// In the cloud the tool list is NOT enforced by the runtime (a Routine session can call any connected tool), so
// the allowed tools are stated as a hard rule in the instructions instead, and the Mac-only pieces are mapped.
const fs = require('fs');
const path = require('path');
const agents = require('../server/agents');
const agentPrompt = require('../server/agentPrompt');

const NOTES = {
  boardMove: 'The local move endpoint (http://127.0.0.1:3737/api/board/move) does not exist in the cloud. Where the instructions say to call it, run the SAME checks yourself first (the move is an operation of today\'s approved proposal, the item is still in its fromGroup, the destination is not a legacy or excluded group, 🔥 Today stays under its cap), then make exactly one call to mcp__monday_com__all_monday_api with the mutation `mutation($i:ID!,$g:String!){ move_item_to_group(item_id:$i, group_id:$g){ id } }` for that item and group. No other mutation through all_monday_api, ever.',
  sessions: 'Source A (Claude Code sessions on the Mac, scripts/list-sessions.js) does not exist in the cloud: skip it and say "Mac sessions: not available in the cloud". Use source B (cloud sessions). Instead of the --remote-ledger / --mark-remote commands, dedupe on the CLAUDE_SESSION markers already posted on the board.',
  gmail: 'Gmail tools: call search_threads with pageSize 50 and follow pageToken until there are no more pages. Call get_thread with messageFormat "PLAIN_TEXT" (the default full content can be millions of characters); if a thread is still too large, call it with "MINIMAL" and say in your RESULT which threads you judged that way.',
  learningLog: 'If you edit LEARNING-LOG.md in a live run, commit only that file with the message "agent <id>: <one-line summary>" and push it to the branch you are on. If the push is refused, do not retry: put the exact entry in your RESULT summary and report delivery "failed".',
};

function cloudNotes(id, prompt, tools) {
  const notes = [];
  if (prompt.includes('/api/board/move')) notes.push(NOTES.boardMove);
  if (prompt.includes('scripts/list-sessions.js')) notes.push(NOTES.sessions);
  if (tools.some((t) => t.startsWith('mcp__Gmail__'))) notes.push(NOTES.gmail);
  if (tools.some((t) => t.startsWith('Edit(LEARNING-LOG.md)'))) notes.push(NOTES.learningLog.replace('<id>', id));
  notes.push('Files under data/ do not persist between cloud runs; never rely on them.');
  return notes;
}

function renderFor(id) {
  const a = agents.find(id);
  const dir = path.join(agents.agentsDir(), id);
  const { body, tools } = agentPrompt.load(dir);
  const mode = (a.cloud && a.cloud.mode) === 'live' ? 'live' : 'dry-run';
  // Mac-only shell commands are mapped to their cloud equivalent (see the cloud notes) or dropped.
  const allowed = [...new Set(tools.flatMap((t) => {
    if (/^Bash\(curl .*\/api\/board\/move/.test(t)) return ['mcp__monday_com__all_monday_api (only the move_item_to_group mutation, see the cloud note)'];
    if (/^Bash\(node scripts\/list-sessions\.js/.test(t)) return [];
    return [t.startsWith('Bash(') ? `the shell command ${t.slice(5, -1)}` : t];
  }))];
  const header = [
    `You are running the scheduled agent "${id}" for Ilan Manassen's Command Center, in a cloud session (mode: ${mode.toUpperCase()}).`,
    `Hard rule: use only these tools: ${allowed.join(', ')}. Reading files in this repository is allowed. Do not call any other tool, even if it is available in this session; if a step needs one, skip that step and say so in your RESULT.`,
    ...cloudNotes(id, body, tools).map((n) => `Cloud note: ${n}`),
  ];
  return { mode, prompt: agentPrompt.build({ body, dryRun: mode !== 'live', extra: header }) };
}
module.exports = { renderFor, cloudNotes, NOTES };

if (require.main === module) {
  const id = process.argv[2];
  try { process.stdout.write(renderFor(id).prompt + '\n'); }
  catch (e) { console.error(`render-agent: ${e.message}`); process.exit(1); }
}
