-- =============================================================================
-- Creator UTM performance: Elevate NYC creators (+ CRM bit.ly links)
-- Warehouse: Snowflake via the Kremer MCP (mcp__Kremer__run-sql). Read-only.
-- Built 2026-11-10. Report: reports/creator-utm-performance.md
--
-- HOW TO RERUN
--   Edit only the two parameter CTEs at the top of each query:
--     params    -> start_date (first day a link was shared) and end_date
--                  (CURRENT_DATE() by default; the visits table lags one day,
--                  so the newest row is yesterday).
--     utm_list  -> one row per creator: creator name, utm_source, utm_campaign.
--                  Add London creators here (e.g. ...multi-event-london...).
--   Each query is a single statement (no SET variables), because Kremer's
--   run-sql runs one statement per call.
--
-- TABLES
--   Q1 bigbrain.l3.fact_tof_visits_daily       one row per website visit, with that
--      visit's own UTMs (visit_marketing_source / visit_medium / visit_campaign_name)
--      and funnel flags. Touch-level: every visit keeps its own UTMs. NOT first- or
--      last-touch; a person who clicked two creator links counts under both.
--   Q2 bigbrain.l3.fact_campaign_monitoring_dwh  marketing attribution table.
--      type='people' = visitors, type='attribution' = accounts + revenue.
--      One "winning" touch per signup, chosen by priority (high-priority clicks,
--      then impressions, then brand clicks, then low-priority clicks); only if
--      none match does it fall back to the last touch in the 24h before signup.
--      Click windows: 12h desktop, 24h other devices. Rebuilt on a schedule, so
--      numbers can move after the fact.
--
-- METRIC DEFINITIONS
--   signup_accounts     = is_hard_signup=1 (an account was created)
--   activated_accounts  = signup + is_first_load_event_after_signup=1 (first board
--                         load; the only activation flag in the table)
--   payers_14d/_28d     = paid within 14/28 days of signup. Not mature until
--                         28 days after the last signup in the window.
--   arr_from_latest_mrr = SUM(mrr_999999)*12 on attribution rows
--   No utm_content / utm_term: the visits table has no such columns, and the
--   creator links carried none.
--   Bots/demo excluded with COALESCE(is_bot_or_demo,0)=0; record_source='signup_flow'.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Q1. Visits -> signups -> activation -> payers, per creator (visits table)
-- -----------------------------------------------------------------------------
WITH params AS (
    SELECT '2026-10-27'::DATE AS start_date,      -- first link sent 27.10.2026
           CURRENT_DATE()     AS end_date
),
utm_list (creator, creator_group, utm_source, utm_campaign) AS (
    SELECT * FROM VALUES
      ('Soojin',            'Creator Buzz', 'elevate', 'multi-multi-event-multi-soojin'),
      ('Audrey',            'Creator Buzz', 'elevate', 'multi-multi-event-multi-audrey'),
      ('Aria',              'Creator Buzz', 'elevate', 'multi-multi-event-multi-aria'),
      ('Maitri',            'Creator Buzz', 'elevate', 'multi-multi-event-multi-maitri'),
      ('Alexis',            'Creator Buzz', 'elevate', 'multi-multi-event-multi-alexis'),
      ('Natasha',           'Creator Buzz', 'elevate', 'multi-multi-event-multi-natasha'),
      ('Danielle',          'Creator Buzz', 'elevate', 'multi-multi-event-multi-daniellefarage'),
      ('Fiona',             'Creator Buzz', 'elevate', 'multi-multi-event-multi-fifbuilds'),
      ('Max Talks Tech',    'Creator Buzz', 'elevate', 'multi-multi-event-multi-maxtalkstech'),
      ('Mariana (Mar) Antaya','Narrative',  'elevate', 'multi-multi-event-multi-mariana'),
      ('Kayvon',            'Narrative',    'elevate', 'multi-multi-event-multi-kayvon'),
      ('Sajjaad',           'Narrative',    'elevate', 'multi-multi-event-multi-sajjaad'),
      ('Taki',              'Narrative',    'elevate', 'multi-multi-event-multi-taki'),
      ('Naya',              'Narrative',    'elevate', 'multi-multi-event-multi-naya')
      -- Other NYC links sent by Ilan (not in the 14-creator scope), add if wanted:
      -- ('Vin Matano (Creator Buzz)','Other','elevate','multi-multi-event-multi-vinmatano'),
      -- ('Eilon','Other','elevate','multi-multi-event-multi-eilon'),
      -- ('Mor','Other','elevate','multi-multi-event-multi-mor'),
      -- ('Lauren Vriens','Other','elevate','multi-multi-event-multi-laurenvriens'),
      -- ('Jean Kang','Other','elevate','multi-multi-event-multi-jeankang'),
      -- ('Jade Bonacolta','Other','elevate','multi-multi-event-multi-jadebonacolta'),
      -- ('Hilary Gridley','Other','elevate','multi-multi-event-multi-hilarygridley'),
      -- CRM bit.ly links (source=influencers; shared before 2026, so use an early start_date):
      -- ('Jake Abrams','CRM','influencers','ww-en-brand-other-jake'),
      -- ('Davidson Daniel','CRM','influencers','ww-en-brand-work_mgmt-davidson')
),
v AS (
    SELECT u.creator, u.creator_group, u.utm_campaign, f.*
    FROM utm_list u
    JOIN bigbrain.l3.fact_tof_visits_daily f
      ON LOWER(f.visit_marketing_source) = u.utm_source
     AND LOWER(f.visit_campaign_name)    = u.utm_campaign
    CROSS JOIN params p
    WHERE f.record_source = 'signup_flow'
      AND f.day BETWEEN p.start_date AND p.end_date
      AND COALESCE(f.is_bot_or_demo, 0) = 0
)
SELECT
    u.creator_group,
    u.creator,
    u.utm_campaign,
    MIN(v.day)                                                                      AS first_visit_day,
    MAX(v.day)                                                                      AS last_visit_day,
    COUNT(DISTINCT v.visit_id)                                                      AS visits,
    COUNT(DISTINCT v.visitor_id)                                                    AS visitors,
    COUNT(DISTINCT IFF(v.is_get_started = 1, v.visitor_id, NULL))                   AS get_started_visitors,
    COUNT(DISTINCT IFF(v.is_soft_signup = 1, v.pulse_user_id, NULL))                AS soft_signup_users,
    COUNT(DISTINCT IFF(v.is_hard_signup = 1, v.pulse_account_id, NULL))             AS signup_accounts,
    COUNT(DISTINCT IFF(v.is_hard_signup = 1 AND v.is_first_load_event_after_signup = 1,
                       v.pulse_account_id, NULL))                                   AS activated_accounts,
    COUNT(DISTINCT IFF(v.is_payer_14 = 1, v.pulse_account_id, NULL))                AS payers_14d,
    COUNT(DISTINCT IFF(v.is_payer_28 = 1, v.pulse_account_id, NULL))                AS payers_28d
