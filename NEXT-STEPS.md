# Next steps: everything still open, in order

Work top to bottom. Send me the output or answer after each part and I fix what it shows. Parts A and B need your Mac; C and D are decisions I can't make for you.

## A. Get it running on the Mac (blocks everything else)

1. **Get the code.** `git clone https://github.com/ilanmn-sys/briefing.git ~/BrieFing && cd ~/BrieFing && git checkout claude/kind-babbage-x6gaqa`. Keep it outside Documents, Desktop and iCloud. Needs Node 20+ (`node -v`). No `npm install`: the server has no dependencies.
2. **Set the Mac timezone to Asia/Jerusalem** (System Settings, General, Date & Time). launchd cannot do timezones; the installer refuses otherwise.
3. **Create `.env`**: `cp .env.example .env`, then fill in:
   - `MONDAY_API_TOKEN`: monday, profile picture, Developers, My access tokens.
   - `SLACK_TOKEN`: a user token with the scopes listed in `.env.example`. You must be a member of #ilan-pa, #media-relations, #communications-team and #monday-global-agencies (they are private).
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`: Google Cloud OAuth with Gmail (read, compose), Calendar (read) and Drive (read).
   - `ANTHROPIC_API_KEY`: for the dashboard's email triage.
   - Leave `DRY_RUN` unset. Nothing writes until you decide.
4. **Start it:** `npm start`. Open http://localhost:3737 and http://localhost:3737/health. **Send me the `/health` output.** Each connector should say `ok`; anything else I fix first.
5. **Check Claude Code and its connectors:** `claude --version`, then `node scripts/check-tools.js`. **Send me the output.** Every MCP server must be `OK` (monday_com, Gmail, Slack, Google_Calendar, Google_Drive). If one is missing, connect it in Claude Code (`claude mcp add ...` or your connectors) and re-run.
6. **First agent dry-run:** `node scripts/run-agent.js daily-board-strategy --dry-run --force`. **Send me what it prints.** It writes nothing; it shows the brief and the writes it would make.

## B. Install the schedules (only after A is green)

7. `scripts/launchd.sh install`, then `scripts/launchd.sh status`. All agents stay disabled, so nothing runs for real yet.
8. **Publishing the learning log.** Find your old `sync-learning-log.sh` (it published to ilanmn.md.page/pepperandclaudprodprocess). Send me its contents (hide any token), or put its command in `.env` as `LEARNINGLOG_PUBLISH_CMD`. Test: `scripts/sync-learning-log.sh`; check `/health` shows `learningLogSync: ok`.

## C. Decisions only you can make (answer in one message)

| # | Question | My recommendation |
|---|---|---|
| 1 | R-13 forbids automations from creating in 📥 Pepper Tasks / 🔥 Today, but the strategy, Slack-flag and log-claude-work agents do (per your build prompt). Amend R-13 or change the agents? | Amend R-13 to name those three agents as exceptions. |
| 2 | Which board is "Routing"? The Switchboard triage notes point to **Comms Routing — who owns what** (18432388543), not your projects board. | Use 18432388543; I will correct `boards.routing`. |
| 3 | Reaction emoji for intake: `:brie:` (build prompt) or `:comms:` (board description)? Currently both. | Keep the one the team really uses. |
| 4 | Cross-post to #monday-global-agencies posts without a click from you. Keep, or turn into a draft DM to Pepper? | Keep for a week of dry-runs, then decide. |
| 5 | Quarterly PR template note: draft it to you (current) or post `@everyone` directly like before? | Keep as a draft. |
| 6 | News cleanup: mark then archive a week later (current) or archive in one step? | Keep two steps. |
| 7 | pepper-inbox: Mon–Fri (build prompt) or Sun–Thu? May it use web tools and save Gmail drafts? | Sun–Thu; web read-only yes; drafts yes. |
| 8 | Newsletter: English or Hebrew? | English. |
| 9 | `log-claude-work-to-board` reads only Claude Code sessions on this Mac, not the Claude app or cloud sessions. Acceptable? | Yes for now. |
| 10 | `morning-board-task-sync` is not ported (the dashboard reads the board live). Fine to drop? | Drop it. |

## D. Facts I need from you (I cannot find them)

- Press-page URL, and the Gmail query or label for email requests (intake). Also resolution targets per tier if you want Deadlines set automatically.
- Narrative and Regev sender addresses; where Mandy posts (I assumed #ilan-pa).
- The Drive file id of the rolling LinkedIn activity doc, and one LinkedIn post you liked.
- Where the office-screen slideshow lives (Google Slides? something else?).
- Confirm the spokespeople board is 457713771 (not the empty "Spokespeople" 8182656618).
- **The old Cowork prompts** for all agents, if you still have them. Pasting them lets me replace my spec-based versions with the real behaviour. This is the single most valuable input.

## E. Bring agents online, one at a time

Order: pepper-inbox, daily-board-strategy, slack-flag-to-task, pepper-eod-status-report, weekly-learning-review, then the rest as in the build prompt.

For each: dry-run, read it, fix, dry-run again, enable in the dashboard's Agents tab, set `DRY_RUN=0` on the server only when you are ready for real writes, watch the first real run. After **two clean real runs**, disable the matching Cowork task. Never run a Cowork task and its twin at once.

## F. Final pass (build prompt step 7)

Open the dashboard cold. Break one connector on purpose (a wrong token) and confirm the rest still render and the broken one shows an error with Retry. Force an agent delivery failure and confirm the Agents tab flags it.
