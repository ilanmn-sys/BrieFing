// Minimal Anthropic Messages API client. Needs ANTHROPIC_API_KEY; model is configurable.
const { http, need } = require('./lib');

async function complete(prompt, { system, maxTokens = 4000 } = {}) {
  const r = await http('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': need('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.CLAUDE_MODEL || 'claude-sonnet-5-5', max_tokens: maxTokens, system, messages: [{ role: 'user', content: prompt }] }),
  }, 60000);
  // Normalise: content may be a string, [{text}], or {content} (trap 10).
  const c = r && r.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map((b) => (typeof b === 'string' ? b : b.text || '')).join('');
  throw new Error('unexpected model response shape');
}
module.exports = { complete };
