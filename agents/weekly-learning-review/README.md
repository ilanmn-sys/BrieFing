# weekly-learning-review

Thu 16:00 (`0 16 * * 4`, Asia/Jerusalem). Disabled until a clean dry-run exists.

## What it does
- **Phase B (first): apply last week's decision.** Finds last Thursday's `📚 סקירה שבועית` DM, reads **Ilan's own** reply (`apply all` / `apply 1,3` / `skip`, or `אשר הכל` / `אשר 1,3` / `דלג`) and applies exactly the approved edits to `LEARNING-LOG.md` (§1 rules, §4 hypotheses), adds a §3 row per change, and logs the skipped proposals as one §2 `approval` signal. A "yes" from Pepper alone is not an approval. No reply after 7 days: the proposals lapse (noted in §3) and may be proposed again.
- **Phase A: propose.** Reads the §2 signals since the last review and DMs Pepper up to 5 proposals in Hebrew, each with the exact text and the S- numbers behind it. A new rule needs 2 independent signals or Ilan stating it himself; one instance becomes a §4 hypothesis. Nothing to propose still sends a one-line message, so a quiet week is distinguishable from a missed run.
- **R-12.** For every applied rule it greps `agents/*/prompt.md` and lists the agents that write to the board but don't carry the rule. It does not edit prompts; the list goes in the confirmation and the §3 row for a human or Claude Code session to fix.

State lives in the log: `review_ts:<slack ts>` in §3 or §2 means that review is closed. Read-only on the board; the only file it edits is `LEARNING-LOG.md`.

## Files
`prompt.md`, `allowed-tools.json` (Read, Grep, `Edit(LEARNING-LOG.md)`, Slack read + send), `schedule.json`.

## Caveats
- **Inferred port.** The build prompt has one line ("Distils §2 into proposed §1 rule changes, relays to Pepper, applies what I approve, appends §3"). The `📚 סקירה שבועית` header, the evidence thresholds, the 5-proposal cap and the `review_ts` marker are my design. Paste the Cowork prompt to reconcile.
- **Weekly cadence vs. apply.** Approval is applied at the *next* Thursday run, so a rule takes up to a week to land. If Ilan wants it same-day, run it by hand or add a daily apply-only run.
- **Who approves.** Log entry S-005 shows Pepper once replied "apply 1" for a log proposal. This port only accepts Ilan's own message. Say if Pepper's relay should count.
- §2 archiving (past ~40 entries) is flagged, never done.

## Run
`node scripts/run-agent.js weekly-learning-review --dry-run --force`
