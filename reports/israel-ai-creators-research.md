# Israel AI creators: who is most influential, and who fits monday.com (research, 11.11.2026)

Read-only research for Ilan. Nobody was contacted, and nothing was written to the Influencers CRM or any board. All numbers came from sources retrieved on 11.11.2026 (system clock). A number or fact that wasn't retrieved or verified is marked "לא אומת" (not verified).

**Bottom line.** Israel's Hebrew AI-creator scene is Instagram-first and fairly small. Only three AI-focused accounts pass 100K on any single platform: Eilon Gruper, Ofir Asher and Amichai Sheqel. The one Israeli creator with mass global reach is Ruben Hassid: 957K on LinkedIn and about 994K newsletter readers (self-reported), in English, based in Tel Aviv.

- **Best fits for monday.com:** Eilon Gruper and Eden Bibas, both 8/8. Next come Ofir Asher (7/8) and Dalia Baida (6/8). Dalia is the closest match to the NYC profile: a working data scientist who makes face-to-camera Reels.
- **Urgent flag:** Amichai Sheqel, already picked for Elevate London, posted paid Salesforce Israel collabs on 08.11 and 10.11.2026. Under R-39, Salesforce is a competitor. Check exclusivity before 23.11.

## 1. Sources and method

**Discovery.**
- About 110 Google SERP calls through Bright Data (`marko_serp_json`, gl=il, Hebrew and English). The `serp_api_community_kb` zone returned empty bodies today, so the script fell back to `marko_serp_json`.
- About 12 WebSearch/WebFetch lookups.
- Sources included Hebrew keyword searches ("בינה מלאכותית", "כלי AI", "סוכני AI", "ChatGPT בעברית", "יוצר/ת תוכן AI", podcast and newsletter queries) and `site:instagram.com` / `site:tiktok.com` / `site:youtube.com` handle searches.
- I also used directories and lists:
  - aicenter.co.il/creators (23 Israeli AI creators)
  - Favikon top-20 Israel LinkedIn and X lists
  - HiveInfluence Israel AI lists for TikTok and YouTube
  - hamashpianim.co.il
- One Bright Data TikTok keyword discovery (`gd_lu702nij2f790tmv9h`, discover_by=keyword, country IL; 6 Hebrew keywords, 244 posts) surfaced TikTok-native creators that Google misses, such as Elad Amrani, Omer Yaron, Dalia Baida's TikTok and Eliron Giny.

**Verification (Bright Data Web Scraper API, all batched, snapshots in the scratchpad `il-ai-creators/run/`).**

