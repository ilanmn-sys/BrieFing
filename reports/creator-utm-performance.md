# Creator UTM performance: Elevate NYC creators

Built 10.11.2026 (system clock). Data runs through **09.11.2026**, because the visits table lags one day. Everything was read-only: nothing was sent and no board was changed. The reusable SQL is in `reports/creator-utm-queries.sql`.

## Bottom line

- The 14 NYC creators' links brought **306 visits** (297 unique visitors) and **15 new accounts**. **2** of those accounts were activated. There are **0 paying accounts and $0 ARR so far**. Payer flags aren't final until 28 days after signup, which is around 25.11.
- **Mariana (Mar) Antaya accounts for most of it:** 181 visits and 14 of the 15 accounts. 152 of her visits and 12 of her signups came on 28.10, the event day. That pattern suggests the link was shared at Elevate itself, for example at the workshop or on stage, rather than in a post. Check this before giving the credit to her content.
- **Five creators have no visits at all:** Natasha, Fiona, Max Talks Tech, Taki and Naya. Aria has 1 visit.
- **All 14 creators' links were found.** None is missing.

## 1. UTM inventory

Every NYC link is `https://monday.com?utm_medium=influencers&utm_source=elevate&utm_campaign=multi-multi-event-multi-<handle>`. They land on the homepage and carry no utm_content or utm_term. Sources: Ilan's sent Gmail, subject "Elevate tomorrow: your checklist + personal link" (Creator Buzz group and Kayvon), or "...which monday.com account should we load your credits on?" / "Taki's monday.com account, sessions + personal link" (Narrative group). The template appears first in Slack: Tzah Perry DM'd Ilan on 26.10 with `...utm_campaign=multi-multi-event-multi-ilan`.

| # | Creator | Group | utm_source | utm_medium | utm_campaign | Sent (UTC) | To | Gmail thread |
|---|---|---|---|---|---|---|---|---|
| 1 | Soojin | Creator Buzz | elevate | influencers | multi-multi-event-multi-soojin | 28.10 01:20 | soojinmedia@gmail.com | 1a180177d3cc6359 |
| 2 | Audrey | Creator Buzz | elevate | influencers | multi-multi-event-multi-audrey | 27.10 17:30 | audrey@soleilai.ca | 1a17d030f8b1813d |
| 3 | Aria | Creator Buzz | elevate | influencers | multi-multi-event-multi-aria | 27.10 17:30 | aria@techwitharia.com (cc to her manager bounced) | 1a17d03104c44110 |
| 4 | Maitri | Creator Buzz | elevate | influencers | multi-multi-event-multi-maitri | 27.10 17:29 | contact@maitrimangal.com | 1a17d03144964431 |
| 5 | Alexis | Creator Buzz | elevate | influencers | multi-multi-event-multi-alexis | 27.10 17:27 | alexis@team-hyphen.com | 1a17d031bea98f27 |
| 6 | Natasha | Creator Buzz | elevate | influencers | multi-multi-event-multi-natasha | 27.10 17:29 | natasha.badger@gmail.com | 1a17d03133608d4d |
| 7 | Danielle | Creator Buzz | elevate | influencers | multi-multi-event-multi-daniellefarage | 27.10 17:30 | danielle@daniellefarage.com | 1a17d030cd34415e |
| 8 | Fiona | Creator Buzz | elevate | influencers | multi-multi-event-multi-fifbuilds | 27.10 17:28 | fifbuilds@gmail.com | 1a17d0319822f285 |
| 9 | Max Talks Tech | Creator Buzz | elevate | influencers | multi-multi-event-multi-maxtalkstech | 27.10 17:29 | maximiliancascerceri@gmail.com | 1a17d03173f0cda1 |
| 10 | Mariana (Mar) Antaya | Narrative | elevate | influencers | multi-multi-event-multi-mariana | 27.10 10:25 | mariana@thedriveagency.co | 1a17cd32a51377fd |
| 11 | Kayvon | Narrative | elevate | influencers | multi-multi-event-multi-kayvon | 27.10 10:26 | kayvon@thetechplate.com | 1a17ce1c4609289b |
| 12 | Sajjaad | Narrative | elevate | influencers | multi-multi-event-multi-sajjaad | 27.10 10:55 | contact@sajjaad.org | 1a17cf7efb2de2d8 |
| 13 | Taki | Narrative | elevate | influencers | multi-multi-event-multi-taki | 27.10 10:56 | slevene@viralnation.com (cc Taki) | 1a17cf7eaec76922 |
| 14 | Naya | Narrative | elevate | influencers | multi-multi-event-multi-naya | 27.10 10:56 | naya@bfepartnerships.com | 1a17cf7ec94f47a3 |

