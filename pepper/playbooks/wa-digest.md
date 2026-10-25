---
id: wa-digest
last_verified: 2026-10-25
owner: Ilan
status: DRAFT 25.10 (Ilan asked for it); not loaded by Pepper until Ilan copies it to her workspace
---
# Playbook: WhatsApp digest for Ilan (and Claude)

**Why.** Claude reads Slack, Gmail, Drive, Calendar and monday, but not WhatsApp. Work moves in Pepper's WhatsApp groups, and Claude's brief and syncs miss it. Pepper posts a short digest in her Slack DM with Ilan, which Claude reads as a source (src: Ilan 25.10).

**Trigger.** Every 2 hours, 09:00–19:00, Sun–Thu (Asia/Jerusalem): 09:00, 11:00, 13:00, 15:00, 17:00, 19:00. Nothing new since the last digest → post nothing.

**Chats in scope** (work groups only, IDs in `registry.md`):
- `comms` (Comms✨)
- `wa-mondaypr` (mondayPR🇮🇱)
- `wa-ilan-or` (אילן אור ו-Pepper)
- `wa-media-relations` (Media relations ✨)
- `wa-influencers` (Influencers @ monday)
- `wa-social-agents` (Social team agents 🤖)
- `wa-alumni` (monday alumni internal task force)

**Never in scope:**
- `private/*` (Gali) and personal chats (טוטו תיקו). Never summarised, never named (src: README privacy rule).
- 1:1 DMs (Ilan, Or) and any chat without a surface card.

**Inputs.** Messages in the scoped chats since the last digest's `to:` time (state file below), with their threads (P9).

**Steps**
1. **Read the window.** Read the window per chat. Drop banter, acks, emoji-only messages, media without text, technical noise and Pepper's own messages.
2. **Keep only what moves work:**
   - 🔴 asks to Ilan or Or, including questions left unanswered for 2+ hours;
   - 🟡 decisions made;
   - 📅 dates, deadlines and commitments;
   - 👤 creator, agency, press or exec mentions, with the name as written;
   - ✅ tasks Pepper already filed (`playbooks/whatsapp-to-board.md`), with the board link.
3. **Write one Slack message** to Ilan (`user:U038UEUQC1Y`, never a channel id, S-005), in Hebrew (P10). Item names and quotes keep their original language. Format:
   ```
   📋 WA digest | <HH:MM>–<HH:MM>
   *<chat name>*
   • 🔴 <who> → <what> (<HH:MM>) "<quote ≤200 chars>"
   • 🟡 …
   *<next chat>* …
   WA_DIGEST | from:<ISO> | to:<ISO> | chats:<n>
   ```
   - A chat with nothing that qualifies is left out entirely.
   - Max ~15 bullets. If there is more, keep 🔴 and 🟡 first and end with "+N more" per chat.
4. **Check the send result** before advancing state (CLAUDE.md DM rule). Then write the new `to:` time to the state file `state/wa-digest.json` in Pepper's workspace: `{ "lastTo": "<ISO>" }`.

**What may appear.** The digest goes to Ilan only, so deal terms and fees from `wa-influencers` may appear here; they must never be posted back in that group (src: `surfaces/wa-influencers.md` "Never here").

**Never:**
- No health or family data.
- No phone numbers.
- No passport numbers or birth dates.
- No secrets.
- The digest is a report. It never answers anyone in a group or speaks for monday (P1).

**Output.** At most one Slack DM per slot, ending with the `WA_DIGEST` marker line. Claude finds digests by that marker.

**Done when.** Every qualifying message in the window appears in exactly one digest, and `lastTo` is advanced.

**On failure (P4).**
- WhatsApp unreadable → post `⚠️ WA digest failed: <reason>` instead, and do not advance `lastTo`, so the next run covers the gap.
- Slack send failed → retry once, then leave `lastTo` unchanged.

**Sources.** Ilan 25.10 (Claude session); CLAUDE.md P1, P4, P9, P10; `surfaces/*`; README privacy rule; S-005.
