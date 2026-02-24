-- ============================================================================
-- MERCATINO FIELDS - Nuove colonne per marketplace_items
-- ============================================================================
-- Questa migrazione aggiunge:
-- - Colonne per tipologia annuncio
-- - Campi immobiliari (mq, locali, piano, etc.)
-- - Metodi di contatto (JSON array)
-- - Campi donazione
-- - Contatore visualizzazioni
-- ============================================================================

-- ============================================================================
-- 1. COLONNE TIPOLOGIA ANNUNCIO
-- ============================================================================

-- Tipo principale (immobile/oggetto)
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS listing_type mercatino_listing_type NOT NULL DEFAULT 'objects';

-- Sottotipo immobili (affitto/vendita) - nullable, solo se listing_type = 'real_estate'
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS real_estate_type mercatino_real_estate_type;

-- Sottotipo oggetti (vendita/regalo) - default 'sale'
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS object_type mercatino_object_type DEFAULT 'sale';

-- ============================================================================
-- 2. CAMPI IMMOBILIARI (nullable, solo per immobili)
-- ============================================================================

-- Metri quadrati
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS square_meters INT;

-- Numero locali/stanze
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS rooms INT;

-- Piano dell'immobile
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS floor INT;

-- Presenza ascensore
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS has_elevator BOOLEAN;

-- Presenza garage/posto auto
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS has_garage BOOLEAN;

-- Anno di costruzione
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS construction_year INT;

-- Zona/via (senza numero civico per privacy)
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS address_zone VARCHAR(255);

-- ============================================================================
-- 3. METODI DI CONTATTO
-- ============================================================================

-- JSON array con metodi di contatto abilitati
-- Format: [{"type": "whatsapp", "value": "+39...", "enabled": true}, ...]
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS contact_methods JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- 4. CAMPI DONAZIONE
-- ============================================================================

-- Flag se l'utente ha donato per questo annuncio
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS has_donated BOOLEAN DEFAULT false;

-- Importo donazione in centesimi (0 = nessuna donazione)
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS donation_amount INT DEFAULT 0;

-- Timestamp donazione
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS donated_at TIMESTAMPTZ;

-- ============================================================================
-- 5. STATISTICHE
-- ============================================================================

-- Contatore visualizzazioni uniche (aggiornato via trigger dalla tabella mercatino_views)
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- ============================================================================
-- 6. CONSTRAINT E CHECK
-- ============================================================================

-- Check: se listing_type = 'real_estate', real_estate_type deve essere valorizzato
-- (non possiamo usare ALTER TABLE ADD CONSTRAINT IF NOT EXISTS, quindi usiamo DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_real_estate_type_required'
  ) THEN
    ALTER TABLE marketplace_items
    ADD CONSTRAINT chk_real_estate_type_required
    CHECK (
      listing_type != 'real_estate' OR real_estate_type IS NOT NULL
    );
  END IF;
END$$;

-- Check: square_meters deve essere positivo se valorizzato
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_square_meters_positive'
  ) THEN
    ALTER TABLE marketplace_items
    ADD CONSTRAINT chk_square_meters_positive
    CHECK (square_meters IS NULL OR square_meters > 0);
  END IF;
END$$;

-- Check: rooms deve essere positivo se valorizzato
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_rooms_positive'
  ) THEN
    ALTER TABLE marketplace_items
    ADD CONSTRAINT chk_rooms_positive
    CHECK (rooms IS NULL OR rooms > 0);
  END IF;
END$$;

-- Check: donation_amount non può essere negativo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_donation_amount_non_negative'
  ) THEN
    ALTER TABLE marketplace_items
    ADD CONSTRAINT chk_donation_amount_non_negative
    CHECK (donation_amount >= 0);
  END IF;
END$$;

-- Check: construction_year ragionevole (1800-2100)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_construction_year_range'
  ) THEN
    ALTER TABLE marketplace_items
    ADD CONSTRAINT chk_construction_year_range
    CHECK (construction_year IS NULL OR (construction_year >= 1800 AND construction_year <= 2100));
  END IF;
END$$;

-- ============================================================================
-- 7. INDICI PER PERFORMANCE
-- ============================================================================

-- Indice per filtrare per tipo di annuncio
CREATE INDEX IF NOT EXISTS idx_marketplace_listing_type
ON marketplace_items(tenant_id, listing_type, status)
WHERE status = 'approved' AND is_sold = false;

-- Indice per immobili in affitto
CREATE INDEX IF NOT EXISTS idx_marketplace_real_estate_rent
ON marketplace_items(tenant_id, real_estate_type, status)
WHERE listing_type = 'real_estate' AND real_estate_type = 'rent' AND status = 'approved';

-- Indice per immobili in vendita
CREATE INDEX IF NOT EXISTS idx_marketplace_real_estate_sale
ON marketplace_items(tenant_id, real_estate_type, status)
WHERE listing_type = 'real_estate' AND real_estate_type = 'sale' AND status = 'approved';

-- Indice per oggetti regalo
CREATE INDEX IF NOT EXISTS idx_marketplace_objects_gift
ON marketplace_items(tenant_id, object_type, status)
WHERE listing_type = 'objects' AND object_type = 'gift' AND status = 'approved';

-- Indice per annunci con donazione (badge "Supporta il Comitato")
CREATE INDEX IF NOT EXISTS idx_marketplace_has_donated
ON marketplace_items(tenant_id, has_donated, status)
WHERE has_donated = true AND status = 'approved';

-- ============================================================================
-- 8. COMMENTI DOCUMENTAZIONE
-- ============================================================================

COMMENT ON COLUMN marketplace_items.listing_type IS 'Tipo principale: real_estate (immobili) o objects (oggetti)';
COMMENT ON COLUMN marketplace_items.real_estate_type IS 'Sottotipo immobili: rent (affitto) o sale (vendita). Obbligatorio se listing_type=real_estate';
COMMENT ON COLUMN marketplace_items.object_type IS 'Sottotipo oggetti: sale (vendita) o gift (regalo)';
COMMENT ON COLUMN marketplace_items.square_meters IS 'Metri quadrati (solo immobili)';
COMMENT ON COLUMN marketplace_items.rooms IS 'Numero locali/stanze (solo immobili)';
COMMENT ON COLUMN marketplace_items.floor IS 'Piano (solo immobili)';
COMMENT ON COLUMN marketplace_items.has_elevator IS 'Presenza ascensore (solo immobili)';
COMMENT ON COLUMN marketplace_items.has_garage IS 'Presenza garage/posto auto (solo immobili)';
COMMENT ON COLUMN marketplace_items.construction_year IS 'Anno costruzione (solo immobili)';
COMMENT ON COLUMN marketplace_items.address_zone IS 'Zona/via senza civico per privacy';
COMMENT ON COLUMN marketplace_items.contact_methods IS 'JSON array metodi contatto: [{type, value, enabled}]';
COMMENT ON COLUMN marketplace_items.has_donated IS 'True se utente ha donato per questo annuncio';
COMMENT ON COLUMN marketplace_items.donation_amount IS 'Importo donazione in centesimi';
COMMENT ON COLUMN marketplace_items.donated_at IS 'Timestamp donazione';
COMMENT ON COLUMN marketplace_items.view_count IS 'Visualizzazioni uniche (aggiornato via trigger)';
