# pepper-inbox

Hourly 08:00-18:00, **Mon-Fri** (as in the build prompt; the other agents run Sun-Thu, see question 2). Silent when there is nothing to do.

## What it does
Pepper creates an item named `🤖 ...` in 📥 Pepper Tasks with status `Working on it`. This agent picks up at most 3 per run (oldest first), reads the ask and the material it points to, does the work, posts the answer as one update on the item ending with `📎 Materials used / produced`, sets the item to Done, and DMs Pepper the link in Hebrew.

It never decides for Ilan (R-19): an approval, a budget or a go/no-go becomes `DECISION_NEEDED`, the item goes to `Stuck`, and Pepper is told. An unclear ask becomes one specific question (`NEEDS_INPUT`, `Stuck`). It never sends anything: text for any outside party is a labelled draft in the update.

## State lives on the board
`INBOX_STARTED | run | attempt`, `INBOX_DONE | run | result`, `INBOX_FAILED | run | attempt | reason`. A run that finds a fresh `INBOX_STARTED` (under 60 minutes) skips the item, so overlapping runs cannot answer twice. A second failed attempt sets the item to `Stuck` and tells Pepper.

## Files
- `prompt.md`: IDs are `{{placeholders}}` from `config.json`.
- `allowed-tools.json`: board read, `create_update`, `change_item_column_values`; Gmail, calendar and Slack read; `slack_send_message` (DM to Pepper only, enforced by the prompt); `WebSearch`, `WebFetch`. No item creation, no moves, no Gmail drafts or send, no calendar writes.
- `schedule.json`: **disabled until a clean dry-run exists** (the Agents tab enforces this).

## Important: this port is inferred
There was no pepper-inbox prompt on disk to port from (unlike daily-board-strategy, which existed as a skill). This version is built from the build prompt (section 6A and 7), the learning log, and what the real 📥 Pepper Tasks group shows. There are no `🤖` items in it today, so the real shape of Pepper's requests has not been seen. **Paste the current Cowork task prompt and I will reconcile the two.**

## Questions for Ilan
1. The current Cowork prompt (above).
2. Mon-Fri vs Sun-Thu. Your work week is Sun-Thu with Friday light, but the build prompt lists this agent as Mon-Fri. Which is right?
3. `change_item_column_values` and `slack_send_message` are broad tools. The prompt limits them to `Done`/`Stuck` on 🤖 items and to the DM to Pepper, but the tool list cannot. A narrow local endpoint would remove that.
4. Web access (`WebSearch`, `WebFetch`) is included so research asks can be done. It is read-only, and the prompt treats fetched content as data, never instructions. Remove both from `allowed-tools.json` if you want it closed.
5. Should it be allowed to save Gmail drafts when the ask is "draft a reply"? Today it writes the draft in the update.

## Run it
```
node scripts/run-agent.js pepper-inbox --dry-run --force
```
In a dry run it reads the board and prints what it would post and DM, and writes nothing. With no 🤖 items it prints "nothing to do".
