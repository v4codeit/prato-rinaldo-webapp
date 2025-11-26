-- =====================================================
-- TOPICS SYSTEM - Seed Default Topic
-- Migration: 00031_topics_seed.sql
-- =====================================================

-- Create "Bacheca Annunci" default topic
-- This topic is visible to everyone but only admins can write
INSERT INTO topics (
  tenant_id,
  name,
  slug,
  description,
  icon,
  color,
  visibility,
  write_permission,
  is_default,
  order_index,
  created_by
)
SELECT
  t.id,
  'Bacheca Annunci',
  'bacheca-annunci',
  'Comunicazioni ufficiali dal Consorzio Prato Rinaldo. Solo il board del consorzio puo pubblicare qui.',
  '📢',
  '#dc2626',  -- Red color for important announcements
  'public'::topic_visibility,
  'admins_only'::topic_write_permission,
  true,
  0,
  u.id
FROM tenants t
CROSS JOIN (
  SELECT id FROM users WHERE role = 'super_admin' LIMIT 1
) u
WHERE t.slug = 'prato-rinaldo'
ON CONFLICT DO NOTHING;

-- Add the super_admin as admin member of the default topic
INSERT INTO topic_members (
  topic_id,
  user_id,
  role,
  is_muted
)
SELECT
  tp.id,
  u.id,
  'admin'::topic_member_role,
  false
FROM topics tp
CROSS JOIN users u
WHERE tp.slug = 'bacheca-annunci'
  AND tp.is_default = true
  AND u.role = 'super_admin'
ON CONFLICT DO NOTHING;

-- Also add all board members (president, vice_president, etc.) as admins
INSERT INTO topic_members (
  topic_id,
  user_id,
  role,
  is_muted,
  added_by
)
SELECT
  tp.id,
  u.id,
  'admin'::topic_member_role,
  false,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM topics tp
CROSS JOIN users u
WHERE tp.slug = 'bacheca-annunci'
  AND tp.is_default = true
  AND u.committee_role IS NOT NULL
  AND u.committee_role IN ('president', 'vice_president', 'secretary', 'treasurer', 'board_member')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE topics IS 'Default topic "Bacheca Annunci" created for official communications';
