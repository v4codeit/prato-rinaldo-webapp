-- =====================================================
-- SEED DEFAULT PROPOSAL CATEGORIES
-- =====================================================
-- Inserts default categories for the Agorà system.
-- These categories can be customized by admins later.

-- Insert default categories for all existing tenants
INSERT INTO proposal_categories (tenant_id, name, description, icon, color, order_index)
SELECT
  t.id,
  'Eventi e Attività',
  'Proposte per feste di quartiere, tornei sportivi, cineforum, laboratori e altre attività ricreative',
  'Calendar',
  '#f97316', -- Orange (secondary color) - energia ed eventi
  1
FROM tenants t;

INSERT INTO proposal_categories (tenant_id, name, description, icon, color, order_index)
SELECT
  t.id,
  'Migliorie alla Piattaforma',
  'Suggerimenti per nuove funzionalità software, correzioni bug, integrazioni e miglioramenti tecnici',
  'Code',
  '#0891b2', -- Teal (primary color)
  2
FROM tenants t;

INSERT INTO proposal_categories (tenant_id, name, description, icon, color, order_index)
SELECT
  t.id,
  'Servizi per la Comunità',
  'Proposte per servizi condivisi: doposcuola, biblioteca, car pooling, banca del tempo, gruppi d''acquisto',
  'Users',
  '#10b981', -- Green (success color)
  3
FROM tenants t;

INSERT INTO proposal_categories (tenant_id, name, description, icon, color, order_index)
SELECT
  t.id,
  'Infrastrutture Fisiche',
  'Proposte per miglioramenti al quartiere: parco giochi, panchine, illuminazione, piste ciclabili, aree verdi',
  'Wrench',
  '#8b5cf6', -- Purple
  4
FROM tenants t;
