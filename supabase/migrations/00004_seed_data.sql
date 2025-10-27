-- =====================================================
-- SEED DATA FOR DEVELOPMENT
-- =====================================================

-- Create default tenant (Prato Rinaldo)
INSERT INTO tenants (id, name, slug, description, primary_color, secondary_color, is_active, subscription_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Community Prato Rinaldo',
  'prato-rinaldo',
  'Comitato di Quartiere Prato Rinaldo - Una community che unisce San Cesareo e Zagarolo',
  '#0891b2',
  '#f97316',
  true,
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Create default forum categories
INSERT INTO forum_categories (id, tenant_id, name, description, icon, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Annunci Generali', 'Annunci e informazioni importanti dalla community', 'megaphone', 0),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Discussioni', 'Discussioni generali sulla vita del quartiere', 'message-circle', 1),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Eventi', 'Organizzazione e discussione eventi', 'calendar', 2),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'Problemi e Segnalazioni', 'Segnala problemi del quartiere', 'alert-triangle', 3),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'Mercatino', 'Discussioni su compravendita', 'shopping-bag', 4)
ON CONFLICT (id) DO NOTHING;

-- Create default badges
INSERT INTO badges (id, tenant_id, name, description, icon, criteria, points)
VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'Benvenuto', 'Completato l''onboarding', '👋', 'Complete onboarding process', 10),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', 'Primo Post', 'Scritto il primo post nel forum', '✍️', 'Create first forum post', 20),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', 'Partecipante Attivo', 'Partecipato a 3+ eventi', '🎉', 'Attend 3 or more events', 50),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000001', 'Venditore', 'Venduto primo oggetto nel marketplace', '💰', 'Sell first item on marketplace', 30),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000001', 'Volontario', 'Offerto servizio volontario', '🤝', 'Offer volunteer service', 100),
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000001', 'Contributore', 'Donato al comitato tramite marketplace', '🎁', 'Donate to committee via marketplace', 75)
ON CONFLICT (id) DO NOTHING;

-- Note: Users will be created via Supabase Auth sign-up flow
-- The first user that signs up can be promoted to super_admin manually via SQL:
-- UPDATE users SET role = 'super_admin', admin_role = 'super_admin' WHERE email = 'your-email@example.com';

COMMENT ON SCHEMA public IS 'Seed data loaded - Default tenant and forum categories created';
