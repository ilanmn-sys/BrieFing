# weekly-linkedin-post-proposal

Wed 09:00 (`0 9 * * 3`). Disabled until a clean dry-run exists.

## What it does
Builds one LinkedIn post proposal for Ilan from published, positive/neutral Tier 1–2 coverage on the news board (last 14 days) and the rolling activity doc when configured: three hook options, one body (≤150 words, no emoji, ≤3 hashtags, one call to action), source links, and notes (what's unverified, what needs approval). Creates **one Gmail draft to Ilan only**. Forces nothing: if nothing suitable, it reports n/a.

## Tools and limits
- Tools: board read, Drive read, Gmail list_drafts + create_draft, WebFetch. Nothing is posted to LinkedIn.

## Caveats and questions
- **The rolling activity doc is not configured** (`linkedin.activityDocId` is empty): I don't know which doc it is. Send the Drive file id and the agent will use it; until then it uses the board alone.
- "The board" is taken to be the news board; tell me if it meant another.
- No source prompt and no past post on disk, so the style rules come only from the build prompt (concise, professional, no emoji, multiple hooks, a CTA). Paste a post you liked and I'll match it.
- Config: the matching block in `config.json` (`agencies`, `influencers`, `inbox`, `linkedin`), read from the real boards on 2026-10-07.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js weekly-linkedin-post-proposal --dry-run --force`
