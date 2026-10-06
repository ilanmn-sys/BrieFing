const test = require('node:test');
const assert = require('node:assert');
const { normalize } = require('../server/calendarLogic');

const timed = (id, s, e, o = {}) => ({ id, summary: id, status: 'confirmed', start: { dateTime: s }, end: { dateTime: e }, htmlLink: 'l', ...o });
const declined = { attendees: [{ self: true, responseStatus: 'declined' }, { email: 'x@y.com' }] };
const accepted = { attendees: [{ self: true, responseStatus: 'accepted' }] };

test('events I declined are hidden and counted; accepted, tentative and no-attendee events stay', () => {
  const r = normalize([
    timed('a', '2026-10-06T10:00:00+03:00', '2026-10-06T11:00:00+03:00', declined),
    timed('b', '2026-10-06T12:00:00+03:00', '2026-10-06T13:00:00+03:00', accepted),
    timed('c', '2026-10-06T14:00:00+03:00', '2026-10-06T15:00:00+03:00', { attendees: [{ self: true, responseStatus: 'tentative' }] }),
    timed('d', '2026-10-06T16:00:00+03:00', '2026-10-06T17:00:00+03:00'),
  ]);
  assert.deepEqual(r.events.map((e) => e.id), ['b', 'c', 'd']); assert.equal(r.declinedHidden, 1);
});

test('cancelled events are dropped silently (not counted as declined)', () => {
  const r = normalize([timed('a', '2026-10-06T10:00:00+03:00', '2026-10-06T11:00:00+03:00', { status: 'cancelled' })]);
  assert.equal(r.events.length, 0); assert.equal(r.declinedHidden, 0);
});

test('a multi-week Out of Office becomes a banner, a 2-hour one stays a timed block', () => {
  const r = normalize([
    timed('ooo-long', '2026-09-27T00:00:00+03:00', '2026-10-11T00:00:00+03:00', { eventType: 'OUT_OF_OFFICE' }),
    timed('ooo-short', '2026-10-07T16:30:00+03:00', '2026-10-07T18:30:00+03:00', { eventType: 'OUT_OF_OFFICE' }),
    timed('meeting', '2026-10-06T10:00:00+03:00', '2026-10-06T11:00:00+03:00'),
    timed('boundary', '2026-10-06T00:00:00+03:00', '2026-10-06T20:00:00+03:00'), // exactly 20h counts as long
  ]);
  const by = Object.fromEntries(r.events.map((e) => [e.id, e]));
  assert.equal(by['ooo-long'].banner, true); assert.equal(by['ooo-long'].eventType, 'OUT_OF_OFFICE');
  assert.equal(by['ooo-short'].banner, false); assert.equal(by.meeting.banner, false); assert.equal(by.boundary.banner, true);
});

test('all-day events are banners with date strings; focus time and free/busy are carried through', () => {
  const r = normalize([
    { id: 'ad', summary: 'Holiday', status: 'confirmed', start: { date: '2026-10-12' }, end: { date: '2026-10-13' } },
    timed('f', '2026-10-06T10:00:00+03:00', '2026-10-06T10:30:00+03:00', { eventType: 'FOCUS_TIME', transparency: 'transparent' }),
  ]);
  assert.equal(r.events[0].allDay, true); assert.equal(r.events[0].banner, true); assert.equal(r.events[0].start, '2026-10-12');
  assert.equal(r.events[1].eventType, 'FOCUS_TIME'); assert.equal(r.events[1].free, true);
});

test('untitled events get a placeholder title', () => {
  assert.equal(normalize([timed('a', '2026-10-06T10:00:00+03:00', '2026-10-06T11:00:00+03:00', { summary: undefined })]).events[0].title, '(no title)');
});
