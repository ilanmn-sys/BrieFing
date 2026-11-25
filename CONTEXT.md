# Working context: read this at the start of every session

This file is the memory that carries between chat sessions. Rules live in `LEARNING-LOG.md` §1. This file holds the facts: who is who, where things are, and what is in flight. When Ilan states a fact or a preference in chat, write it here or in the log in the same turn (R-41).

Last updated: 2026-11-16.

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
- **Don't reveal internal considerations to externals** (R-33). Do NOT CC Yuval: she is on maternity leave from 15.11.
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
| Influencers CRM per-platform followers (25.11) | IG `numeric_mm9egyzt`, TikTok `numeric_mm9edw1d`, YouTube subs `numeric_mm9ernz3`, LinkedIn `numeric_mm9ezr1z`, X `numeric_mm9erxna`, Total (all platforms, sum of non-empty) `numeric_mm9e4bpf`, as-of `date_mm9e21r7`; Followers `numeric_mm5ywa2b` stays = main platform. Data: `reports/creator-followers.csv` |
| Elevate List (London creators, shared with Creator Buzz) | board `18435082524`, group `group_mm8rqrbe`. Never set the approval column `color_mm8rmc28` |
| Elevate attendance (media / creators / ambassadors) | board `18436014899` (Allison Grey). London dinner group `group_mm946c5j` |
| Budget board | `18430005022` (has no London lines yet) |
| Guest Travel Form | token `07f2ef8f2b278a3aac699d74a5e93615` (question ids in the repo history, 14.11) |
| Elevate London brief (artifact) | https://claude.ai/artifact/PPZ1hBxKR2nq1XgmP31qch. Source `web/artifacts/elevate-london-brief.html` |
| Command Center (artifact) | https://claude.ai/artifact/PbmhDaYyJsdoRZUQQPKj1q. Source `web/live/command-center.html` |
| Creator invite template (London) | `templates/london-creator-invite.txt` |
| Research helpers (Bright Data, SERP, profile analysis) | `scripts/research/`. Auth goes through the session proxy; there is no key in the code. Profile datasets (IG/YouTube) take plain URL collection (no discover_new; Bright Data rejects it). The Posts datasets need `&type=discover_new&discover_by=url` (IG/YouTube) or `discover_by=profile_url` (TikTok/X) |
| Research reports | `reports/` (London AI creators, Israel AI creators, UK multi/cross-platform, Regev options, Vin sheet) |
| Kremer (read-only Snowflake) | `bigbrain.l2.raw_users`, `bigbrain.l4.dim_accounts`. UTM queries in `reports/creator-utm-queries.sql` |

## Scheduled tasks (claude.ai routines)

| Routine | ID | When | Rule for relaying it |
|---|---|---|---|
| Morning brief (via Pepper) + day plan | `trig_01Esk6zwQiY1f313Gci4ZPD9` | Sun–Thu 07:47 | one line + link |
| Reply tracker | `trig_01KVkFNwP9ehvDi1P6s6KXxq` | daily 20:47 (Sun–Thu) | only if a DM was sent |
| London creator sync | `trig_01TQNok2ioEUYvohRHEYhXiP` | DISABLED 16.11 (usage) | — |
| Creator UTM report | `trig_0148sS7vhvanWQ5FU2UUkqxz` | daily 08:39 (from 25.11; NYC + London, ranked) | silent unless it fails |
| Elevate NYC content watch | `trig_01Pd12AtXYpfMKC3jwZwhtdi` | every 3 days until 30.11 | commit `agents/elevate-nyc-content-watch/state` after each run |
| Weekly LinkedIn proposal | `trig_01N9EfxTDXtkTTnQNT8wXp9x` | Wed | — |

Parked 15.11 (Ilan: "let's put a pin in it"): (1) run the routines in their own sessions instead of this chat (main benefit: no context compaction, faster chat, fewer tokens); (2) cut Slack noise to one brief plus exceptions; (3) send the brief directly instead of through Pepper, keeping Pepper only to execute "שלח". Raise again after London (24.11) or when Ilan asks.

## People

**Internal**
- **Yuval Apeloig** (yuvalap@): on maternity leave from 15.11. Do not CC or route anything to her; Ilan owns London alone.
- **Or Elmaliah:** VIP, PR lead; Geektime decisions go through her.
- **Adaya Brum** (עדיה, procurement): Slack U08MBQRHFA5 / DM D0C2BJPA3CL.
- **Inbal Jozefov** (registrations): U08BDUF8CAF / DM D098MQU4L94.
- **Sophie Spence** (EMEA events): U086WNZNKRQ.
- **Daria:** monday accounts and AI credits, D08BJF3LYLQ. Backup when she is out: Tomer Aloni (U0837B2QWQJ).
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
- **Creator Buzz** (London creator agency): Vin vin@creatorbuzz.com, Melissa melissa@creatorbuzz.com. Agency fee: 18% on top of what the creators are paid (Ilan, 16.11). Same model intended for Narrative (London): 18% on top of the creator fees. Slack Connect `#creatorbuzz-mondaycrm` `C09SND9EV09` cannot take sends or drafts from Claude; put copy-paste text in the self-DM.
- **Narrative:** Regev regev@narrativegroup.co. His 7 London options (14.11) were all passed. Margo margo@narrativegroup.co sent a second batch of 4. It was evaluated 15.11 in `reports/narrative-london-batch2.md`: Christian Zimmer Maybe ($6,500), The Metaverse Guy Maybe if Zoho/Vani is ruled not a competitor ($1,500), Nick Sadler Pass, Jason West Pass.
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
  - 11:30–12:15 headset tour, meeting in the creator room Alice Simpson booked at ExCeL (calendar: "We Are Alive roundtable room"); not Capital Lounge
  - about 14:00 creator workshop, opened by a Daniel Lereya Q&A
