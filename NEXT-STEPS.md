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

## C. Decisions (all made 2026-10-07)

1. R-13 amended: strategy, 📌 flags and log-claude-work may create in 📥 Pepper Tasks.
2. Routing board = Comms Routing (18432388543).
3. Intake sweeps `:comms:` only.
4. Cross-post posts automatically.
5. PR template note is drafted to Ilan.
6. News cleanup: mark, archive a week later.
7. pepper-inbox: 09:00, 13:00, 17:00 Sun–Fri; web read-only; no Gmail drafts.
8. Newsletter in English.
9. log-claude-work logs Mac and cloud sessions (cloud needs the claude-code-remote tools; see `check-tools`).
10. morning-board-task-sync dropped.

## D. Facts I need from you (I cannot find them)

- Press-page URL, and the Gmail query or label for email requests (intake). Also resolution targets per tier if you want Deadlines set automatically.
- ~~Narrative and Regev addresses~~ found (narrativegroup.co). Where Mandy Monday posts (no Slack posts since 1 Sep).
- The Drive file id of the rolling LinkedIn activity doc, and one LinkedIn post you liked.
- ~~Office-screen slideshow~~ found: "Media relations screens" (Google Slides).
- Confirm the spokespeople board is 457713771 (not the empty "Spokespeople" 8182656618).
- **The old Cowork prompts** for all agents, if you still have them. Pasting them lets me replace my spec-based versions with the real behaviour. This is the single most valuable input.

## E. Bring agents online, one at a time

Order: pepper-inbox, daily-board-strategy, slack-flag-to-task, pepper-eod-status-report, weekly-learning-review, then the rest as in the build prompt.

For each: dry-run, read it, fix, dry-run again, enable in the dashboard's Agents tab, set `DRY_RUN=0` on the server only when you are ready for real writes, watch the first real run. After **two clean real runs**, disable the matching Cowork task. Never run a Cowork task and its twin at once.

## F. Final pass (build prompt step 7)

Open the dashboard cold. Break one connector on purpose (a wrong token) and confirm the rest still render and the broken one shows an error with Retry. Force an agent delivery failure and confirm the Agents tab flags it.
