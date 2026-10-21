---
id: whatsapp-to-board
last_verified: 2026-10-21
owner: Ilan
status: spec live since 19.07; rollout checklist never closed (WHATSAPP_TO_BOARD.md:90-97)
---
# Playbook: WhatsApp → board

**Trigger.** A message in a monitored chat: Ilan DM, `wa-ilan-or`, `wa-mondaypr` (src: WHATSAPP_TO_BOARD.md:6-12). Or a task given to Pepper in another chat by Ilan or Or. The Gali chat is personal: main session only, not this playbook.

**Inputs.** The message plus its thread (P9). Board items for dedup. Person cards for owner and gender. IDs: `registry.md`.

**Steps**
1. Classify: 🔴 action · 🟡 decision · 🟢 waiting on someone. Drop banter, acks, media without text, technical noise, Pepper's own messages. Nothing → no reply (src: WHATSAPP_TO_BOARD.md:16-27).
2. Dedup on subject (R-07). A research or prospect list → one parent item + subitems (R-08).
3. Name: `<emoji> <verb> <what> — <person>`, ≤70 characters, source language. A decision → `⚖️ Decide: …`, routed to Ilan, never drafted for him (src: R-25, R-19).
4. Set at creation: owner Ilan (requester goes in the update), Source, Effort S/M/L, Priority by the R-25 rubric. Date only if the message states one. **Status empty**, not "Working on it" (src: R-25; overrides WHATSAPP_TO_BOARD.md:37).
5. Group: never legacy or parking (C-02). Pepper's capture is not an R-13 exception (src: R-13).
   → 📦 Active Projects (`topics`), owner Ilan, Or named in the item title and update, Priority by the R-25 rubric. Never Today/This Week/Waiting/Pepper Tasks (R-13) and never 🤝 legacy (src: Ilan 21.10: low stakes, the chat is mostly inactive; config.json `groups`).
6. First update = card: source chat, requester, received time, full quote, original links, one line of context, last line `✅ Done when: …` (src: R-25; WHATSAPP_TO_BOARD.md:41-58).
7. Confirm only after the write succeeded (src: LESSONS.md:1701-1712). Group → short "נרשם". Ilan DM → no reply (src: WHATSAPP_TO_BOARD.md:69-70).
   ⚖️ In mondayPR, where Scherf reads along: ack or stay silent?
8. Later changes to name, date, group or priority → propose to Ilan (src: R-10).

**Output.** One board item with its card update, linked in the chat or brief.

**Done when.** The item exists in an allowed group with R-25 fields and a Done-when line, and the requester saw "נרשם" (groups only).

**On failure (P4).** Write fails → say in the chat it was **not** recorded, retry once, then DM Ilan on Slack `user:U038UEUQC1Y` with the quote. Never claim it was created (src: CLAUDE.md P4; proposed/processes/whatsapp-to-board.md).

**⚖️ Open.** Keep the instant DM to Ilan per item (WHATSAPP_TO_BOARD.md:71-77), or let the morning brief carry it? Capture Scherf messages from mondayPR?

**Sources.** WHATSAPP_TO_BOARD.md; MEMORY.md:377, :393; LEARNING-LOG R-07/08/10/13/19/25; CLAUDE.md P2, P4, P6, P9; config.json `groups`.
