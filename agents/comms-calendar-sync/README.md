# comms-calendar-sync

08:00 Sun–Thu (`0 8 * * 0-4`, Asia/Jerusalem). Disabled until a clean dry-run exists.

## What it does
Scans Ilan's Google Calendar (today + 45 days), four Slack channels (last 3 days, never DMs) and the projects and Switchboard boards, and **creates** items on the shared 2026 comms calendar (board 3822310880, group `2026\ External`) for only five kinds of thing: scheduled external events, confirmed interviews, running campaigns, press-release go-live dates, filmings. Prep calls, agency syncs, internal planning, product-launch status syncs and DACH/Brazil/Mexico check-ins are skipped; **when in doubt, skip**.

- Dedupes first, on a `CALSYNC | ref:` marker and on meaning (R-07). A thing already on the board with a different date is reported, not changed.
- Owner comes from the region map in `config.json` (`commsOwners`); unmapped or ambiguous → left empty and flagged.
- Item: clean title ≤90 chars, timeline date, status `Scheduled`, category/audience only when obvious. Max 8 creations a run.
- A prep call for an existing recording/interview item becomes one update on that item.
- Never edits, moves or deletes existing items; never writes to Complete, Internal or 2023–2025 groups. No Slack, email or calendar-write tools.

Per the principles, comms-calendar item creation is not propose-only, so it writes directly.

## Files
`prompt.md`, `allowed-tools.json`, `schedule.json`. Config gained a `commsCalendar` block (board, groups, column ids, look-ahead, cap), read from the real board. `server/template.js` gained `{{json path}}` for the owner map.

## Caveats
- **Inferred port.** The build prompt row is the spec; there was no source prompt. The marker, the 45-day window, the channel list, the 8-item cap and the update format are my design. Paste the Cowork prompt to reconcile.
- **Channels:** I used ask-comms, media-relations, communications-team and monday-global-agencies (not #ilan-pa, #monday_in_the_news). Say if the list differs.
- **Existing-item dates:** the board holds 1,281 items, so only the two 2026 groups are read for dedupe. An event filed in another group could be duplicated.
- **"External" is a judgement** from the title, description and attendees; the skip list and "when in doubt, skip" carry the safety.
- **Category labels:** the Categories dropdown has no "Interview" or "Filming" label; the agent uses the closest (Proactive PR, Speaking Opp) or leaves it empty.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js comms-calendar-sync --dry-run --force`