**Other links that are not among the 14 creators** were found in the same sends and are tracked for completeness:

| Who | utm_campaign | Sent |
|---|---|---|
| Vin Matano (Creator Buzz agent) | multi-multi-event-multi-vinmatano | 27.10 |
| Eilon (Ayalon Gruper) | multi-multi-event-multi-eilon | 27.10 |
| Mor | multi-multi-event-multi-mor | 27.10 (Hebrew email) |
| Lauren Vriens | multi-multi-event-multi-laurenvriens | 27.10 |
| Jean Kang | multi-multi-event-multi-jeankang | 27.10 |
| Jade Bonacolta | multi-multi-event-multi-jadebonacolta | 27.10 |
| Hilary Gridley | multi-multi-event-multi-hilarygridley | 27.10 |
| Ilan (template/test) | multi-multi-event-multi-ilan | Slack DM from Tzah Perry, 26.10 |

**CRM bit.ly links:** both were resolved with `curl -sI` on 10.11, and both match the item updates on Influencers CRM 18425284143.

| Creator (item) | bit.ly | Resolves to | utm_source / medium / campaign |
|---|---|---|---|
| Jake Abrams (13016312244) | bit.ly/4sEjieG | monday.com/w/agents | influencers / influencers / ww-en-brand-other-jake |
| Davidson Daniel (13016325007) | bit.ly/3NTNUux | monday.com/crm | influencers / influencers / ww-en-brand-work_mgmt-davidson |

Searching Slack for `utm_source=elevate` and `utm_campaign`, and reading the CRM board updates since 20.10, turned up no other creator UTMs. Nothing in the repo besides the CRM enrichment report has one either.

## 2. Metrics per creator (27.10 to 09.11.2026)

**A. Visits table** (`bigbrain.l3.fact_tof_visits_daily`). Each visit is counted under its own UTMs. Bots and demo traffic are excluded.

| Creator | Visits | Visitors | Get started | Accounts created | Activated (1st board load) | Payers 14d / 28d | First / last visit |
|---|---:|---:|---:|---:|---:|---|---|
| Mariana (Mar) Antaya | 181 | 180 | 38 | **14** | **2** | 0 / 0 | 27.10 / 09.11 |
| Maitri | 32 | 31 | 5 | 1 | 0 | 0 / 0 | 28.10 / 05.11 |
| Audrey | 31 | 31 | 0 | 0 | 0 | 0 / 0 | 28.10 / 29.10 |
| Sajjaad | 26 | 26 | 1 | 0 | 0 | 0 / 0 | 28.10 / 29.10 |
| Kayvon | 11 | 11 | 0 | 0 | 0 | 0 / 0 | 07.11 / 08.11 |
| Danielle | 11 | 9 | 0 | 0 | 0 | 0 / 0 | 27.10 / 04.11 |
| Soojin | 8 | 4 | 0 | 0 | 0 | 0 / 0 | 05.11 / 09.11 |
| Alexis | 5 | 5 | 0 | 0 | 0 | 0 / 0 | 28.10 / 29.10 |
| Aria | 1 | 1 | 0 | 0 | 0 | 0 / 0 | 28.10 |
| Natasha | 0 | 0 | 0 | 0 | 0 | 0 / 0 | – |
| Fiona | 0 | 0 | 0 | 0 | 0 | 0 / 0 | – |
| Max Talks Tech | 0 | 0 | 0 | 0 | 0 | 0 / 0 | – |
| Taki | 0 | 0 | 0 | 0 | 0 | 0 / 0 | – |
| Naya | 0 | 0 | 0 | 0 | 0 | 0 / 0 | – |
| **Total (14)** | **306** | **297** | **44** | **15** | **2** | **0 / 0** | |

**B. Attribution table** (`bigbrain.l3.fact_campaign_monitoring_dwh`). This table credits each signup to one winning touchpoint.

