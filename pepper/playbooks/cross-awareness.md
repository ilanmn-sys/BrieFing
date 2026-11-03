---
id: cross-awareness
loaded: always, with CORE.md (every session, every chat, every agent)
last_verified: 2026-11-03
owner: Ilan
board: sharedMemory (config.json `sharedMemory`, board 18438292586)
---
# Cross-awareness: one memory across every chat, channel and session

**Why.** Every WhatsApp group, Slack channel, Gmail thread and Claude session is its own session. None of them sees what the others sent, drafted, decided or are waiting on. Result on 03.11: a draft built on a wrong guess, duplicate drafts to the same person, "was it sent?" checks, and Pepper not knowing what Claude did while she was down (src: Ilan 03.11 "it doesn't work and it's very annoying"). A rule ignored twice needs a mechanism, not more text (src: README.md, MEMORY.md:734-746).

**Scope.** All of them, no pilot (src: Ilan 03.11): every Pepper chat (WhatsApp + Slack), Claude cloud and Mac sessions, and every scheduled agent or task.

## 1. The ledger (shared memory)
Private monday board **🧠 Shared Memory** (`config.json` → `sharedMemory`; IDs there, not here). One row = one event.

| Column | What |
|---|---|
| Name | one-line summary, ≤120 chars, in the source language. Never the full message |
| Type | Sent · Draft · Deleted · Decision · Waiting on · Answer · Question · Handoff · Task |
| Surface | card id (`wa-comms`, `wa-mondaypr`…) or `slack:<channel>` / `gmail` / `claude-cloud` / `claude-mac` |
| Actor | `pepper` · `claude-cloud` · `claude-mac` · `agent:<name>` · `ilan` |
| Topic | stable kebab-case key: `london-dinner`, `london-swag`, `vin-invoice`. Reuse an existing key before inventing one (look it up first) |
| Project / People | project card id; counterpart names |
| Audience | `owner-only` · `ilan+or` · `internal` · `external-ok` · `private` (see §3) |
| Link | permalink to the message, draft or item. No link → no row |
| State | Open (waiting / unsent draft) · Closed · Superseded |
| Dedupe key | `surface|thread|counterpart|topic` |
| When | date |

## 2. Every turn (all sessions)
**Before replying (Context Router).**
1. Pull the topic, people and project from the message (INDEX §3-4 keywords).
2. Query the ledger for those keys: open rows of any age, plus closed rows from the last 14 days. Max 8 rows, newest first.
3. Keep only rows this surface may see (§3). Use them; cite their link when you rely on one ("Or already answered in #influencers-at-elevate: <link>").
4. Never quote another chat word for word. Summarise, and only what the audience allows.

**Before any send or draft (dedupe gate).**
- Same counterpart + topic has an **Open** Draft or a Sent row from the last 24h → don't create another. Show the existing one, or update it and mark the old row Superseded.
- The question was already asked or answered on another surface → point there, don't ask again.

**After the turn (write).** One row for each: message sent, draft created/deleted, decision Ilan made, question we're now waiting on, answer received to an Open row (close that row), task given, handoff to another session. Skip chit-chat, thanks, emoji. A failed ledger write is reported to Ilan as a failure (P4), never silent.

**Handoff.** When one session covers for another (Claude while Pepper is down, an agent for Ilan), write a `Handoff` row per open thread. The next session that owns that surface reads it, acts, and closes it.

## 3. Audience: what may flow where
Each event gets the audience of its source; the blocklist overrides everything.

| Source surface | Default audience |
|---|---|
| `dm-ilan` (main session) | owner-only, unless Ilan says it may be shared |
| `wa-ilan-or`, `dm-or` | ilan+or |
| internal: `comms`, `wa-media-relations`, `wa-social-agents`, `wa-alumni`, internal Slack channels and DMs, internal email | internal |
| mixed external: `wa-mondaypr` (Scherf), `wa-influencers` (Narrative), Slack Connect, external email | internal (the monday side may see it) |
| `private/*` | private: main session only, never anywhere else |

| Reader surface | May see |
|---|---|
| `dm-ilan` | everything except `private` (that only in the main session) |
| `wa-ilan-or`, `dm-or` | ilan+or, internal, external-ok |
| internal surfaces | internal, external-ok |
| mixed external / external | only `external-ok` rows, and only rows that came from the **same** party. Never one agency's or creator's info in another's chat |

**Blocklist, always owner-only whatever the source:** budget, fees, POs, invoices, contracts and renewals, disputes, IR/earnings and anything pre-announcement, legal, HR/RIF, health, family (src: CORE Hard NOs; R-33; Ilan 03.11 "never reflect our considerations to Andressa"). Only Ilan moves a row to a wider audience.

## 4. Daily cross-surface digest
The `wa-digest` and EOD report group open rows **by topic, not by chat** ("london-dinner: 3 chats, 2 open questions, waiting on Lee-at since 2.11"). Rows Open for more than 48h with no follow-up are listed first.

## 5. Hygiene
- Closed rows older than 14 days: delete weekly. Open rows never expire silently; they show up in the digest.
- Topic keys: if two keys mean the same thing, merge to the older one and note it.
- No secrets, no passport numbers, no DOBs, no message bodies.

## ⚖️ Open
- Does OpenClaw offer an after-send hook? If yes, the write step moves there (mechanism, not instruction). Until then it is a playbook step and the EOD report counts sends without a ledger row.
- Claude Code hooks (PostToolUse on Slack/Gmail send) need a monday token in the environment; until then Claude writes rows through the monday connector.
