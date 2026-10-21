---
id: morning-brief
last_verified: 2026-10-21
owner: Ilan
---
# Playbook: morning brief

Two outputs, kept apart (src: MEMORY.md:66-68): **A** Ilan's Hebrew task brief in his DM, **B** the media brief in the Ilan+Or group. Ilan's DM carries no media.

**Trigger.** Sun-Thu. A: after Claude's 07:00 strategy pass creates `🗓️ Daily Strategy — <date>` in 📥 Pepper Tasks (src: LEARNING-LOG §0). B: 07:30, cron `morning-brief-ilan-or-group` (src: MEMORY.md:58-64).
Gate first: system clock (P5), then `is_holiday.py` (exit 0 = stop) (src: HEARTBEAT.md:24-37). Friday and Saturday: no brief (src: Ilan 21.10).

**Inputs**
- A: the Daily Strategy item. Board canonical groups + 👨‍👩 personal track (IDs: `registry.md`). Today's calendar (R-26). Switchboard 18431118484, not the 467729906 archive (C-14).
- B: Muck Rack, NewsAPI, Bright Data, Gmail alerts. Tier-1 global ≤5 + Tier-1 Israel ≤5, articles only (src: MEMORY.md:63-64).

**Steps: A, Ilan's brief**
1. Brief gate on every item: exists and active; owner Ilan; not already done (Slack, Gmail Sent, WhatsApp); not covered by a meeting in the next 48h; not a meta item. If it looks done → **propose** Done, never auto-archive (src: proposed/02 §9; LESSONS.md:244-450; R-10; C-11).
2. Hebrew, at most 7 items, 🔥 Today before 🔴 Overdue, each with a concrete reason (src: LEARNING-LOG §0; R-01, R-02).
3. Suggested block per item: a 30-min gap 08:00-19:00 from the real calendar. Calendar unreadable → say so, suggest no times (src: R-26).
4. Personal track: separate section, at most 3 items, health first. Main-session DM only, never a group (src: R-17, R-18; MEMORY.md:34).
5. Overdue > 10 → propose specific cuts or reschedules. Proposals only (src: LESSONS.md:2711-2712; R-10).
6. Send to Slack `user:U038UEUQC1Y` and check the result (src: CLAUDE.md repo rules).
7. Ilan replies `apply all` / `apply 1,3` / `skip`. Claude applies. Calendar blocks only after approval, English titles (src: LEARNING-LOG §0; R-27). ⚖️ Does `morning-dynamic-blocks` keep auto-booking (C-13)?

**Steps: B, Ilan+Or media brief**
1. Every item has its original link (src: MEMORY.md:39, :198).
2. Live-check against the group history (src: LESSONS.md:2653-2673). Drop widget-only and self-admitted noise (src: LESSONS.md:870-941).
3. Hebrew format per `surfaces/wa-ilan-or.md`. Nothing found → send nothing (P-39b).

**Output.** A: one Hebrew Slack DM. B: one WhatsApp message to `wa-ilan-or`.

**Done when.** A was delivered (send result ok) and Ilan's reply is applied or logged in LEARNING-LOG §2. B was delivered once, or nothing qualified.

**On failure (P4).** Board, calendar or Slack down → Ilan gets a short Hebrew note saying which source failed, plus a retry. Never a silent skip, never "nothing today" filler. Partial scan → say "partial", never "ok" (src: MEMORY.md:703-711; S-008).

**⚖️ Open.** Auto-booking (C-13). B overlaps A in time: keep both?

**Sources.** LEARNING-LOG §0, §1 (R-01/02/10/17/18/26/27); CLAUDE.md P1-P5; MEMORY.md:58-71; proposed/processes/morning-brief-and-standup.md.
