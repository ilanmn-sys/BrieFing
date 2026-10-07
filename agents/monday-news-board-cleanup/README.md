# monday-news-board-cleanup

Sun 08:00 (`0 8 * * 0`). Disabled until a clean dry-run exists.

## What it does
Finds noise on the news board (stock-ticker blurbs, non-outlet spam, syndicated duplicates) among items created in the last 14 days. **Two steps a week apart:** it first *marks* candidates (Website? = `Not coverage` or `Duplicate`, plus a `NEWS_CLEANUP | marked:<date>` update); a week later it *archives* items still marked that no person touched. A person who changes the status or replies has vetoed the archive. Genuine coverage is never touched. Caps: 40 marks, 40 archives per run.

## Tools and limits
- Board writes: Website? status on candidates, updates, and `archive_item` (recoverable in monday for 30 days).
- **Broad tool:** archiving needs `all_monday_api` (no narrow archive tool exists). The prompt limits it to the `archive_item` mutation, but the tool itself can do more. This is the same open question as the other agents' broad tools.

## Caveats and questions
- **Two steps (decided 2026-10-07):** mark, then archive a week later unless a person vetoes.
- No source prompt; classification is the model's judgement, so dry-run it and read the marks before enabling.
- Config: the `news` block in `config.json` (board, groups, column ids, caps), read from the real boards on 2026-10-07.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js monday-news-board-cleanup --dry-run --force`
