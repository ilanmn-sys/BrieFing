// Minimal Anthropic Messages API client. Needs ANTHROPIC_API_KEY; model is configurable.
const { http, need } = require('./lib');
const { viaClaude } = require('./via/mode');

// Without an API key, completions run through the user's Claude Code login (claude -p, no tools). They are slow
// (~10 s), so identical prompts are cached for 6 hours in data/snapshot/llm-cache.json; the snapshot job warms it.
const CACHE_MS = 6 * 3600000;
async function viaClaudeCode(prompt, system) {
  const claude = require('./via/claude'), store = require('./via/store');
  const k = claude.hash(`${system || ''}\n${prompt}`), cache = store.read('llm-cache', {});
  if (cache[k] && Date.now() - Date.parse(cache[k].at) < CACHE_MS) return cache[k].text;
  const text = await claude.complete(prompt, { system });
  const c = store.read('llm-cache', {}); c[k] = { at: new Date().toISOString(), text };
  for (const [kk, v] of Object.entries(c)) if (Date.now() - Date.parse(v.at) > CACHE_MS) delete c[kk];
  store.write('llm-cache', c);
  return text;
}

async function complete(prompt, { system, maxTokens = 4000 } = {}) {
  if (viaClaude('llm')) return viaClaudeCode(prompt, system);
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
