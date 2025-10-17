-- Helper functions for RLS policies

-- Get current user's tenant_id
CREATE OR REPLACE FUNCTION auth.get_user_tenant_id()
RETURNS TEXT AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE;

-- Check if user is admin/moderator
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (role IN ('admin', 'super_admin') OR admin_role IS NOT NULL)
  );
$$ LANGUAGE SQL STABLE;

-- Check if user is verified
CREATE OR REPLACE FUNCTION auth.is_verified()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND verification_status = 'approved'
  );
$$ LANGUAGE SQL STABLE;

