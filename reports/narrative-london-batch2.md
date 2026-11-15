# Elevate London (23–24.11.2026, ExCeL): Narrative batch 2 (Margo), 4 creators

Research run 15.11.2026 (system clock). No one was contacted and no drafts were created. Nothing was written to the Elevate List board. In the Influencers CRM, only the two Maybe creators were written (see §5).

## 1. Bottom line

- **No clear Go.** Two are a **Maybe** and two are a **Pass**.
- **Christian Zimmer (Maybe, $6,500 attendance + stories).**
  - Best fit of the four: a real student-builder in AI, with no paid competitor deals.
  - Against him: his Instagram ER is 0.9%, below our 2% bar. His audience is DACH and students, not UK. He flies in from Zurich, and Margo bills the flight on top.
- **The Metaverse Guy (Maybe, $1,500 dedicated YouTube video). This is conditional.**
  - London-based, cheap and on-topic (AI builders and tools).
  - But on 13.10.2026 he made a **paid "AI Project Management" video for Vani, a Zoho product**. Ilan has to rule whether Zoho counts as an R-39 "similar tool". If it does, this is a Pass.
  - His sponsored videos also look promoted.
- **Nick Sadler (Pass).** London-based, but engagement is very low: Instagram 0.03%, TikTok median about 1.6K views on 80.8K followers. This matches the 11.11 UK report.
- **Jason West (Pass).** 893K subscribers, but his last 15 long videos average about 70K views with only 1–57 likes each (0.03% like-to-view). That is the signature of paid ad views, not an organic audience. His latest unpromoted videos get 3–9K views.
- **Recommended spend:** up to **$8,000** ($6,500 + $1,500). That excludes Christian's Zurich flight, which per R-40 we don't offer, and any local transport. Of the ~10-creator London plan, 8 are already in place (6 Creator Buzz + 2 Israelis via Scherf), so these two would take the last 2 slots. Christian's existing CRM summary says it is unclear whether Zip #16198 ($73,750, Narrative) has a London line for him.

## 2. Summary table

