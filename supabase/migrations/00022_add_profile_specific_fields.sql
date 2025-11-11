-- Migration: Add Profile-Specific Fields for Volunteers and Professionals
-- Description: Add columns for volunteer-specific (availability_hours) and professional-specific (vat_number, hourly_rate) fields
-- Created: 2025-01-05

-- Add columns for professionals
ALTER TABLE service_profiles
ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);

-- Add column for volunteers
ALTER TABLE service_profiles
ADD COLUMN IF NOT EXISTS availability_hours INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN service_profiles.vat_number IS 'Partita IVA (solo professionisti) - formato: IT + 11 cifre';
COMMENT ON COLUMN service_profiles.hourly_rate IS 'Tariffa oraria in euro (solo professionisti)';
COMMENT ON COLUMN service_profiles.availability_hours IS 'Ore settimanali disponibili per volontariato (solo volontari) - range: 1-168';

-- Add constraints
ALTER TABLE service_profiles
ADD CONSTRAINT check_hourly_rate_positive CHECK (hourly_rate IS NULL OR hourly_rate > 0);

ALTER TABLE service_profiles
ADD CONSTRAINT check_availability_hours_range CHECK (availability_hours IS NULL OR (availability_hours >= 1 AND availability_hours <= 168));

-- Add indexes for filtering by hourly_rate (useful for price-based searches)
CREATE INDEX IF NOT EXISTS idx_service_profiles_hourly_rate ON service_profiles(hourly_rate) WHERE hourly_rate IS NOT NULL;
