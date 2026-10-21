---
id: wa-comms
chat_ids: ["120363402527748008@g.us"]
platform: WhatsApp
last_verified: 2026-10-21
owner: Ilan
confidence: high that this is the "communications" group; ⚖️ Ilan to confirm
---
# Comms✨ (WhatsApp)

**Purpose.** monday.com comms team group, about 10 people including leadership (src: LESSONS.md:1058). Pepper relays new posts from monday's own X / LinkedIn / Instagram for the team to engage, on Amy's request (src: LESSONS.md:1017-1019).

**Members & roles.** [Or Elmaliah](../people/or-elmaliah.md) (authority) · [Amy Bronstein](../people/amy-bronstein.md) (Social, owns the post relay) · Ilan · others, list unverified (src: groups-context.md:129; PEPPER_STATE:82).

**Pepper's role: mention-only + one automated relay.**
- Reply only when @mentioned or quoted (src: ILAN_PLAYBOOK.md:142). 1-2 sentences (src: ILAN_PLAYBOOK.md:77, :142).
- Automated: `sprout-owned-channels-watcher` posts each new owned post once, in Amy's format "Hey, check out this new post on <platform>, Amy says you MUST engage ❤️ <link>" (src: LESSONS.md:1019).
- ⚖️ MEMORY.md:90 still says "don't respond, crisis alerts only". The live relay and Or's POV request (LESSONS.md:1058) contradict it. Best guess: mention-only.

**Language.** English (src: PEPPER_STATE:25; CLAUDE.md P10). Hebrew only if the message to Pepper is Hebrew (P10).

**Capture → board.** Not a monitored capture chat (src: WHATSAPP_TO_BOARD.md:6-14). A task given to Pepper here by Or or Ilan → `playbooks/whatsapp-to-board.md`. Canonical groups only.

**Never here**
- Reasoning, checklists, "NO_REPLY" text. A leak here was quoted back by Amy (src: LESSONS.md:1037-1058).
- Old, pinned, reply or already-sent posts in the relay. New original posts only, deduped on URL (src: LESSONS.md:200-243, groups-context.md:136).
- "No new posts" or status messages (src: LESSONS.md:2717-2724).
- Speaking for monday to anyone outside the company (src: MEMORY.md:1082-1086).
- Anything personal or from another group (src: HEARTBEAT.md:24; MEMORY.md:34).

**Escalation.** Crisis, exec, IR or RIF topic → don't answer in the group. Flag Or, then DM Ilan in Hebrew on Slack `user:U038UEUQC1Y` (src: OOO_BRIEF.md:42-56; CORE).

**Known pitfalls**
- 02.10: reasoning text sent to the group, Amy quoted it (src: LESSONS.md:1056-1060).
- 14.10: Sprout's 1-3h lag dropped posts; lookback is now 6h plus direct scrape (P-34, src: LESSONS.md:143-174).
- 14.10: support replies were relayed as posts (src: LESSONS.md:234).
- 18.10: old posts relayed, Amy complained (src: groups-context.md:134-136).
- 20.10: relay "a few hours too late" (src: groups-context.md:143).
- 18.10: Pepper replied to Amy as if a different agent had been tagged (src: groups-context.md:137).

**Open questions for Ilan (⚖️)**
1. Is Comms✨ the "communications" group you meant, or Slack #communications-team (C08STFTQFME)?
2. Mention-only (best guess), silent, or free reply?
3. Is the post relay still wanted, given the lateness complaints?
4. MEMORY.md:779 says Amy owns "the mondayPR audience". Was Comms✨ meant?
