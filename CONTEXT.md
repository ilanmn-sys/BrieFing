# Working context: read this at the start of every session

This file is the memory that carries between chat sessions. Rules live in `LEARNING-LOG.md` §1. This file holds the facts: who is who, where things are, and what is in flight. When Ilan states a fact or a preference in chat, write it here or in the log in the same turn (R-41).

Last updated: 2026-11-15.

## Ilan and how he works

- Ilan Manassen is Senior Communications Manager at מאנדיי.
  - Slack user `U038UEUQC1Y`. His self-DM channel is `D038RJ45RQD`; copy-paste texts and summaries go there.
  - monday user `29607541`.
- He works in Hebrew. Write to him in Hebrew. Item names, people's names and links stay in their original language.
- He is on reserve duty part-time 16–19.11.2026. That week is light.
- He mostly works from the Claude chat. Other surfaces:
  - **Slack self-DM:** the push channel.
  - **Command Center:** the state of the day. https://claude.ai/artifact/PbmhDaYyJsdoRZUQQPKj1q
  - **Pepper (`U0BBLHZH4DC`):** sends internal messages on his "שלח".
- **Time blocks:** the morning brief writes the day plan into the Command Center (`plans/<date>`), and Ilan books it with "סגור הכל ביומן" (R-42).
  - Block titles are always in English (R-27).
  - The recurring 09:00–16:00 "Focus time" hold does not count as busy when planning.
- **Style of what he receives:** short, numbered and phone-friendly, with a link on every line. He replies with numbers ("3 שלח").

## Standing constraints (summary; the log is authoritative)

- **Externals get drafts only.** That means agencies, creators, vendors, journalists, execs and Slack Connect channels.
  - Or Elmaliah is a VIP: Slack DMs to her are drafts too.
  - Show the text first unless he says "שלח" (R-31). A budget, approval or commitment decision is never sent; it is his.
- **Openers:** every message opens with a how-are-you (R-32).
- **Elevate London emails** CC yuvalap@monday.com until 24.11 (R-33). Don't reveal internal considerations to externals.
- **Spelling:** write מאנדיי in Hebrew (R-36) and עדיה, not אדיה (R-38).
- **Follow-ups:** every ask gets a Waiting-on ledger row with `fu:DD.MM` (R-37).
- **Competitors (R-39):** Asana (hard no), ClickUp, Notion, Wrike, Smartsheet, Atlassian, Airtable, ServiceNow, Salesforce, HubSpot, Pipedrive, Attio, GoHighLevel.
  - AI-agent products and AI app builders (Lovable, Bolt, Replit, v0) are not competitors.
- **Creator travel:** don't volunteer to pay it (R-40).
- **Never print** passport numbers, dates of birth, API keys or credentials.
- **Quiet periods:** no unreleased financials during an IR quiet period.

## Where things live

| What | Where |
|---|---|
| Ledger: who waits on whom, open loops | Shared Memory board `18438292586`, group `topics`. Columns: Type `color_mm8rry6y` · Surface `text_mm8rmdd5` · Actor `text_mm8r3sqb` · Topic `text_mm8r8q6s` · People `text_mm8rhjr2` · Audience `color_mm8r6zhp` · Link `link_mm8rhfed` · State `color_mm8rjzd1` · Dedupe `text_mm8rwkaj` · When `date_mm8r5ag6` |
| Influencers CRM 2026 | board `18425284143`. Latest Post `long_text_mm70dpn`, Deliverables `long_text_mm5y6bjc`, UTM columns `numeric_mm8z9jyb` / `numeric_mm8zyedt` / `numeric_mm8zxhqs` / `numeric_mm8z2a3m`, `date_mm8z1ccm` |
| Elevate List (London creators, shared with Creator Buzz) | board `18435082524`, group `group_mm8rqrbe`. Never set the approval column `color_mm8rmc28` |
| Elevate attendance (media / creators / ambassadors) | board `18436014899` (Allison Grey). London dinner group `group_mm946c5j` |
| Budget board | `18430005022` (has no London lines yet) |
| Guest Travel Form | token `07f2ef8f2b278a3aac699d74a5e93615` (question ids in the repo history, 14.11) |
| Elevate London brief (artifact) | https://claude.ai/artifact/PPZ1hBxKR2nq1XgmP31qch. Source `web/artifacts/elevate-london-brief.html` |
| Command Center (artifact) | https://claude.ai/artifact/PbmhDaYyJsdoRZUQQPKj1q. Source `web/live/command-center.html` |
| Creator invite template (London) | `templates/london-creator-invite.txt` |
| Research helpers (Bright Data, SERP, profile analysis) | `scripts/research/`. Auth goes through the session proxy; there is no key in the code. Profile datasets need `&type=discover_new&discover_by=url` (Instagram/YouTube) or `discover_by=profile_url` (TikTok/X) |
| Research reports | `reports/` (London AI creators, Israel AI creators, UK multi/cross-platform, Regev options, Vin sheet) |
| Kremer (read-only Snowflake) | `bigbrain.l2.raw_users`, `bigbrain.l4.dim_accounts`. UTM queries in `reports/creator-utm-queries.sql` |

## Scheduled tasks (claude.ai routines)

