# quarterly-pr-template-refresh

1st of Jan/Apr/Jul/Oct, 09:00 (`0 9 1 1,4,7,10 *`). Disabled until a clean dry-run exists.

## What it does
Checks the Global Partnership Press Release Template (item 12272450331 on Official PR materials; file in Drive) against the **official** press kit and the latest earnings release (monday.com and ir.monday.com only): inline description, "About monday.com" boilerplate, customer count and other numbers. If anything changed it creates **one Gmail draft to Ilan** with a before/after table, source URLs and dates, the proposed announcement note, and what it could not verify. If nothing changed it does nothing. It never edits the template, the live Google Doc or the board.

## Tools and limits
- Tools: board read + updates, Drive read, WebSearch/WebFetch, Gmail list_drafts + create_draft.
- Built from the item's real update history (June, Sept and Oct 2026 refreshes): same three checks, same "only announce when the version actually changes" habit.

## Caveats and questions
- **Past refreshes posted `@everyone` on the board item.** This port drafts the note to you instead of posting it (Principle 1). Say if you want it to post directly.
- The live Google Doc id isn't on disk (updates say it was updated by hand), so the agent compares against the Drive file and says which version it read.
- The October 2026 refresh was already posted on 2026-10-04, so the first real run should find the template current.
- Official source URLs are limited to the two domains in config; there is no press-kit URL on disk.
- Config: the `news` block in `config.json` (board, groups, column ids, caps), read from the real boards on 2026-10-07.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js quarterly-pr-template-refresh --dry-run --force`
