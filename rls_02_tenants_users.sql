-- Tenants policies
CREATE POLICY "Tenants are viewable by everyone"
  ON tenants FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only super_admin can modify tenants"
  ON tenants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Users policies
CREATE POLICY "Users can view verified users in same tenant"
  ON users FOR SELECT
  USING (
    tenant_id = auth.get_user_tenant_id()
    AND verification_status = 'approved'
  );

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    auth.is_admin()
    AND tenant_id = auth.get_user_tenant_id()
  );

