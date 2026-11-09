---
id: morning-brief
last_verified: 2026-11-09
owner: Ilan
---
# Playbook: morning brief

Two outputs, kept apart (src: MEMORY.md:66-68; Ilan 21.10): **A** Ilan's Hebrew daily brief: built by Claude, delivered by Pepper on three channels. **B** the brief in the Ilan+Or group: coverage, important events in the company calendar, prep for the day, social mentions.

**A replaced (Ilan, 09.11).** Pepper no longer builds her own brief A from the `🗓️ Daily Strategy` item. Claude's scheduled brief (07:47, Sun-Thu) builds it and DMs it to Pepper with the header `📨 BRIEF FOR ILAN`. Pepper delivers it; Ilan works from it by replying to her.

**Trigger.** Sun-Thu. A: Claude's DM `📨 BRIEF FOR ILAN | DD.MM` arrives in Pepper's Slack DM (~07:50). B: 07:30, cron `morning-brief-ilan-or-group` (src: MEMORY.md:58-64).
Gate first: system clock (P5), then `is_holiday.py` (exit 0 = stop) (src: HEARTBEAT.md:24-37). Friday and Saturday: no brief (src: Ilan 21.10).

**Steps: A, deliver Ilan's brief**
1. Check the date in the header is today (P5). An older brief → don't deliver; tell Ilan it is stale.
2. Deliver the text as is (no rewording, no additions) on all three, and check each result:
   - Slack DM `user:U038UEUQC1Y`.
   - WhatsApp DM to Ilan (`surfaces/dm-ilan.md`). Same text; Slack link markup becomes plain URLs.
   - Email to ilanmn@monday.com, subject `☀️ בריף יומי | <weekday> DD.MM`, body = the brief with clickable links. This is a send to Ilan (P1), not a draft.
3. A failed channel → say which one in the Slack DM, with a retry (P4). Never a silent skip.
4. **Working from the brief.** Ilan replies to Pepper (Slack thread or WhatsApp) with an item number and a verb: `1 שלח`, `3 טיוטה`, `2 תזכירי לי ב-15:00`, `4 תעבירי לקלוד`. Pepper does it under her normal rules:
   - Internal colleague or Ilan → sends; external, journalist or exec → draft only, Ilan sends (P1, R-11).
   - A decision (budget, approval, commitment) → never sent; `⚖️` item to Ilan (P8, R-19).
   - Read the thread before replying (P9). Work Pepper can't do → `🤖` item in 📥 Pepper Tasks for Claude.
   - Ledger row per action (R-34). Board changes stay propose-only (P2).
5. No brief from Claude by 08:30 → tell Ilan in the Slack DM that the brief didn't arrive (P4). Do not build a substitute.

**Steps: B, Ilan+Or brief**
1. Every item has its original link (src: MEMORY.md:39, :198).
2. Live-check against the group history (src: LESSONS.md:2653-2673). Drop widget-only and self-admitted noise (src: LESSONS.md:870-941).
3. Hebrew format per `surfaces/wa-ilan-or.md`. Nothing found → send nothing (P-39b).

**Output.** A: the same brief on Slack DM, WhatsApp DM and email. B: one WhatsApp message to `wa-ilan-or`.

**Done when.** A was delivered on all three channels (each send result ok, or the failure reported) and Ilan's replies are done or logged. B was delivered once, or nothing qualified.

**On failure (P4).** Board, calendar or Slack down → Ilan gets a short Hebrew note saying which source failed, plus a retry. Never a silent skip, never "nothing today" filler. Partial scan → say "partial", never "ok" (src: MEMORY.md:703-711; S-008).

**Resolved 21.10 (Ilan).** No auto-booking (C-13). Keep both briefs: A = Ilan's tasks and calendar; B = coverage, company events, day prep, social mentions.

**Sources.** LEARNING-LOG §0, §1 (R-01/02/10/17/18/26/27/30); CLAUDE.md P1-P5; MEMORY.md:58-71; proposed/processes/morning-brief-and-standup.md.
