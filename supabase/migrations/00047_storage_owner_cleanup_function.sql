-- =====================================================
-- STORAGE OWNER CLEANUP FOR USER DELETION
-- Migration: 00047_storage_owner_cleanup_function.sql
-- =====================================================
-- The storage.objects table has FK `objects_owner_fkey`
-- referencing auth.users(id) WITHOUT ON DELETE CASCADE.
-- This blocks user deletion if any storage files exist.
--
-- This function nullifies storage.objects.owner for a
-- given user, removing the FK constraint that blocks
-- auth.users deletion. Called as a safety net AFTER
-- Storage API cleanup in deleteUser().
-- =====================================================

CREATE OR REPLACE FUNCTION public.clear_storage_objects_owner(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE storage.objects
  SET owner = NULL
  WHERE owner = target_user_id;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$;

-- Only allow service_role to call this function
REVOKE ALL ON FUNCTION public.clear_storage_objects_owner(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clear_storage_objects_owner(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.clear_storage_objects_owner(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.clear_storage_objects_owner(UUID) TO service_role;

COMMENT ON FUNCTION public.clear_storage_objects_owner IS
'Safety net for user deletion. Sets storage.objects.owner to NULL for all objects
owned by the target user, removing the FK constraint that blocks auth.users deletion.
Must be called with service_role (admin client) only.';
