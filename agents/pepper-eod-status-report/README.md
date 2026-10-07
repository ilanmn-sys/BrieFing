# pepper-eod-status-report

17:30 Sun–Thu (`30 17 * * 0-4`, Asia/Jerusalem). Disabled until a clean dry-run exists.

## What it does
1. **Harvest.** Reads Pepper's messages since the previous `📊 סיכום יום` report and, if she reported an observation, appends one `pepper` signal to §2 of `LEARNING-LOG.md` (marked `eod_ts:<ts>` so it is never harvested twice). Never edits §1, §3 or §4.
2. **Report.** One Hebrew DM to Pepper (by user id): done today, still open, overdue, tomorrow, 🤖 requests, 📌 waiting for a date, strategy outcome.
3. **Ask.** Closes with a request for today's observations; her reply is harvested by tomorrow's run.

Idempotent: if today's report is already in the DM it exits silently. Read-only on the board.

## Files
`prompt.md`, `allowed-tools.json` (board read, Slack read + send, `Edit(LEARNING-LOG.md)` only), `schedule.json`.

## Caveats
- **Inferred port.** The build prompt has one line for this agent ("Hebrew end-of-day report to Pepper; harvests her previous reply into the log; asks for today's observations"). The report layout, the `📊 סיכום יום` header and the `eod_ts` marker are my design; paste the Cowork prompt to reconcile.
- **Learning log timing.** The log says the Mac sync runs at 18:00, half an hour after this run, so the harvest publishes the same evening once `scripts/sync-learning-log.sh` exists (not built yet).
- "Done today" relies on each item's last-update date; an item edited after being completed could be miscounted.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js pepper-eod-status-report --dry-run --force`