| Routine | ID | When | Rule for relaying it |
|---|---|---|---|
| Morning brief (via Pepper) + day plan | `trig_01Esk6zwQiY1f313Gci4ZPD9` | Sun–Thu 07:47 | one line + link |
| Reply tracker | `trig_01KVkFNwP9ehvDi1P6s6KXxq` | 3× daily | only if a DM was sent |
| London creator sync | `trig_01TQNok2ioEUYvohRHEYhXiP` | daily until 19.11 | short summary |
| Creator UTM daily report | `trig_0148sS7vhvanWQ5FU2UUkqxz` | daily | silent unless it fails |
| Elevate NYC content watch | `trig_01Pd12AtXYpfMKC3jwZwhtdi` | daily until 30.11 | commit `agents/elevate-nyc-content-watch/state` after each run |
| Weekly LinkedIn proposal | `trig_01N9EfxTDXtkTTnQNT8wXp9x` | Wed | — |

Parked 15.11 (Ilan: "let's put a pin in it"): (1) run the routines in their own sessions instead of this chat (main benefit: no context compaction, faster chat, fewer tokens); (2) cut Slack noise to one brief plus exceptions; (3) send the brief directly instead of through Pepper, keeping Pepper only to execute "שלח". Raise again after London (24.11) or when Ilan asks.

## People

**Internal**
- **Yuval Apeloig** (yuvalap@): owns London with Ilan; CC on London email.
- **Or Elmaliah:** VIP, PR lead; Geektime decisions go through her.
- **Adaya Brum** (עדיה, procurement): Slack U08MBQRHFA5 / DM D0C2BJPA3CL.
- **Inbal Jozefov** (registrations): U08BDUF8CAF / DM D098MQU4L94.
- **Sophie Spence** (EMEA events): U086WNZNKRQ.
- **Daria:** monday accounts and AI credits, D08BJF3LYLQ.
- **Tzah:** UTM links, D0ABBUGP1QV.
- **Shoshi:** U01V0LS5NF7.
- **Oya/Aviya:** U085VU6B8H0 / D0C9PBN69L7.
- **Alice:** DM D0AFLS76YFQ; the We Are Alive PO.
- **Alice Simpson:** Communications Manager, media relations, U0AEZR67JSX; adds journalists to the attendance board.
- **Allison Grey:** owns the attendance board.
- **Reut Efroni:** DM D04HC8EMDT6.
- **Yaniv:** DM D09LPEUNCLB.
- **Keren Koshman.**
- **Lee-at Fuss** (Ambassador program, external contractor): U0BVCN5PAVB. About 14 ambassadors for London, in #influencers-at-elevate `C0C00JX5MRA`.
- **Nitzan Sharon:** EMEA travel coordinator.
- **Ruth Rosenthal:** handles the Rathbone hotel group booking (10 rooms). Not Ilan's.

**External (drafts only)**
- **Creator Buzz** (London creator agency): Vin vin@creatorbuzz.com, Melissa melissa@creatorbuzz.com. Slack Connect `#creatorbuzz-mondaycrm` `C09SND9EV09` cannot take sends or drafts from Claude; put copy-paste text in the self-DM.
- **Narrative:** Regev regev@narrativegroup.co. His 7 London options (14.11) were all passed.
- **Scherf** (Israeli influencer agency): Eden, Zohar, Dalia. Weekly sync Sunday 12:00.
- **Signal Tours** (travel): Sharon Shulman sharons@signaltours.com.
  - PO #16316 ($3,000) is used up.
  - Zip #16492 (about $4,500) was approved 14.11. It covers Hila Naor, Vin's Canada team member and the overage.
- **Others:** We Are Alive, Clarity, Pinnacle (mel.dorman@pinnaclepromotions.com), Balthazar (Patricia), Geektime (Ido).

## Elevate London, 23–24.11.2026 (ExCeL)

**Schedule**
- **Mon 23.11, 19:30:** creator & community dinner at Balthazar, Le Grand Salon Privé.
  - The menu and questionnaire are due Mon 16.11 EOD.
  - Within the £3,500 minimum. Hawksmoor was released.
- **Tue 24.11:**
  - 10:00 keynote
  - 11:30–12:15 headset tour (Capital Lounge 1+2, Level 2)
  - about 14:00 creator workshop, opened by a Daniel Lereya Q&A
- **Press registration:** https://elevate-widgets.monday.com/emea/page/6959790/press-registration
- **UTM format:** `…multi-multi-event-london-{slug}`.

**Creators**
- **Target:** about 10 in total, including the Israelis.
- **Confirmed:** 6 creators through Creator Buzz.
  - Invite drafts for Charlie, Lara, Agi, Tunde and Beatrice wait on Vin confirming their emails; Moddy's invite comes after that.
- **Israelis:** Amichai Sheqel and Hila Naor, through Scherf.
  - Amichai posted Salesforce content 08 and 10.11. His exclusivity check is open.
  - Eilon was at NYC, not London.
- **Under discussion with Vin:** Nathan Hodgson, Huw Prosser, Grace Beverley, Elowen Hu.
- **Not coming:** Harry Stebbings and Jack Roberts (unavailable), Temi (passed).
- **Other open items:** Matt Pocock was invited 11.11 with no reply; a follow-up draft and LinkedIn text are ready. Myriam needs an updated boilerplate, because the headcount is outdated.

## Other threads in flight (as of 15.11)

- **Geektime "monday Builders":** 60K vs a 45K renewal. On hold (Ilan, 15.11): no answer to Ido until Ilan discusses it with Or and Scherf.
- **AWS re:Invent talk:** Keren Koshman asked for comms approval. The deck has been received.
- **Gmail:** about 25 stale drafts are waiting for Ilan to delete by hand.
