// Gmail + Calendar via a Google OAuth refresh token (read-only scopes for /health).
const { http, need } = require('../lib');
const { viaClaude } = require('../via/mode');

async function accessToken() {
  const body = new URLSearchParams({
    client_id: need('GOOGLE_CLIENT_ID'), client_secret: need('GOOGLE_CLIENT_SECRET'),
    refresh_token: need('GOOGLE_REFRESH_TOKEN'), grant_type: 'refresh_token',
  });
  const r = await http('https://oauth2.googleapis.com/token', { method: 'POST', body });
  return r.access_token;
}

async function gmailHealth() {
  if (viaClaude('gmail')) return require('../via/store').health('gmail');
  const t = await accessToken();
  const r = await http('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: { Authorization: `Bearer ${t}` } });
  return `mailbox ${r.emailAddress}`;
}

async function calendarHealth() {
  if (viaClaude('calendar')) return require('../via/store').health('calendar');
  const t = await accessToken();
  const now = new Date().toISOString();
  const r = await http(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1&timeMin=${encodeURIComponent(now)}`,
    { headers: { Authorization: `Bearer ${t}` } });
  return `primary calendar ok (${(r.items || []).length} upcoming sampled)`;
}

// Events for [today, today+days) in the configured timezone. Read-only. Follows nextPageToken (max 3 pages).
async function listEvents(days, tz, todayStr) {
  if (viaClaude('calendar')) return require('../via/calendar').listEvents(days, tz, todayStr);
  const { normalize } = require('../calendarLogic');
  const t = await accessToken();
  const off = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
    .formatToParts(new Date()).find((x) => x.type === 'timeZoneName').value.replace('GMT', '') || '+00:00';
  const start = new Date(`${todayStr}T00:00:00${off}`);
  const end = new Date(start.getTime() + days * 86400000);
  const items = []; let pageToken, truncated = false;
  for (let i = 0; i < 3; i++) {
    const q = new URLSearchParams({ timeMin: start.toISOString(), timeMax: end.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '100', ...(pageToken ? { pageToken } : {}) });
    const r = await http(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${q}`, { headers: { Authorization: `Bearer ${t}` } });
    items.push(...(r.items || []));
    pageToken = r.nextPageToken;
    if (!pageToken) break;
    if (i === 2) truncated = true;
  }
  return { ...normalize(items), truncated };
}

module.exports = { gmailHealth, calendarHealth, listEvents, accessToken };
