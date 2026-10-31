# elevate-nyc-content-watch

Daily until 30.11.2026. Runs as a **cloud scheduled task** bound to Ilan's Claude Code session (not launchd: it needs Bright Data, which only the cloud environment has). There is deliberately no `schedule.json`, so the Mac runner never picks it up.

## What it does
Watches the 21 creators who came to Elevate NYC (28–29.10.2026) across Instagram, TikTok, YouTube, X, LinkedIn (via search only) and the Creator Buzz shared channel. Finds posts that mention monday.com or Elevate, logs them, writes the newest one to the creator's CRM item (Latest post column only), and DMs Ilan in Hebrew when there's something new.

## Files
- `prompt.md`: the instructions.
- `agents/elevate-nyc-content-watch/state/roster.json`: creators and profile URLs (unresolved handles are filled in on the first run).
- `agents/elevate-nyc-content-watch/state/found.json`: dedup log of posts already reported.

## Limits
- Read-only except: `found.json`, `roster.json`, the CRM Latest post column, one Slack DM to Ilan.
- LinkedIn is checked through Google search only, so LinkedIn posts can be missed.
- Stories disappear after 24h and mostly aren't returned by the datasets, so story mentions will be missed unless Creator Buzz posts them.
