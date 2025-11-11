-- =====================================================
-- AUTH TRIGGER & ADMIN FUNCTIONS
-- =====================================================
-- This migration adds:
-- 1. Trigger to automatically create user profile on auth.users insert
-- 2. Function to promote user to super_admin via SQL
-- =====================================================

-- =====================================================
-- FUNCTION: handle_new_user()
-- =====================================================
-- Creates user profile in public.users when auth.users record is created
-- Supports: email/password, OAuth, Magic Link authentication

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_tenant_id UUID := '00000000-0000-0000-0000-000000000001'; -- Prato Rinaldo
  user_name TEXT;
BEGIN
  -- Extract name from metadata or derive from email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Insert user profile
  INSERT INTO public.users (
    id,
    tenant_id,
    name,
    email,
    role,
    verification_status,
    onboarding_completed,
    onboarding_step,
    created_at,
    updated_at,
    last_signed_in
  ) VALUES (
    NEW.id,
    default_tenant_id,
    user_name,
    NEW.email,
    'user',
    'pending',
    false,
    0,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.handle_new_user IS
'Automatically creates user profile in public.users when a new user registers via auth.users';

-- =====================================================
-- TRIGGER: on_auth_user_created
-- =====================================================
-- Fires after INSERT on auth.users to create profile

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNCTION: promote_to_super_admin()
-- =====================================================
-- Promotes a user to super_admin role
-- Usage: SELECT promote_to_super_admin('user-uuid-here');

DROP FUNCTION IF EXISTS public.promote_to_super_admin(UUID);

CREATE OR REPLACE FUNCTION public.promote_to_super_admin(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Update user role and admin role
  UPDATE public.users
  SET
    role = 'super_admin',
    admin_role = 'super_admin',
    verification_status = 'approved',
    updated_at = NOW()
  WHERE id = user_uuid;

  -- Raise error if user not found
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found with ID: %', user_uuid;
  END IF;

  -- Log success
  RAISE NOTICE 'User % promoted to super_admin', user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.promote_to_super_admin IS
'Promotes a user to super_admin role by user ID. Usage: SELECT promote_to_super_admin(''uuid-here'')';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Ensure trigger function can access auth schema
GRANT USAGE ON SCHEMA auth TO postgres, service_role;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify trigger exists:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';
