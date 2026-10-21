---
id: readme
status: PILOT DRAFT for Ilan's review. Not installed in Pepper's workspace.
last_verified: 2026-10-21
owner: Ilan
---
# Pepper knowledge: how it works

**Problem it fixes.** 32 files organised by file type. LESSONS.md (299 KB) and MEMORY.md (125 KB) are too big to really load. Rules are scattered, duplicated and contradictory. Volatile state is mixed with rules, and lessons are appended as stories instead of fixing the rule. Result: Ilan re-reminds Pepper about the same things (audit 21.10: INVENTORY.md, DUPLICATES_AND_CONFLICTS.md).

**Idea.** Organise by *where Pepper is* and *what she's doing*, not by file type. Load little, deterministically.

## Layout
| Path | What | Loaded |
|---|---|---|
| `CORE.md` | identity, Ilan's 10 principles condensed, precedence (cap 5 KB) | always |
| `INDEX.md` | chat → surface, trigger → playbook, name → person, keyword → project | always |
| `surfaces/<id>.md` | one card per chat or channel (cap ~3 KB) | when in that chat |
| `playbooks/<id>.md` | one per recurring process | when its trigger fires |
| `people/<id>.md` | central people only | when the name appears |
| `projects/<id>.md` | time-boxed projects with an `expires:` date | by keyword, until expiry |
| `registry.md` | IDs only, generated | looked up, never hand-edited |
Pilot scope: 3 surfaces (Comms✨, mondayPR, Ilan+Or), 2 playbooks, 3 people cards, 1 project.

## Precedence (also in CORE)
Platform guardrails → Ilan's live instruction → CLAUDE.md P1-P10 + LEARNING-LOG §1 + config.json → CORE → surface → playbook → person / project. Old LESSONS.md / MEMORY.md never override a card. Rule names: `R-xx` = Ilan's (LEARNING-LOG); `P-xx` = Pepper's own.

## Card rules
- Every rule cites its source `(src: file:line, CLAUDE.md Px, R-xx)`. No source → it isn't a rule.
- Front-matter on every card: `id`, `last_verified`, `owner`. Surfaces add `chat_ids`; projects add `expires`.
- Live state (counts, statuses, fees) lives on the boards. Cards point to them.
- Unresolved points are written as best guess + `⚖️` question. Ilan's answer replaces both.
- **Privacy:** no health or family data in CORE, surfaces, playbooks, or anything loaded in groups. That lives in a private file, main session only.
- No secrets anywhere in these files. Keys stay in the platform secret store (C-09: TOOLS.md is not durable).

## The correction loop (replaces appending to LESSONS.md)
1. Ilan corrects Pepper ("Or is female", "don't post that here").
2. Pepper replies in his DM with a **diff** to the exact card line: file, old line, new line, source = Ilan's message and date.
3. Ilan answers `ok` / edits it / `no`.
4. On `ok`: apply the diff, bump `last_verified`, and check every other card and playbook that writes to the same place (R-12: fix at the source). If the rule is about the board, also check Ilan's agents.
5. Log one line in the day's conversation log. No narrative entry.
A rule that is ignored twice in 7 days needs a mechanism (script, gate or state file), not more text (src: MEMORY.md:734-746).

## The archive
LESSONS.md and MEMORY.md are frozen as `archive/LESSONS-2026-10.md` and `archive/MEMORY-2026-10.md`. They can be searched for history and precedent, but they are **not loaded** and never override a card. Coverage map of where every old section went: audit `proposed/99-coverage-map.md`.

## Registry
`registry.md` is generated from `config.json` (the only place IDs live) by `python3 scripts/build-pepper-registry.py`. `--check` reports drift. WhatsApp JIDs and a few verified people IDs aren't in config.json yet, so they sit in the script's `STATIC` map. Move them into config.json when it gets a `whatsapp` section. Phone numbers appear as last 4 digits only.

## Rollout (for Ilan's approval, not done)
1. Ilan answers the ⚖️ questions in the three surface cards.
2. Pepper copies `pepper/` into her workspace and points start-of-turn at `CORE.md` + `INDEX.md` instead of LESSONS/MEMORY.
3. Run for a week on the 3 pilot chats. Count how often Ilan re-reminds her about the same thing. Then card the remaining chats.
