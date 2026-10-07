# Pepper × Claude — Working Process & Learning Log

The shared operating document for how Ilan, Claude and Pepper run the day together — and the record of
what we've learned about doing it better. Published at
**https://ilanmn.md.page/pepperandclaudprodprocess** so Pepper can read it directly.

**How it works**

- **§0 How we work together** is the operating agreement. Who does what, who decides, what never happens without asking.
- **§1 Active Rules** is read by the `daily-board-strategy` skill *before* it scores anything, and applied on top of the skill's built-in model. This is the live part — edits here change behaviour tomorrow morning.
- **§2 Signal Log** is appended automatically: which proposals Ilan approved vs. rejected, whether the brief matched what actually got done, corrections he gave in conversation, and deadline slippage patterns.
- **§3 Rule Changes** records what changed, when, and why — so any rule traces back to the evidence that produced it.
- **§4 Open Hypotheses** holds what we suspect but haven't confirmed. Each graduates to §1 or gets dropped.

**Keeping the published page current.** The source of truth is `LEARNING-LOG.md` in Ilan's Cowork folder;
Claude and the scheduled agents write there. Outbound HTTP is blocked from Claude's sandbox, so no agent
can push to md.page itself — publishing runs on Ilan's Mac via `sync-learning-log.sh`, scheduled by
`com.ilan.learninglog-sync.plist` for 18:00 Sun–Thu, half an hour after the end-of-day run writes the
day's signal. Run the script by hand any time to publish sooner.

If the published page and this file disagree, **this file wins** and the sync didn't run — check
`/tmp/learninglog-sync.log`. A stale page means Pepper is working from old rules, so it's worth noticing.

**Keeping it readable.** §2 grows forever; §1 must not. When §2 passes roughly 40 entries, move everything
older than the current quarter into `LEARNING-LOG-ARCHIVE.md` and leave a one-line pointer here. Rules
that stopped being relevant get deleted from §1, not kept for sentiment — a rule list nobody can hold in
their head stops being applied. md.page caps a page at 500KB, but readability will bite long before size does.

---

## §0 — How we work together

**The three roles.**

- **Ilan** decides. Nothing structural happens to his board without his say-so.
- **Claude** reads, analyses, proposes, and builds. Holds the board, the Command Center, email and Slack. Writes the record.
- **Pepper** is the chief of staff on Slack. She delivers the morning brief, chases people, drafts and sends replies, and carries requests back to Claude via the 📥 Pepper Tasks group.

**The daily cycle.**

1. **07:00** — Claude runs the strategy pass: reads §1 of this doc, scores the board, infers missing deadlines, sweeps email that needs replies, checks the real calendar for open gaps.
2. Claude creates `🗓️ Daily Strategy — <date>` in Pepper Tasks with a numbered list of proposed changes, and Pepper DMs Ilan the Hebrew brief — at most 7 things for today, each with a specific reason and a suggested time block.
3. **Ilan replies** `apply all` / `apply 1,3,5` / `skip`.
4. **08:00–12:00** — Claude applies what was approved, confirms in Slack, and **records what was rejected in §2**. A rejected proposal is the most valuable output of the day.
5. **Thursday 16:00** — the weekly review turns accumulated signal into proposed rule changes for §1.

**What never happens without asking.** Group moves, setting or changing deadlines, priorities, and archiving. Two exceptions apply silently: sweeping already-`Done` items to ✅ Completed, and filling an empty owner with Ilan.

**Ways work enters the system.**

- 📌 reaction on any Slack message → becomes a task, Pepper asks Ilan for the due date.
- An email needing a reply → becomes a Pepper task to *draft and send* — never a reminder for Ilan.
- Pepper creates a `🤖`-prefixed item in Pepper Tasks → Claude picks it up hourly, does the work, replies on the item.
- Ilan ticks a task done in the Command Center → board status updates and Pepper is notified, in one action.

**Language.** Pepper writes to Ilan in Hebrew. Item names keep their original language.

---

## §1 — Active Rules

Rules currently applied on top of the skill's built-in scoring. Each carries the date it was learned and
the evidence behind it. Remove a rule the moment it stops being true.

### Ordering
- **`R-01`** 🔥 Today outranks 🔴 Overdue in section order. Overdue work has already slipped; today is still winnable. *(2026-09-02, Ilan)*
- **`R-02`** An item counts as "today" if it's due today **or** sits in the 🔥 Today group — a dated-only test misses anything deliberately dragged into Today. *(2026-09-02)*
- **`R-03`** Anything acted on today sinks to the bottom of its section. Never sort by most-recently-updated first. *(2026-09-02, Ilan)*

