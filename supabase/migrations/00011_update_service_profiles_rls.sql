-- =====================================================
-- UPDATE RLS POLICIES FOR SERVICE_PROFILES
-- =====================================================

-- Drop old policies (with old table name reference)
DROP POLICY IF EXISTS "professional_profiles_select_all" ON service_profiles;
DROP POLICY IF EXISTS "professional_profiles_insert_authenticated" ON service_profiles;
DROP POLICY IF EXISTS "professional_profiles_update_own" ON service_profiles;
DROP POLICY IF EXISTS "professional_profiles_delete_own" ON service_profiles;

-- Recreate policies with new naming
CREATE POLICY "service_profiles_select_all"
ON service_profiles FOR SELECT
USING (true);

CREATE POLICY "service_profiles_insert_authenticated"
ON service_profiles FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "service_profiles_update_own"
ON service_profiles FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "service_profiles_delete_own"
ON service_profiles FOR DELETE
USING (user_id = auth.uid());

-- Admin can update/delete any profile
CREATE POLICY "service_profiles_update_admin"
ON service_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.admin_role IN ('admin', 'super_admin', 'moderator')
  )
);

CREATE POLICY "service_profiles_delete_admin"
ON service_profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.admin_role IN ('admin', 'super_admin', 'moderator')
  )
);
