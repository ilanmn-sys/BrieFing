# monthly-media-newsletter

1st of each month, 09:00 (the cloud scheduled task fires at 08:43) Asia/Jerusalem. Runs as a cloud scheduled task using the render-agent pattern. Moved here on 01.11.2026 from Ilan's Cowork desktop task (which produced the October 2026 draft, monday doc 18437978833).

## What it does
- Counts last month's coverage on the news board (446791074): total, YoY versus the same month last year, sentiment split, tier breakdown, top countries. Every number is counted; fill rates are shown.
- Reads #monday_in_the_news for story picks, the press releases page, and does its own Tier 1 competitor scan (no dependency on Pepper).
- Creates one monday doc "Media Newsletter — <Month YYYY> (Draft)" in the Communications-Team workspace, in the same format as the October 2026 doc, with two quickchart.io charts and a "Notes for the editor" section.
- DMs Ilan in Hebrew with the doc link and the ready-to-paste #media-relations announcement; Ilan posts it himself.

## Mode
`schedule.json` → `cloud.mode`. Starts as `dry-run` (prints the doc, the Slack draft and the DM). Switch to `live` after Ilan approves a dry-run.

## Run by hand
`node scripts/render-agent.js monthly-media-newsletter` prints the full instructions.