### Board hygiene
- **`R-04`** Running automations never get due dates. A dated automation generates permanent false overdue and poisons the whole list. Park them in 🔁 Recurring. *(2026-08, 15 items found this way)*
- **`R-05`** Items whose real deadline is written in the title (`עד 10.8`, `48h מקבלה`) are invisible to date-based sorting. When triaging, read the title for dates and propose moving them into `date4`. *(2026-08, the Scherf block — 9 items all sat at one meaningless date)*
- **`R-06`** A `Not Relevant` status doesn't move an item. Items tagged Not Relevant but still sitting in active groups are pure noise — sweep them. *(2026-08, 13 found)*
- **`R-07`** The 📌 flag workflow can produce near-duplicates when Ilan flags the same thing twice. Always dedupe on subject before creating. *(2026-08, Amanda Kaus pair)*
- **`R-08`** Research/prospect captures (creator shortlists, article links) are not tasks. One parent item with subitems, not ten rows. *(2026-08, 10 influencer rows)*

### Process
- **`R-09`** **Always verify the current date from the system clock before proposing any deadline.** Never infer today's date from board data, item dates, or context. *(2026-09-06 — see `S-001`)*
- **`R-10`** Board changes are propose-only. Only two exceptions apply without asking: sweeping already-`Done` items to ✅ Completed, and filling an empty `person` with Ilan. *(2026-08-26, Ilan)*
- **`R-11`** An email needing a reply becomes a Pepper task to *draft and send* — never a reminder for Ilan. *(2026-09-02, Ilan)*
- **`R-12`** A rule added to §1 only binds agents that read this log. When adding one, check every other automation that writes to the board and fix it at the source — otherwise it keeps violating the rule silently, daily. *(2026-09-14 — see `S-004`)*
- **`R-13`** No automation may create items in 🔥 Today, 📅 This Week, ⏳ Waiting on Others, or 📥 Pepper Tasks. Those are the human triage groups. Automations write to 🔁 Recurring or 📦 Active Projects only. *(2026-09-14)* **Exceptions (2026-10-07, Ilan):** three agents may create in 📥 Pepper Tasks, and only these items: `daily-board-strategy` (the `🗓️ Daily Strategy` item and approved `📧 מענה למייל:` tasks), `slack-flag-to-task` (`📌` items), and `log-claude-work-to-board` (clear action items, at most 3 a run, 🔥 Today only when due today and under the cap). No other automation creates in the triage groups.
- **`R-14`** Status `With steakholder` means the item is blocked on someone else → route to **⏳ Waiting on Others** and clear its date. Blocked work must never inflate Ilan's overdue count. *(2026-09-14, Ilan — 3 items found this way)*
- **`R-15`** An item whose name states an ongoing objective rather than a finishable action ("ensure at least one big story in the upcoming months") can never be completed and will rot forever. Either rewrite it as a concrete first step with a date, or move it to 📦 Active Projects undated. *(2026-09-14)*
- **`R-16`** When a task is blocked, say **who** holds it, on the item. "Waiting on approval" with no name is how something sits for 8 weeks — nobody can chase an unnamed person. *(2026-09-14 — see the ערן רוזן item)*

- **`R-19`** Before routing something to Pepper as correspondence, check whether the blocker is **words or a decision**. An item whose real content is "approve $27,000" is not an email task — it goes to Ilan as a decision, never to Pepper as a draft. Delegating a decision guarantees it stalls. *(2026-09-22 — see `S-006`)*
- **`R-20`** Work belonging to a dated event must carry **the event date on the board**, not just per-item prep milestones. A milestone in `date4` makes every prep item read as overdue and floods 🔥 Today with things nobody can act on. Check the calendar for the event date before dating its prep. *(2026-09-22 — Elevate 27.10 was only discoverable in a calendar description)*
- **`R-21`** An item that sits in 🔥 Today past its date gets moved out to 📅 This Week. 🔥 Today must only ever contain work that is genuinely today, or it stops carrying any signal. *(2026-09-22)*
- **`R-22`** Before replying to or delegating an email thread, **read the thread**. Three of four "unanswered" items had already been answered, or were waiting on the other party. `unreplied` from a triage pass is a guess, not a fact. *(2026-09-22)*