| Creator | Attributed visitors | Attributed signups | Qualified signups | Paying accounts | ARR (latest MRR × 12) |
|---|---:|---:|---:|---:|---:|
| Mariana (Mar) Antaya | 178 | 16 | 0 | 0 | $0 |
| Maitri | 30 | 1 | 0 | 0 | $0 |
| Audrey | 30 | 0 | 0 | 0 | $0 |
| Sajjaad | 25 | 0 | 0 | 0 | $0 |
| Kayvon | 11 | 0 | 0 | 0 | $0 |
| Danielle | 5 | 0 | 0 | 0 | $0 |
| Alexis | 5 | 0 | 0 | 0 | $0 |
| Soojin | 4 | 0 | 0 | 0 | $0 |
| Aria | 1 | 0 | 0 | 0 | $0 |
| Natasha, Fiona, Max Talks Tech, Taki, Naya | 0 | 0 | 0 | 0 | $0 |
| **Total (14)** | **289** | **17** | **0** | **0** | **$0** |

The two tables match visitors to accounts differently, which is why Mariana has 14 signups in A and 16 in B.

**Mariana by day** (visits / accounts): 27.10: 25 / 2 · **28.10: 152 / 12** · 29.10: 3 / 0 · 09.11: 1 / 0.
**Maitri by day:** her visits are spread over 28.10–05.11, peaking at 12 on 29.10. Her one signup came on 04.11. This looks like post-driven traffic.

**The other links** (visits table, same window): vinmatano 2 · mor 1 · jeankang 1 · ilan (test) 1 · eilon, laurenvriens, jadebonacolta, hilarygridley 0. None produced a signup.

**CRM links, all time:**
- **Davidson** (`ww-en-brand-work_mgmt-davidson`): first visit 09.05.2026, latest 03.11.2026. 161 non-bot visits, 2 get-started, **0 signups**. The attribution table shows 146 visitors and 0 signups. Only 1 of those visits falls inside the Elevate window (03.11).
- **Jake** (`ww-en-brand-other-jake`): **no real traffic**. There is a single visit on 10.09.2026, flagged as bot.

## 3. Method

- **Tables:**
  - `bigbrain.l3.fact_tof_visits_daily`, filtered to `record_source='signup_flow'` and `COALESCE(is_bot_or_demo,0)=0`. Matching is on `visit_marketing_source`, `visit_campaign_name` and `day`. The metrics are `visit_id`, `visitor_id`, `is_get_started`, `is_soft_signup`, `is_hard_signup` (account created), `is_first_load_event_after_signup` (activation), `is_payer_14` and `is_payer_28`.
  - `bigbrain.l3.fact_campaign_monitoring_dwh`, using `type='people'` for visitors and `type='attribution'` for accounts. Matching is on `source`, `campaign` and `created_at`. The metrics are `is_qualified_signup`, `first_arr_date` (paying) and `mrr_999999` × 12 (ARR).
- **Attribution:**
  - The visits table has **no attribution model**. Each visit keeps its own UTMs, so it is touch-level, neither first-touch nor last-touch.
  - The campaign-monitoring table uses **rule-based single-touch** attribution. Priority goes high-priority clicks, then impressions, then brand clicks, then low-priority clicks. Only if none of those match does it fall back to the **last touch in the 24h before signup**. Click windows are 12h on desktop and 24h on other devices.
  - The campaign-monitoring table is rebuilt on a schedule, so its numbers can change retroactively.
- **Window:** 27.10.2026 (first send) through `CURRENT_DATE()`. The visits table's newest day is yesterday.
- **SQL:** `reports/creator-utm-queries.sql` holds four queries:
  - Q1: per-creator funnel from the visits table, with a ROLLUP total.
  - Q2: per-creator attribution and ARR.
  - Q3: discovery of unlisted or typo'd elevate campaigns.
  - Q4: daily trend for one creator.

  Q1 and Q2 were run exactly as saved on 10.11 and produced the tables above. To change the window or the creator list, edit the `params` and `utm_list` CTEs.
- **Kremer:** I first used `data-expert-agent` for schema discovery, which took about 1–2 minutes and needed no approval. Everything after that ran on `run-sql`, which is synchronous and returns in seconds. Use `run-sql` with the saved queries for daily reruns.

