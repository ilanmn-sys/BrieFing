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