### Personal track
- **`R-17`** 👨‍👩 אישי (`group_mm5p991c`) is a **canonical group with its own track**, not work. Its items are scored separately and never compete with work items — they always lose on stakeholder and external-commitment points, so ranking them together guarantees they never surface. The brief carries a short, separate `👨‍👩 אישי` section of at most 3 items. *(2026-09-14, Ilan — promoted from `H-04`)*
- **`R-18`** Within the personal track, health and medical items outrank everything else. A missed appointment is not symmetrical with a missed board update. *(2026-09-14)*

---

## §2 — Signal Log

Newest first. Types: `approval` · `accuracy` · `correction` · `pepper` · `slippage`.

### S-005 · 2026-09-14 · `pepper` · severity: medium
**What happened.** In her reply to the 09-10 weekly learning-capture block, Pepper confirmed "apply 1"
(R-09 expansion) and reported that she had already updated `build_slack_digest.py` — replacing hardcoded
`"03.09.2026"` with `datetime.now(timezone.utc).strftime('%d.%m.%Y')` and the hardcoded count with
`{total_scanned}` from `len(d['results'])`. She also flagged an open cron failure: the
`daily-influencer-scan-high-priority` scheduled task is still failing at Slack send because its Slack
target is set to `D0BCAGJV0AD` (the DM *channel* ID), but the API call requires `user:U038UEUQC1Y` (the
Slack user ID) when opening a DM. She asked whether to fix it now or wait.

**Why it matters.** The influencer scan has been running and silently failing on delivery for several
days. This is a configuration bug — a valid-looking channel ID that belongs to a different scope — and
the failure was caught by Pepper reviewing her own output, not by any monitoring alert.

**Implication.** Scheduled tasks that DM a user should use `user:U038UEUQC1Y`, not `D0BCAGJV0AD`, as
the channel target. Worth a pass checking other cron jobs for the same pattern. One confirmed instance
— not yet a rule.

---

### S-004 · 2026-09-08 · `pepper` · severity: low
**What happened.** In her 07.09 08:17 IDT Influencer CRM daily-scan digest, Pepper flagged her own
automation's output: the digest header printed the date "03.09" while the actual run date was 07.09 — a
date-formatting bug in that recurring task, which she logged to HEARTBEAT for a fix. She also noted two
data-quality gaps: Nitter (used for X/Twitter follower/engagement deltas) has been down since 24.08, and
of 41 influencer names scanned that day only 11 had content that actually surfaced in SERPs — she
suggested a direct `web_fetch` check against 2–3 priority profiles' pages for anyone Ilan wants tighter
tracking on.

**Why it matters.** This is the same failure shape as `S-001`/`R-09` — a scheduled task's date label came
from something other than the system clock — showing up in a second, unrelated recurring automation. That
suggests the fix belongs at the scheduled-task level generally, not just in daily-board-strategy.

**Implication.** Worth a pass checking whether other recurring automations on the board derive "today"
correctly. One data point — not yet a rule.

---

### S-006 · 2026-09-22 · `correction` · severity: high
**"Unanswered emails" were actually stalled deal decisions.** Four items had sat in 📥 Pepper Tasks for
12 days as `📧 מענה למייל:` tasks assigned to Pepper to draft and send. Reading the actual threads showed:

- **Wes Roth** — Ilan had already replied on 14.9 asking for reference videos. Ball with Regev. Not his task at all.
- **Mauricio Prado** — Ilan asked for a performance report, it arrived, then Andressa followed up on 15.9 ("Did you have a chance to review?") and that follow-up sat **unread for 7 days**.
- **Full outreach status** — Regev answered on 10.9 listing proposals *awaiting Ilan's green light*.
- **Emma Steuer** — a $21K go/no-go, never answered.

Plus a wider cluster of Narrative proposals pending Ilan's decision: Ruben Hassid $27K, Riley Brown $40K,
Sebastian Raschka $12.5K, Nate Herk, Wes Roth $13.5K.

**Why the handoff failed.** Pepper was asked to *draft replies*. None of these needed a draft — they
needed a decision with a budget attached, which only Ilan can make. Delegating them to her guaranteed
nothing would move, and the 12-day stall looked like her not doing the work when the task was
mis-specified from the start.

**Lesson.** Before routing something to Pepper as correspondence, check whether the blocker is *words*
or *a decision*. An item whose real content is "approve $27,000" is not an email task. The email sweep
(§3) classifies by "does this thread need a reply" — which is the wrong question when the reply is a
commitment.

