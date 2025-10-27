-- =====================================================
-- RENAME PROFESSIONAL_PROFILES TO SERVICE_PROFILES
-- =====================================================
-- This migration refactors the professional profiles system
-- to support both professionals and volunteers under a unified
-- "Community Pro" section.

-- Create ENUM for service profile type
CREATE TYPE service_profile_type AS ENUM ('volunteer', 'professional');

-- Rinomina tabella
ALTER TABLE professional_profiles RENAME TO service_profiles;

-- Aggiungi campo tipo profilo
ALTER TABLE service_profiles
ADD COLUMN profile_type service_profile_type DEFAULT 'professional' NOT NULL;

-- Rinomina campo hourly_rate per chiarezza (se esiste)
-- (può essere tariffa oraria per professionisti o rimborso per volontari)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='service_profiles' AND column_name='hourly_rate') THEN
        ALTER TABLE service_profiles RENAME COLUMN hourly_rate TO rate_or_reimbursement;
        COMMENT ON COLUMN service_profiles.rate_or_reimbursement IS
        'Hourly rate for professionals, reimbursement cost for volunteers (e.g. fuel reimbursement)';
    END IF;
END $$;

-- Rinomina indici esistenti (se esistono)
ALTER INDEX IF EXISTS idx_professional_profiles_tenant RENAME TO idx_service_profiles_tenant;
ALTER INDEX IF EXISTS idx_professional_profiles_user RENAME TO idx_service_profiles_user;

-- Crea indice per profile_type (per query filtrate)
CREATE INDEX IF NOT EXISTS idx_service_profiles_type ON service_profiles(tenant_id, profile_type);

-- =====================================================
-- AGGIORNA MODERATION_ITEM_TYPE ENUM
-- =====================================================

-- Crea nuovo enum con valore aggiornato
CREATE TYPE moderation_item_type_updated AS ENUM (
  'marketplace',
  'service_profile',  -- Rinominato da 'professional_profile'
  'proposal',
  'proposal_comment',
  'tutorial_request'
);

-- Aggiorna colonna moderation_queue
ALTER TABLE moderation_queue
  ALTER COLUMN item_type TYPE moderation_item_type_updated
  USING item_type::text::moderation_item_type_updated;

-- Elimina vecchio enum
DROP TYPE moderation_item_type;

-- Rinomina nuovo enum
ALTER TYPE moderation_item_type_updated RENAME TO moderation_item_type;
