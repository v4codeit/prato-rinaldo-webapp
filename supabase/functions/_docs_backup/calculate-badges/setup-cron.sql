-- Setup Cron Job for calculate-badges Edge Function
-- This SQL file sets up an hourly cron job to automatically award badges
--
-- Prerequisites:
-- 1. pg_cron extension must be enabled
-- 2. pg_net extension must be enabled
-- 3. Replace YOUR_PROJECT_REF with your Supabase project reference
-- 4. Replace YOUR_ANON_KEY with your Supabase anon key
--
-- Run this in your Supabase SQL Editor

-- ============================================
-- Step 1: Enable Required Extensions
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ============================================
-- Step 2: Create Cron Job (Hourly)
-- ============================================

-- Remove existing job if it exists
SELECT cron.unschedule('calculate-badges-hourly');

-- Schedule the function to run every hour at minute 0
-- Schedule: 0 * * * * (at minute 0 of every hour)
SELECT cron.schedule(
  'calculate-badges-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- ============================================
-- Alternative Schedules (commented out)
-- ============================================

-- Every 15 minutes: */15 * * * *
/*
SELECT cron.schedule(
  'calculate-badges-frequent',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
*/

-- Every 6 hours: 0 */6 * * *
/*
SELECT cron.schedule(
  'calculate-badges-6hours',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
*/

-- Daily at midnight: 0 0 * * *
/*
SELECT cron.schedule(
  'calculate-badges-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
*/

-- ============================================
-- Step 3: Verify Cron Job Setup
-- ============================================

-- List all cron jobs
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname LIKE '%calculate-badges%';

-- ============================================
-- Step 4: Monitor Cron Job Execution
-- ============================================

-- View recent job runs
SELECT
  runid,
  jobid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid IN (
  SELECT jobid FROM cron.job WHERE jobname LIKE '%calculate-badges%'
)
ORDER BY start_time DESC
LIMIT 10;

-- ============================================
-- Maintenance Commands
-- ============================================

-- To disable the job temporarily:
-- UPDATE cron.job SET active = false WHERE jobname = 'calculate-badges-hourly';

-- To enable the job:
-- UPDATE cron.job SET active = true WHERE jobname = 'calculate-badges-hourly';

-- To delete the job:
-- SELECT cron.unschedule('calculate-badges-hourly');

-- To manually trigger the job (for testing):
/*
SELECT net.http_post(
  url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges',
  headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
  body:='{}'::jsonb
);
*/

-- ============================================
-- Notes
-- ============================================

-- Cron Schedule Format:
-- ┌───────────── minute (0 - 59)
-- │ ┌───────────── hour (0 - 23)
-- │ │ ┌───────────── day of month (1 - 31)
-- │ │ │ ┌───────────── month (1 - 12)
-- │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
-- │ │ │ │ │
-- │ │ │ │ │
-- * * * * *

-- Examples:
-- 0 * * * *     - Every hour at minute 0
-- */30 * * * *  - Every 30 minutes
-- 0 0 * * *     - Daily at midnight
-- 0 0 * * 0     - Weekly on Sunday at midnight
-- 0 0 1 * *     - Monthly on the 1st at midnight
