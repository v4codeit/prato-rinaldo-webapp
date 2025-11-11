-- =====================================================
-- Migration: Fix Announcements Schema Conflict
-- Description: Drop old announcements table and recreate with new schema + tenant support
-- =====================================================

-- Step 1: Drop conflicting RLS policies from old schema
DROP POLICY IF EXISTS "announcements_select_all" ON announcements;
DROP POLICY IF EXISTS "announcements_admin_all" ON announcements;

-- Step 2: Drop existing announcements table completely
DROP TABLE IF EXISTS announcements CASCADE;

-- Step 3: Create new announcements table with tenant support
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  link TEXT,
  is_active BOOLEAN DEFAULT false NOT NULL,
  priority INTEGER DEFAULT 0 NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_announcements_tenant_active ON announcements(tenant_id, is_active, priority DESC);
CREATE INDEX idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX idx_announcements_created_by ON announcements(created_by);

-- Step 5: Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies with tenant awareness

-- Policy 1: Users can read active announcements from their tenant
CREATE POLICY "Users can read active announcements from their tenant"
  ON announcements FOR SELECT
  USING (
    tenant_id = get_user_tenant_id()
    AND is_active = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

-- Policy 2: Admins can read all announcements from their tenant
CREATE POLICY "Admins can read all announcements from their tenant"
  ON announcements FOR SELECT
  USING (
    is_admin()
    AND tenant_id = get_user_tenant_id()
  );

-- Policy 3: Admins can insert announcements in their tenant
CREATE POLICY "Admins can insert announcements in their tenant"
  ON announcements FOR INSERT
  WITH CHECK (
    is_admin()
    AND tenant_id = get_user_tenant_id()
  );

-- Policy 4: Admins can update announcements in their tenant
CREATE POLICY "Admins can update announcements in their tenant"
  ON announcements FOR UPDATE
  USING (
    is_admin()
    AND tenant_id = get_user_tenant_id()
  )
  WITH CHECK (
    is_admin()
    AND tenant_id = get_user_tenant_id()
  );

-- Policy 5: Admins can delete announcements in their tenant
CREATE POLICY "Admins can delete announcements in their tenant"
  ON announcements FOR DELETE
  USING (
    is_admin()
    AND tenant_id = get_user_tenant_id()
  );

-- Step 7: Create trigger for automatic updated_at update
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Add helpful comments
COMMENT ON TABLE announcements IS 'Tenant-specific announcements/banners displayed to users';
COMMENT ON COLUMN announcements.tenant_id IS 'Tenant that owns this announcement';
COMMENT ON COLUMN announcements.is_active IS 'Whether the announcement is currently active';
COMMENT ON COLUMN announcements.priority IS 'Higher priority announcements are displayed first';
COMMENT ON COLUMN announcements.start_date IS 'Optional: announcement becomes visible after this date';
COMMENT ON COLUMN announcements.end_date IS 'Optional: announcement becomes hidden after this date';
