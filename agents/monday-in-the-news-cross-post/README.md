# monday-in-the-news-cross-post

09:00 daily (`0 9 * * *`). Disabled until a clean dry-run exists.

## What it does
Reads new top-level article posts in #monday_in_the_news (last 30 h), skips those already in #monday-global-agencies (last 4 days), and posts up to 5, one message each: `📰 <headline> — <outlet>` plus the URL. Silent when nothing is new. If the target channel can't be read it posts nothing (it can't dedupe).

## Tools and limits
- Tools: Slack read channel/thread and send. No DMs, no replies, no reactions. Posts come from Ilan's user with the "Sent using Claude" footer.
- Holds anything that looks internal, a draft, confidential or embargoed.

## Caveats and questions
- **Posting without a click (decided 2026-10-07):** Ilan confirmed it posts automatically, as the build prompt says. Watch the first week of dry-runs before enabling.
- The build prompt says `#global-agencies`; config's channel is `#monday-global-agencies` (id verified earlier). I used the config one.
- No source prompt; message format is my design.
- Config: the `news` block in `config.json` (board, groups, column ids, caps), read from the real boards on 2026-10-07.
- MCP tool names must be checked against `claude mcp list` on the Mac.

## Run
`node scripts/run-agent.js monday-in-the-news-cross-post --dry-run --force`
