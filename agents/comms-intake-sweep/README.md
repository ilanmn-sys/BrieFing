# comms-intake-sweep

Every 2h 08–18 Sun–Fri (`0 8-18/2 * * 0-5`, Asia/Jerusalem). Disabled until a clean dry-run exists.

## What it does
Collects new comms requests from #ask-comms, `:comms:` reactions (public and private channels only), the press page and email; **de-duplicates first** (Slack permalink, requester + subject within 14 days, doc URL, cross-door collision); classifies each (Domain, Tier, Type, Region, Requesting team, Deadline); picks an owner from the **Comms Routing** board (Confirmed group only); and creates one item per request on the Switchboard (board 18431118484), max 10 a run.

- Reads the **Comms Triage — Rules & Hypotheses** board (active rules) at the start of every run; those rules, not the prompt, decide classification and routing. Hard rules are also in the prompt (R-12 journalists always get a human, R-11 fast-lane exclusions, R-18 no owner rather than default to Ilan).
- Low confidence → Inbox, Status `New`, "needs your eyes". Not comms → Closed, `Deflected`. Past deadlines are kept and flagged, never re-dated.
- **Sends nothing and never reads DMs.** Acknowledging requesters is Brie Fing's job, after Ilan approves a batch. No Slack send, no reactions, no Gmail write tools. Board write tool: `create_item` only.

## Files
`prompt.md`, `allowed-tools.json`, `schedule.json`. Config gained: `boards.routingTable`, `boards.triageRules`, `routingTable`, `triageRules`, the full Switchboard column map under `requests.columns`, `requests.intake`, `requests.groupByTier`. `server/template.js` now accepts hyphens in placeholder paths.

## Caveats and questions
- **Routing board (confirmed 2026-10-07):** "Comms Routing — who owns what" (18432388543). `boards.routing` now points there.
- **Reaction emoji (decided 2026-10-07):** `:comms:` only.
- **Press page and email are not configured.** Nothing on disk says where press-page requests land or which mailbox/query to use (`requests.intake.pressPageUrl`, `requests.intake.emailQuery`, both empty). The agent says "not configured" in every RESULT instead of guessing. Give me the URL and the Gmail query/label.
- **Deadlines.** The tier resolution targets are not in config, so the agent sets a Deadline only when the requester stated one. Give me the targets per tier and I'll add them.
- **Board description mentions a DM sweep.** The build prompt says never read DMs; the agent follows the build prompt.
- **Inferred port.** No source prompt on disk; this is built from the build-prompt row, the Switchboard/Routing/Rules boards and the existing triage notes. Paste the Cowork prompt to reconcile.
- **Owner is a suggestion** until a human confirms (the board says so); the agent writes "Owner suggested" in Triage notes.
- Requester matching (Slack email → monday user) needs the Slack profile tool to return emails: untested.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js comms-intake-sweep --dry-run --force`
