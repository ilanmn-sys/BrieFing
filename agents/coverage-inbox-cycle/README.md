# coverage-inbox-cycle

Every 2h 08–18 Sun–Fri (`0 8-18/2 * * 0-5`). Disabled until a clean dry-run exists.

## What it does
Reads the MuckRack alert emails (sender `alerts@muckrack.com`, verified on Ilan's real inbox; one rolling thread holds 80+ messages, so it reads the thread's newest messages, not the search preview), drops ticker noise, non-outlets, excluded domains and syndicated copies, dedupes on normalised link, and **creates** items on the news board (446791074, group "New articles", max 15 a run): headline, link, publish date, publication, language, Type/Sentiment only if clear, Website? = `Pending Review`.

## Tools and limits
- Never edits, moves or deletes; no mail write; no Slack. Tools: Gmail search/get, board read + `create_item`, WebFetch.
- **Inferred:** it sets Outlet trigger = `Connect media outlet` because every existing item carries it (it appears to be the automation that links the Media Outlets board). Tier is left empty.

## Caveats and questions
- No source prompt on disk; built from the build-prompt row, the board's real columns and the MuckRack exclude list in the board description.
- Tier/Focus Area/Topic are left empty: nothing says how they were set. Say if the old agent filled them.
- Config: the `news` block in `config.json` (board, groups, column ids, caps), read from the real boards on 2026-10-07.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js coverage-inbox-cycle --dry-run --force`
