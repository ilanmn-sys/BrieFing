# comms-request-collector

Hourly 08–19 Sun–Fri (`0 8-19 * * 0-5`, Asia/Jerusalem). Disabled until a clean dry-run exists. Cloud routine: `trig_01CiYhTrBWsxdbmc1BkV3Gfi` ("Agent: comms-request-collector (dry run)", minute :53, disabled). The Command Center shows the 📥 messages not filed yet (no ✅, no 📌) above the Requests tabs, with a Run now button.

## What it does
Files Slack messages Ilan reacted to with :inbox_tray: (last 3 days, all channel types) into the Comms Requests board (Switchboard) inbox, then marks them :white_check_mark:. Dedupes on the Slack permalink in the Slack thread column (an existing item gets an update instead). Brie Fing, the request desk agent, takes over from the inbox.

## Guard
slack-flag-to-task adds :inbox_tray: under Ilan's name to every 📌 message it turns into a task. A message that also carries Ilan's :pushpin: is therefore skipped and reported as "skipped: 📌 task".

## Files
`prompt.md` (Ilan's collector instructions, 2026-10-13, with the repo's standard checks), `allowed-tools.json` (Slack read, reactions and add-reaction only, no send; monday read, users, create item and update), `schedule.json`.

## Caveats
- Brie Fing may have its own Slack reaction trigger (Brie suggested `inbox_tray` on 2026-10-08). If it is set to :inbox_tray:, both would act on the same reaction.
- comms-intake-sweep (dry-run, not live) sweeps the :comms: reaction into the same board. Do not run both on the same emoji.
