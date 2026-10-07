# monthly-media-newsletter

1st of the month, 09:00 (`0 9 1 * *`). Disabled until a clean dry-run exists.

## What it does
Computes last month's coverage numbers from the news board (totals by tier, type, sentiment, top countries, earned vs paid; every column's fill rate shown), picks 5–7 highlights (Tier 1, Highlight (QBR), Salience) and creates **one Gmail draft to Ilan only**: `Media coverage newsletter — <Month YYYY> (DRAFT)`. A "Notes for the editor" block lists anything uncertain. It never sends and never invents reach or impressions.

## Tools and limits
- Tools: board read, Gmail list_drafts + create_draft, WebFetch. No send tool.
- Skips if a draft with the same subject exists.

## Caveats and questions
- No source prompt and no past newsletter on disk, so the structure is my design. Paste a past issue or the old prompt and I'll match the format and audience.
- **Language (decided 2026-10-07):** English; headlines keep their original language. No emoji.
- Config: the `news` block in `config.json` (board, groups, column ids, caps), read from the real boards on 2026-10-07.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js monthly-media-newsletter --dry-run --force`
