# daily-inbox-action-items-to-ilan-pa

08:05 daily (`5 8 * * *`). Disabled until a clean dry-run exists.

## What it does
Reads the inbox (same query as the dashboard's Gmail connector, 2-day window), reads each thread in full (R-22), classifies it (automated / waiting / fyi / decision / reply), creates up to 8 **Gmail draft replies** for threads where words are enough, and posts one short digest to #ilan-pa: decisions for Ilan (no draft, R-19), replies drafted, replies needed without a draft, waiting-on-others over 5 days. No calendar invites; no send.

## Tools and limits
- Tools: Gmail search/get/list_drafts/create_draft, Slack send (channel post). No send/forward/label tools, no calendar.
- The old "inbox-triage page" is not rebuilt: the dashboard's Email tab shows the same triage live.

## Caveats and questions
- Drafts are created in the thread, addressed only to people already on it; unknown facts become `[bracketed]` placeholders.
- The dashboard Email tab and this agent classify the same way but independently (the dashboard uses a model call, this one reads whole threads). Their verdicts can differ.
- No source prompt: digest format is my design.
- Config: the matching block in `config.json` (`agencies`, `influencers`, `inbox`, `linkedin`), read from the real boards on 2026-10-07.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js daily-inbox-action-items-to-ilan-pa --dry-run --force`
