#!/usr/bin/env node
// A stand-in for `claude -p` in tests. It reads the fetch prompt, "calls" each listed tool through the responder
// module in $FAKE_RESPONDER, and prints stream-json like the real CLI (format checked against a real run, see
// claude-stream-real.jsonl). With --output-format json it answers a plain completion. Every call is logged to $FAKE_LOG.
const fs = require('fs');
const args = process.argv.slice(2);
const prompt = args[args.indexOf('-p') + 1] || '';
const json = args[args.indexOf('--output-format') + 1] === 'json';
const allowed = (args[args.indexOf('--allowedTools') + 1] || '').split(',');
const responder = require(process.env.FAKE_RESPONDER);
const log = (x) => process.env.FAKE_LOG && fs.appendFileSync(process.env.FAKE_LOG, JSON.stringify(x) + '\n');
if (json) { const text = responder.complete ? responder.complete(prompt) : '[]'; log({ complete: true }); console.log(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: text })); process.exit(0); }
const calls = [];
for (const line of prompt.split('\n')) {
  const m = line.match(/^\d+\. Call `([^`]+)` with exactly these arguments \(JSON\): (.*)$/);
  const f = line.match(/^\d+\. Call `([^`]+)`: (.*)$/);
  if (m) calls.push({ name: m[1], input: JSON.parse(m[2]) });
  else if (f) calls.push({ name: f[1], input: { instruction: f[2] } });
}
const out = (o) => process.stdout.write(JSON.stringify(o) + '\n');
out({ type: 'system', subtype: 'init', tools: allowed });
calls.forEach((c, i) => {
  if (!allowed.includes(c.name)) return;
  const input = responder.mutate ? responder.mutate(c) : c.input;
  if (input === null) return; // the responder can simulate a call that was never made
  const id = `toolu_fake_${i}`;
  out({ type: 'assistant', message: { content: [{ type: 'tool_use', id, name: c.name, input }] } });
  const r = responder.respond(c.name, input);
  log({ name: c.name, input });
  out({ type: 'user', message: { content: [{ tool_use_id: id, type: 'tool_result', content: typeof r.result === 'string' ? r.result : JSON.stringify(r.result), is_error: !!r.isError }] } });
});
out({ type: 'assistant', message: { content: [{ type: 'text', text: 'DONE' }] } });
out({ type: 'result', subtype: 'success', is_error: false, result: 'DONE', total_cost_usd: 0.01 });
