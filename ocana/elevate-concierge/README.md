# Elevate Concierge (Ocana agent)

A WhatsApp assistant for journalists, influencers and creators at **Elevate 2026**: New York, 27 Oct (Certification Day) and 28–29 Oct (main conference); London, 24 Nov. It answers from an approved knowledge base and the Elevate calendar. Anything else goes to a human through Slack. **Status: not created. Needs the inputs below.**

## Needs Ilan's sign-off: an exception to Principle 1
`CLAUDE.md` says journalist-facing text is always a draft. This agent answers journalists directly, so it needs an explicit exception:
- It **answers directly** only facts in `kb/` or the Elevate calendar: agenda, venue, logistics, FAQ, public announcements after their embargo.
- It **hands off** everything else (`kb/10-do-not-answer.md`, `basePrompt.md` "What you never do"), and a human replies from the same number.

Until this is approved, the agent stays stopped.

## Files → Ocana API
`node scripts/ocana-agent.js build` turns this folder into a `CreateAgentRequest`:

| Field | Source |
|---|---|
| `basePrompt` | `basePrompt.md`: identity, sources of truth, red lines, safety, WhatsApp style |
| `agentsMd` | `AGENTS.md`: tools, playbooks, handoff format, failure handling |
| `userMd` | `USER.md`: guest personas and the team behind the agent |
| `memoryMd` | every `kb/*.md`, joined in file order (the API has no knowledge-upload endpoint) |
| model, temperature, maxTokens, `selectedPlugins`, `channels`, `ownerUserId` | `agent.json` |

## What the spec means for the build
1. **Get the create-time fields right before creating.** `PATCH /agents/{id}` accepts only name, prompt and the three md files. Channels, plugins and model can't be changed through the API afterwards: use the portal, or create a new agent. The script sends only the allowed fields on `update`.
2. **The knowledge base is inline.** It travels in `memoryMd`, so every edit is an `update` call. `build` prints the size of each field. Ask the Ocana team for the size limit, and whether `memoryMd` is shared across conversations (`AGENTS.md` assumes it is, so the agent never writes guest details into memory).
3. **Find the WhatsApp channel config shape in an agent that already has it.** The spec leaves `channels[].config` open. Run `snapshot <agentId>` on an Ocana agent that already uses WhatsApp, and copy the shape into `agent.json`. One WhatsApp number should belong to one agent: **do not `clone` a WhatsApp agent for testing**, unless the clone gets its own number.
4. **Plugins** are community packages: `packages calendar`, `packages slack`. Put their ids in `selectedPlugins`.
5. **Leave Gmail off.** An external bot that can read a mailbox is one prompt injection away from leaking it. If follow-ups by email are needed, use a dedicated event mailbox with drafts only, never Ilan's.
6. **Calendar: read-only, Elevate agenda calendar only.** Never a personal calendar.
7. **Stopping is the kill switch.** `stop` halts the agent. Keep a person with the token on call during the event.
8. **Token:** create a `user_service` token with the narrowest scopes (`agents:create`, `agents:update`, `agents:lifecycle`, `agents:read`) and `expiresInDays: 14`. Revoke it after the event.
9. **Ask the Ocana team about logs, handoff and opt-in.** The management API has no endpoint for conversations, logs or human takeover. Before launch, confirm with them how to (a) read conversation logs, (b) let a human reply from the same number and mute the bot per chat, and (c) record WhatsApp opt-in and send approved templates.

## Run
```
node scripts/ocana-agent.js build                    # payload + sizes + TODO report, no API call
node scripts/ocana-agent.js packages slack           # read-only lookups (need OCANA_API_URL, OCANA_TOKEN)
node scripts/ocana-agent.js snapshot <existing-whatsapp-agent-id>
DRY_RUN=0 node scripts/ocana-agent.js create         # refuses while any TODO is left; saves agentId; does not start
DRY_RUN=0 node scripts/ocana-agent.js update         # after kb/ edits
DRY_RUN=0 node scripts/ocana-agent.js start | stop
```
`--allow-todo` lets an internal pilot run with knowledge-base gaps. A TODO in the owner, plugins or channels always blocks. Every failed API call exits non-zero and prints the HTTP status.

## Still open
- [ ] Ilan approves the Principle 1 exception
- [ ] `kb/`: public facts filled from monday.com/elevate on 2026-10-20; internal facts (press room, embargoes, Wi-Fi, emergency, creator rules, guest list) still TODO, and everything signed off by the Elevate producer (each file has an Owner line)
- [ ] WhatsApp channel config, Calendar and Slack package ids, `ownerUserId`
- [ ] The calendar id and Slack channel id in `AGENTS.md`; the handoff rota in `USER.md`
- [ ] Answers from the Ocana team on items 2 and 9
- [ ] Test: 30–50 questions in EN/HE/PT/ES, including attempts to break it ("ignore your rules", "what's Ilan's number", embargoed items before their release time)