## 4. Data gaps and caveats

1. **Revenue isn't final yet.** The 28-day payer flag isn't complete until about 25.11 for 28.10 signups, and until 02.12 for Maitri's 04.11 signup. The 14-day flag is also immature for anything after 27.10. "0 payers / $0 ARR" is the position today, not a final result.
2. **Mariana's event-day spike:** 152 visits and 12 signups came on 28.10. That looks like in-person use at Elevate, such as a QR code or a screen at the workshop, rather than her content. Check before treating it as content performance.
3. **The data only sees people who clicked the link.** A view of a post without the link (an IG Reel with no link, an untagged TikTok) leaves no trace in either table. Natasha, Fiona, Max, Taki and Naya show zero visits. That fits either "not posted yet" or "posted without the link", and the data can't tell which. Cross-check with `agents/elevate-nyc-content-watch/state/found.json`.
4. **No utm_content / utm_term:** the links carried none, and the visits table has no such columns. The attribution table's `content`/`keyword` columns are empty for these rows.
5. **"Activated" is a proxy.** It means the first board load after signup, which is the only activation flag in the visits table. It is not a product-qualified activation.
6. **CRM links predate Elevate.** They use `utm_source=influencers`, not `elevate`. Jake's link has never had a real visit. If he posted it, the bit.ly may not have been used.
7. **Delivery note:** Aria's email cc to sandrachen@sixteenth.com bounced. Aria herself received the link, and it has 1 visit.

## 5. Efficiency (cost, views, followers)

Added 10.11.2026 (system clock). Visits and accounts come from a fresh Q1 run on 10.11 (data through 09.11), and they match section 2A. Fees, views and followers are in `reports/creator-utm-inputs.csv`, so a daily job can join them to fresh Kremer numbers. Read-only: nothing was sent and no board was changed.

**Bottom line:** On cost per visit, **Maitri is the most efficient creator whose traffic clearly came from her content.** She cost $250 per visit, and her one signup cost $8,000. Mariana is cheaper on paper, at $186 per visit and $2,411 per account, but 152 of her 181 visits came on 28.10, the event day. Without that day she costs **$1,164 per visit and $16,875 per account.** Five paid creators (Natasha, Fiona, Max, Taki and Naya, who was unpaid) have no visits yet.

### Table

Fees are creator fees. Creator Buzz fees do **not** include the agency's 18% (with it, the NYC total is $80,771). Narrative fees are the figures in Zip #16198. Views: V = verified (Bright Data, 10.11), R = creator-reported, * = partial (covers only some of the creator's monday posts), n/a = no figure. Followers are on the platform where the creator posted the monday content, or their main platform if no post was found.