| Creator | Platforms / followers | Avg views (recent) | ER | Fit | Competitor flags (R-39) | Package & price | CPM | Verdict |
|---|---|---|---|---|---|---|---|---|
| **Christian Zimmer** ([@chrispathway](https://www.instagram.com/chrispathway/)) | IG 323K ✓ · TikTok 37.6K · LinkedIn (claims 350K+ combined) · newsletter [chrisnotes.ai](https://www.chrisnotes.ai) | TikTok median 5.0K (15 videos). IG reel views **not available** | IG median 0.90% (13 posts) · TikTok 1.18% | Good: AI/tech student-builder (ETH Zurich, won the Zurich Agentic AI Hackathon, Claude Founder House). Young DACH audience | Notion mentioned organically as a tool he uses (12.11), not paid. No paid partnerships in his last 15 IG posts | Attendance + stories **$6,500** (+ Zurich flight, billed by Narrative) | Not computable (no story or reel views). $20 per 1K IG followers | **Maybe** |
| **Nick Sadler** ([@nicksadler.io](https://www.instagram.com/nicksadler.io/)) | IG 134K ✓ · TikTok 80.8K · FB · newsletter (nicksadler.io) · small YouTube | TikTok median 1.6K (14 videos). IG reel views **not available** | IG median 0.03% (15 posts) · TikTok 0.05% | Medium: AI marketing news and prompts for creative businesses. Mostly news reels, not building | None found. VEED video (tool content). Alibaba CoCreate link in bio | (Pass) Story set $1,000 · Reel $5,250 · Reel + TikTok $6,250 | TikTok add-on: $1,000 for ~1.6K views ≈ **$625**. IG reel: not computable | **Pass** |
| **The Metaverse Guy** ([YouTube](https://www.youtube.com/@TheMetaverseGuy), Zain Ul Abedeen) | YouTube 283K (UK) · TikTok 4.2K · IG @mr.freakk (count not collected) · LinkedIn | YouTube long median **68.5K** (15 videos). Unpromoted model tests 4–10K. TikTok ~730 | YouTube likes/views 0.37%. Median views/subs 24% | Good on topic: AI app builders, agents, AI video tools. Mostly sponsored tool reviews | **Paid Vani video (Zoho), "AI Project Management", 13.10.2026.** Sponsored Make video (30.10) demos Asana and Salesforce as integrations (not paid by them) | Dedicated YouTube video **$1,500** | ~$22 at the 68.5K median. **$150–375** if views follow his unpromoted videos | **Maybe (conditional on a Zoho ruling)** |
| **Jason West** ([@JWestdigital](https://www.youtube.com/@JWestdigital)) | YouTube 893K (UK) · X @JWestDigital (~220) · LinkedIn ~2K · IG small | YouTube long median **~70K** (15 videos), but the latest 4 are 3.4K–15.6K. Shorts median ~800 | YouTube likes/views **0.03%** (1–57 likes per video) | Medium-good on topic: AI for small business, agents (Grok Bot), chatbots. He is CEO of FastBots.ai | None confirmed. A SERP snippet links him to an Asana project-management video; I couldn't verify that it is his (oEmbed refused) | (Pass) Dedicated video $6,500 · Integration/Short add-on $2,500 | ~$93 at the median. **$730–1,930** at recent unpromoted views. Short add-on ≈ $3,100 | **Pass** |

## 3. Method

- **Clock:** 15.11.2026, 21:19 UTC (`date`).
- **Bright Data datasets (15.11):**
  - Instagram Profiles `gd_l1vikfch901nx3by4`, snapshot `sd_mwic98x2wx11l04gr`
  - Instagram Posts `gd_lk5ns7kz21pck8jpis` (15 per account, discover_by=url), snapshot `sd_mwic8u3h1hx0xexwlk`
  - Instagram Reels `gd_lyclm20il4r5helnj`, snapshot `sd_mwicdrryl0r8y6mu8`. It returned no view counts.
  - TikTok Profiles `gd_l1villgoiiidt09ci`, snapshot `sd_mwicdrhgl9cypux6d`. Its `top_videos` field supplies the recent plays, likes and comments.
  - YouTube Channels `gd_lk538t2k2p1k3oos71`, snapshot `sd_mwic98xh2fhq1smy3k`
  - YouTube Videos `gd_lk56epmy2i5g7lzu0k` (31 videos), snapshot `sd_mwicb5if17gr7tbogs`. It supplies likes, the sponsored flag, descriptions and transcripts.
  - A TikTok Posts run (`sd_mwicdrtm1py2640s1b`) was still running at write-up. The profile `top_videos` covered the same data.
  - The profile datasets reject `type=discover_new` ("Available types: user_name/keyword"). They work as plain URL collection. The CONTEXT.md note on this is wrong for the Instagram and YouTube profile datasets.
- **YouTube:** channel RSS (latest 15 uploads, mostly Shorts for Jason West) plus the `/videos` tab (latest 30 long videos with views). Direct watch-page fetches were rate-limited by Google, so likes came from Bright Data.
- **SERP:** Bright Data `marko_serp_json`, gl=uk, about 37 queries. Covered cross-platform presence, LinkedIn, competitor terms and controversy.
- **ER:**
  - IG and TikTok: (likes + comments) / followers per post, median.
  - YouTube: median views / subscribers on long videos, plus likes / views.
- **CPM:** package price / (expected views / 1,000), using real recent medians. Where promotion is suspected, a range is shown.
- **CRM duplicate check:**
  - Influencers CRM 2026: all 249 items read. **Christian Zimmer already existed** (13143456400, Narrative group, identity was unconfirmed). The other three are not there.
  - Elevate List: all 101 items read. None of the four is there.

## 4. Per creator

### Christian Zimmer: Maybe
- **Who:** M.Sc. Statistics at ETH Zurich ([LinkedIn](https://ch.linkedin.com/in/christian-zimmer-4b482b252)). Co-founder of FrontierHack, ex-BCG visiting associate.
  - This resolves the "Not identified" status from the London research (S3).
  - CreatorDB says he is Germany-based and that most of his audience is in Germany.
- **Content:** "Helping you make sense of tech, AI and Finance". The TechMaxxing series covers context systems, Claude Code, Codex and projects. He also posts AI-learning resources and GitHub repos, plus student and founder lifestyle reels.
- **Builder credentials:**
  - Won the Zurich Agentic AI Hackathon (Oct 2026).
  - Invited to Claude Founder House Paris.
  - Interviewed Anthropic technical staff.
- **Activity:** about 1 IG post a day. Latest 15.11.
- **Engagement:**
  - IG median 0.90% on the 13 latest posts. The 2 old pinned posts are excluded: they were 18% and 220%.
  - Two posts with "comment X" prompts have 1.1K–2.4K comments.
  - TikTok median 5.0K views and 1.18% ER. Occasional hits: 153K (08.11), 180K (21.10).
- **Brand safety:**
  - No paid partnership flags or #ad in his last 15 IG posts.
  - Notion: an organic mention in his tools list (12.11). Not paid.
- **Value:**
  - The $6,500 package is attendance plus stories. Story reach is unknown, and IG reel views weren't returned by the scraper.
  - The $11,000 reel package is too expensive at a 0.9% ER.
  - The flight from Zurich is extra (per Margo). R-40: we don't offer to pay it, and it's Ilan's call.
- **CRM:** existing item [13143456400](https://monday.monday.com/boards/18425284143/pulses/13143456400), updated.

### Nick Sadler: Pass
- **Who:** London. Background in music and film, now AI marketing for creative businesses ([nicksadler.io](https://nicksadler.io)). His collabs go through mightyjoy.
- **Engagement:**
  - IG 134K, median ER 0.03%. 11 of his 15 latest reels have under 40 likes.
  - The spikes come from comment-for-link prompts, e.g. 1,880 comments on 570 likes.
  - TikTok 80.8K, median 1.6K views and 0.05% ER.
- **Fit:** AI news reels (Claude, ChatGPT, prompts). This is commentary, not building.
- **Value:** even the $1,000 story set buys very little reach. The TikTok cross-post costs about $625 CPM.
- **Brand safety:** no competitor found. His bio links to Alibaba CoCreate (ExCeL, 19–20.11).
- He failed the ER bar in the 11.11 UK report too.

### The Metaverse Guy: Maybe (conditional)
- **Who:** Zain Ul Abedeen, UK. The channel has run since 2015, and he says he will be at Alibaba CoCreate at ExCeL on 19–20.11.
- **Content:** AI app builders (Bolt, Lovable, Cursor), agents and AI video tools. **13 of his last 16 long videos are sponsored tool reviews.**
- **Views:**
  - Sponsored reviews get 35K–128K views. His own model tests get much less: Kimi 9.6K, Claude Haiku 5.5K, GLM 4.2K.
  - His likes/views median of 0.37% is low for that view volume. That suggests the sponsored views are boosted by paid promotion (not verified).
- **Competitors:**
  - **Vani (Zoho, via zoho.to/themetaverse), paid, 13.10.2026**, "AI Project Management … Better than Miro?", positioned against Trello. Zoho sells a CRM and Zoho Projects. Not named in R-39, but it falls under "similar tools", so **Ilan to rule.**
  - Make (Maia) sponsored video (30.10) demos Asana and Salesforce as integrations. Make is not on the R-39 list.
- **Value:** $1,500 for a dedicated video is cheap if the 68.5K median holds (~$22 CPM). Shorts and TikTok ($1,000) are poor value: his TikTok gets about 730 views.
- **CRM:** new item [13554479376](https://monday.monday.com/boards/18425284143/pulses/13554479376).

### Jason West: Pass
- **Who:** CEO of FastBots.ai (AI customer-service chatbots) and FastFunnels. LinkedIn location is Bournemouth (Margo says London-based). He runs a Skool ChatGPT community.
- **Views:**
  - His 15 latest long videos have a median of ~70K views, but **likes are 1–57 per video (median 0.03% of views)**. Synthesia's video: 183,866 views, 16 likes.
  - This points to paid ad views, not an engaged audience.
  - Long-form uploads have slowed to about one every 3 weeks (latest 12.11: 3.4K views). His FastBots videos get 4.7K–8.9K. Shorts get about 800.
- **Fit:** AI agents for small business (Grok Bot, chatbots). On topic, but his audience is likely not engaged.
- **Brand safety:**
  - Sponsors: Synthesia, Freebeat, Omnisend, AutoDS, Base44, Tango, Gamma, Replit. None are R-39 competitors.
  - FastBots is an AI-agent product, not a competitor.
  - One SERP snippet places "How to use Asana for project management" next to his channel. I couldn't verify that the video is his.
- **Value:** $6,500 gives an expected CPM of $730–1,930 on unpromoted views. The Short add-on is about $3,100 CPM.

## 5. CRM changes (Influencers CRM 2026, 18425284143)

- **Christian Zimmer:** existing item [13143456400](https://monday.monday.com/boards/18425284143/pulses/13143456400).
  - Left in its Narrative group, to avoid creating a duplicate.
  - Empty cells filled: Stage = Prospect, Deal Value $6,500, Followers 323,186, Avg ER 0.9, Agent = Narrative (Margo), Instagram, TikTok, LinkedIn, Newsletter, Profile URL, Primary Platform "IG / TikTok", Language English.
  - Elevate Attendance was already "Elevate EMEA" and was left as is.
  - One update posted.
- **The Metaverse Guy:** new item [13554479376](https://monday.monday.com/boards/18425284143/pulses/13554479376) in 🇬🇧 UK — Elevate London pool.
  - Filled: Owner Ilan, Stage = Prospect, Deal Value $1,500, Followers 283,000, Agent = Narrative (Margo), YouTube, Profile URL, TikTok, Instagram, LinkedIn, Website, Primary Platform YouTube, Tier Mid, Region UK, Language English.
  - Elevate Attendance left empty. The only near label is "Invited", and we haven't invited him.
  - One update posted.
- **Not touched:** no approval column, no Elevate List write, no contact and no drafts.

## 6. Data we could not get

- **Instagram reel and story views (Christian, Nick):** the Bright Data Reels and Posts datasets return no view counts. So the IG CPM can't be calculated.
- **Audience geography:** not verified for any of the four. CreatorDB says Germany for Christian. The others are inferred from channel location only.
- **Whether the YouTube views of the Metaverse Guy and Jason West are paid promotion:** inferred from like ratios and the gap between sponsored and unsponsored videos. Not confirmed. YouTube Studio traffic sources would settle it.
- **Missing follower counts:** The Metaverse Guy's IG (@mr.freakk). Jason West's IG and X. Christian's LinkedIn (claimed only).
- **Jason West and Asana:** not verified.
- **TikTok Posts run:** not complete at write-up. TikTok numbers come from the profile `top_videos` instead.
