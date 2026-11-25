# Creator UTM performance: Elevate NYC + London

Built 25.11.2026 (system clock, Asia/Jerusalem). Data runs through **24.11.2026** (the visits table lags one day). Queries: `reports/creator-utm-queries.sql` (Q1 visits table, Q2 attribution table, Q5 London daily). Fees and followers: `reports/creator-utm-inputs.csv`. Previous version (10.11, NYC only) is in git history.

## Bottom line

- **London (10 creators, links out 23.11):** **490 visits, 12 accounts, 3 activated** in the first ~1.5 days. Christian Zimmer leads (221 visits, 4 accounts, **$45/visit**), then Moddy (155) and Amichai (88 visits, 5 accounts, best signup rate). Agi, Tunde and Zain: 0 so far.
- **Unlike NYC, London traffic is content-driven, not in-room.** Almost every visit comes from Instagram (`l.instagram.com`), on mobile, from dozens of countries, and peaks right after each creator's story (Christian 10:15 + 18:28 UTC, Amichai 18:17 UTC). Event-day share is 100% by construction (the only data days are 23–24.11), so the flag below uses referrer, timing and geography instead of the date.
- **Moddy's 155 is suspect:** 177 visits in 10 minutes (17:31–17:41 UTC, 108 in one minute), then silence; 34 already bot-flagged, 43% desktop, 0 get-started in the burst. Treat as unverified until it repeats on a later post.
- **NYC (14 creators):** **318 visits, 18 accounts, 2 activated** (10.11: 306 / 15). Since 10.11: +12 visits and +3 accounts (Sajjaad 11 visits, 2 accounts on 23–24.11 via Instagram/ManyChat; Maitri 1 account on 13.11). Mariana is still 86% event-day traffic.
- **Payers: 0 and ARR $0 for all 24.** The NYC 28.10 cohort's 28-day payer window closes today (25.11); flags are not final until that day lands in the table. London matures ~22.12.

## 🇬🇧 London ranking (start 23.11; data 23–24.11)

Primary sort $/visit (cheapest first), $/account alongside; fee n/a ranked by visits after them; no-visit creators last. Fees = CRM Deal Value (`numeric_mm5y6ykh`), currency not stated on the board; blank for Moddy, Amichai, Hila.

| # | Creator | Agency | Fee | Visits | Accounts | Activated | $/visit | $/account | Visits ÷ followers | Traffic |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | Christian Zimmer | Narrative | 10,000 | 221 | 4 | 1 | $45 | $2,500 | 0.067% (328K IG) | 📱 content: IG, 50+ countries, peaks 10–11 & 18–19 UTC after his stories |
| 2 | Lara Acosta | Creator Buzz | 13,000 | 14 | 1 | 0 | $929 | $13,000 | 0.004% (396K IG) | 📱 content: IG, 18–21 UTC, 10 countries |
| 3 | Beatrice Vladut | Creator Buzz | 4,000 | 2 | 0 | 0 | $2,000 | – | n/a | ❔ 2 visits, RO, via Google |
| 4 | Charlie Hills | Creator Buzz | 20,500 | 8 | 1 | 0 | $2,563 | $20,500 | 0.006% (123K IG) | 📱 content: mostly IG, GB |
| 5 | Moddy | Creator Buzz | fee n/a | 155 | 1 | 0 | – | – | 0.061% (252K IG) | ⚠️ 10-minute burst 17:31–17:41 UTC after 17:29 story; likely partly non-human |
| 6 | Amichai Sheqel | Scherf | fee n/a | 88 | 5 | 2 | – | – | 0.076% (116K IG) | 📱 content: IL mobile via IG from 18–19 UTC (story 18:17) |
| 7 | Hila Naor | Scherf | fee n/a | 2 | 0 | 0 | – | – | 0.006% (32K IG) | ❔ 2 IL visits at 11 UTC (Google/direct), possibly her own test |
| – | Agi, Tunde Alao, Zain Ul Abedeen | CB / CB / Narrative | 15,500 | 0 | 0 | 0 | no visits | – | – | 15,500 spent, no visits yet |
| | **Total (10)** | | 63,000 known (7/10) | **490** | **12** | **3** | $257* | $10,500* | | |

