// The full prompt an agent runs with, built in one place so the Mac runner (run-agent.js) and the cloud
// runner (render-agent.js, used by the cloud Routines) can never drift apart.
const fs = require('fs');
const path = require('path');
const { today, config } = require('./lib');
const { render } = require('./template');

const DRY = 'DRY RUN: do not write anywhere (no board writes, no Slack messages, no drafts, no learning-log edits). Read everything you need, then print the writes you would make and the exact brief you would send.';
const RESULT = 'Finish with exactly one last line: RESULT: {"delivery":"ok|failed|n/a","summary":"one sentence"}';

function load(dir) {
  const promptFile = path.join(dir, 'prompt.md'), toolsFile = path.join(dir, 'allowed-tools.json');
  if (!fs.existsSync(promptFile)) throw new Error('not ported: no prompt.md');
  if (!fs.existsSync(toolsFile)) throw new Error('allowed-tools.json is required (agents run with a scoped tool list)');
  let tools; try { tools = JSON.parse(fs.readFileSync(toolsFile, 'utf8')); if (!Array.isArray(tools)) throw new Error('not an array'); } catch (e) { throw new Error('bad allowed-tools.json: ' + e.message); }
  let body; try { body = render(fs.readFileSync(promptFile, 'utf8'), config); } catch (e) { throw new Error('prompt template: ' + e.message); }
  return { body, tools };
}

function build({ body, dryRun, extra = [] }) {
  return [`Today is ${today()} (read from the system clock). Read LEARNING-LOG.md section 1 before anything else.`, dryRun ? DRY : '', ...extra, body, RESULT].filter(Boolean).join('\n\n');
}
module.exports = { load, build, DRY, RESULT };