- **Press registration:** https://elevate-widgets.monday.com/emea/page/6959790/press-registration
- **UTM format:** `https://monday.com?utm_medium=influencers&utm_source=elevate&utm_campaign=multi-multi-event-london-{first name}` (same template as NYC, confirmed by Ilan 16.11). Links per creator: `templates/london-creator-utm.csv`; they go out in the checklist email 21–22.11, not in the invite.

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

- Dinner print designs (18.11): `templates/london-dinner-print/` (placecard, menu, blank menu, A3 placemat, 60 cm centrepiece) with the official Elevate logo. Alison handles the design questions from here; Ilan does not want to spend more time on them.
- 19.11 creator drafts: Tunde → r-5561650855268504207; Beatrice → r2441375275120874180; Charlie (replied 18.11, now group A) → r3826083447364112040; Moddy → r8530541213878378375; Christian → r-6501669693619978285; Lara → r8729590963823729606; Agi → r2006087600749914249; Zain (info@themetaversecompany.uk, cc Margo) → r-1087741229784212082; Tara → r3342847467114656593; Zohar (HE) → r7523839367153971206; Hila (HE) → r9077690786995926907; Amichai (HE, cc Zohar) → r-7395316010608937851. All in the invite threads except Tara/Zohar (new). Old London drafts deleted (15.11 invite drafts Lara/Agi/Tunde/Beatrice/Charlie-collabs, Hila 17.11). Hila registered with Hila@leadshift-ai.com (her 18.11 email).
## Other threads in flight (as of 15.11)

- **Geektime "monday Builders":** 60K vs a 45K renewal. On hold (Ilan, 15.11): no answer to Ido until Ilan discusses it with Or and Scherf.
- **AWS re:Invent talk:** Keren Koshman asked for comms approval. The deck has been received.
- **Gmail:** about 25 stale drafts are waiting for Ilan to delete by hand.

## Dennis (monday PR agent 17796) — changed 16.11
- 19.11 (Ilan): real-time alerts. Job 3 Step 3 now posts to #media-relations every fresh Tier 1/2 coverage item (plus spokesperson/negative) with summary, publish date, outlet, competitors, sentiment; stock/financial-media noise excluded. New Step 3b: Tier 1/2 items naming a specific monday product (alone or vs competitors) → DM Allison Grey (U0BQNJD25DX). Inbox sweep now hourly 08–20 (added 9,11,13,15,17,19); n8n import hourly 08–20.
- No website recommendations any more: we no longer upload coverage to the website. Website? column now only records coverage (No / Not coverage / Duplicate / Pending Review).
- Iron rule: digests, #media-relations posts, owner DMs, the Hebrew brief and drafts to Pepper carry only articles new since the previous digest (publish date ≤3 days old, item ID not in `triage_memory/digested_ids.json`). Backfill and n8n imports with old dates stay silent on the board. (Triggered by Or's 16.11 complaint about Aug–Sep items in #media-relations.)

