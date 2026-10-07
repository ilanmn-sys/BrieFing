# refresh-news-screens

Mon 08:00 (`0 8 * * 1`). Disabled until a clean dry-run exists.

## What it does
Prepares the office-screens lineup: up to 20 recent coverage slides (Tier 1 → 3, positive/neutral, real outlets; marked NEW or ALREADY ON SCREENS), up to 5 spokesperson slides (from the monday spokespeople board, skipping anyone needing a new bio or photo) and up to 3 channel highlights. It writes **one Google Doc** `Office screens plan — <date> (DRAFT)`; it never edits the live slideshow or any board item.

## Tools and limits
- Tools: board read, Slack channel read, Drive search + create_file.
- A person sets the board status `Done - added to Screens deck` after adding a story.

## Caveats and questions
- **Where is the live slideshow?** Nothing on disk says (a Google Slides deck? a monday-all MiniSite?). Until you tell me, the agent produces the plan, not the deck. Tell me the deck type/location and I can wire a real refresh.
- The board titled "Spokespeople" (8182656618) is an empty template; the news board's "monday spokespeople" relation points to **457713771**, which is what this uses. Confirm.
- Drive `create_file` is untested; set `news.screens.draftFolderId` to choose the folder.
- Config: the `news` block in `config.json` (board, groups, column ids, caps), read from the real boards on 2026-10-07.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js refresh-news-screens --dry-run --force`
