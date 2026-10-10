// Google Calendar through Claude Code's Calendar connector. The snapshot holds 14 days of events from today;
// listEvents(days) slices it. The event objects follow the Google Calendar API (summary, start, end, attendees,
// eventType, transparency), so calendarLogic.normalize is reused unchanged.
// The connector's list_events arguments are not pinned here (its schema could not be checked from the build
// session), so the model chooses them from a plain instruction; the window is re-checked on our side.
const store = require('./store');
const { normalize } = require('../calendarLogic');

const DAYS = 14;
function window(todayStr, tz, days = DAYS) {
  const off = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(new Date()).find((x) => x.type === 'timeZoneName').value.replace('GMT', '') || '+00:00';
  const start = new Date(`${todayStr}T00:00:00${off}`);
  return { start, end: new Date(start.getTime() + days * 86400000) };
}
const spec = (todayStr, tz) => {
  const { start, end } = window(todayStr, tz);
  return { key: 'calendar:events', server: 'Google_Calendar', tool: 'list_events',
    instruction: `list every event on the primary calendar from ${start.toISOString()} to ${end.toISOString()} (timezone ${tz}), with recurring events expanded into single events, ordered by start time, as many as the tool allows (at least 250).` };
};

// Pure: the tool's JSON -> Google-style event list, whatever the wrapper key is.
function events(parsed) {
  if (Array.isArray(parsed)) return parsed;
  for (const k of ['items', 'events', 'results', 'data']) if (parsed && Array.isArray(parsed[k])) return parsed[k];
  return [];
}

async function listEvents(days, tz, todayStr) {
  const snap = store.read('calendar');
  if (!snap) throw new store.SnapshotMissing('no Calendar snapshot yet: run "node scripts/snapshot.js"');
  const { start, end } = window(todayStr, tz, days);
  const inRange = (snap.data.items || []).filter((e) => { const s = Date.parse((e.start && (e.start.dateTime || e.start.date)) || ''); const en = Date.parse((e.end && (e.end.dateTime || e.end.date)) || ''); return en > start.getTime() && s < end.getTime(); });
  return { ...normalize(inRange), truncated: false, snapshotAt: snap.at };
}

module.exports = { spec, events, listEvents, window, DAYS };
