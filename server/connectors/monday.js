const { config, http, need } = require('../lib');

async function gql(query, variables) {
  return http('https://api.monday.com/v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: need('MONDAY_API_TOKEN'), 'API-Version': '2024-10' },
    body: JSON.stringify({ query, variables }),
  });
}

// Read-only: confirms auth and that the projects board is reachable.
async function health() {
  const r = await gql('query($id:[ID!]){ me{ id name } boards(ids:$id){ id name } }', { id: [String(config.boards.projects)] });
  if (r.errors) throw new Error(JSON.stringify(r.errors).slice(0, 200));
  const board = r.data.boards[0];
  if (!board) throw new Error('projects board not visible to this token');
  return `user ${r.data.me.id}; board "${board.name}"`;
}

module.exports = { gql, health };
