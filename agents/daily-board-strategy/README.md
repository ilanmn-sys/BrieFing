# daily-board-strategy

Hourly 07:00-12:00, Sun-Thu. The first run of the day does the strategy pass (PROPOSE mode); later runs handle Ilan's approval reply (APPLY mode). Ported from the Cowork skill of the same name.

## What it does
Reads the projects board, the last 7 days of email and today's calendar. Scores and routes every open item, then creates `🗓️ Daily Strategy — <date>` in 📥 Pepper Tasks and has Pepper DM Ilan a Hebrew brief (max 7 under today, a separate personal section of max 3, decisions listed apart). Board changes are proposals. The only silent writes are the section 8 housekeeping: Done items to ✅ Completed, and an empty Owner set to Ilan.

## Files
- `prompt.md`: fully self-contained. IDs are `{{placeholders}}` filled from `config.json` by the runner; an unknown placeholder fails the run.
- `allowed-tools.json`: the only tools the agent may call. No wildcards, no Bash, no Gmail send/draft/trash, no calendar writes.
- `schedule.json`: cron and enabled flag. **Disabled until it has a clean dry-run** (the Agents tab enforces this).

## What changed from the Cowork skill
- Hard-coded IDs and the Cowork folder path removed (config placeholders, repo-relative `LEARNING-LOG.md`).
- Section 1 rules R-04 to R-22 are written into the prompt, so the agent no longer depends on reading the log to obey them (R-12).
- Email sweep: calendar-noise query, skips automated senders, notes to self, broadcasts (over 15 recipients) and cc-only threads, reads the whole thread (R-22), and sends decisions to Ilan instead of to Pepper (R-19).
- Calendar: declined meetings are ignored and a multi-day Out of Office is context, not a meeting.
- Pepper is addressed by user id only (S-005). The send result is checked and reported in the `RESULT` line.
- The `ask_ts` marker is written after the DM is sent, with a REPAIR path if a run dies between the two.

## Open questions for Ilan
1. **R-13 vs this agent.** R-13 says automations write only to 🔁 Recurring or 📦 Active Projects, yet this agent creates its strategy item and the approved email tasks in 📥 Pepper Tasks (build prompt 6A). The prompt follows 6A. Amend R-13 to name this exception, or tell me to change the agent.
2. **Approval in the dashboard.** Built: the Tasks tab shows today's proposals with Apply all / Apply selected / Skip all (see below). It only works on items where the agent wrote the `PROPOSALS_JSON` line. APPLY mode in the agent remains as the Slack-reply fallback, and exits silently once the dashboard has handled the day (`APPLIED` marker).
3. **Tool names.** `allowed-tools.json` uses the MCP tool names from the cloud session (`mcp__monday_com__*`, `mcp__Gmail__*`, `mcp__Slack__*`, `mcp__Google_Calendar__*`). They must match `claude mcp list` on the Mac. If they differ, edit the file.
4. **Group moves go through a narrow local endpoint** (`POST /api/board/move`), so `all_monday_api` is no longer in this agent's tool list. The endpoint only performs a move that belongs to today's approved proposal (or a Done item into ✅ Completed), checks the item is still where the proposal saw it, never writes into legacy or excluded groups, caps 🔥 Today, limits 40 moves a day, logs every call to `data/board-moves.log`, and does nothing unless the server runs with `DRY_RUN=0`. The server must be running (`com.ilan.cc.server`) for the agent to apply moves.

## Run it
```
node scripts/run-agent.js daily-board-strategy --dry-run --force   # prints the brief and intended writes, writes nothing
```
Then enable it from the Agents tab. The first live run should be watched.

## Apply all (dashboard)
The agent writes one `PROPOSALS_JSON:` line on the strategy item next to the human list. The dashboard reads only that line, validates every operation (never into legacy or excluded groups, strict dates and labels, at most 5 operations per proposal), and re-checks each item against the values the agent saw (`fromGroup`, `fromDate`, `from`). Anything that changed since is skipped and reported. Email tasks that already exist are skipped. After applying it posts a confirmation with an `APPLIED | ... | by:dashboard` marker, sets the item Done, DMs Pepper, and appends an `approval` entry to the learning log naming every proposal Ilan did not select. Older strategy items (prose only, like 2026-10-05) have no JSON line and are shown as "apply by hand".
