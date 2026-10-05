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

// Events for [today, today+days) in the configured timezone. Read-only.
async function listEvents(days, tz, todayStr) {
  const t = await accessToken();
  const off = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
    .formatToParts(new Date()).find((x) => x.type === 'timeZoneName').value.replace('GMT', '') || '+00:00';
  const offset = off.length > 0 ? off : '+00:00';
  const start = new Date(`${todayStr}T00:00:00${offset}`);
  const end = new Date(start.getTime() + days * 86400000);
  const q = new URLSearchParams({
    timeMin: start.toISOString(), timeMax: end.toISOString(),
    singleEvents: 'true', orderBy: 'startTime', maxResults: '100',
  });
  const r = await http(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${q}`, { headers: { Authorization: `Bearer ${t}` } });
  return (r.items || [])
    .filter((e) => e.status !== 'cancelled')
    .map((e) => ({
      id: e.id, title: e.summary || '(no title)', link: e.htmlLink,
      allDay: !!e.start.date,
      start: e.start.dateTime || e.start.date, end: e.end.dateTime || e.end.date,
      location: e.location || null,
    }));
}

module.exports = { gmailHealth, calendarHealth, listEvents };
