-- Helper functions for RLS policies (in public schema)

-- Get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS TEXT AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is admin/moderator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (role IN ('admin', 'super_admin') OR admin_role IS NOT NULL)
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is verified
CREATE OR REPLACE FUNCTION public.is_verified()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND verification_status = 'approved'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