| Run | Dataset | Inputs | Result |
|---|---|---|---|
| Instagram Profiles ×3 | gd_l1vikfch901nx3by4 | 30 + 19 + 12 handles | 46 live profiles (some guessed handles were dead and were dropped) |
| Instagram Posts ×2 | gd_lk5ns7kz21pck8jpis | 17 + 9 accounts × 12 latest posts | 312 posts |
| TikTok Profiles | gd_l1villgoiiidt09ci | 17 handles | 15 live |
| TikTok Posts ×2 + keyword discovery | gd_lu702nij2f790tmv9h | 12 + 7 accounts × 12 posts; 6 keywords | 221 + 122 + 244 records (filtered to target accounts) |
| YouTube Videos (discovery) | gd_lk56epmy2i5g7lzu0k | 14 channels × 10 videos | 12 channels returned |
| LinkedIn Profiles | gd_l1viktl72bvl7bjuj0 | 19 profiles | 19 returned |
| LinkedIn Posts (discovery, 11.09–11.11) | gd_lyy3tktm25m4avu764 | 12 profiles | 126 records (others' posts filtered out) |
| X Profiles | gd_lwxmeb2u1cniijd7t4 | 8 handles | 6 live |

**Internal sources (read only).**
- `agents/elevate-nyc-content-watch/state/roster.json` (Mor Nissim, Eilon Gruper)
- `reports/crm-enrichment-2026-11-01.md` (which Israeli creators are already in the Influencers CRM)
- The Elevate London brief (Amichai Sheqel picked via Scherf; Dalia Baida invited via Scherf). Her handle was not on file; I identified it from her TikTok bio ("data scientist, M.Sc") and IG @dalia__ai, which matches her LinkedIn ("Dalia Baida (Smirnov), Data Scientist at Blue dot").

**Markers.**
- **V** = from a Bright Data record today.
- **S** = Google snippet or third-party page, unverified.
- **SR** = self-reported in the creator's own bio or site.

**Formulas.**
- **ER:** median (likes + comments) / followers over the latest ~12 posts on that platform. The mean is given where a viral post skews it.
- **TikTok:** also median plays and plays/followers. **YouTube:** median (likes + comments) / views and median views over 10 videos. **LinkedIn:** median over the posts the dataset returned for 11.09–11.11 (5–9 posts per profile).
- **IG views:** the IG Posts dataset returned no play counts today, so IG views/followers is לא אומת.
- **Cadence:** posts per month from the sampled post dates. Where pinned old posts distort the window, I counted only the recent posts and marked the figure "~".

**Total reach.** The sum of followers across IG, TikTok, YouTube, LinkedIn and X. It is a reach sum, not unique audience. Newsletters, WhatsApp communities and podcasts are listed but not added.

**Brand-deal check.**
- I scanned captions of every sampled post for בשיתוף / שת"פ / #ad / paid-partnership labels. I also checked IG co-author (collab) fields and TikTok commerce labels.
- I ran `site:instagram.com "<handle>" בשיתוף` searches for the top accounts (12-month window).
- The IG "paid partnership" flag came back empty for every account, so collab fields and captions are the evidence.
- I checked for competitors per **R-39**: Asana (hard no), ClickUp, Notion, Wrike, Smartsheet, Atlassian (Jira, Confluence, Trello, Loom), Airtable, ServiceNow, Salesforce, HubSpot, Pipedrive, Attio, GoHighLevel. AI-agent products (Viktor, Grok Bot, Manus, Instinct) are not competitors.

**Scoring (/8, same scale as the Vin and London research, with Reach in place of UK).**

| Criterion | 2 | 1 | 0 |
|---|---|---|---|
| **Fit** | AI for work, productivity or agents, for a professional or business audience | General, consumer or news AI, creative AI, or dev-only | Off-niche |
| **Reach** (total) | ≥150K | 40K–150K | <40K |
| **ER** (main platform median) | IG/TikTok ≥2%, LinkedIn ≥1% | IG/TikTok 0.5–2%, LinkedIn 0.3–1% | Below that |
| **Clean** | No competitor deal in 12 months | Organic competitor mention, or a deal to check | Paid competitor deal in the last 12 months (drop under the brief) |

**NYC similarity** compares each creator with our Elevate NYC creators: working tech professionals explaining AI for work in face-to-camera IG Reels, 20K–500K followers.
- **High** = all three traits.
- **Med** = two of the three.
- **Low** = one or none.

**monday.com tie markers:** ★ = already worked with or connected to monday.com; CRM = already an item on the Influencers CRM 2026 board.

## 2. Ranked table: the long list (45)

Ranks 1–20 are the deep-dive set, ordered by score, then fit, then NYC similarity. Rows 21–45 are the long list (scores only where data allows).

| # | Name | Main platform + handle | Followers per platform | Total reach | ER (main) | Niche / format | Score F/R/E/C | NYC sim | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Eilon (Ayalon) Gruper** ★ CRM | IG [@eilon.grouper](https://www.instagram.com/eilon.grouper/) | IG 168,681 V; TikTok 66,900 V; YT 20.3K V (no upload since 02.2026) | **255,881** V | IG 4.32% (12); TikTok 3.90% (12) | Practical AI tools, Claude/GPT how-tos; HE face-to-camera Reels | 2/2/2/2 = **8** | High | **Strong yes** |
| 2 | **Eden Bibas** CRM | IG [@eden_bibas](https://www.instagram.com/eden_bibas/) | IG 87,972 V; LinkedIn 34,029 V; TikTok 25,200 V; YT @BibasAI 11.9K S | **159,101** (V 147,201) | IG 4.30% (12) | AI for business and life; AI-avatar "100K challenge"; Claude skills; HE Reels + LinkedIn | 2/2/2/2 = **8** | High | **Strong yes** |
| 3 | **Ofir Asher (Ofir AI)** | IG [@ofir.ai](https://www.instagram.com/ofir.ai/) | IG 115,976 V; TikTok 59,900 V; LinkedIn ~1.3K S | **177,176** (V 175,876) | IG 3.47% (12); TikTok 3.66% (12) | AI and tech news storytelling, Claude skills, Google tools; HE Reels | 1/2/2/2 = **7** | Med | **Strong yes** (reach + ER) |
| 4 | **Omer Yaron** | TikTok [@omeryaron_](https://www.tiktok.com/@omeryaron_) + IG [@omer.yaron](https://www.instagram.com/omer.yaron/) | TikTok 55,700 V; IG 20,636 V | **76,336** V | IG 6.43% (11); TikTok 1.14% (12) | Claude for creators and business (ManyChat replacement, design); HE | 2/1/2/2 = **7** | High | **Maybe** (no post for 34–41 days) |
| 5 | **Dalia Baida (Smirnov)** ★ | IG [@dalia__ai](https://www.instagram.com/dalia__ai/) | IG 26,725 V; TikTok 3,871 V; LinkedIn 878 V | **31,474** V | IG 2.82% (12); TikTok 5.93% (12) | Data scientist explaining Claude/ChatGPT at work; HE face-to-camera Reels | 2/0/2/2 = **6** | **High** | **Strong yes** |
| 6 | **Liya Kenan** | IG [@liya_kenan](https://www.instagram.com/liya_kenan/) | IG 56,696 V; LinkedIn 157 V (probable) | **56,853** V | IG 2.90% (12) | Gemini/ChatGPT prompts, Claude skills, comment-to-DM guides; HE | 1/1/2/2 = **6** | Med | **Maybe** |
| 7 | **Shalhevet Vardi (Aimprove)** | IG [@aimprove.ai](https://www.instagram.com/aimprove.ai/) | IG 60,050 V; TikTok 30,400 V (inactive since 12.2025); YT ~5.9K S | **96,350** (V 90,450) | IG 0.76% (11) | AI agents for small businesses ("agent boot camp"), Claude Code; HE Reels | 2/1/1/2 = **6** | Med | **Maybe** (lean yes) |
| 8 | **Benny Farber** | Community + podcast "פשוט AI"; IG [@bennyfarber](https://www.instagram.com/bennyfarber/) | IG 22,536 V; LinkedIn 16,725 V; YT 5,460 V; community "228K" SR | **44,721** V (+228K community SR, not added) | IG 0.64% (9); YT 1.78% (10) | Largest Hebrew AI community; weekly podcast (192 episodes); runs an AI conference | 2/1/1/2 = **6** | Low | **Maybe** (amplifier / host) |
| 9 | **Adir Duchan** | LinkedIn [adir-duchan](https://www.linkedin.com/in/adir-duchan) | LinkedIn 36,907 V | **36,907** V | LinkedIn 2.28% (5) | AI engineer (Sticklight, ex-Elementor): agents, skills, AI news; HE | 2/0/2/2 = **6** | Low | **Maybe** (LinkedIn voice) |
| 10 | **Elad Amrani** | TikTok [@eladamrani.ai](https://www.tiktok.com/@eladamrani.ai) | TikTok 5,267 V; IG 4,101 V | **9,368** V | TikTok 10.16% (11); median plays 15,400 | Builds AI agents (Agentic-dev), Claude Code workshops; AI-labelled avatar videos | 2/0/2/2 = **6** | Med | **Maybe** (rising micro) |
| 11 | **Ruben Hassid** CRM (Top 15 #01) | LinkedIn [ruben-hassid](https://www.linkedin.com/in/ruben-hassid) | LinkedIn 957,166 V; X 97,238 V; IG 85,201 V; YT 19,100 V; How to AI newsletter ~994K SR | **1,158,705** V | LinkedIn 0.08% (9); IG 0.19% (12) | Claude/AI-for-work carousels and guides; EN, global | 2/2/0/1 = **5** | Low | **Maybe** (the biggest Israeli AI voice; low ER) |
| 12 | **Bar Shealtiel** | IG [@barshaltiel.ai](https://www.instagram.com/barshaltiel.ai/) | IG 70,002 V; TikTok 36,400 V; LinkedIn 27,873 V; YT 13,900 V | **148,175** V | IG 0.36% (12, mean 5.58); TikTok 1.32% (9); YT 2.32% (10) | "Most practical AI content in Hebrew": guides, carousels, YT tutorials; club of 6,000+ | 2/1/0/2 = **5** | Med | **Maybe** (strong fit; ER spiky) |
| 13 | **Mor Nissim** ★ CRM | IG [@mornissim_](https://www.instagram.com/mornissim_/) | IG 48,234 V; YT 6,820 V; LinkedIn 4,476 V | **59,530** V | IG 0.43% (12); YT 2.11% (10) | Automation and AI-agent builder (Flow); Claude Code course; monday AI-agent video on YT; HE | 2/1/0/2 = **5** | High | **Maybe** (proven partner; low IG ER) |
| 14 | **Yuval Avidani** | LinkedIn [yuval-avidani](https://www.linkedin.com/in/yuval-avidani-87081474) + IG [@yuval_770](https://www.instagram.com/yuval_770/) | LinkedIn 30,677 V; IG 13,450 V; TikTok 10,200 V; YT 7,240 V | **61,567** V | IG 0.34% (12); LinkedIn 0.06% (9); YT 1.51% | Developer, GitHub Star; AI segment on Channel 12 News (SR); agents and MCP builds | 2/1/0/2 = **5** | Med | **Maybe** |
| 15 | **Amitay Boneh** | LinkedIn [amitayboneh](https://www.linkedin.com/in/amitayboneh) | LinkedIn 36,078 V; IG 623 V; AI with Amitay newsletter לא אומת | **36,701** V | LinkedIn 0.49% (9) | GenAI lecturer, Builders Lab co-founder; skills, personal agents; Favikon IL top 20 | 2/0/1/2 = **5** | Low | **Maybe** (LinkedIn) |
| 16 | **Omri Barak & Yoav Tzuker (TrashTech)** | YT [@TrashTechNews](https://www.youtube.com/@trashtechnews) + IG [@omri.barak](https://www.instagram.com/omri.barak/) | TrashTech YT 18,600 V, TikTok 18,300 V, IG 12,934 V; Omri IG 12,078 V, TikTok 10,700 V, X 4,957 V; epicNews newsletter לא אומת | **77,569** V | YT 1.09% (10), median 12,043 views; Omri TikTok 1.21% | Weekly HE tech/AI business podcast and news; ex-Channel 12 tech reporter | 1/1/1/2 = **5** | Low | **Maybe** (media / podcast slot) |
| 17 | **Dana Israeli** | IG [@danaisraeli](https://www.instagram.com/danaisraeli/) | IG 65,715 V; TikTok 91 V | **65,806** V | IG 0.97% (12) | Gen-AI creativity lecturer, AI avatar, AI Makery app; some family/lifestyle | 1/1/1/2 = **5** | Med | **Maybe** (creative) |
| 18 | **Amichai Sheqel** ★ CRM | TikTok [@amichai.ai](https://www.tiktok.com/@amichai.ai) + IG [@amichai.ai](https://www.instagram.com/amichai.ai/) | TikTok 168,400 V; IG 113,770 V; LinkedIn 23,120 V | **305,290** V | IG 0.56% (12); TikTok 0.23% (12), median plays 16,200 | Claude agents and skills, ChatGPT codes; AI Master club; HE | 2/2/1/**0** = **5** | High | ⚑ **Pass for new work** (paid **Salesforce** collab 08.11 + 10.11.2026; already picked for Elevate London) |
| 19 | **Luiza Jarovsky** | LinkedIn [luizajarovsky](https://www.linkedin.com/in/luizajarovsky) | LinkedIn 146,628 V; X 32,957 V; IG 578 V; newsletter 103K+ SR | **180,163** V | LinkedIn 0.11% (9) | AI governance and regulation; EN; Tel Aviv District | 1/2/0/2 = **5** | Low | **Pass** (critical-of-AI-industry tone; not a tools creator) |
| 20 | **Sapir Adler** CRM | IG [@sap.adler](https://www.instagram.com/sap.adler/) | IG 45,305 V | **45,305** V | IG 0.50% (12) | AI for business marketing, Claude skills, plus photography and tourism | 1/1/1/2 = **5** | Med | **Pass** (mixed niche; paid travel posts) |
| 21 | Hila Naor | IG @hila.naor_ | IG 31,882 V; LinkedIn 274 V | 32,156 | IG 0.36% | AI mentor (LeadShift AI) + paid travel content | 1/0/0/2 = 3 | Med | Pass |
| 22 | Alhanan Fortan | IG @alhananfortan | IG 25,876 V | 25,876 | IG 0.91% | Claude guides, prompts | 2/0/1/2 = 5 | Med | Watch |
| 23 | Eliron Giny | IG @eliron.giny | IG 19,655 V; TikTok 11,800 V | 31,455 | IG 0.56%; TikTok 0.84% | Daily AI news (fintech founder) | 1/0/1/2 = 4 | Med | Watch |
| 24 | Adir Yadayev | IG @adir.yad | IG 12,295 V; TikTok 5,747 V | 18,042 | IG 0.69% | AI for business owners; AI-clone videos | 2/0/1/2 = 5 | Med | Watch |
| 25 | Ben Rotenberg | LinkedIn ben-rotenberg | LinkedIn 23,877 V | 23,877 | LinkedIn 0.25% | AI-for-work workshops; BGU lecturer | 2/0/0/2 = 4 | Low | Watch |
| 26 | Nir Diamant | LinkedIn nir-diamant-ai | LinkedIn 20,808 V; X 2,918 V; DiamantAI newsletter 60K+ SR | 23,726 | LinkedIn 0.05% | RAG / agent tutorials (dev); location "United States" | 1/0/0/2 = 3 | Low | Pass (dev, US-based) |
| 27 | Maor Shlomo | LinkedIn maor-shlomo | LinkedIn 77,465 V | 77,465 | LinkedIn 0.43% | Base44 founder (Wix): an exec, not a creator | 1/1/1/2 = 5 | Low | Pass (exec) |
| 28 | Yam Peleg | X @Yampeleg | X 43,204 V; IG 1,125 V | 44,329 | לא אומת | LLM research; ThursdAI co-host; EN | 1/1/–/2 | Low | Pass (dev) |
| 29 | Hillel Fuld | X @HilzFuld | X 198,187 V; IG 145,413 V; LinkedIn 78,965 V | 422,565 | IG 0.05%; LinkedIn 0.02% | Tech columnist; mostly Israel advocacy now | 0/2/0/2 = 4 | Low | Pass (politics) |
| 30 | Yam Olisker | YT @YamOlisker | YT 113,000 V; TikTok 143,700 V; IG ~49K S | 256,700 V | YT 2.83%, median 75K views | Gadgets and phones; AI peripheral | 0/2/2/2 = 6 | Low | Pass (off-niche); amplifier only |
| 31 | Sagi Shmaryahu | TikTok @sagishmaryahu | TikTok 235,800 V; IG 41,254 V; YT 23,600 V | 300,654 | TikTok 0.22% | Phone tips and gadgets; Samsung paid post 08.11 | 0/2/0/2 = 4 | Low | Pass |
| 32 | Michael Danilov | TikTok @michael_danilovv | TikTok 85,600 V; IG 8,882 V | 94,482 | TikTok 0.02%, median 545 plays | AI marketing tips | 1/1/0/2 = 4 | Low | ⚑ Pass (audience looks inflated or dead) |
| 33 | Roey Tzezana | TikTok @roey.future | TikTok 11,000 V; IG 5,424 V | 16,424 | TikTok 3.23% | Futurist; AI-risk series | 1/0/2/2 = 5 | Low | Watch (risk-focused) |
| 34 | Tal Rotter | TikTok @talecomlaunch | TikTok 55,100 V | 55,100 | TikTok 0.48% | E-commerce + AI | 1/1/0/2 = 4 | Low | Pass |
| 35 | Shai Shotashvili | TikTok @shai_shotashvili | TikTok 23,400 V; IG 3,458 V | 26,858 | TikTok 0.08% | AI agents for business | 2/0/0/2 = 4 | Med | Pass (ER) |
| 36 | Uri Eliabayev CRM | LinkedIn urieliabayev | LinkedIn 12,863 V; MDLI FB group ~50K (CRM note) | 12,863 | לא אומת | ML community founder (MDLI) | 1/0/–/2 | Low | Community partner |
| 37 | Shahar Golan | YT @sgolan20 | YT 8,840 V | 8,840 | YT 2.22% | Gen-AI tutorials; "לומדים AI" community | 1/0/2/2 = 5 | Low | Watch |
| 38 | AI With Henry | YT @AIWithHenry | YT 11,700 V; IG 715 V | 12,415 | YT 1.12%, median 165 views | ChatGPT course in HE | 1/0/1/2 = 4 | Low | Pass |
| 39 | Matty Mariansky | FB group "עליית המכונות" + newsletter | FB group 71.7K S; newsletter לא אומת | לא אומת | לא אומת | AI and culture newsletter; Bezalel lecturer | 1/–/–/2 | Low | Community partner |
| 40 | Shay Shitrit | LinkedIn shayshitrit | LinkedIn 12,152 V | 12,152 | לא אומת | AI-first for startups (Builders Lab); Favikon IL top 20 | 2/0/–/2 | Low | Watch |
| 41 | Lior Shalmoni | IG @liorshalmoni | IG 12,326 V | 12,326 | לא אומת (likes not returned) | AI video series creator; **no post since 28.06** | 1/0/–/2 | Low | Pass (inactive) |
| 42 | Amir Moshe | IG @amirmoshe.ai | IG 10,435 V | 10,435 | IG 1.97% | AI creation lessons; recent **election/political** reels | 1/0/1/2 | Low | ⚑ Pass (politics) |
| 43 | Anna Volovik | IG @annavolovik.ai | IG 10,543 V | 10,543 | IG 0.06% | AI lecturer (hospitals) | 1/0/0/2 = 3 | Low | Pass |
| 44 | The AI Bois | TikTok @theaibois | TikTok 29,000 V | 29,000 | לא אומת | AI people art; **last post 06.2023** | – | Low | Pass (inactive) |
| 45 | Ziv Kitaro | TikTok @zivkitaro | TikTok 11,900 V; IG 773 V | 12,673 | TikTok 0.71% | ChatGPT tips; **last post 04.2025** | – | Low | Pass (inactive) |

Also seen, not profiled:
- **Podcast hosts:** Avi Rushkovan / Ariel Vatkin ("מדברים AI"), Roi Shalem / Eran Goldstein ("מי אמר AI"), Eyal Marcus ("Hands-On AI"), Mike Erlihson / Uri Goren ("ExplAInable"), Nir Shiloni / Tal Doron ("CloudAI"). Episode counts were found, but no audience numbers.
- **Small TikTok/IG accounts:** Matt Elior, Yarden Lerer, Netanel Estreicher (FB community "100K+" SR), Hadas Adler (YT 2,550 V), Eddie Laventman (YT 920 S), Rani Ifrah, Yair Gamliel (@yairr.ai 2,241 V), Maya Yahalom.

## 3. Creator cards (top 20)

### 1. Eilon (Ayalon) Gruper ★ (Elevate NYC), CRM item 13285487559
- **Handles:**
  - IG [@eilon.grouper](https://www.instagram.com/eilon.grouper/) 168,681 V
  - TikTok [@eilon.grouper](https://www.tiktok.com/@eilon.grouper) 66,900 V
  - YouTube [@eilon.grouper2](https://www.youtube.com/channel/UCnxE3DNx_ZQcTY1ZGmCQ9kQ) 20.3K V (last upload 18.02.2026; the older uploads were flight-sim videos)
  - Facebook page; site eilon.co
  - No LinkedIn or X found
- **Base, language, job:** Israel; Hebrew. Entrepreneur, lecturer and AI-workshop seller (eilon.co); started in e-commerce at 17 (mako, S).
- **Engagement:**
  - IG median 4.32% (mean 5.91%, 12 posts); one Reel a week, every Saturday, ~3–4 posts/month.
  - TikTok median 3.90% (12 posts), median 64,600 plays (97% of followers); last TikTok post 10.10.2026.
- **Content (last 60 days):** Claude usage-limit tricks; Claude extensions; "stop writing prompts, start writing loops"; Google's AI-detection tool; what happens to a prompt; Claude vs GPT for video editing. Mostly AI for work and productivity, as face-to-camera explainers.
- **Brand deals:** none in the last 12 sampled posts. Earlier collabs (S, older than 12 months or undated): Meta Israel (Llama 3), Microsoft Israel (AI Tour). A 04.07.2026 TikTok names Salesforce among companies hiring FDEs; that is an organic job-market mention, not an ad.
- **Clean:** 2.
- **Fit for monday:** the strongest Hebrew AI-for-work Reels creator, with high engagement at mid-macro size and a proven monday relationship. **8/8 · NYC High.**
- **Red flags:** YouTube dormant; TikTok cadence slowed in October.

### 2. Eden Bibas, CRM item 12993723125
- **Handles:**
  - IG [@eden_bibas](https://www.instagram.com/eden_bibas/) 87,972 V
  - LinkedIn [eden-bibas](https://www.linkedin.com/in/eden-bibas) 34,029 V
  - TikTok (Eden Bibas) 25,200 V
  - YouTube [@BibasAI](https://www.youtube.com/@BibasAI) 11.9K S (a free 2-hour Codex course, 91K views, S)
- **Base, language, job:** Givatayim, Tel Aviv District (LinkedIn V); Hebrew. Founder of Brain by Eden Bibas: courses, the "Brainers" club (5,000+ members SR) and the Brainstorm conference (S); ex-fitness coach (mako, S).
- **Engagement:**
  - IG median 4.30% (mean 7.45%, 12 posts); ~13 posts/month since 22.10.
  - LinkedIn median 0.25% (9).
- **Content:** a live "100K challenge" in which an **AI avatar of himself writes, films, edits and posts** (day 48/60); Claude skills; 11 Claude desktop updates; AI tools for flights and groceries; deepfake-voice warning. Every Reel uses a "comment X and I'll DM you" funnel.
- **Brand deals:**
  - TikTok Israel STEM series (S, date לא אומת).
  - LinkedIn 08.10 recommends Timeless for meeting notes ("I pay for many tools"; reads organic).
  - A Notion mention inside an OpenAI-announcements recap (30.09, organic).
- **Clean:** 2.
- **Fit for monday:** an "AI agent does my work" story told live. He also teaches business owners and runs a large paid community. **8/8 · NYC High** (Reels, face-to-camera, 88K).
- **Red flags:** the avatar format means some posts aren't really him on camera. A collab would need to be human-led.

### 3. Ofir Asher (Ofir AI)
- **Handles:**
  - IG [@ofir.ai](https://www.instagram.com/ofir.ai/) 115,976 V
  - TikTok [@ofir.ai](https://www.tiktok.com/@ofir.ai) 59,900 V
  - Facebook "Ofir AI" לא אומת
  - LinkedIn ~1.3K S
  - WhatsApp channel (bit.ly/BNA-AI)
- **Base, language, job:** Tel Aviv (TAU B.Sc in AI/ML); Hebrew. Co-founder of BNA AI (training and courses) with his brother Elad (S).
- **Engagement:**
  - IG median 3.47% (12); ~11 posts/month.
  - TikTok median 3.66% (mean 5.45%, 12), median 50,800 plays (85%); ~16 posts/month.
- **Content:** AI and tech storytelling (Musk's companies, the F-35 helmet, Palantir/Israel, the 70s casino computer), Claude "Anatomy" skill, Google's 18 AI tools. More curiosity and news than workplace how-to.
- **Brand deals:** Google Israel IG collab (20.05.2026, V co-author field); "Israel's official representative at Microsoft's 50th Anniversary and Google I/O 2026" (LinkedIn headline, S). Neither is a competitor.
- **Clean:** 2.
- **Fit:** big, engaged and clean, but the angle is "wow tech" rather than AI at work. **7/8 · NYC Med.**
- **Red flags:** several TikToks carry the "contains AI-generated media" label (fine, but note it).

### 4. Omer Yaron
- **Handles:**
  - TikTok [@omeryaron_](https://www.tiktok.com/@omeryaron_) 55,700 V
  - IG [@omer.yaron](https://www.instagram.com/omer.yaron/) 20,636 V
  - Bio claims "121K followers / 125M views across networks" (SR)
- **Base, language, job:** Israel; Hebrew. Sold his shoe brand @elevate_il at 21 (SR); now sells AgentCut (agentcut.io) and coaching.
- **Engagement:**
  - IG median 6.43% (11).
  - TikTok median 1.14% (12), median 18,750 plays.
  - **Last post 07.10.2026 (IG) and 30.09.2026 (TikTok)**; about 4–5 posts/month before that.
- **Content:** Claude replacing ManyChat, AI design that doesn't look generic, Claude video editing.
- **Brand deals:** none found.
- **Clean:** 2.
- **Fit:** strong fit and the best engagement in the set. **7/8 · NYC High**, but he's been quiet for over a month.
- **Red flags:** inactivity. His old brand is literally named "Elevate", which could cause confusion in comms.

### 5. Dalia Baida (Smirnov) ★ (Scherf; invited to Elevate London)
- **Handles:**
  - IG [@dalia__ai](https://www.instagram.com/dalia__ai/) 26,725 V
  - TikTok [@dalia___ai](https://www.tiktok.com/@dalia___ai) 3,871 V
  - LinkedIn [dalia-smirnov](https://il.linkedin.com/in/dalia-smirnov) 878 V
  - Site dalia-ai.co; WhatsApp group
- **Base, language, job:** Israel; Hebrew. Data scientist at Blue dot (LinkedIn V); M.Sc.; 6+ years in high-tech (SR).
- **Engagement:**
  - IG median 2.82% (mean 4.82%, 12); ~13 posts/month in late October.
  - TikTok median 5.93% (12), median 6,579 plays (170% of followers).
- **Content:** Claude skills ("Grill Me"), Claude Code for TV clean-up, getting more from Claude, ChatGPT vs Claude $100 plans, the AI bubble, AI and cyber. Face-to-camera.
- **Brand deals:** none found.
- **Clean:** 2.
- **Fit:** the closest Israeli match to the NYC cohort: a working tech professional explaining AI for work in Reels. Small but highly engaged. **6/8 · NYC High.**
- **Red flags:** none. Reach is small (27K).

### 6. Liya Kenan
- **Handles:** IG [@liya_kenan](https://www.instagram.com/liya_kenan/) 56,696 V. LinkedIn liya-kenan (157, Rishon LeZion; the match is probable). Landing page lp.klaigen.com. "11,000+ in my AI community" (SR).
- **Base, language:** Rishon LeZion (probable); Hebrew.
- **Engagement:** IG median 2.90% (mean 6.63%, 12); ~14 posts/month.
- **Content:** Gemini image commands, ChatGPT "secret modes", Claude skill folders, AI family photos, plus some psychology and self-help posts. Heavy comment-to-DM funnels.
- **Brand deals:** Diet Angel (~07.2026, S) and a "just km" app post (~09.2026, S); not competitors.
- **Clean:** 2.
- **Fit:** consumer-leaning AI tips with good engagement. **6/8 · NYC Med.**
- **Red flags:** diet-brand work and generic "secret codes" content.

### 7. Shalhevet Vardi (Aimprove)
- **Handles:**
  - IG [@aimprove.ai](https://www.instagram.com/aimprove.ai/) 60,050 V
  - TikTok [@aimprove](https://www.tiktok.com/@aimprove) 30,400 V (**last post 17.12.2025**)
  - YouTube ~5.9K S; site aimprove.co.il
- **Base, language, job:** Tel Aviv (IG); Hebrew. Founder of Aimprove (courses, "agent boot camp", the "מ.ב.צ.ר" method).
- **Engagement:** IG median 0.76% (11); ~7 posts/month.
- **Content:** Claude Code that keeps working with the laptop closed; an AI marketing department of agents; a WhatsApp sales agent that "made ₪620K"; competitor-research agents; Claude/Codex settings.
- **Brand deals:** none found. A collab with @zivamar on 19.10 looks like peer content.
- **Clean:** 2.
- **Fit:** "build your AI team" is close to monday's agents story. **6/8 · NYC Med.**
- **Red flags:** income-claim hooks.

### 8. Benny Farber
- **Handles:**
  - IG [@bennyfarber](https://www.instagram.com/bennyfarber/) 22,536 V
  - LinkedIn [bennyfarber](https://il.linkedin.com/in/bennyfarber) 16,725 V (Petah Tikva)
  - YouTube [@BennyFarber-AIPashut](https://www.youtube.com/@BennyFarber-AIPashut) 5,460 V
  - "ChatGPT Israel" community, "the largest AI community in Israel = 228K" (SR, IG bio)
  - Podcast "פשוט AI": 192 episodes (V, YT titles)
- **Language, job:** Hebrew. Community founder, podcaster, conference organizer ("the largest AI conference in Israel", second edition, S); AI-implementation partner at "AI פשוט".
- **Engagement:**
  - IG median 0.64% (9).
  - YT median views 689, ER 1.78% (10).
- **Content:** podcast episodes on Grok Bot, Instinct and AI agents in business; AI glasses; AI video.
- **Brand deals:** flew to NVIDIA GTC 2026 as a creator (ice.co.il, 02.2026; likely hosted). Not a competitor.
- **Clean:** 2.
- **Fit:** a distribution partner (community + podcast) rather than a Reels talent. **6/8 · NYC Low.**
- **Red flags:** his bio leads with a past arrest ("5 years ago I was in detention"), told as a redemption story; worth knowing.

### 9. Adir Duchan
- **Handles:** LinkedIn [adir-duchan](https://www.linkedin.com/in/adir-duchan) 36,907 V ("ההוא מהזה").
- **Base, language, job:** Tel Aviv District; Hebrew. AI engineer at Sticklight; formerly Senior AI Engineer at Elementor (S); Favikon IL LinkedIn top 20.
- **Engagement:** LinkedIn median 2.28% (5 posts, 20.09–31.10). The 20.09 post on Instinct drew 3,644 likes.
- **Content:** agents (Instinct), "software factory / company brain is a waste of time", an open-source skills bank, daily AI news.
- **Brand deals:** a 20.10 post tags Cato Networks (could be paid; not a competitor).
- **Clean:** 2.
- **Fit:** a credible practitioner with the best LinkedIn engagement found. **6/8 · NYC Low** (LinkedIn text, no Reels).
- **Red flags:** posts only every week or two.

### 10. Elad Amrani
- **Handles:** TikTok [@eladamrani.ai](https://www.tiktok.com/@eladamrani.ai) 5,267 V; IG [@eladamrani.ai](https://www.instagram.com/eladamrani.ai/) 4,101 V; eladamrani.ai with a weekly newsletter.
- **Language, job:** Hebrew. Co-owner of Agentic-dev (builds agents for businesses); Claude Code, n8n and vibe-coding workshops.
- **Engagement:** TikTok median 10.16% (11), median 15,400 plays (292% of followers); ~14 posts/month.
- **Content:** Claude Code plugins, Claude for YouTube, MarkItDown, Google Harness², LinkedIn-managing skills.
- **Brand deals:** none.
- **Clean:** 2.
- **Fit:** exactly on-topic and growing fast, but micro. **6/8.**
- **Red flags:** every TikTok is labelled "Creator labelled as AI-generated" (avatar/voice), so it isn't the real face.

### 11. Ruben Hassid (CRM: Top 15 #01 and Narrative)
- **Handles:**
  - LinkedIn [ruben-hassid](https://www.linkedin.com/in/ruben-hassid) 957,166 V
  - X [@rubenhassid](https://x.com/rubenhassid) 97,238 V
  - IG [@rubenhassid](https://www.instagram.com/rubenhassid/) 85,201 V
  - YouTube [@rubenhassid](https://www.youtube.com/@rubenhassid) 19,100 V
  - How to AI newsletter: "994,381 subscribers" (SR, Substack post)
- **Base, language, job:** Tel Aviv District (LinkedIn V); made aliyah from Paris (S); English. Writer and founder of How to AI; enterprise AI consultant (S).
- **Engagement:**
  - LinkedIn median 0.08% (9), with 200–620 likes and 140–210 comments per post.
  - IG median 0.19% (12); posts daily.
  - YT ER 2.34% on few videos (last upload 23.07.2026).
- **Content:** Claude tips, guides and certifications; "AI-slop" critique; AI employees.
- **Brand deals:** **Viktor** paid post ("we just hired an AI employee", LinkedIn and IG, 10.11.2026; not a competitor per R-39). IG 05.11 delivers his guide as "my Notion library" (organic tool use).
- **Clean:** 1 (a Notion-hosted funnel).
- **Fit:** the most influential Israeli AI creator by far, with a B2B audience, but in English and LinkedIn carousels. Low ER for the size, and he sells to brands at scale. **5/8 · NYC Low.**
- **Red flags:** regular sponsor slots, including Viktor, an AI-agents-for-work product adjacent to monday agents (check exclusivity before any deal).

### 12. Bar Shealtiel
- **Handles:**
  - IG [@barshaltiel.ai](https://www.instagram.com/barshaltiel.ai/) 70,002 V
  - TikTok [@barshaltiel0](https://www.tiktok.com/@barshaltiel0) 36,400 V
  - LinkedIn [bar-shealtiel-ai](https://il.linkedin.com/in/bar-shealtiel-ai) 27,873 V
  - YouTube 13,900 V
  - "AI פרקטי" club 6,000+ (SR); "+300K Israelis learn AI with me" (SR)
- **Base, language, job:** Modiin; Hebrew. Founder of "בינה מלאכותית בגובה העיניים" / Eye level AI.
- **Engagement:**
  - IG median 0.36% (mean 5.58%; carousels; likes hidden on 1 post).
  - TikTok median 1.32% (9).
  - YT median 3,282 views, ER 2.32%.
  - LinkedIn median 0.46%.
  - Very high cadence (several carousels a day in November).
- **Content:** which Claude model to pick, ChatGPT image commands, Gemini 4 tricks, presentations exported to PowerPoint, GPTs to skills.
- **Brand deals:** none found.
- **Clean:** 2.
- **Fit:** the best "AI at work" utility content across four platforms, but IG engagement is uneven. **5/8 · NYC Med.**

### 13. Mor Nissim ★ (Elevate NYC), CRM item 12993720069
- **Handles:** IG [@mornissim_](https://www.instagram.com/mornissim_/) 48,234 V; YouTube [@MorNissim](https://www.youtube.com/@MorNissim) 6,820 V; LinkedIn 4,476 V.
- **Base, language, job:** Tel Aviv District; Hebrew. Industrial engineer; founder of Flow (automation and AI consultancy); co-runs an "AI engineer" course with Saar Weinberg (S).
- **Engagement:**
  - IG median 0.43% (12); ~5 posts/month.
  - YT median views 1,350, ER 2.11%.
- **Content:** ChatGPT and CVs, building sites with AI, a Claude Code course in Hebrew, and a YouTube guide "A monday AI agent connected to WhatsApp". On 01.11 she thanked monday for flying her to Elevate NYC (V caption).
- **Brand deals:** TimeOS and Tadiran collabs (S, ~2025). A 2022 Reel about monday (organic).
- **Clean:** 2.
- **Fit:** a proven, on-message partner who already makes monday content. **5/8 · NYC High.**
- **Red flags:** low IG engagement.

### 14. Yuval Avidani
- **Handles:** LinkedIn 30,677 V; IG [@yuval_770](https://www.instagram.com/yuval_770/) 13,450 V; TikTok 10,200 V; YouTube [@yuv-ai](https://www.youtube.com/@yuv-ai) 7,240 V; YUV.AI community; X @yuvalav לא אומת.
- **Language, job:** Hebrew. Developer for about 20 years; GitHub Star; ex-Akamai (S). Presents the AI segment on Channel 12 News (SR).
- **Engagement:** IG median 0.34%; LinkedIn 0.06%; YT median 1,063 views, ER 1.51%; posts daily.
- **Content:** Claude + Higgsfield MCP, Fable 5.2 building a CapCut alternative, Grok Bot, GitHub agents.
- **Brand deals:** Higgsfield tagged (08.11; possibly paid, not a competitor).
- **Clean:** 2.
- **Fit:** agents and a builder audience, plus TV credibility. **5/8 · NYC Med.**

### 15. Amitay Boneh
- **Handles:** LinkedIn [amitayboneh](https://www.linkedin.com/in/amitayboneh) 36,078 V; AI with Amitay newsletter on Substack (subscribers לא אומת).
- **Base, language, job:** Tel Aviv District; Hebrew. GenAI lecturer; co-founder of Builders Lab.
- **Engagement:** LinkedIn median 0.49% (9).
- **Content:** Skills, choosing a personal agent, Israel's AI workforce readiness (with the National AI Directorate).
- **Brand deals:** none. A Notion mention on 15.10 is an organic product comparison.
- **Clean:** 2 (organic mention only).
- **Fit:** an AI-for-work thought leader for product people. **5/8 · NYC Low.**

### 16. Omri Barak & Yoav Tzuker (TrashTech)
- **Handles:**
  - TrashTech: YouTube [@TrashTechNews](https://www.youtube.com/@trashtechnews) 18,600 V; TikTok 18,300 V; IG [@trashtechnewsig](https://www.instagram.com/trashtechnewsig/) 12,934 V
  - Omri: IG [@omri.barak](https://www.instagram.com/omri.barak/) 12,078 V; TikTok 10,700 V; X 4,957 V
  - epicNews newsletter (לא אומת)
- **Base, language, job:** Tel Aviv; Hebrew. Omri was a tech reporter at Channel 12 (2010–2020) and now consults on content and AI.
- **Engagement:** YT median 12,043 views, ER 1.09% (the strongest Hebrew AI-business video views found). Omri's TikTok median is 1.21%.
- **Content:** a weekly podcast: Google search under threat, NVIDIA, AI and jobs; an interview with the Mixtiles CEO on rolling out AI in companies.
- **Brand deals:** an Israel Innovation Authority campaign link in their IG bio (utm=Influencer, 03.2026; government, not a competitor).
- **Clean:** 2.
- **Fit:** a media slot (episode sponsorship or guest) rather than a creator deal. **5/8 · NYC Low.**

### 17. Dana Israeli
- **Handles:** IG [@danaisraeli](https://www.instagram.com/danaisraeli/) 65,715 V; site danad.co.il; LinkedIn dana-israeli (לא אומת).
- **Language, job:** Hebrew. Gen-AI creativity lecturer and animator; creator of the AI Makery app; represented by @kerenalouf for lectures.
- **Engagement:** IG median 0.97% (12); ~11 posts/month.
- **Content:** her AI avatar, ChatGPT GIFs and carousels, AI saved-posts agent, plus a family trip.
- **Brand deals:** none found.
- **Clean:** 2.
- **Fit:** creative-AI, with a business-audience side. **5/8 · NYC Med.**

### 18. Amichai Sheqel ★ (picked for Elevate London via Scherf), CRM item 12993721570
- **Handles:**
  - TikTok [@amichai.ai](https://www.tiktok.com/@amichai.ai) 168,400 V
  - IG [@amichai.ai](https://www.instagram.com/amichai.ai/) 113,770 V
  - LinkedIn [amichai-sheqel](https://www.linkedin.com/in/amichai-sheqel-0519091ab) 23,120 V
  - AI Master club (Skool); site amichai-ai.co.il
- **Base, language, job:** Hod HaSharon; Hebrew. Lecturer and consultant; says he has worked with Google, Facebook and Microsoft (S).
- **Engagement:**
  - IG median 0.56% (12); ~25 posts/month.
  - TikTok median 0.23% (12), median 16,200 plays (9.6%).
- **Content:** Claude animation skills, building an agent in Claude, Claude connectors, ChatGPT codes, NVIDIA RTX Spark.
- **Brand deals (competitor):**
  - ⚑ **Salesforce Israel paid collab.** IG Reels on 08.11 and 10.11.2026 have co-author @salesforceil, with "בשיתוף @salesforceil @salesforceilrnd" in the caption (V + S). The pitch: "comment 'סיילספורס' for the announcements + guide… the future of the world of work".
  - A matching LinkedIn post on 09.11 tags Salesforce (V).
  - Earlier: a Deloitte Digital × Salesforce Israel video (~08.2026, S).
- **Clean:** **0 under R-39.**
- **Fit:** topic and format are right. **5/8 · NYC High**, but the brief's Clean rule says drop.
- **Action for Ilan:** he is already booked for London (23–24.11). Confirm with Scherf/Eden whether the Salesforce deal carries category exclusivity or overlaps the London dates. Don't commission new monday content until that's clear.

### 19. Luiza Jarovsky
- **Handles:** LinkedIn [luizajarovsky](https://il.linkedin.com/in/luizajarovsky) 146,628 V; X [@LuizaJarovsky](https://x.com/LuizaJarovsky) 32,957 V; Luiza's Newsletter "103,000+" (SR).
- **Base, language, job:** Tel Aviv District; English. Co-founder of the AI, Tech & Privacy Academy.
- **Engagement:** LinkedIn median 0.11% (9).
- **Content:** AI regulation (Australia), NVIDIA lawsuits, METR capability report.
- **Brand deals:** none.
- **Clean:** 2.
- **Fit:** policy and governance, often critical of AI companies ("'AI' is not your friend", S). **5/8 · Pass** for creator work; possibly a panel voice.

### 20. Sapir Adler, CRM item 12993697703
- **Handles:** IG [@sap.adler](https://www.instagram.com/sap.adler/) 45,305 V; sapdigital.co.
- **Language, job:** Hebrew. Marketing consultant; AI for business, photography, tourism; founder of @igers.plus.
- **Engagement:** IG median 0.50% (12).
- **Content:** Claude skills (fonts, video editing), free video generators, plus a paid tourism post.
- **Brand deals:** **Arava Way winter card** collab (03.11.2026; tourism, not a competitor); Google Israel tag.
- **Clean:** 2.
- **Fit:** mixed niche. **5/8 · Pass.**

## 4. Buckets

**Strong yes**
- **Eilon Gruper ★:** top Hebrew AI-for-work Reels creator, 4% engagement, already a monday partner.
- **Eden Bibas:** an "AI agent runs my content" story told live, a business-owner community, and 4% engagement.
- **Ofir Asher:** the biggest clean, high-engagement reach after Eilon. Brief him toward AI-at-work rather than tech curiosities.
- **Dalia Baida ★:** the NYC profile in Hebrew (data scientist, Reels, about 3–6% engagement). Small, so pair her with a bigger name.

**Maybe**
- **Benny Farber, Bar Shealtiel, Aimprove (Shalhevet Vardi), Liya Kenan, Mor Nissim ★:** on-topic Hebrew educators, each with a gap: reach, engagement or a consumer lean.
- **Ruben Hassid:** global reach, but low engagement and an active Viktor deal.
- **Omer Yaron:** excellent engagement, but no post since early October.
- **Adir Duchan and Amitay Boneh:** LinkedIn practitioners.
- **Elad Amrani:** a fast-rising micro creator who posts with an AI avatar.
- **Yuval Avidani and TrashTech:** a TV segment and a podcast slot.
- **Dana Israeli:** creative AI.

**Pass (with reasons)**
- **Amichai Sheqel ★:** paid Salesforce collab in November 2026 (R-39). Flag, given his London booking.
- **Luiza Jarovsky:** governance and critical tone.
- **Hillel Fuld:** politics and advocacy now dominate.
- **Michael Danilov:** 85.6K TikTok but a median of 545 plays and 0.02% engagement (inflated or dead audience).
- **Sagi Shmaryahu and Yam Olisker:** gadgets, not AI. Possible amplifiers only.
- **Maor Shlomo:** an exec (Base44/Wix). Any approach should come from Ilan.
- **Nir Diamant and Yam Peleg:** developer audience; Nir is US-based.
- **Amir Moshe:** election and political Reels.
- **Hila Naor and Sapir Adler:** mixed niche with paid travel posts.
- **Inactive:** Lior Shalmoni, The AI Bois, Ziv Kitaro.

## 5. Platform-by-platform leaders (AI-focused accounts, verified counts)

| Platform | Top 5 by followers | Notes |
|---|---|---|
| Instagram | Eilon Gruper 168.7K · Ofir Asher 116.0K · Amichai Sheqel 113.8K · Eden Bibas 88.0K · Ruben Hassid 85.2K | Next: Bar Shealtiel 70.0K, Dana Israeli 65.7K, Aimprove 60.1K, Liya Kenan 56.7K. Highest engagement among them: Eilon 4.3%, Eden 4.3%, Ofir 3.5%. Hillel Fuld (145K) left out as non-AI |
| TikTok | Amichai Sheqel 168.4K · Eilon Gruper 66.9K · Ofir Asher 59.9K · Omer Yaron 55.7K · Bar Shealtiel 36.4K | Left out: Michael Danilov 85.6K (suspect), Sagi Shmaryahu 235.8K and Yam Olisker 143.7K (gadgets). Engagement leaders: Elad Amrani 10.2%, Dalia 5.9%, Eilon 3.9%, Ofir 3.7% |
| YouTube | Ruben Hassid 19.1K · TrashTech 18.6K · Bar Shealtiel 13.9K · Eden Bibas 11.9K (S) · AI With Henry 11.7K | Hebrew AI YouTube is small. TrashTech has the strongest views (median 12K). Eilon's 20.3K channel has been dormant since 02.2026. General tech: Yam Olisker 113K (median 75K views) |
| LinkedIn | Ruben Hassid 957.2K · Luiza Jarovsky 146.6K · Maor Shlomo 77.5K · Adir Duchan 36.9K · Amitay Boneh 36.1K | Next: Eden Bibas 34.0K, Yuval Avidani 30.7K, Bar Shealtiel 27.9K. Hillel Fuld 79.0K left out as non-AI. Engagement leader: Adir Duchan 2.3% |
| X | Ruben Hassid 97.2K · Yam Peleg 43.2K · Luiza Jarovsky 33.0K · Omri Barak 5.0K · Nir Diamant 2.9K | Hebrew AI creators barely use X. Hillel Fuld 198K is mostly politics |
| Newsletters / podcasts / communities | How to AI (Ruben) ~994K SR · Benny Farber's community "228K" SR + "פשוט AI" podcast (192 episodes) · Luiza's Newsletter 103K+ SR · עליית המכונות FB group 71.7K S · DiamantAI 60K+ SR | Also: Brainers (Eden) 5,000+ SR, AI Prakti (Bar) 6,000+ SR, Liya 11,000+ SR, AI Master (Amichai, Skool), YUV.AI, MDLI (~50K FB), TrashTech and epicNews. WhatsApp groups are the main funnel for almost every Hebrew creator |

## 6. monday.com ties

| Name | Tie | Today's read |
|---|---|---|
| Eilon Gruper | Elevate NYC creator (roster), CRM 13285487559 | #1 overall. Re-engage first |
| Mor Nissim | Elevate NYC (flown in by monday; 01.11 thank-you post V), CRM 12993720069; YT video on a monday AI agent + WhatsApp | Reliable partner; low IG engagement |
| Dalia Baida (Smirnov) | Invited to Elevate London via Scherf (her answer pending) | Best NYC-style match; small |
| Amichai Sheqel | Picked for Elevate London via Scherf, CRM 12993721570 | ⚑ Salesforce paid collab 08–10.11.2026 |
| Ruben Hassid, Eden Bibas, Uri Eliabayev, Sapir Adler | Already CRM items | See cards |

## 7. Data gaps

- **IG views:** the IG Posts dataset returned no play or view counts. IG engagement is likes + comments only. Paid-partnership flags also came back empty, so deal detection relies on captions, co-author fields and SERP.
- **Single-scrape numbers:** LinkedIn engagement rests on 5–9 posts per profile (dataset cap). X engagement was not pulled.
- **Unverified counts:**
  - Eden Bibas YT (11.9K)
  - Aimprove YT (~5.9K)
  - Yam Olisker IG (~49K)
  - Ofir's LinkedIn (~1.3K)
  - Ruben's newsletter (~994K)
  - Benny Farber's "228K" community
  - Luiza's and Nir's newsletters
  - The עליית המכונות group
  - Uri Eliabayev's MDLI group
- **Podcast audiences:** none of the Hebrew AI podcasts publish listener numbers; only episode counts were found.
- **Identity:** Liya Kenan's LinkedIn match is probable, not confirmed. Bar Shealtiel's TikTok (@barshaltiel0) is taken from the keyword-discovery records (9 posts); the profile run used a wrong handle.
- **Not found:** LinkedIn for Eilon Gruper, Ofir Asher (beyond S), Liya Kenan (beyond the probable match) and Omer Yaron. Facebook pages (Eilon, Ofir, Omri) were not scraped.
- **Inactivity:**
  - Eilon's YT: last upload 02.2026
  - Aimprove TikTok: last post 12.2025
  - Omer Yaron: last post early 10.2026
  - Lior Shalmoni: last post 06.2026
- **Paid vs organic:** for NVIDIA (Benny Farber GTC trip, Amichai 26.10), Higgsfield (Yuval) and Cato Networks (Adir Duchan), I couldn't tell paid from organic. None is a competitor.
- **Raw data:** Bright Data snapshots are in the scratchpad `il-ai-creators/run/` (igp1–3, igposts1–2, ttp1, ttkw, ttposts1–2, yt1, li1, liposts, x1).
