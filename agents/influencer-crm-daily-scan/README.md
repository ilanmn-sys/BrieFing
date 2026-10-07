# influencer-crm-daily-scan

08:00 daily (`0 8 * * *`). Disabled until a clean dry-run exists.

## What it does
Reads Narrative/Regev and influencer Gmail threads and Pepper's/Mandy's posts in #ilan-pa, then: creates up to 10 email-log items (deduped on a `THREAD:<id>` marker), refreshes **Latest Post** for Top 15 / Active Offers / High-priority influencers (up to 25, only from what it actually finds), posts factual updates, and DMs Ilan a summary dated from the clock. It never changes Stage, Priority, Owner, Deal Value, Followers or Next Follow-up: offers, prices and stage changes go to Ilan as decisions.

## Tools and limits
- Fixes the three known bugs: header date from the clock, DM by user id with the send result checked, X metrics reported as unavailable (Nitter down), never filled.
- Tools: Gmail read, Slack read + send (DM), board read/create/update/`change_item_column_values` (used only for Latest Post), WebSearch/WebFetch.

## Caveats and questions
- **Delivery:** the build prompt says it "emails me a summary"; S-005 shows the real delivery was a Slack DM. Gmail is drafts-only, so I used the DM. Say if you want a draft in the mailbox too.
- Gmail query: `newer_than:2d (narrativegroup.co OR creator OR influencer) -from:me`. Narrative is narrativegroup.co (Margo Aronovic, Regev Gur), found in your inbox.
- Mandy is "Mandy Monday" (mandy@monday.com). She has no Slack posts since 1 Sep, so where she posts is unconfirmed; the agent reads #ilan-pa.
- `change_item_column_values` is a broad tool; the prompt restricts it to the Latest Post column.
- No source prompt: board columns are real, the rest is my design.
- Config: the matching block in `config.json` (`agencies`, `influencers`, `inbox`, `linkedin`), read from the real boards on 2026-10-07.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js influencer-crm-daily-scan --dry-run --force`