**Rule produced.** `R-19`.

---

### S-007 · 2026-09-22 · `slippage` · severity: medium
**🔥 Today decayed into a dumping ground, and Elevate dates were fiction.** All 7 items in 🔥 Today were
5–8 days late, nothing had been cleared, and 5 of them were Elevate prep milestones dated 17.9 — while
**Elevate is actually 27.10**, five weeks out. The date was recoverable from Ilan's own calendar event
description ("Top priority until Elevate day 27.10") but was never on the board.

11 Elevate items were scattered across 5 groups, including a **duplicate plan item** with an identical
name in two groups, and one Elevate item filed in 🛒 רשימת קניות.

**Also:** ⚡ משימות יומיומיות, drained to 2 items on 14.9, was back to 23 — an automation bulk-created 18
well-formed items into a legacy group being retired. Content was good, destination was dead.

**Lesson.** A milestone date and a deadline are not the same thing, and putting a milestone in `date4`
makes everything downstream read as a crisis. When work belongs to a dated event, the event date must be
on the board — otherwise every prep item looks overdue and 🔥 Today fills with things nobody can act on.

**Rules produced.** `R-20`, `R-21`.

---

### S-005 · 2026-09-14 · `accuracy` · severity: high
**The apply step has never once run.** Eight days and three strategy passes (09-09, 09-10, 09-14) later,
🔥 Today, 📅 This Week and ⏳ Waiting on Others are all still **empty**. The pass proposes correctly and
creates its `🗓️ Daily Strategy` item every morning — but propose-only requires Ilan to reply
`apply all` / `apply 1,3,5` in Pepper's DM, and that reply has never come. Stale strategy items then
accumulate in 📥 Pepper Tasks, adding noise to the group they're meant to organise.

**What this means.** The half of the loop that reads and thinks works. The half that requires a human
action in Slack every single morning does not. A design that needs a daily manual confirmation to
produce *any* effect will produce no effect — the friction is small but it's paid daily, and the cost
of skipping is invisible.

**Open question for the Thursday review.** Either group routing moves to auto-apply (keeping deadlines
and archiving gated), or the approval has to happen somewhere Ilan already is rather than in a DM he
has to remember to answer. Recorded as `H-05`.

---

### S-004 · 2026-09-14 · `slippage` · severity: high
**Two automations were polluting the board.**

1. **`log-claude-work-to-board` re-created the automations as dated projects.** Its step 4 created an
   item in 📦 Active Projects with `date4 = today` for *"ongoing/recurring work"* — so every scheduled
   agent got a project item with a due date, daily. 11 had accumulated by 14 Sep, each reading as
   overdue. This is a direct violation of `R-04`, by an automation, twelve days after `R-04` was written
   from cleaning up the same problem.
2. **15 truncated sentence-fragments** appeared in 📥 Pepper Tasks, all within 90 seconds on 2026-09-11,
   each a meeting-note or email sentence cut at ~100 characters — e.g. `✅ sign completion today to start
   logistics and content next week; the same team will own content, inte (📝 monday.com | Elevate x
   Comms/PR Bi-wee)`. Four were the same two Vin Matano asks duplicated. Source markers point at monday
   Notetaker docs, **not** at any of Ilan's scheduled tasks — likely a monday-side agent. Unconfirmed.

**Fixed.** 12 recurring items → 🔁 Recurring with dates cleared; 15 fragments + 1 stale Not Relevant item
→ 🚫 Noise; `log-claude-work-to-board` rewritten with explicit routing rules and a standing instruction
never to date an automation.

**Lesson — this is the important one.** A rule written only into `§1` binds the agents that *read* this
log. Every other automation touching the board is unaware of it and will keep violating it silently.
When a rule is added here, check which existing automations could break it, and fix them at the source.

**Rule produced.** `R-12`.

**Still open.** The source of the 15 fragments is unidentified and may fire again.

---

### S-003 · 2026-09-06 · `correction` · severity: medium
**What happened.** The Command Center's Tasks tab sorted by `updated_at` descending, so posting an
update or changing a status *promoted* that item to the top of the list. Ilan asked for the opposite:
importance and date, with anything already acted on sinking to the bottom.

**Why it mattered more than it looks.** The list was actively rewarding the wrong thing — the more you
engaged with an item, the harder it competed for your attention afterwards. A handled task should get
quieter, not louder.

