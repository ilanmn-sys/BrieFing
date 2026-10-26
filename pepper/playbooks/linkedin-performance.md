---
id: linkedin-performance
last_verified: 2026-10-26
owner: Ilan
status: DRAFT 26.10 (Ilan asked for it); not loaded by Pepper until Ilan copies it to her workspace
---
# Playbook: LinkedIn performance, what works

**Why.** Claude's weekly LinkedIn proposal (`agents/weekly-linkedin-post-proposal`, Wed 09:00) should optimize to what actually performs on Ilan's profile. Pepper reads the post numbers. Claude can't. Pepper keeps one doc of findings, and the proposal reads it (src: Ilan 26.10).

**Trigger.** Weekly, Tuesday 17:00 Asia/Jerusalem (cron `linkedin-performance-ilan`), so the doc is fresh before Wednesday's proposal. Also when Ilan asks.

**Inputs**
- Ilan's own LinkedIn posts from the last 90 days: text, date and time, format (text, image, carousel, video, link), and the numbers LinkedIn shows (impressions, reactions, comments, reposts). Source: Bright Data LinkedIn posts scraper on Ilan's profile URL, or a LinkedIn analytics export Ilan drops in Drive.
- The previous version of the doc, to compare week over week.

**Steps**
1. **Collect.** One row per post with: date, weekday and hour, format, hook (first line), topic, word count, hashtags, has a link, has a visual, impressions, reactions, comments, reposts. A missing number stays blank, never estimated.
2. **Compare.** Rank posts by engagement rate (reactions + comments + reposts ÷ impressions). If impressions are missing, rank by reactions + comments + reposts and say so. Fewer than 5 posts with numbers → write "not enough data" and stop at step 4.
3. **Findings.** At most 7 findings, each one testable and backed by the rows. Examples of the shape:
   - "Posts that open with a number: median 3.1% vs 1.4% (n=4 vs n=9)."
   - "Carousel vs single image vs text only."
   - "Tue–Wed 08:00–10:00 vs other slots."
   - "Under 120 words vs over."
   Each finding names n on both sides. If n < 3 on a side, label it "weak signal".
4. **Write the doc** "LinkedIn — what works" (Google Doc, Drive id goes in `config.linkedin.performanceDocId`). Replace the content with:
   - `Updated: <DD.MM.YYYY>` and the window covered.
   - **Do more:** findings, strongest first.
   - **Do less:** findings, strongest first.
   - **Top 3 posts:** hook, date, format, numbers, link.
   - **Table:** all rows from step 1.
5. **Tell Ilan** in his Slack DM (`user:U038UEUQC1Y`), in Hebrew (P10), in 3 lines at most: what changed this week and the doc link. Check the send result.

**Never:**
- Never invent, round up or estimate a number. A finding without numbers is not a finding.
- Never post, comment or react on LinkedIn. Read only.
- Never read other people's private data or DMs. Only Ilan's public posts and his own analytics.

**Output.** The updated doc, plus one Slack DM to Ilan.

**Done when.** The doc shows today's `Updated:` date, and the DM send result is ok.

**On failure (P4).**
- Can't read the posts → DM Ilan `⚠️ LinkedIn performance failed: <reason>` and leave the doc unchanged. The Wednesday proposal then uses the last version and says how old it is.
- Doc write failed → retry once, then DM Ilan.

**Open (needs Ilan).**
- Ilan's LinkedIn profile URL.
- Which source: Bright Data scraper or a monthly analytics export.
- Create the doc and send its Drive id, for `config.linkedin.performanceDocId`.

**Sources.** Ilan 26.10 (Claude session); CLAUDE.md P1, P4, P10; `agents/weekly-linkedin-post-proposal/prompt.md`.
