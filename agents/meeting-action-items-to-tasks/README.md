# meeting-action-items-to-tasks

Hourly 09:00–19:00 Sun–Thu (`0 9-19 * * 0-4`, Asia/Jerusalem). Disabled until a clean dry-run exists.

Ilan, 2026-10-25: "an agent that takes action items from meetings and puts them into tasks, permanently".

## What it does
1. Reads monday Notetaker through the monday MCP: `explore_meetings` (access `OWN`, started in the last 30h) then `get_meetings_content` (summary + action items) for meetings Ilan attended that **ended in the last 26h** (catch-up window, so a missed hour or a slow recording is picked up later).
2. Keeps only action items whose owner is **Ilan** (Ilan Manassen / אילן). Empty or collective owners ("the team", "we") are not his unless the summary names him; they are listed in the RESULT (principle 6). Done items, ongoing objectives, recurring work and automations are skipped (R-15, R-04).
3. Dedupes (R-07) twice: on the marker `MEETING_ACTION | meeting:<meeting id> | item:<action item id>` in the board's updates of the last 3 days (in any group, so a task Ilan finished or tossed never comes back), and on meaning against open board items. A meaning-duplicate gets an `Also agreed in …` update carrying the marker instead of a new task.
4. Creates at most **8 tasks per run** in 📥 Pepper Tasks (🔥 Today only if due today and under the cap), R-25 format: `<emoji> <verb> <what> — <person>`, source language kept, `⚖️ Decide:` for decisions. Set at creation: owner Ilan, Source `Meeting Notetaker`, Effort, Priority (R-25 rubric), Date only when the meeting states or clearly implies one, Status empty. First update = the card (context, meeting + date, Notetaker link, quoted action item, `✅ Done when:`, marker).
5. Others' action items (agencies, colleagues) never become tasks: one `MEETING_OTHERS | meeting:<id>` update on the single open project item that clearly matches the meeting, else only listed in the RESULT. It never creates a project/topic item (S-004).

No Slack, email or calendar tools; board writes only. Notetaker or board read failure = `delivery: failed` with the error, never a clean "no meetings".

## Files
`prompt.md`, `allowed-tools.json` (scoped: Read, the three Notetaker tools, monday board reads, `create_item`, `create_update`, `change_item_column_values` — the last only for values on a task created in the same run; no Bash, Slack, Gmail, moves or `all_monday_api`), `schedule.json`, `test/meeting-action-items-to-tasks.test.js`.

## Caveats
- **R-13 (amended 2026-10-25, Ilan).** This agent is the 4th named exception allowed to create in 📥 Pepper Tasks, only Ilan's meeting action items as above. See the learning log §1 and §3.
- **Tool names.** Checked against the monday MCP in a cloud session on 2026-10-25: `mcp__monday_com__explore_meetings`, `mcp__monday_com__get_meetings_content`, `mcp__monday_com__search_meetings_content` (the last is allowed but not needed by the prompt; it is a keyword fallback). On the Mac the server may be named differently: run `node scripts/check-tools.js` first.
- **Action item shape** (seen on a real meeting): `{id, content, isDone, owner, dueDate}`, owner is a display name ("Ilan Manassen", "Sophie"), not a user id. The marker uses the Notetaker action-item id (stable across runs); if an item ever has no id, the prompt falls back to its 1-based position.
- **Source label.** `Meeting Notetaker` already exists on the Source dropdown (checked 2026-10-25); the agent never creates labels.
- **S-004 history.** The 15 fragments of 2026-09-11 came from Notetaker docs via an unidentified monday-side agent. If that agent is still active, it and this one could both file the same item. Watch the first live runs for fragment-style names in 📥 Pepper Tasks that this agent did not create (no `MEETING_ACTION` marker).
- **Window vs. runs.** Each meeting is seen by up to ~10 hourly runs; idempotency rests on the marker. If a card update fails after the create, the RESULT says `failed` and names the item; the meaning check is the fallback.

## Run
`node scripts/run-agent.js meeting-action-items-to-tasks --dry-run --force`
