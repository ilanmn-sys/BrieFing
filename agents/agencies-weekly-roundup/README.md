# agencies-weekly-roundup

Mon 08:30 (`30 8 * * 1`). Disabled until a clean dry-run exists.

## What it does
One Slack DM to Ilan: action items (with holders, R-16), momentum (closed this week), slipping (overdue/stale, flagged not re-dated, H-01) and decisions waiting on him (principle 8). Sources: projects-board agency items and their updates, the agency sync-notes board (473764901, last 14 days) and #monday-global-agencies (last 7 days). Max 25 lines. Read-only everywhere.

## Tools and limits
- Tools: board read + updates, Slack channel/thread read, Slack send (DM only).

## Caveats and questions
- Same agency keyword matching as the daily nudge.
- Whether the sync-notes board is the right source for "momentum" is my inference from the Scherf sync items; say if the old agent used something else.
- No source prompt: format is my design.
- Config: the matching block in `config.json` (`agencies`, `influencers`, `inbox`, `linkedin`), read from the real boards on 2026-10-07.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js agencies-weekly-roundup --dry-run --force`