FROM utm_list u
LEFT JOIN v ON v.creator = u.creator
GROUP BY ROLLUP ((u.creator_group, u.creator, u.utm_campaign))   -- last row = TOTAL
ORDER BY u.creator IS NULL, visits DESC;


-- -----------------------------------------------------------------------------
-- Q2. Attributed visitors, signups, paying accounts and ARR (attribution table)
-- -----------------------------------------------------------------------------
WITH params AS (
    SELECT '2026-10-27'::DATE AS start_date,
           CURRENT_DATE()     AS end_date
),
utm_list (creator, creator_group, utm_source, utm_campaign) AS (
    SELECT * FROM VALUES
      ('Soojin',            'Creator Buzz', 'elevate', 'multi-multi-event-multi-soojin'),
      ('Audrey',            'Creator Buzz', 'elevate', 'multi-multi-event-multi-audrey'),
      ('Aria',              'Creator Buzz', 'elevate', 'multi-multi-event-multi-aria'),
      ('Maitri',            'Creator Buzz', 'elevate', 'multi-multi-event-multi-maitri'),
      ('Alexis',            'Creator Buzz', 'elevate', 'multi-multi-event-multi-alexis'),
      ('Natasha',           'Creator Buzz', 'elevate', 'multi-multi-event-multi-natasha'),
      ('Danielle',          'Creator Buzz', 'elevate', 'multi-multi-event-multi-daniellefarage'),
      ('Fiona',             'Creator Buzz', 'elevate', 'multi-multi-event-multi-fifbuilds'),
      ('Max Talks Tech',    'Creator Buzz', 'elevate', 'multi-multi-event-multi-maxtalkstech'),
      ('Mariana (Mar) Antaya','Narrative',  'elevate', 'multi-multi-event-multi-mariana'),
      ('Kayvon',            'Narrative',    'elevate', 'multi-multi-event-multi-kayvon'),
      ('Sajjaad',           'Narrative',    'elevate', 'multi-multi-event-multi-sajjaad'),
      ('Taki',              'Narrative',    'elevate', 'multi-multi-event-multi-taki'),
      ('Naya',              'Narrative',    'elevate', 'multi-multi-event-multi-naya')
),
a AS (
    SELECT u.creator, c.*
    FROM utm_list u
    JOIN bigbrain.l3.fact_campaign_monitoring_dwh c
      ON LOWER(c.source)   = u.utm_source
     AND LOWER(c.campaign) = u.utm_campaign
    CROSS JOIN params p
    WHERE c.type IN ('people', 'attribution')
      AND c.created_at >= p.start_date
      AND c.created_at <  DATEADD(day, 1, p.end_date)
)
SELECT
    u.creator_group,
    u.creator,
    u.utm_campaign,
    COUNT(DISTINCT IFF(a.type = 'people', a.original_visitor_id, NULL))                       AS attributed_visitors,
    COUNT(DISTINCT IFF(a.type = 'attribution', a.pulse_account_id, NULL))                     AS attributed_signups,
    COUNT(DISTINCT IFF(a.type = 'attribution' AND a.is_qualified_signup = 1,
                       a.pulse_account_id, NULL))                                             AS qualified_signups,
    COUNT(DISTINCT IFF(a.type = 'attribution' AND a.first_arr_date IS NOT NULL,
                       a.pulse_account_id, NULL))                                             AS paying_accounts,
    COALESCE(SUM(IFF(a.type = 'attribution', a.mrr_999999, 0)), 0) * 12                       AS arr_from_latest_mrr
