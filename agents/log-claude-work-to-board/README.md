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
- **Where are the sessions?** The Cowork version presumably read Cowork sessions. This one reads Claude Code transcripts from `~/.claude/projects` on the Mac (`CLAUDE_PROJECTS_DIR` to override). Sessions in the Claude app/cloud are not on that disk and are not logged. Is that acceptable?
- **R-13 conflict.** The row says action items go to 📥 Pepper Tasks / 🔥 Today; R-13 forbids automations from creating there. The agent follows the build prompt, capped at 3 a run. Ilan to settle; the fix is one line in section 3 of the prompt.
- **Ledger is local.** If the Mac's `data/` folder is wiped, the last 48h of sessions are re-listed; the `CLAUDE_SESSION` marker on the item is the dedupe of last resort.
- Matching a session to an item is the model's judgement; unmatched sessions are never force-fitted.

## Run
`node scripts/list-sessions.js` (see what it would log), then `node scripts/run-agent.js log-claude-work-to-board --dry-run --force`
