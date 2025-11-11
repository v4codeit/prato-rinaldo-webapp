-- =====================================================
-- Migration: Fix Service Profiles Schema Completo
-- =====================================================
-- Risolve problemi critici in service_profiles e reviews
-- - Aggiunge colonne mancanti (business_name, services[], certifications[], logo_url, portfolio_images)
-- - Fix reviews: rinomina professional_profile_id → service_profile_id
-- - Aggiunge tenant_id e constraint UNIQUE a reviews
-- - Crea storage buckets per loghi e portfolio
-- - Aggiunge indici ottimizzati per performance

-- STEP 1: Aggiungere colonne mancanti a service_profiles
ALTER TABLE service_profiles
  ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_images JSONB DEFAULT '[]';

-- STEP 2: Migrare dati esistenti (se necessario)
-- Se c'era campo 'title', copiarlo in business_name
UPDATE service_profiles
SET business_name = title
WHERE business_name IS NULL AND title IS NOT NULL;

-- STEP 3: Fix tabella reviews
-- Rinominare colonna (se esiste)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reviews' AND column_name = 'professional_profile_id'
    ) THEN
        ALTER TABLE reviews RENAME COLUMN professional_profile_id TO service_profile_id;
    END IF;
END $$;

-- Aggiungere tenant_id
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Popolare tenant_id da service_profiles (se dati esistono)
UPDATE reviews r
SET tenant_id = sp.tenant_id
FROM service_profiles sp
WHERE r.service_profile_id = sp.id AND r.tenant_id IS NULL;

-- Rendere tenant_id NOT NULL dopo popolamento
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reviews' AND column_name = 'tenant_id' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE reviews ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
END $$;

-- Aggiungere constraint unique (se non esiste)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'reviews_unique_per_user_service'
    ) THEN
        ALTER TABLE reviews
          ADD CONSTRAINT reviews_unique_per_user_service
          UNIQUE (service_profile_id, reviewer_id);
    END IF;
END $$;

-- STEP 4: Aggiornare indici
DROP INDEX IF EXISTS idx_reviews_profile;
CREATE INDEX IF NOT EXISTS idx_reviews_service_profile ON reviews(service_profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tenant ON reviews(tenant_id);

-- Indice per ricerca fulltext
CREATE INDEX IF NOT EXISTS idx_service_profiles_search
  ON service_profiles USING gin(to_tsvector('italian',
    coalesce(business_name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(category, '')
  ));

-- Indice per filtri comuni
CREATE INDEX IF NOT EXISTS idx_service_profiles_filters
  ON service_profiles(tenant_id, profile_type, category, status);

-- STEP 5: Storage buckets per loghi e portfolio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('service-logos', 'service-logos', true, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('service-portfolio', 'service-portfolio', true, 10485760,
   ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- STEP 6: RLS policies per storage

-- Service logos - Upload owner
DROP POLICY IF EXISTS "Service logo upload own" ON storage.objects;
CREATE POLICY "Service logo upload own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Service logo update own" ON storage.objects;
CREATE POLICY "Service logo update own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Service logo delete own" ON storage.objects;
CREATE POLICY "Service logo delete own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Service logo read public" ON storage.objects;
CREATE POLICY "Service logo read public"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-logos');

-- Service portfolio - Upload owner
DROP POLICY IF EXISTS "Service portfolio upload own" ON storage.objects;
CREATE POLICY "Service portfolio upload own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Service portfolio update own" ON storage.objects;
CREATE POLICY "Service portfolio update own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Service portfolio delete own" ON storage.objects;
CREATE POLICY "Service portfolio delete own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Service portfolio read public" ON storage.objects;
CREATE POLICY "Service portfolio read public"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-portfolio');

-- STEP 7: Commenti per documentazione
COMMENT ON COLUMN service_profiles.business_name IS 'Nome attività professionale o nome professionista';
COMMENT ON COLUMN service_profiles.services IS 'Array servizi offerti dal professionista';
COMMENT ON COLUMN service_profiles.certifications IS 'Array certificazioni e qualifiche';
COMMENT ON COLUMN service_profiles.logo_url IS 'URL logo professionale da storage bucket';
COMMENT ON COLUMN service_profiles.portfolio_images IS 'Array JSON di URL immagini portfolio (max 6)';
COMMENT ON COLUMN service_profiles.address IS 'Indirizzo studio/attività professionale';

COMMENT ON COLUMN reviews.tenant_id IS 'Riferimento al tenant per multi-tenancy';
COMMENT ON COLUMN reviews.service_profile_id IS 'Riferimento al profilo professionale/volontario';
