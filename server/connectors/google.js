// Gmail + Calendar via a Google OAuth refresh token (read-only scopes for /health).
const { http, need } = require('../lib');

async function accessToken() {
  const body = new URLSearchParams({
    client_id: need('GOOGLE_CLIENT_ID'), client_secret: need('GOOGLE_CLIENT_SECRET'),
    refresh_token: need('GOOGLE_REFRESH_TOKEN'), grant_type: 'refresh_token',
  });
  const r = await http('https://oauth2.googleapis.com/token', { method: 'POST', body });
  return r.access_token;
}

async function gmailHealth() {
  const t = await accessToken();
  const r = await http('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: { Authorization: `Bearer ${t}` } });
  return `mailbox ${r.emailAddress}`;
}

async function calendarHealth() {
  const t = await accessToken();
  const now = new Date().toISOString();
  const r = await http(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1&timeMin=${encodeURIComponent(now)}`,
    { headers: { Authorization: `Bearer ${t}` } });
  return `primary calendar ok (${(r.items || []).length} upcoming sampled)`;
}

module.exports = { gmailHealth, calendarHealth };
