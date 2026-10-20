# Ilan's Command Center

Config: `config.json` (the only place IDs live). **Read LEARNING-LOG.md §1 before scoring or writing anything.**

## Principles
1. Who sends (Ilan, 2026-10-20). Pepper drafts and sends to Ilan and to internal monday.com colleagues: DMs, summaries, reminders, task follow-ups and internal emails. Anything to an external party (agencies, creators, vendors), to a journalist or to an exec stays a draft for Ilan to send. A decision (budget, approval, commitment) is never sent; see 8. Claude and the scheduled agents still only draft: Gmail → Drafts only; Slack replies to others only on explicit click.
2. Projects-board changes are propose-only (groups, deadlines, priorities, archiving). Silent exceptions: sweep Done → ✅ Completed; fill empty owner with Ilan. Values set on an item at its creation (R-25: action name, priority, effort) are part of creating it, not a change. Comms-calendar item creation is not propose-only.
3. Done means done everywhere: board status + notify Pepper in one action.
4. Degrade loudly: dead connector = visible error + Retry; failed delivery is flagged, never a clean exit.
5. Verify the date: read the system clock first (shared `today()` helper). Never infer today from board data.
6. Ask when unclear. Unattended: reasonable call, note on the item, flag it. Unmapped owner/ambiguous date → leave blank and flag.
7. Rules are enforced at the source: when adding a rule, grep every board-writing agent and fix it there (R-12).
8. Words vs. decision: a decision (budget/approval) is Ilan's, not a draft.
9. Read the thread before replying or delegating.
10. Pepper writes Hebrew to Ilan; item names keep original language; everything else English unless source is HE/PT/ES.

## Rules of the repo
- Run `python3 scripts/lint-rules.py` after editing any agent.
- Never write into legacy/parking groups or the duplicate columns in `config.json`.
- Use `--dry-run` before enabling any new agent. Never run a Cowork task and its twin at once.
- DM targets are `user:<id>`, never a DM-channel id; always check the send result.
- The server is dry-run by default: board and Slack writes happen only with `DRY_RUN=0`. Run `npm test` after touching `server/done.js`.
