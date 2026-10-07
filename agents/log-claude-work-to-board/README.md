# log-claude-work-to-board

18:00 daily (`0 18 * * *`, Asia/Jerusalem). Disabled until a clean dry-run exists.

## What it does
1. `node scripts/list-sessions.js` lists Claude Code sessions not yet logged: what Ilan typed, Claude's last answer, tools used, files edited. No tool output ever reaches the model, secrets are redacted, and the scheduled agents' own runs (first prompt `Today is ...`) are skipped.
2. For each session it finds the matching project item **by meaning** and posts one short update ending `CLAUDE_SESSION | id:<id> | date | lines:<n>`, then records the session in a local ledger (`data/agents/log-claude-work.ledger.json`) with `--mark`. A session that grows later is re-listed and only the new part is logged.
3. **No match: no item is created** (S-004). The session is counted as unmatched in the run summary.
4. A concrete follow-up stated by the session becomes a task: max 3 per run, ≤90 chars, whole phrase, owner Ilan, no date unless stated; 🔥 Today only if due today and under the cap, else 📥 Pepper Tasks.
5. Recurring/automated work: never dated; goes on its `🔁` item in 🔁 Recurring (created undated if missing). Dated automation items elsewhere are reported, not touched.

No Slack, email or calendar tools. Board writes are `create_update` and `create_item` only.

## Files
`prompt.md`, `allowed-tools.json` (scoped Bash: only the two `list-sessions.js` forms), `schedule.json`, plus `scripts/list-sessions.js` and its tests. Config gained `groups.activeProjects` (`topics`, the 📦 Active Projects group id, read from the real board; the agent never creates there).

## Caveats
- **Inferred port.** There was no source prompt. The build prompt row, S-004 and R-04/R-13 were the spec; the session source (local transcripts), the ledger and the update format are my design. Paste the Cowork prompt to reconcile.
- **Sessions covered (decided 2026-10-07): Mac and cloud.** Mac sessions come from `~/.claude/projects` via `scripts/list-sessions.js`. Cloud sessions (Claude Code on the web and in the app) come from the `claude-code-remote` tools `list_sessions` / `list_events`, read-only, as untrusted data; their ledger is `--remote-ledger` / `--mark-remote`. If those tools are not connected where the agent runs, it logs Mac sessions only and says "cloud sessions: not available here". `check-tools.js` shows that server as OPTIONAL.
- **R-13 (resolved 2026-10-07).** Ilan amended R-13 to name this agent as one of three allowed to create in 📥 Pepper Tasks; see the learning log §1 and §3.
- **Ledger is local.** If the Mac's `data/` folder is wiped, the last 48h of sessions are re-listed; the `CLAUDE_SESSION` marker on the item is the dedupe of last resort.
- Matching a session to an item is the model's judgement; unmatched sessions are never force-fitted.

## Run
`node scripts/list-sessions.js` (see what it would log), then `node scripts/run-agent.js log-claude-work-to-board --dry-run --force`
