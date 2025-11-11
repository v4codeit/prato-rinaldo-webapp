-- Add representative_name column to service_profiles table
-- This field stores the legal representative name for professionals
-- For volunteers, this field remains NULL (they use business_name for their personal name)

ALTER TABLE service_profiles
ADD COLUMN representative_name TEXT;

-- Add column comment
COMMENT ON COLUMN service_profiles.representative_name IS
  'Nome del rappresentante legale per professionisti. Legato al campo users.name. Per volontari rimane NULL.';

-- Populate existing professional profiles with user names
-- This ensures backward compatibility for existing records
UPDATE service_profiles sp
SET representative_name = u.name
FROM users u
WHERE sp.user_id = u.id
  AND sp.profile_type = 'professional'
  AND sp.representative_name IS NULL;

-- Note: volunteers keep representative_name as NULL
-- because their business_name already contains their personal name