| Creator | Group | Fee | Visits | Accounts | $/visit | $/account | Views | Views→visits | Views→accounts | Followers (platform) | Visits ÷ followers | Accounts / 10K followers |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|
| Mariana (Mar) Antaya | Narrative | $33,750 | 181 | 14 | $186 | $2,411 | n/a | n/a | n/a | 492,389 IG | 0.0368% | 0.284 |
| ↳ Mariana without 28.10 | | $33,750 | 29 | 2 | $1,164 | $16,875 | n/a | n/a | n/a | 492,389 IG | 0.0059% | 0.041 |
| Maitri | Creator Buzz | $8,000 | 32 | 1 | $250 | $8,000 | 26,000 R* | 0.12% | 0.0038% | 234,537 IG | 0.0136% | 0.043 |
| Danielle | Creator Buzz | $4,000 | 11 | 0 | $364 | no accounts | n/a | n/a | n/a | 26,352 LinkedIn | 0.0417% | 0 |
| Sajjaad | Narrative | $10,000 | 26 | 0 | $385 | no accounts | n/a | n/a | n/a | 355,000 YouTube | 0.0073% | 0 |
| Audrey | Creator Buzz | $14,000 | 31 | 0 | $452 | no accounts | n/a | n/a | n/a | 186,875 IG | 0.0166% | 0 |
| Alexis | Creator Buzz | $6,000 | 5 | 0 | $1,200 | no accounts | 529 V* | (0.95%)† | 0% | 61,044 IG | 0.0082% | 0 |
| Kayvon | Narrative | $20,000 | 11 | 0 | $1,818 | no accounts | n/a | n/a | n/a | 497,723 IG | 0.0022% | 0 |
| Soojin | Creator Buzz | $15,000 | 8 | 0 | $1,875 | no accounts | n/a | n/a | n/a | 196,230 IG | 0.0041% | 0 |
| Aria | Creator Buzz | $10,000 | 1 | 0 | $10,000 | no accounts | n/a | n/a | n/a | 126,173 IG | 0.0008% | 0 |
| Natasha | Creator Buzz | $5,000 | 0 | 0 | no visits | no accounts | 385 V* | 0% | 0% | 30,232 IG | 0% | 0 |
| Fiona | Creator Buzz | $3,450 | 0 | 0 | no visits | no accounts | n/a | n/a | n/a | 24,177 IG | 0% | 0 |
| Max Talks Tech | Creator Buzz | $3,000 | 0 | 0 | no visits | no accounts | 1,646 V* | 0% | 0% | 397,700 TikTok | 0% | 0 |
| Taki | Narrative | $10,000 | 0 | 0 | no visits | no accounts | n/a | n/a | n/a | 263,700 TikTok | 0% | 0 |
| Naya | Narrative | $0 (attendance only) | 0 | 0 | n/a | n/a | n/a | n/a | n/a | 125,994 IG | 0% | 0 |
| **Total (14)** | | **$142,200** | **306** | **15** | **$465** | **$9,480** | | | | 3,018,126 | 0.0101% | 0.050 |
| **Total without Mariana's 28.10** | | $142,200 | 154 | 3 | $923 | $47,400 | | | | | 0.0051% | 0.010 |

- **With the 18% Creator Buzz agency fee** ($154,521 all-in), the total is $505 per visit and $10,301 per account, or $1,003 and $51,507 without Mariana's 28.10. The Creator Buzz rank order doesn't change: Maitri is $295 per visit and Danielle $429.
- **Views figures:**
  - Maitri: 26,000 is Vin's number for her 29.10 Reel only, posted in #creatorbuzz-mondaycrm on 29.10. Her 03.11 Reel and her LinkedIn post have no view count.
  - Max: 1,646 = 427 on TikTok + 1,219 on YouTube Shorts. His IG Reel has no view count.
  - Alexis: 529 is her TikTok only.
  - Natasha: 385 is her TikTok only.
- † **Alexis's ratio isn't meaningful.** All 5 of her visits came on 28–29.10, a week before her TikTok went up on 05.11.

### Ranking (primary: cost per visit; cost per account alongside)

| # | Creator | $/visit | $/account | Note |
|---|---|---:|---:|---|
| 1 | Mariana | $186 | $2,411 | **Event-day spike.** 152 of her 181 visits and 12 of her 14 accounts came on 28.10. Without that day: $1,164 per visit and $16,875 per account, which would put her **6th**. |
| 2 | Maitri | $250 | $8,000 | Her traffic follows her 29.10 Reel, peaking at 12 visits on 29.10. Her signup came on 04.11. **Best content-driven result.** |
| 3 | Danielle | $364 | – | Highest visits ÷ followers (0.042%), with a small LinkedIn audience |
| 4 | Sajjaad | $385 | – | All visits on 28–29.10, before his 31.10 LinkedIn post |
| 5 | Audrey | $452 | – | All visits on 28–29.10, before her 02.11 Reel |
| 6 | Alexis | $1,200 | – | All visits on 28–29.10 |
| 7 | Kayvon | $1,818 | – | Visits on 07–08.11. No monday post found yet. |
| 8 | Soojin | $1,875 | – | Visits on 05–09.11, after her 04.11 Reel |
| 9 | Aria | $10,000 | – | 1 visit |
| 10–13 | Fiona, Max, Natasha, Taki | no visits | – | $21,450 spent with no visits. Taki has no monday post found. |
| – | Naya | n/a | n/a | No fee, no posting obligation |

### Takeaway

