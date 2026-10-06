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
2. **Approval in the dashboard.** H-05 was decided as "Apply all" in the dashboard. That button is not built yet, so APPLY mode still reads Ilan's reply in Pepper's DM.
3. **Tool names.** `allowed-tools.json` uses the MCP tool names from the cloud session (`mcp__monday_com__*`, `mcp__Gmail__*`, `mcp__Slack__*`, `mcp__Google_Calendar__*`). They must match `claude mcp list` on the Mac. If they differ, edit the file.
4. **`all_monday_api` is broad.** It is needed for `move_item_to_group` but can run any monday mutation. The prompt restricts its use; the tool list cannot. A narrow local endpoint for moves would remove the risk.

## Run it
```
node scripts/run-agent.js daily-board-strategy --dry-run --force   # prints the brief and intended writes, writes nothing
```
Then enable it from the Agents tab. The first live run should be watched.
