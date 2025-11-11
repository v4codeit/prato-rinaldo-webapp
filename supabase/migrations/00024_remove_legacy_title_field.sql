-- Migration: Remove legacy 'title' field from service_profiles
-- Date: 2025-01-27
-- Author: Claude AI Assistant
-- Description:
--   The 'title' field was replaced by 'business_name' in migration 00017
--   but was never removed. This migration removes the legacy field to fix
--   the "null value in column title violates not-null constraint" error
--   when creating new service profiles.

-- Remove the legacy title column
ALTER TABLE service_profiles DROP COLUMN IF EXISTS title;

-- Note: All existing data uses 'business_name' field.
-- The 'title' column is completely unused in the current codebase.