Only two creators produced accounts. Of those, only Maitri's traffic clearly comes from her content: her visits track her 29.10 Reel, which had a reported 26K views. At $250 per visit and $8,000 per account, she is the most efficient creator in this group. Mariana's $186 per visit looks best, but it rests on in-person use at Elevate on 28.10. Without that day she drops to the middle of the pack, at $1,164 per visit. Most other creators' visits, including Audrey's, Sajjaad's, Alexis's and Aria's, also cluster on 28–29.10, before their Reels and posts went up. That points to event-day Stories or in-person sharing rather than the paid feed content. Overall, the program has cost $465 per visit and $9,480 per account so far, or $923 and $47,400 without Mariana's event day. Paid conversion isn't readable until about 25.11. For London, the creator-level numbers favor mid-size, tightly niched creators who post right away (Maitri, Danielle) over large accounts (Kayvon, Taki, Sajjaad), whose visits per follower are among the lowest.

### Data gaps

1. **Instagram and LinkedIn views can't be verified.** Bright Data's IG Reels dataset returned 0 of 10 view counts (10.11, snapshot `sd_mwajla2sjb8d0448i`), as on earlier runs. The LinkedIn posts dataset has no views field. The only creator-reported number found is Maitri's 26K. No Gmail recap emails from Creator Buzz, Narrative, The Drive or Viral Nation have view numbers. **Ask both agencies for per-post insights screenshots** (views, reach, link clicks, story views) to fill this in.
2. **No monday post was found for Mariana, Kayvon, Taki or Naya** (content-watch `found.json`, last run 09.11). Their views are n/a. Mariana's and Kayvon's visits therefore can't be tied to a post.
3. **Story views are missing.** Every Creator Buzz creator's IG Story set was live around the event (Creator Buzz sheet, "Content Status"), and the event-day visits most likely came from there. Bright Data can't collect Stories.
4. **Fees:**
   - Creator Buzz fees come from the agency's sheet "Monday Elevate NYC", tab "Final Creators" (the "Negotiation Responses" column). They sum to $68,450, which matches the agreed $80,771 ÷ 1.18.
   - Some CRM Deliverables notes still show older numbers: Audrey $9,000, Aria $8,000, Maitri $9,000, Alexis $10,000, Natasha $7,000, Danielle $5,750 and Fiona $3,400. Use the sheet.
   - Narrative fees are taken as given (Zip #16198). It isn't confirmed whether any Narrative agency fee sits on top.
   - Kayvon's CRM item also mentions a duplicate $26K offer. $20,000 per Zip was used.
   - Naya is $0: the CRM says "Attendance only: signed 18.10, no fee and no posting obligation". Her $20,925 package from 08.10 no longer applies.
5. **Followers:**
   - The IG figures are from Bright Data on 10.11 (Reels dataset) or on 08.11 (IG profiles, for Mariana, Kayvon and Naya). Soojin is at 196K, above the 168.9K in the brief.
   - Danielle is LinkedIn (CRM, 26,352). She has only 3.7K on IG.
   - Max is TikTok (397.7K, 10.11). He has 232K on IG and 28.1K on YouTube.
   - Taki is TikTok (263.7K, 09.11). He has 238K on IG.
   - Sajjaad is YouTube, 355K from the CRM. It wasn't re-verified, and his only monday post is on LinkedIn, where his follower count is unknown.
6. **Small numbers.** Apart from Mariana and Maitri, every creator has 0 accounts, so cost per account can't separate them. Cost per visit rests on 1–32 visits per creator.
7. **Revenue isn't in this view.** All creators are at 0 payers and $0 ARR (section 2B). Rerun after 25.11.

## 6. Board columns (Influencers CRM 2026, board 18425284143), added 10.11.2026

Inputs (numbers, updated daily by the 08:39 run): UTM Visits `numeric_mm8z9jyb`, UTM Accounts `numeric_mm8zyedt`, UTM Activated `numeric_mm8zxhqs`, UTM Payers (28d) `numeric_mm8z2a3m`, UTM Data As Of `date_mm8z1ccm`. Set once: Elevate Fee (USD) `numeric_mm8zrytk`, Post Views `numeric_mm8zyn45`.
Formulas: $ / Visit `formula_mm8zzppt`, $ / Account `formula_mm8z9wj1`, Views → Visits % `formula_mm8zhvy3`, Visits / Followers % `formula_mm8zv8f8` (uses the existing Followers column).
Item ids per creator: `crm_item_id` in creator-utm-inputs.csv.
