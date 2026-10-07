# slack-flag-to-task

Every 2h 09–18 Sun–Thu (`0 9-18/2 * * 0-4`, Asia/Jerusalem). Disabled until a clean dry-run exists.

## What it does
- **Phase A.** Finds Slack messages Ilan flagged with 📌 and not yet marked 📥 (`hasmy::pushpin: -has::inbox_tray: after:<today-14d>`; searched twice, default channels then `im,mpim`). Max 10 per run. For each: creates a `📌 <title>` item in 📥 Pepper Tasks (no date, no status), dedupes on marker and subject (R-07), DMs Pepper in Hebrew to ask Ilan for a deadline, then reacts 📥.
- **Phase B.** Reads Ilan's reply to Pepper's ask, resolves it to a date (Hebrew/English table; ambiguous → leave empty and retry; "no deadline" → skipped), sets the Date column and confirms in Hebrew.

## State markers (item updates)
`AWAITING_DUE_DATE | channel | ts | permalink`, `PEPPER_ASK_TS:<ts>`, `ASK_FAILED | reason`, `DUE_DATE_SET | date | from_reply_ts`, `DUE_DATE_SKIPPED | from_reply_ts`.

## Files
`prompt.md`, `allowed-tools.json` (scoped: no Bash, no Gmail/Calendar, no move/all_monday_api), `schedule.json`.

## Caveats
- **Inferred port.** There was no source prompt on disk; this is built from build prompt §6A plus the real item formats on the board. Paste the Cowork prompt to reconcile.
- **R-13 (resolved 2026-10-07).** Ilan amended R-13 to name this agent as one of three allowed to create in 📥 Pepper Tasks; see the learning log §1 and §3.
- **Externally shared channels:** the 📥 reaction fails there, so dedupe relies on the board marker; a message can be re-picked once its item leaves 📥 Pepper Tasks.
- **No re-ask.** 8 of 9 existing 📌 items have waited undated up to ~3 weeks. Question: add a single re-nudge?
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js slack-flag-to-task --dry-run --force`