- 16.11: Ilan near his usage cap. Routines cut back (table above). Keep replies short; avoid full-thread/FULL_CONTENT reads and subagents unless needed.
- 17.11 dinner headcount (Ilan): Vin NOT coming (Tara is); Dor Cohen IN (added to dinner invite); Reut asks +4 creators; one more Narrative creator besides Christian = The Metaverse Guy (Zain Ul Abedeen, CRM 13554479376); email via Margo; Shir Yarkoni probably replaces Oya. Est. ~26 sure, ~40 with ambassadors, max ~43 of 48.
- 18.11 dinner headcount (Ilan): Oya out, Shir in; Reut herself likely joins plus one CS person. Reut's group = 5 total including Reut (Ilan 18.11). If everyone comes: team 9 + Creator Buzz 7 + Scherf 3 + Narrative 2 + Reut 1 + CS 1 + Reut creators 4 + ambassadors 14 = 41 of 48. Balthazar draft r3951518547552224212 still says 35 + up to 4.
- 18.11: Ilan sends the Narrative creator invites (Christian, Zain) himself, not via Margo. Drafts r-2067721336305321840 / r3162238585293887730 have an empty To (creator emails not on file), CC Margo.
- 18.11: no invites from us to Reut's creators (Ilan).
- 18.11 dinner: Allison Grey NOT attending (Ilan). Ambassadors now 11 confirmed (+2 pending, dropped if no reply by 19.11), names not yet received. Named list 21 + Reut + 4 Reut creators + 11 ambassadors + CS 1 = 38 (40 max).
- 18.11 ambassador names (Lee-at, 11): Simran Ghattoraya, Yogesh Pokale, David Simpson, Trevor Chauvin-DeCaro, Shiro Zayas, Clare Groves, Feride Ozer, Rissa Ream, Oyedokun Bibitayo Oyefunke, Cionna Evans (vegetarian), Chad Bruce (no fish or seafood).
- 18.11 Reut's 4 dinner creators: Callum Mcdonnell, Grace Andrews (we passed her paid Creator Buzz offer 17.11, Elevate List 13558089187 = Declined), Beth Thomas, Adam Faulkner. Reut's group, no invites from us.
- 18.11 Balthazar: canapés = smoked salmon blinis + chicken skewers (Ilan). Steak frites possible at +£10pp (select 'No Main' + 'Steak frites' in dietary). No drinks package; drinks on consumption, wine by bottle. Asked Dora to allow ordering on the night or extend pre-orders to Fri 20.11 12:00 UK; questionnaire held until she answers (cannot edit after submit).
- 18.11: Steak frites added as 4th main option at +£10pp (Ilan approved).
- 18.11: Tunde, Moddy, Beatrice registered + sent accounts (to Daria for credits) and added to dinner/keynote/tour/workshop invites; all 4 events now guests-can't-see-guests. Asked Nora re badge pickup + cameras for Moddy.
- Plan 19.11 (Ilan): creator emails. Non-repliers: reminder. Repliers: dietary + (if Balthazar requires) menu choice + personal UTM. All: masterclass sign-up push. Our creators only (CB 7, Narrative 2, Scherf 3), not Reut's. Check-in scheduled 19.11 08:30 IL (trig_01Y6ytJ1Zthgd946cgPngrq6).
- Zohar Dublin (Scherf) and Tara Crymble (Creator Buzz team) are NOT creators (Ilan 18.11): event registration + dietary + optional masterclasses only; no UTM, no AI credits.
- Draft hygiene (Ilan 18.11): one draft per person; when a reply changes something, replace that draft and delete the old one, never a second draft. 19.11: drafts 08:30, re-sync 13:00, Slack self-reminders to Ilan 10:00 + 15:00 (Dr0CJNPBAWKV, Dr0CJDJYTG9M).
- LinkedIn direction (Ilan 18.11): more hands-on AI posts, e.g. how we run Elevate with a small team and many sub-agents, in AI language. Never mention reserve duty. Draft: reports/linkedin-ai-agents-elevate-ops.md.
- Bright Data (18.11): API key works via the env proxy, but every request returns client_10020 'Account is suspended' (billing). Fix: brightdata.com/cp/setting/billing. The brightdata-plugin in this env ships skills only, no MCP tools. Until fixed, research falls back to web search.
- 18.11 dinner pre-orders (Dora: due 19.11 15:00 UK): asking all groups to reply TODAY. Drafts: Vin+Melissa r4366665280853375187, Margo r-1870477516578537370. Slack texts for team, Reut, Lee-at and HE text for Hila/Amichai/Zohar given to Ilan.
- 19.11 ~14:15: SENT (Ilan explicitly asked) reminders to the 4 not registered / no account link: Lara + Agi (cc Vin, Melissa), Zain (cc Margo), Amichai (cc Zohar). Other 8 creator drafts still unsent.
- 19.11 Margo offered 3 for the last London spot: Matt Talks Tech (YT 820K, $8K dedicated video) = Maybe, best value, verify channel is work/AI not gadgets; Seb Intel (@sebintel 371K, $15K) = Pass: same person as @sebastien we rated medium fit 11.11 (creative AI, ER 0.17%), #replitpartner per creatordb; AITRENDZ (René Remsik, $12.5K) = Pass: AI-tools listicle page, no workplace angle, follower data inconsistent. Ilan's call.
- 19.11 16:05: Doron Eliezer is at another customer dinner on 23.11; he pointed us to Claude Springer (U0APJ4WQ8TF, CS Regional Director) to find a local CS guest. I saved a draft DM to Claude Springer (CSM level is fine). Zain registered and opened an account with info@themetaversecompany.uk, but there's no URL yet. Agi says "all done in the other thread", so we still need to check which account. I saved a draft accounts-status message to Simon and Shir (group DM C0CK8VCDGDQ) and a draft confirmation request to Daria.
- 19.11 ~16:40 IL: Balthazar pre-order form SENT to Dora (26/40 choices; 14 TBC will follow; default Gravadlax/Sea bass/Brûlée; exceptions: Lara vegan, Zain halal→vegan menu, Cionna veg, Chad no fish). Still missing: Reut+4, CS seat, Tara, ambassadors David/Trevor/Rissa/Cionna/Chad. Vin re-pitched Will Francis ($6.6K) and Temi ($3K): both had Asana paid posts (22.10 / 28.10), recommended pass; Vin also asked for a London brief.
- 19.11 (Ilan): from now on, every Balthazar update to Dora = regenerate the pre-order form and attach it. Steps: update templates/london-dinner-preorders.csv, run `python3 -I scripts/fill-balthazar-preorder.py templates/balthazar/blank-form.docx "templates/Balthazar Pre-Order monday.com 23.11.docx" templates/london-dinner-preorders.csv`, then attach. The form now has 42 rows (Reut's group: Reut, Adam, Yiftach, Alessia, Rotem, Ron; Callum/Grace/Beth TBC), 32 with choices.
- 19.11 18:57 IL: Bright Data WORKS again via api.brightdata.com (content-watch run OK); the 18.11 'suspended' note is outdated. NYC watch: 1 new find (Jean Kang LinkedIn 16.11), total 31 posts / 14 creators.
- 19.11 13:00 UTC Amichai: dessert = chocolate mousse (not sorbet; Dora still has sorbet, fix in next update). His monday account email: asheqel@gmail.com (no URL), for Daria. Dora 18:45 IL: revised function sheet + asks if we want to PRE-PAY (Ilan's call).
- 19.11 ~20:50 IL: told Dora we pay by credit card on the night (no pre-pay); sent Amichai mousse fix + form (35/42).
- 20.11 08:19 UK: Simon Shubbar suggests Hosanna Ouellette (U0ACFPFCURH, growth, builds agents) for his Balthazar seat. Not invited yet; once she confirms + picks a menu, replace Simon's row and send Dora the regenerated form.
- 20.11 09:40 UK: Dora confirmed the amendments (mousse, card on the night) and asks for ALL final pre-orders, the logo and the table plan by 12:00 UK today. Draft reply r-4392386255600677839 (form attached, 35/42, default Gravadlax/Sea bass/Brûlée for anyone missing; Cionna veg, Chad no fish; Simon's seat to follow; says table plan + logo follow separately). No table plan exists in the repo; Allison sent the menu logo 18.11 in the same thread.
- 20.11 15:30 IL: Ilan sent Dora the form 13:27 UTC + spoke by phone; Dora 13:41 sent updated function sheet + logo. Table plan (Ilan): T1 Reut+CRM team+her creators (9); T2–T4 mixed creators/ambassadors/team (11 each). File templates/Balthazar Table Plan monday.com 23.11.docx; draft to Dora r-5304116585180534271.
- 20.11 (Ilan): table plan on Dora's template (6 round tables: top 7/8/7, bottom 7/8/7 = 44 seats). Reut table = Reut + Callum, Grace, Beth, Adam + Yiftach, Alessia, Rotem (Ron moved). Seats held for Hosanna (Simon's replacement) + 2 CS (TBC). File templates/Balthazar Table Plan monday.com 23.11.pptx; draft to Dora r3006586712728623216 (TBC seats spread: CS1 bottom-mid, CS2 top-left, Hosanna bottom-right; Amy moved to bottom-mid). Hosanna invite = Slack draft.
- 20.11 ~16:20 IL: table plan v1 (mixed, Reut table kept) SENT to Dora (msg 1a1f967ea054ad50). v2 kept in templates as alternative.
- 20.11: Elevate by monday logos (black + white, SVG+PNG) sent to Dora for printed menus (black preferred). Files templates/balthazar/logos/.
- 20.11 15:22 UK: Dora LOCKED the dinner: black logo on the (white) menus; dishes allocated to all guests without pre-orders; final function sheet + pre-orders on her Salesforce links; no further changes, anything else on the day. 15:40 UK Claude Springer: no CS guests (too late). 15:41 UK Hosanna Ouellette YES (Buffalo mozzarella / Steak frites / Dark chocolate mousse) → replaced Simon's row, CS row removed: form 41 guests / 35 choices. Draft to Dora r-3279550613595349975 (optional, on-the-day note + form). Hosanna added to the dinner calendar invite 21.11 19:21 UK (hosannaou@monday.com).
- 20.11 16:25 UK: Melissa (Creator Buzz channel) posted monday account links for all 6 CB creators (Charlie, Lara, Moddy, Tunde, Beatrice, Agi); all 6 registered for Elevate. Lara (ladigitalmx) and Agi (as-team66344) are new for Daria's credits; still missing Zain, Amichai URLs. 17:00 UK Charlie Hills accepted the dinner invite (all 4 London events now accepted).
- 21.11 07:08 UK sync: Kate Nir replied 20.11 22:35 UK (keynote rehearsals that evening; asked dinner time/place and when Simon's workshop is). Ilan answered 05:00 UK (19:30 near Covent Garden; workshop Tue 14:30) and asked whether to send invites; waiting on her. Calendar has the workshop from 14:00 UK (Daniel Q&A 14:00–14:45).
- 21.11 12:10 UK sync: Reut (DM 11:19 UK, "last-minute changes") sent a slide of the 4 London creators her team brings to the conference: Beth Thomas, Callum McDonnell, Elfried Samba (new; ex-Gymshark social, Butterfly Effect) and Lara Acosta (already our Creator Buzz creator). Grace Andrews + Adam Faulkner not on it. Unclear whether her dinner seats change; pre-order CSV left unchanged until confirmed. Ledger 13608928502.
- 21.11: Reut's slide (11:19 UK) = 4 CRM creators: Beth Eleanor Thomas, Callum McDonnell, Elfried Samba (NEW, ex-Gymshark), Lara Acosta (also our CB creator). Grace + Adam not on it. Slack draft to Reut (thread) asks dinner change + Lara overlap. Kate Nir (kateni@monday.com) added to dinner + workshop invites 21.11; not on Balthazar form/table plan (add on the night).
- 21.11 (Ilan said send): sent Reut (thread) Lara's deal via Creator Buzz ($13K full scope: IG Reel + LinkedIn cross-post + Story set; dinner 23.11 + creator day 24.11) to avoid double pay/deliverables; asked if Grace/Adam out + Elfried in + his menu. Previous Reut Slack draft Dr0CLQHPV1ME superseded (delete manually).
- 21.11 ~17:32 UK (Ilan to Reut, DM): Lara Acosta comes through us (Creator Buzz, closed long ago); her campaign can't focus on CRM. Waiting on Reut (ledger 13609571998, fu 22.11).
- 21.11 18:20–19:07 UK (Reut DM): Lara Acosta ALSO signed a contract with the CRM team via Reut's agency (possible double booking); Reut escalated to her agency, asks us to share our creator names next time. Ilan: "looks like she's trying to double-book". Decision open (owner-only ledger 13609664643). Reut still owes Grace/Adam/Elfried answers (ledger 13609571998).
- 21.11 19:3x UK: sent Dora (thread) Hosanna replaces Simon + Kate Nir added (choice on the night) + CS seats dropped = 42 guests; regenerated form attached. Old draft r-3279550613595349975 deleted. Table plan not updated for Kate (seat on the night; F has 1 empty seat).
- 21.11 20:08 UK sync (last of the day): quiet. No Dora reply to the 19:35 email (only Patricia's auto-reply); ledger waiting-on Dora 13609738620 (fu 22.11), Dora draft row 13603901176 closed. No new Slack/Gmail/board activity.
- 22.11 07:08 UK sync: quiet overnight. Only Ilan's own DM to Reut (21.11 23:07 UK): next time send names first or check the CRM; Lara was one of our first hires, final list locked last week (owner-only ledger 13610630514). No Dora reply yet (fu today). No new RSVPs, email, boards or drafts.
- 22.11 08:08 UK sync: quiet. No new Slack (all London channels/DMs), Gmail, RSVPs (dinner/workshop unchanged since 21.11), board or ledger activity. Still no Dora ack (fu today), no Reut reply.
- 22.11 ~08:38 UK: SENT Daria (credits thread) Lara + Agi URLs and Zain/Amichai account emails (asked to find by email). Old unsent Daria draft superseded. Creator credits: 6/10 loaded (Hila, Tunde, Moddy, Beatrice, Christian, Charlie). Keren Sharabi (EMEA Services Director, via Doron) dinner invite = Slack draft.
- 22.11 (Ilan): Comms Requests rule: sensitive/time-critical requests stuck with an owner → Brie Fing pings #communications (C08STFTQFME), not just the owner. Guy's graduate panel: ask Guy re prep + walkthrough. Request-board cleanup in progress via Brie Fing (DM D0C40088Q4V thread 1795336142.305559); no closures approved yet.
- 22.11: Elevate EMEA attendee approval board = 18424583807 (Sophie's staffing; 285 rows, CCO group = Lihi Goren Pecht).
- 22.11 09:09 UK sync: only new item = Ilan's own 08:38 UK Daria send (credits 6/10). No Daria reply yet; ledger waiting-on row 13610861661 (internal, fu 23.11). No other new London Slack/Gmail/RSVP/board activity. Brief republished (v37).
- 22.11 (Ilan): headset tour Tue 24.11 11:30–12:15 = 5 stations: Vibe (Philipp Dess), Harmony (Amit Ben, Simon Harris), Globster/Rings AI (Nave Cohen, Alon Naftali), Sidekick (Alon Kichin), Notetaker (Aviya Sela); no demo needed, timings flexible; Sidekick/Notetaker after 12:00 (sessions 11–12). Sent Nora + Or group DM C0CKYQZH8RY (asked Harmony/Globster booth locations); booth-hosts group DM C0CKYR0ME82 = Slack draft, send after Nora/Or. Booth schedule: Manon's artifact MSDN8PiqF8N7VqWJVcfm4B, #elevate-emea-booth-staffing.
- 22.11: Ilan met Reut Shemesh (Sr User Acquisition, U02GQJEL2GG) + Shirley Carlebach (Growth Marketing Group Lead, U0204PY11L2). Sent group DM C0CL2S51DHA (+Or): all NYC creator content (15 creators/31 posts, UTM 307 visits/16 accounts) + London 10 expected; promised to share London content as it goes live.
- 22.11 10:09 UK sync: no replies yet from Nora/Or (headset tour, ledger 13610966690, fu 23.11), Daria, Dora, Reut Efroni, Keren. Acquisition share logged (ledger 13610992753). Brief v38 adds the 5-station tour. No other new London activity.
- 22.11 11:10 UK sync: Or (Nora+Or DM, 11:01 UK) proposes a shorter headset tour: Nora intro + walk-through, 3 stops (Notetaker, Vibe, Harmony), maybe 1 activation, short demos, heads-up to product teams; Ilan's call vs 5 stations (ledger decision 13611078038); booth-hosts draft still lists 5. Daria 10:25 UK: credits loaded for Lara, Agi, Zain (9/10); Amichai's asheqel@ has 2 monday accounts → his Gmail draft r-533413318885750106 updated to ask which account (cc Zohar). Christian Zimmer accepted all 4 London events 10:20 UK. Shirley thanked for the NYC content share. Brief v39.
- 22.11 12:09 UK sync: Hila Naor emailed 11:34 UK ("את עולה?") during the Agents walkthrough Zoom (11:30–12:00 UK, her Fireflies notetaker joined); reschedule if Ilan missed it (ledger 13611276383). Or (acquisition group DM 11:51 UK) asked Reut Shemesh + Shirley for their thoughts on the NYC share. No other new London activity; RSVPs, boards unchanged. Brief v40.
- 22.11 13:09 UK sync: the Hila Naor Agents walkthrough DID happen (Notetaker summary 12:36 UK, ~56 min); reschedule row 13611276383 closed. Ilan's to-dos: send Hila the Notetaker summary; open the private MCPs he showed. Hila keeps the WhatsApp-external-agent question for the workshop; deep content can go live after this week. Hila's travel to be reimbursed, method TBD (owner-only ledger decision 13611341270; follow-up row 13611392626). No other new London activity. Brief v41.
- 22.11 ~13:20 UK: headset tour = Or's plan (Ilan approved): Nora intro + walk-through, then Notetaker (Aviya), Vibe (Philipp), Harmony (Amit Ben, Simon Harris), + optional activation; short demo per booth. Approved to Or in C0CKYQZH8RY. Booth heads-up = Slack draft in group C0CKUGUD9D3 (3 teams + Or + Nora). Old 5-station draft in C0CKYR0ME82 obsolete (Ilan to delete).
- 22.11 ~13:30 UK: Ilan SENT booth heads-up (Notetaker/Vibe/Harmony + program context) in group C0CKUGUD9D3. Waiting on booth teams' OK.
- 22.11 14:09 UK sync: correction: Ilan's first booth heads-up (13:49 UK) went to the Nora+Or DM C0CKYQZH8RY for review; Or asked to add the creator list + socials, Nora offered a photo stop + group photo. The full tour message with the 10 creators' links was SENT to booth group C0CKUGUD9D3 at 14:04 UK; waiting on Aviya/Philipp/Amit/Simon (ledger 13611471710, fu 23.11). Tour decision row 13611078038 closed. Amichai's AI assistant (service@ai-masterclub.com) emailed Nitzan, cc Ilan, 14:00 UK: taxi Hod HaSharon → Ben Gurion tonight, pickup 01:40 IL, LY311 05:30 Mon 23.11 (owner-only ledger 13611518984). Reut Shemesh (acquisition group, 14:02 UK) wants to reuse NYC creator content (product-in-use clips, edited/shortened) and asks what our creator agreements allow (owner-only ledger 13611498303). Agi accepted all 4 London events. Brief v42.
- 22.11 ~14:31 UK: Keren Sharabi (via Doron) sent Doron Sinai (doronsi@) + Tom Kaplan (tomkap@), FDE team; Keren herself likely can't (dinner with managers). Added both to dinner invite; table plan v3 (Tom = table E ex-CS1, Doron = table A ex-CS2, Hosanna confirmed, Kate Nir = table F empty seat); pre-order form 44 guests; SENT Dora (thread) 44 guests + form + table plan. Asked Keren whether she confirms with them or Ilan does.
- 22.11 15:09 UK sync: Keren Sharabi (C0CL0NSSE8H, 14:25 UK) already confirmed with Doron Sinai + Tom Kaplan: they're in. Ilan asked procurement (C0C3ZGEQK6G: עדיה, Michal Rutenberg, Or; 14:14 + 14:16 UK) how to reimburse creators' travel (direct / agency / PO / business Gett); waiting (owner-only ledger 13611634688, fu 23.11). Ilan in acquisition group (14:12 UK) asked next steps with Aviv Bar Oz (avoid clash with rebrand activation; ledger 13611625758). Dora 44-guest waiting row 13611624710 (fu 23.11); old 42-guest row 13609738620 closed. Brief v43.
- 22.11 16:09 UK sync: Michal Rutenberg (procurement group C0C3ZGEQK6G, 16:02 UK) answered the creator-travel question: in principle a PO must be opened, no other way to pay creators; asked that such costs be raised in advance, not last minute. Applies to Amichai's taxi tonight + Hila's travel (Ilan's call; owner-only ledger 13611778973; waiting row 13611634688 closed). Ilan forwarded the Valeria call (moved to Mon 23.11 18:30 IL) to Reut Shemesh 15:17 UK. Nothing else new (no Dora ack, RSVPs/boards unchanged). Brief v44.
- 23.11 16:32 UK catch-up sync (hourly runs missed 22.11 16:09 → now). Dinner FINAL: Ilan sent Dora Kamie Shami-Schnitzer replaces Dor Cohen (veg) 10:20 UK; Dora 10:32 UK: function kitchen cooks pre-orders only, no orders on arrival; Ilan sent Kate/Doron/Tom choices 12:14–12:23 UK; Dora 13:17 UK final function sheet, no further changes, rest via on-site team (CSV updated). Lee-at 15:37 UK (#influencers-at-elevate): ambassadors got no dinner invite, sent 14 addresses; dinner invite now has all 14 (16:32 UK), but the form has 11 ambassadors and 4 addresses don't match form names (meganegeland@, marketing@bapany.org, cpmalliou@, tamara.vuckovic@): open (ledger 13618413647). Tour: Simon Harris (Harmony) wants it early, speaking slot 12:15; Aviya leaves ~11:50, Manon Bouchard/Lawrence Machin cover Notetaker+Sidekick; no reply from Philipp (Vibe). Tara (Creator Buzz) bumped her 20.11 meeting-point question 12:19 UK and shared "Elevate EMEA Influencer Brief" (NY brief adapted) 15:32 UK; unanswered (ledger 13618402778). Reut 23.11 07:48 UK: CRM side cancelled Lara (decision row closed). Michal 22.11 16:17 UK: no employee-style expense for creators; suppliers build it into fee / PO line; Ilan 16:18 UK: via our agencies. Ilan emailed Amichai 10:25 UK which of 2 accounts (credits 9/10). Brief v45.
- 23.11 ~16:45 UK: 14 ambassador emails (Lee-at's list) added to dinner invite. 10 'see you tonight + personal UTM' Gmail drafts created (EN; HE for Hila/Amichai; CC CB/Narrative/Scherf). Zain UTM added.
- 23.11 ~16:50 UK: SENT all 10 'see you tonight + personal UTM' emails (hyperlinked, no google redirect; agencies CC'd).
- 23.11 17:09 UK sync: Agi replied 17:03 UK to the see-you-tonight email: arrives ~20:00 (work call first). Dinner RSVPs: 4/14 ambassadors accepted (Simran, Feride, David, Shiro). Auto-replies: marketing@bapany.org = Trevor Chauvin-DeCaro (on the form), OOO until 2.12; Yogesh OOO until 27.11; both may not attend. Ledger rows 13618877931, 13618899261. Brief v46.
- 23.11 18:09 UK sync: Reut Efroni (DM 17:13 UK) asks where the creator workshop is (which floor); unanswered (Capital Lounge 3, Level 2; ledger 13619568483). Trevor (marketing@bapany.org) accepted the dinner ~17:20 UK despite his OOO: 5/14 ambassadors (ledger 13619579034). Brief v47.
- 23.11 19:09 UK sync: Chad Bruce (Travelodge, ambassador) accepted the dinner 18:26 UK: 6/14 ambassadors (ledger 13620370713). Christian replied 18:46 UK to see-you-tonight (thanks); Amichai 17:23 + Moddy 17:29 courtesy replies (Amichai still hasn't said which account). No new London Slack. Brief v48.
- 23.11 20:09 UK sync (last tonight): quiet. No new London Slack (all channels/DMs), no creator/agency Gmail, RSVPs unchanged (dinner 6/14 ambassadors; workshop unchanged). Only Zip #16198 (NYC Narrative): Adaya asked Or to approve 20:00 UK (ledger 13620996574). Brief not republished (nothing new). DM to Ilan 20:09 UK with the 4 morning must-dos (Reut location, Tara meeting point, tour order Harmony first, workshop wifi/Shir+Aviad/Amichai account).
- 24.11 07:09 UK sync (event day): quiet overnight. No new London Slack (all channels/DMs), no creator/agency/We Are Alive Gmail (no Lucy handover confirmation, no Amichai account reply). Only new: Beatrice Vladut accepted the workshop 23:13 UK (ledger 13624427732); workshop creators accepted: Beatrice, Moddy, Christian, Charlie, Agi, Zohar; no response: Tunde, Lara, Zain, Amichai, Hila. Brief not republished.
- 24.11 08:10 UK sync: Nora (Nora+Or DM C0CKYQZH8RY, 07:22 + 07:30 UK) asks Ilan for the final tour order breakdown and where they meet; unanswered (ledger 13624657715). Workshop RSVPs unchanged; no creator/agency/We Are Alive Gmail (still no Lucy handover confirmation, no Amichai account reply); no other new London Slack. Brief not republished.
- 24.11 09:09 UK sync: Ilan answered Nora (C0CKYQZH8RY, 09:04 UK): "We will meet right outside the main stage" (tour meeting point); tour order still not sent (ledger 13624657715 kept open, renamed). No other new London Slack, no creator/agency/We Are Alive Gmail (no Lucy confirmation, no Amichai account reply); workshop RSVPs unchanged. Brief not republished.
- 24.11 ~09:17 UK: Amichai sent workshop account asheqels-team-company.monday.com (09:11 UK); sent to Daria in credits thread for last load (10/10 pending her). Tour order sent to Nora.
- 24.11 10:09 UK sync: tour order (Harmony → Notetaker → Vibe → group photo) + meeting point (outside main stage) sent to Nora; ledger 13624657715 closed. Amichai account asheqels-team-company.monday.com sent to Daria 09:16 UK, no reply yet (waiting row 13625160923, credits 9/10 → 10/10). Reut Efroni handled (Ilan spoke with her; she handles her creators' accounts): row 13619568483 closed. Old Amichai "which account" draft row 13611076946 closed. Workshop-directions message for creators prepared for Ilan to send. Tara (13618402778) still open. No other new London Slack/Gmail; workshop RSVPs unchanged (6 accepted, 5 no response). Brief v49.
- 24.11 11:11 UK sync: Amichai emailed 10:30 UK asking Ilan to save him a seat at masterclass "Building apps with Vibe: Marketing & Sales" 12:40 UK, Learning Lab 3 (ledger 13625492920); masterclass POC today is Rebecca Levin (U06LM1N3AHY), stationed outside the learning labs (#elevate-masterclasses-emea 07:33 UK). Daria still silent on Amichai's credits (row 13625160923 open, 9/10). No other new London Slack/Gmail; workshop RSVPs unchanged. Brief not republished.
- 24.11 12:12 UK sync: quiet. No new London Slack (all channels/DMs, Ilan sent nothing), no creator/agency/We Are Alive Gmail (Daria still silent on Amichai credits, 9/10), workshop RSVPs unchanged (6 accepted, 5 no response). No creator posts spotted via Slack/Gmail. Late dinner RSVP from bibitayooyedokuno@gmail.com (after the event; ignore). Brief not republished. DM to Ilan: 3 pre-14:00 items (credits, masterclass seat, Tara/WhatsApp directions).
- 24.11 13:14 UK sync: Ilan asked Daria (DM, 12:50 UK, top-level, not in the credits thread) to load Amichai too; Daria replied 13:07 UK "למי?" + "לא רואה לינק": the account link was missing. Ilan needs to send asheqels-team-company.monday.com before 14:00 (credits 9/10; ledger question 13626207443, waiting row 13625160923 open). No other new London Slack/Gmail; workshop RSVPs unchanged (6 accepted, 5 no response). Brief not republished. DM to Ilan 13:14 UK.
- 24.11 14:00 UK: Daria loaded Amichai's credits ('done and done') → credits 10/10. Workshop started 14:00.
- 24.11 14:11 UK sync: credits 10/10 confirmed in Daria DM (14:00 UK); ledger rows 13625160923 + 13626207443 closed. No other new London Slack/Gmail (Clarity UK coverage roundup 13:35 UK in #clarity-monday, not London-creator). Brief v50. DM to Ilan 14:11 UK.
- 24.11 15:10 UK sync: Ilan sent Daria Tara's email (tara.crym@gmail.com) in the credits DM 14:57 UK; no reply yet (ledger waiting row 13627452213). No other new London Slack/Gmail; no creator posts spotted via Slack/Gmail. Brief not republished.
- 24.11 (Ilan): content watch now covers 10 London creators (roster event=london, watch to 24.12; report-only except Christian 13143456400 + Zain 13554479376 CRM). Trigger trig_01Pd12AtXYpfMKC3jwZwhtdi daily 18:47 IL to 01.12, then back to every 3 days (reminder trig_01ELcGdAS7nSLMkW7CxoCg9d on 02.12).
- 24.11 16:10 UK sync: Daria (15:11 UK) is out of the office and pointed Ilan to Tomer Aloni (U0837B2QWQJ) for today's credits; Ilan asked Tomer 15:15 UK to load credits for tara.crym@gmail.com. Tomer 15:53 UK asked what it is about and whether it is part of Elevate; unanswered (ledger 13628130740; Daria row 13627452213 closed). No creator thank-yous/posts in Slack/Gmail; no other new London activity. Brief not republished.
- 24.11 17:10 UK sync: quiet. Ilan has not answered Tomer Aloni (Tara's credits, ledger 13628130740 still open); no credits confirmation. No creator thank-yous/feedback or new post links in Slack/Gmail (beyond the 16:48 UTC content-watch report). Verified Daria row 13627452213 status = Closed. Brief not republished.
- 24.11 (Ilan): Influencers CRM full sync done. New CRM items (UK — Elevate London pool): Moddy 13629402836, Beatrice Vladut 13629325112; the other London creators already had items (Charlie 13431146985, Lara 13431161942, Tunde 13462451800, Agi 13431163033, Hila 13579454406, Amichai 12993721570 "Amichai AI", in the Narrative group). All 10 London crmItemIds now in the content-watch roster. All 31 Elevate NYC + London creator items got an "Interaction log (synced 24.11.2026)" update; empty columns filled (owner, email, agent, deliverables, invite), Christian Deal Value 6,500 → 10,000 (17.11 package). Kierra Mcmillian (13434164812) is kierramc@monday.com, likely an employee, not a creator.
- 24.11: Elevate '26 Creator Wall (all creator posts NYC+London, Elevate DS look): https://claude.ai/artifact/SeahWViUoPQvtNoZV6LEi9. Source scratchpad/elevate-content; data via scripts/build-elevate-content-data.py from content-watch found.json; thumbnails via Bright Data. Snapshot, not auto-updated yet.
- 24.11 18:09 UK sync: quiet. Ilan still has not answered Tomer Aloni (Tara's credits; Tomer DM silent since 15:53 UK, ledger 13628130740 open, no credits confirmation). No new London Slack (all channels/DMs; Ilan's only messages were in an unrelated Orr Segev DM), no creator/agency/We Are Alive Gmail, no creator thank-yous or new post links. Brief not republished.
- 24.11 20:53 IL reply tracker: DM sent (D038RJ45RQD p1795546350772999). New waiting-on-Ilan rows: Another/Veja agents trial for Álvaro Leme 13629918627, Signal Tours asks which PO covers Tara's travel 13629918626 (owner-only), Forrest Richardson customer escalation (Search Everywhere) 13629918628. 18 London rows moot after the event set Superseded (workshop/dinner/meeting points/Matt Pocock/Amalia/Reut/Hila/Shanee/Or-sync). Old Gmail drafts still to delete by hand: 8 creator emails 19.11, Matt fu, Or reserve-duty fu.
- 24.11 19:10 UK sync: quiet. Tomer Aloni DM silent (Tara credits still unanswered, ledger 13628130740 open). No new London Slack (all channels/DMs; Ilan's only message was the 18:52 UK reply-tracker DM), no creator/agency/We Are Alive Gmail, no creator thank-yous or new post links. Booth leaderboard final 19:00 UK (not London-creator). Brief not republished.
- 24.11 evening: 29 IG story mentions on event day from 9/10 London creators verified via Sprout API (findings show Beatrice at 5, not 6 as first counted); Beatrice IG = @beavladut; logged on CRM items (update + Deliverables line each; Beatrice IG column filled); media capture pending (Sprout-only, ~24h).
- 25.11: Ilan: UTM report → daily again, NYC + London (24 creators), ranked per event by $/visit (then $/account, visits÷followers), ⚡ event-day vs 📱 content flag. Kremer re-authed 25.11. Sajjaad UTM: 11 visits / 2 accounts 23–24.11 (reel 'comment monday' DM link may not carry our UTM: ask Narrative).
- 25.11 London creator fees resolved (USD, excl. 18% agency fee): Christian Zimmer $10,000 (Margo/Narrative final package 17.11 + Ilan 'Confirmed!', Gmail 1a1ea1dec25ff498; $6,500 was the 15.11 offer); Moddy $11,450 (Creator Buzz sheet 'Monday Elevate EMEA' > Final: 30-60s IG video + 1 story + dinner + conference); Amichai + Hila $0: accommodation + flights only, no content fee (Ilan, 25.11). CRM Deal Value set (Moddy 11450, Amichai/Hila 0), updates posted; utm inputs/report updated.
- 25.11 Amichai/Hila travel (Signal Tours quotes, no invoices seen): Amichai $933 flight + £460 hotel (2 × £230, Dorsett Canary Wharf 23–25.11) = $1,536 (PO012602925, Gmail 1a1c0a701fa11019); Hila $1,026 flight (Gmail 1a1ddf587174194c, Zip #16492) + hotel unpriced (voucher 1148564), estimated at £460 = ~$1,629. FX ECB 1.3098 (24.11). $/visit incl. travel: Amichai $17 ($307/account), Hila ~$815. In `travel_usd` in creator-utm-inputs.csv and the London report.
- 25.11: Vibe app 'Elevate '26 Creator Hub' (id 10593647, https://monday.monday.com/vibe/app/10593647): live read-only dashboard of the 24 Elevate creators from Influencers CRM (hardcoded item ids + travel Hila 1629 / Amichai 1536). Leaderboards per event by $/visit, cards, side panel with updates, NY vs London. Private/unpublished. New creators or travel costs = update the app's hardcoded map via vibe_update.