FROM utm_list u
LEFT JOIN a ON a.creator = u.creator
GROUP BY ROLLUP ((u.creator_group, u.creator, u.utm_campaign))
ORDER BY u.creator IS NULL, attributed_visitors DESC;


-- -----------------------------------------------------------------------------
-- Q3. Discovery: any elevate-sourced or creator-looking campaign NOT in the list
--     (catches typos, new creators, or links edited by the creator)
-- -----------------------------------------------------------------------------
SELECT LOWER(visit_marketing_source) AS utm_source, visit_medium AS utm_medium,
       visit_campaign_name AS utm_campaign, MIN(day) AS first_day, MAX(day) AS last_day,
       COUNT(DISTINCT visit_id) AS visits
FROM bigbrain.l3.fact_tof_visits_daily
WHERE record_source = 'signup_flow'
  AND day >= '2026-10-20'
  AND COALESCE(is_bot_or_demo, 0) = 0
  AND (LOWER(visit_marketing_source) = 'elevate'
       OR LOWER(visit_campaign_name) LIKE '%multi-event-multi%'
       OR LOWER(visit_campaign_name) LIKE 'ww-en-brand-%')
GROUP BY 1, 2, 3
ORDER BY visits DESC;


-- -----------------------------------------------------------------------------
-- Q4. Daily trend for one creator (spot event-day spikes vs. post-driven traffic)
-- -----------------------------------------------------------------------------
SELECT day, COUNT(DISTINCT visit_id) AS visits,
       COUNT(DISTINCT IFF(is_hard_signup = 1, pulse_account_id, NULL)) AS signup_accounts
FROM bigbrain.l3.fact_tof_visits_daily
WHERE record_source = 'signup_flow'
  AND day >= '2026-10-27'
  AND COALESCE(is_bot_or_demo, 0) = 0
  AND LOWER(visit_campaign_name) = 'multi-multi-event-multi-mariana'   -- change me
GROUP BY 1
ORDER BY 1;
