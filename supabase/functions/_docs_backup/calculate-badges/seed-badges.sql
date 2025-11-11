-- Seed badges for the Prato Rinaldo platform
-- Run this before deploying the calculate-badges function
-- This ensures all required badges exist in the database

-- Prerequisites:
-- 1. Run migration-add-badge-slug.sql first to add slug and category columns
-- 2. Replace 'YOUR_TENANT_ID' with your actual tenant ID

-- Note: If slug column doesn't exist yet, remove slug and category from INSERT statements

-- Benvenuto Badge (Onboarding Completion)
INSERT INTO badges (id, tenant_id, name, slug, description, icon, points, category, created_at)
VALUES (
  gen_random_uuid()::TEXT,
  'YOUR_TENANT_ID',
  'Benvenuto',
  'benvenuto',
  'Hai completato l''onboarding e sei ufficialmente parte della comunità!',
  'user-check',
  10,
  'onboarding',
  NOW()
)
ON CONFLICT (tenant_id, slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  points = EXCLUDED.points,
  category = EXCLUDED.category;

-- Primo Post Badge (First Forum Post)
INSERT INTO badges (id, tenant_id, name, slug, description, icon, points, category, created_at)
VALUES (
  gen_random_uuid()::TEXT,
  'YOUR_TENANT_ID',
  'Primo Post',
  'primo-post',
  'Hai pubblicato il tuo primo post nel forum. Benvenuto nella conversazione!',
  'message-circle',
  20,
  'engagement',
  NOW()
)
ON CONFLICT (tenant_id, slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  points = EXCLUDED.points,
  category = EXCLUDED.category;

-- Partecipante Attivo Badge (5+ Event Attendances)
INSERT INTO badges (id, tenant_id, name, slug, description, icon, points, category, created_at)
VALUES (
  gen_random_uuid()::TEXT,
  'YOUR_TENANT_ID',
  'Partecipante Attivo',
  'partecipante-attivo',
  'Hai partecipato a 5 o più eventi della comunità. Sei un membro molto attivo!',
  'calendar-check',
  50,
  'events',
  NOW()
)
ON CONFLICT (tenant_id, slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  points = EXCLUDED.points,
  category = EXCLUDED.category;

-- Venditore Badge (Marketplace Sale)
INSERT INTO badges (id, tenant_id, name, slug, description, icon, points, category, created_at)
VALUES (
  gen_random_uuid()::TEXT,
  'YOUR_TENANT_ID',
  'Venditore',
  'venditore',
  'Hai venduto con successo un articolo nel marketplace. Ottimo lavoro!',
  'shopping-bag',
  30,
  'marketplace',
  NOW()
)
ON CONFLICT (tenant_id, slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  points = EXCLUDED.points,
  category = EXCLUDED.category;

-- Volontario Badge (Volunteer Services)
INSERT INTO badges (id, tenant_id, name, slug, description, icon, points, category, created_at)
VALUES (
  gen_random_uuid()::TEXT,
  'YOUR_TENANT_ID',
  'Volontario',
  'volontario',
  'Hai offerto i tuoi servizi come volontario per aiutare la comunità. Grazie!',
  'heart',
  100,
  'community',
  NOW()
)
ON CONFLICT (tenant_id, slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  points = EXCLUDED.points,
  category = EXCLUDED.category;

-- Contributore Badge (Committee Donation)
INSERT INTO badges (id, tenant_id, name, slug, description, icon, points, category, created_at)
VALUES (
  gen_random_uuid()::TEXT,
  'YOUR_TENANT_ID',
  'Contributore',
  'contributore',
  'Hai contribuito finanziariamente al comitato tramite una donazione. Grazie per il supporto!',
  'gift',
  75,
  'community',
  NOW()
)
ON CONFLICT (tenant_id, slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  points = EXCLUDED.points,
  category = EXCLUDED.category;

-- Verify badges were inserted
SELECT
  name,
  slug,
  points,
  category,
  description
FROM badges
WHERE slug IN (
  'benvenuto',
  'primo-post',
  'partecipante-attivo',
  'venditore',
  'volontario',
  'contributore'
)
ORDER BY points DESC;