\* On the 7 creators with a known fee (245 visits, 6 accounts). Attribution table (Q2): 534 attributed visitors, 17 signups (Amichai 8, Christian 4, Lara 3), 0 qualified, 0 paying.

Fee notes: Christian's CRM value is 10,000, but Narrative quoted $6,500 on 15.11 (at $6,500 he is $29/visit). Creator Buzz/Narrative fees exclude the 18% agency fee.

## 🗽 NYC ranking (start 27.10; event days 28–29.10)

| # | Creator | Agency | Fee | Visits | Accounts | Activated | $/visit | $/account | Visits ÷ followers | Event-day share | Without event days |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | Mariana (Mar) Antaya | Narrative | $33,750 | 181 | 14 | 2 | $186 | $2,411 | 0.037% | ⚡ 86% (155) | 26 visits, 2 acc: **$1,298/visit, $16,875/account** |
| 2 | Maitri | Creator Buzz | $8,000 | 33 | 2 | 0 | $242 | $4,000 | 0.014% | 📱 42% | – |
| 3 | Sajjaad | Narrative | $10,000 | 37 | 2 | 0 | $270 | $5,000 | 0.010% | ⚡ 70% (26) | 11 visits, 2 acc: **$909/visit, $5,000/account** |
| 4 | Danielle | Creator Buzz | $4,000 | 11 | 0 | 0 | $364 | – | 0.042% | 📱 27% | – |
| 5 | Audrey | Creator Buzz | $14,000 | 31 | 0 | 0 | $452 | – | 0.017% | ⚡ 100% | 0 visits outside event days |
| 6 | Alexis | Creator Buzz | $6,000 | 5 | 0 | 0 | $1,200 | – | 0.008% | ⚡ 100% | 0 visits outside event days |
| 7 | Kayvon | Narrative | $20,000 | 11 | 0 | 0 | $1,818 | – | 0.002% | 📱 0% | – |
| 8 | Soojin | Creator Buzz | $15,000 | 8 | 0 | 0 | $1,875 | – | 0.004% | 📱 0% | – |
| 9 | Aria | Creator Buzz | $10,000 | 1 | 0 | 0 | $10,000 | – | 0.001% | ⚡ 100% | 0 visits outside event days |
| – | Natasha, Fiona, Max Talks Tech, Taki | | $21,450 | 0 | 0 | 0 | no visits | – | – | – | $21,450 spent, no visits |
| – | Naya | Narrative | $0 | 0 | 0 | 0 | n/a | n/a | – | – | attendance only |
| | **Total (14)** | | **$142,200** | **318** | **18** | **2** | **$447** | **$7,900** | | | |

Attribution table (Q2): 302 attributed visitors, 20 signups (Mariana 16), 0 qualified, 0 paying, $0 ARR.

## Interpretation

- **London's content worked faster than NYC's.** In 1.5 days London produced 1.5x NYC's 4-week visit total, and the referrer/timing/geography says it came from stories, not from the room. NYC's best content-driven creator (Maitri, $242/visit) is 5x Christian's $45.
- **Mid-size Israeli and European creators with an engaged audience converted best:** Amichai (5 accounts from 88 visits, 6%) and Christian (4 from 221). Large Creator Buzz accounts (Lara 396K, Charlie 123K) brought little so far.
- **Moddy needs a second look** before he gets credit (burst pattern above). If the burst is excluded he has ~3 visits.
- **NYC is flat since 10.11** except Sajjaad's new Instagram/ManyChat push (23–24.11, 11 visits, 2 accounts) — his only accounts, both outside event days.

## Caveats

- **Payer flags mature 28 days after signup** (NYC 28.10 cohort: 25.11; London: ~22.12). 0 payers today is not a final result.
- **Touch-level attribution** (visits table): every visit keeps its own UTM, so a person who clicked two creator links counts for both. The attribution table (one winning touch per signup) is shown for comparison.
- **Lag:** data through 24.11; 25.11 posts are not in yet. Bots/demo excluded (`is_bot_or_demo`), which removed 34 of Moddy's visits. Activated = first board load after signup.
- **London fees** come from the CRM Deal Value column (currency not stated); 3 of 10 are blank. NYC fees are creator fees from the Creator Buzz sheet / Zip #16198, excluding the 18% agency fee.
- Board: Influencers CRM 2026 (18425284143) UTM columns updated for all 24 creators on 25.11 (data date 2026-11-24).
