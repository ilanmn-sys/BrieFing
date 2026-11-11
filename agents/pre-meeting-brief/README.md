# pre-meeting-brief

Hourly at :05, 07:05–18:05 Sun–Thu (`5 7-18 * * 0-4`, Asia/Jerusalem). Disabled, cloud mode dry-run, until a clean dry-run exists. Ilan approved the agent on 2026-11-11 ("build the pre-meeting brief, 30 minutes before").

## What it does
Each run reads the system clock and looks at Ilan's primary Google Calendar for meetings starting 30–90 minutes from now. It skips declined, all-day, `Focus:` blocks, meetings with no other human, meetings with more than 15 attendees, and meetings already briefed (ledger dedupe key `meeting-brief|<eventId>|<startISO>`, so a moved meeting is briefed once more for its new time).

For each meeting it builds a Hebrew brief of about 15 lines: who (role/company, external marked), what it is about, what is open with them (Open rows on the 🧠 Shared Memory ledger), correspondence from the last 14 days (Gmail and Slack, one line each with a link), what was agreed last time (monday Notetaker: decisions and open action items), what to bring or decide (decisions stay Ilan's, principle 8), one question to ask, and the event and Zoom/Meet links.

It **schedules** the brief in Pepper's Slack DM (by user id) for start − 30 minutes, headed `📨 MEETING BRIEF FOR ILAN`, and Pepper delivers it to Ilan on Slack and WhatsApp per `pepper/playbooks/morning-brief.md` A. If Pepper's DM fails it goes to Ilan directly, headed `⚠️ פפר לא זמינה — הבריף ישירות ממני`. One ledger row per delivery (Type Sent, Topic `meeting-brief`, Audience owner-only, State Closed).

## Tools and limits
- Tools: Calendar list/get, Gmail search/read, Slack search/read, Slack schedule and send (Pepper's DM, or Ilan's in the fallback, only), monday ledger read + `create_item` (ledger rows only), monday Notetaker read.
- Never messages an attendee or anyone else; no calendar, email or other board change.
- Dry run: builds and prints each brief, its `post_at` and the ledger row; sends and writes nothing.

## Caveats and questions
- **Hourly cadence, exact delivery:** the run is hourly, but the brief arrives at exactly T−30 because it is a Slack scheduled message. A scheduled message can't be edited or cancelled via the API: if the meeting is cancelled after the run, the brief still arrives (and a moved meeting gets a second, correct brief).
- **Late bookings:** a meeting booked less than 30 minutes ahead (or after the run that would have covered it) is briefed at the next run if it is still at least 5 minutes away, and sent immediately instead of scheduled. One that starts before the next run gets no brief.
- Slack search by attendee needs their Slack user id; when the search can't resolve it, the agent falls back to a name keyword search, which is noisier.
- "Last time" is matched by title, then by shared attendees: a recurring meeting whose title changes each time may find the wrong earlier occurrence.
- Ledger values (Surface `slack:dm-pepper`, Topic `meeting-brief`) are new keys; say if you want them named differently.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js pre-meeting-brief --dry-run --force`
