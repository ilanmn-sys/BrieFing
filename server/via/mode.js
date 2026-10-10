// Per connector: the direct API when its token is in .env, otherwise Claude Code's connectors.
// DATA_MODE=api|connectors forces one mode for everything.
const TOKEN = { monday: 'MONDAY_API_TOKEN', gmail: 'GOOGLE_REFRESH_TOKEN', calendar: 'GOOGLE_REFRESH_TOKEN', drive: 'GOOGLE_REFRESH_TOKEN', slack: 'SLACK_TOKEN', llm: 'ANTHROPIC_API_KEY' };
function mode(name) {
  const forced = process.env.DATA_MODE;
  if (forced === 'api' || forced === 'connectors') return forced;
  return process.env[TOKEN[name]] ? 'api' : 'connectors';
}
const viaClaude = (name) => mode(name) === 'connectors';
module.exports = { mode, viaClaude, TOKEN };
