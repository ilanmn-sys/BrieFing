const { http, need } = require('../lib');
const google = require('./google');

async function health() {
  // Reuses the Google refresh token; needs a Drive read scope.
  const body = new URLSearchParams({
    client_id: need('GOOGLE_CLIENT_ID'), client_secret: need('GOOGLE_CLIENT_SECRET'),
    refresh_token: need('GOOGLE_REFRESH_TOKEN'), grant_type: 'refresh_token',
  });
  const t = (await http('https://oauth2.googleapis.com/token', { method: 'POST', body })).access_token;
  const r = await http('https://www.googleapis.com/drive/v3/about?fields=user', { headers: { Authorization: `Bearer ${t}` } });
  return `drive user ${r.user.emailAddress}`;
}
module.exports = { health };
