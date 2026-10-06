// Calendar normalisation. Found by checking the real calendar:
//  - most events in a vacation week were ones I had DECLINED, so they must not show as meetings;
//  - a 2-week Out of Office arrives as one timed event, which must be a banner, not a full-height block.
const DAY = 86400000;

function normalize(items) {
  const out = []; let declined = 0;
  for (const e of items || []) {
    if (e.status === 'cancelled') continue;
    const me = (e.attendees || []).find((a) => a.self);
    if (me && me.responseStatus === 'declined') { declined++; continue; }
    const allDay = !!(e.start && e.start.date);
    const start = e.start.dateTime || e.start.date, end = e.end.dateTime || e.end.date;
    const long = !allDay && Date.parse(end) - Date.parse(start) >= 20 * 3600000; // spans (nearly) a whole day or more
    out.push({
      id: e.id, title: e.summary || '(no title)', link: e.htmlLink, allDay, start, end,
      eventType: e.eventType || 'DEFAULT', banner: allDay || long, free: e.transparency === 'transparent', location: e.location || null,
    });
  }
  return { events: out, declinedHidden: declined };
}

module.exports = { normalize, DAY };
