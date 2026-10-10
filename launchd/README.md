# Running the Command Center on the Mac (launchd)

Everything here is generated. Nothing is installed until you run `scripts/launchd.sh install`, and nothing runs an agent for real until you enable it in the dashboard after a clean dry-run.

## One-time setup

1. **Put the repo outside protected folders**, for example `~/BrieFing` (not Documents, Desktop or iCloud). macOS can block background jobs from reading those.
2. **Timezone.** The Mac must be on `Asia/Jerusalem`. launchd has no timezone setting; the generator refuses to run otherwise, rather than fire everything hours off.
3. **`.env`** (copy `.env.example`) can stay empty: without tokens the dashboard goes through Claude Code's connectors (see "Connectors mode" below). Leave `DRY_RUN` unset: nothing writes until you change it on purpose. Optional: `CLAUDE_BIN=/full/path/to/claude` if `claude` is not on the default PATH, and `LEARNINGLOG_PUBLISH_CMD` (below).
4. **Claude Code logged in** on this Mac, with the connectors the agents use (monday, Gmail, Slack, Google Calendar, Google Drive). Check them:
   ```
   node scripts/check-tools.js
   ```
   It runs `claude mcp list` and reports, per MCP server the agents rely on, `OK`, `NOT CONNECTED` or `MISSING`. Fix anything flagged before the first dry-run: an agent whose server is missing runs without those tools. (It checks servers, not individual tool names; the first `--dry-run` of each agent is the check for those.)
5. **Start the dashboard once by hand** (`npm start`, open http://localhost:3737 and `/health`) to confirm the connectors, then continue.

## Install

```
scripts/launchd.sh install      # generates launchd/out/*.plist, copies them to ~/Library/LaunchAgents, loads them
scripts/launchd.sh status       # what launchd has loaded
scripts/launchd.sh uninstall    # unloads and removes every com.ilan.cc.* job and the sync job
```

- **19 agent jobs** (`com.ilan.cc.<agent id>`), each calling `scripts/run-agent.js <id>` on its cron. A disabled agent skips itself, so installing all of them is safe.
- **The server job** (`com.ilan.cc.server`) keeps the dashboard running on port 3737 and starts it at login.
- **The snapshot job** (`com.ilan.cc.snapshot`) refreshes the dashboard's data through the connectors every 15 minutes, 07:00–21:00 Sun–Fri (it does nothing for a connector that has a token).
- **The learning-log sync** (`com.ilan.learninglog-sync`) runs 18:00 Sun-Thu.
- Logs: `logs/launchd/<job>.log`. Run history for the agents is in the dashboard's Agents tab.
- Re-run `install` after you change a schedule or add an agent; stale jobs are removed.

`morning-board-task-sync` was dropped (2026-10-07): the dashboard reads the board live. Disable its Cowork version when you switch over.

## Bringing an agent online (one at a time)

1. `node scripts/run-agent.js <id> --dry-run --force` and read what it would do.
2. Fix anything wrong, dry-run again. The Agents tab only lets you enable an agent after a clean dry-run.
3. Enable it in the dashboard. Its next scheduled run is a real one (set `DRY_RUN=0` in `.env` first if it writes; the server is dry-run by default).
4. After two clean real runs, disable the matching Cowork task. Never run a Cowork task and its twin at once.

## Sleep, wake and missed runs

launchd runs a missed calendar job when the Mac wakes (several missed runs of one job coalesce into one). The Agents tab flags an agent that missed two fires, so a Mac that slept through the morning shows up there. A laptop that is asleep or off at 08:00 cannot run the morning agents on time.

## The learning-log sync

`scripts/sync-learning-log.sh` publishes `LEARNING-LOG.md` (this repo is the source of truth) to the page Pepper reads. It checks the file (not empty, under 500KB, no secrets) and skips when nothing changed, then runs **your** publish command:

```
LEARNINGLOG_PUBLISH_CMD='...'   # in .env; receives the file path in $LEARNINGLOG_FILE
```

**Nothing is published until you set it.** The old Cowork-era script and the exact md.page update call are not on this machine, so I did not guess an endpoint: publishing is outward-facing and a wrong target would put the log on the wrong page. If your old `sync-learning-log.sh` still works, point the command at it. A failed or missing sync is recorded in `data/learninglog-sync/status.json` and shown as `learningLogSync` on `/health`.

## Connectors mode (no tokens)

For every connector without a token in `.env`, the dashboard uses Claude Code's own connectors on this Mac:

- **Reading:** `scripts/snapshot.js` runs `claude -p` and makes the exact calls the dashboard needs (for monday, the dashboard's own GraphQL through `all_monday_api`). It takes the tool results verbatim from the stream, so the model never retypes data. The dashboard then reads from `data/snapshot/` instantly. The header chip shows "Via connectors · updated N min ago"; click it to refresh now.
- **Writing:** each button that writes (Done, Apply all, the board-move endpoint, Gmail draft, Slack reply, DM to Pepper) runs one short `claude -p` with only the one tool it needs, and checks the call was made with exactly the intended arguments. Expect 20–40 seconds. `DRY_RUN` still blocks all of them until you set `DRY_RUN=0`.
- **Slack** has no unread markers through the connector: "needs you" means the latest message in a DM is not yours (last 7 days); channels show how many messages others posted in the last 2 days.
- **Calendar:** the connector's argument names could not be checked from the build session, so the model picks them from a plain instruction. If the calendar shows "last snapshot failed", send me the error.
- **Cost:** each snapshot is one to three short Claude runs (~30–90 s of model time); that is about 56 runs a working day.
- **Health:** `/health` shows each connector's snapshot age; older than 45 minutes is an error (the snapshot job is not running).