**Also corrected in the same pass.** 🔥 Today now renders above 🔴 Overdue. Overdue work has already
slipped; today is still winnable. And "today" means due today *or* sitting in the 🔥 Today group — a
dated-only test silently dropped anything deliberately dragged into Today with no date.

**Rules produced.** `R-01`, `R-02`, `R-03`.

---

### S-002 · 2026-09-06 · `accuracy` · severity: high
**Board audit before the first strategy pass.** 221 items across 14 groups. What the audit found:

- **The triage layer the whole system reads from was empty.** 🔥 Today, 📅 This Week and ⏳ Waiting on Others held *zero* items, while three competing "today" buckets held 41. The dashboard and the morning digest were both pointing at groups nothing routed into.
- **Priority was set on 12 of 221 items.** The column existed; nothing used it.
- **42% of the board was archive weight** — 88 items in ✅ Completed plus 4 noise, paginated on every dashboard load.
- **All 15 "Active Projects" were running automations**, each carrying a due date, each therefore permanently overdue.
- **9 agency items carried their real deadlines in their titles** (`עד 10.8`, `48h מקבלה`) while `date4` held one meaningless shared date.
- **📥 Pepper Tasks had 21 of 22 items open** — her inbox was accumulating with nothing draining it.

**Applied after Ilan's review.** 46 items removed from the active board: 15 automations → 🔁 Recurring
with dates cleared, 31 → 🚫 Noise (13 already tagged Not Relevant, 10 research captures, 7 dead agency
items, 1 duplicate). 85 open items → 39.

**Lesson.** The prioritization model was never the bottleneck. Nothing was routing work into the buckets
the model reads. Before tuning how things are ranked, check that they're arriving at all.

**Rules produced.** `R-04`, `R-05`, `R-06`, `R-07`, `R-08`.

**Still open.** Duplicate columns "Task Status" and "Task Priority" need deleting by hand. The 88
Completed items still sit on the board. Hypothesis `H-03` came from the Pepper Tasks backlog.

---

### S-001 · 2026-09-06 · `correction` · severity: high
**What happened.** Claude proposed deadlines for 39 items anchored to "today = Wed 26 August". The actual
date was Sunday 6 September. The date had been inferred from board item dates rather than read from the
system clock, so every proposed deadline was ~11 days stale and items described as "due today" were in
fact 11 days overdue.

**Caught by.** Claude, while writing this log — not by review, which means it would have shipped.

**Root cause.** Treating context clues as authoritative for something cheap to verify. A single `date`
call would have prevented it.

**Rule produced.** `R-09`.

**Still open.** The 39-item deadline proposal needs redoing against the correct date.

---

## §3 — Rule Change History

| Date | Change | Trigger |
|---|---|---|
| 2026-10-07 | Amended `R-13`: named the three agents allowed to create in 📥 Pepper Tasks (strategy, 📌 flags, log-claude-work action items) | Ilan's decision while porting the agents to Claude Code |
| 2026-09-06 | Added `R-09` (verify date from system clock) | `S-001` |
| 2026-09-06 | Log created; `R-01`–`R-11` seeded from the first two weeks of operating the system | Initial setup |

---

## §4 — Open Hypotheses

Suspected, not yet confirmed. Each needs evidence before it becomes a rule.

- **`H-01`** Agency chase items (Scherf, Another BR) slip roughly a week regardless of the date set — the deadline inference for them may need a longer default than 3 business days. *Evidence needed: 3+ observations of re-dating.*
- **`H-02`** The 🔥 Today cap of 7 may still be too high for a day with more than ~4 hours of meetings. *Evidence needed: brief-accuracy entries on heavy-meeting days.*
- **`H-03`** Items in 📥 Pepper Tasks that sit >14 days may indicate the ask was never clear enough to action, rather than low priority. *Evidence needed: review of the current 21 open Pepper items.*
- ~~**`H-04`**~~ **Promoted to `R-17` / `R-18` on 2026-09-14.** Confirmed: 👨‍👩 אישי grew from 3 to 15 items in 8 days with 8 undated and two health appointments 33 days overdue, while never once appearing in a brief. Personal work loses to work items on every scoring dimension, so shared ranking guarantees it stays invisible.
- **`H-05`** Propose-only may be the wrong gate for group routing. It requires a Slack reply every morning and has produced zero applied changes in 8 days (`S-005`). Auto-applying group moves while keeping deadlines and archiving gated would likely fix it. *Evidence needed: Ilan's decision.*
