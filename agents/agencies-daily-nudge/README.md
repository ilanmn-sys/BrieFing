# agencies-daily-nudge

08:00 Mon–Fri (`0 8 * * 1-5`). Disabled until a clean dry-run exists.

## What it does
One Slack DM to Ilan (by user id) listing open agency items (projects-board items whose name mentions Scherf, Another Brazil/BR, Another Mexico or Another Co): overdue, due this week, stale (7+ days), nobody named. Deadlines in titles (`עד 10.8`) count (R-05). Per H-01 it flags slipping chases and never re-dates. Silent when there are none. Read-only on the board.

## Tools and limits
- Tools: board read + updates, Slack send (DM only).

## Caveats and questions
- The agency match is by keyword in the item name (config `agencies.names`); an agency item without the name in its title is missed. Say if the names or the matching should differ.
- English message, item names keep their language (build prompt doesn't say Hebrew for Ilan's own DMs).
- No source prompt: format is my design.
- Config: the matching block in `config.json` (`agencies`, `influencers`, `inbox`, `linkedin`), read from the real boards on 2026-10-07.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js agencies-daily-nudge --dry-run --force`
