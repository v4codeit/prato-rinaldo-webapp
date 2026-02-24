-- ============================================================================
-- MERCATINO VIEWS - Tabella tracking visualizzazioni uniche
-- ============================================================================
-- Questa migrazione crea:
-- - Tabella mercatino_views per tracking visite
-- - Trigger per aggiornamento automatico view_count
-- - RLS policies per sicurezza
-- ============================================================================

-- ============================================================================
-- 1. TABELLA MERCATINO_VIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS mercatino_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Riferimento all'annuncio
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,

  -- Fingerprint browser (hash SHA-256 troncato)
  -- Generato client-side con FingerprintJS
  visitor_fingerprint VARCHAR(64) NOT NULL,

  -- User ID se loggato (nullable per visitatori anonimi)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- IP parziale per analytics (solo primi 3 ottetti per privacy: 192.168.1.xxx)
  ip_partial VARCHAR(20),

  -- User agent per debug/analytics
  user_agent VARCHAR(500),

  -- Timestamp visualizzazione
  viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraint: una sola visualizzazione per fingerprint + item
  CONSTRAINT unique_view_per_fingerprint UNIQUE(item_id, visitor_fingerprint)
);

-- ============================================================================
-- 2. INDICI
-- ============================================================================

-- Indice per lookup rapido per item
CREATE INDEX IF NOT EXISTS idx_mercatino_views_item
ON mercatino_views(item_id);

-- Indice per analytics per utente
CREATE INDEX IF NOT EXISTS idx_mercatino_views_user
ON mercatino_views(user_id)
WHERE user_id IS NOT NULL;

-- Indice per analytics temporali
CREATE INDEX IF NOT EXISTS idx_mercatino_views_date
ON mercatino_views(viewed_at DESC);

-- ============================================================================
-- 3. TRIGGER PER AGGIORNAMENTO view_count
-- ============================================================================

-- Funzione trigger per aggiornare il contatore
CREATE OR REPLACE FUNCTION update_mercatino_view_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna il contatore nell'item
  UPDATE marketplace_items
  SET view_count = (
    SELECT COUNT(*)
    FROM mercatino_views
    WHERE item_id = NEW.item_id
  )
  WHERE id = NEW.item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dopo INSERT
DROP TRIGGER IF EXISTS trigger_update_mercatino_view_count ON mercatino_views;
CREATE TRIGGER trigger_update_mercatino_view_count
AFTER INSERT ON mercatino_views
FOR EACH ROW
EXECUTE FUNCTION update_mercatino_view_count();

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- Abilita RLS
ALTER TABLE mercatino_views ENABLE ROW LEVEL SECURITY;

-- Policy: Chiunque può inserire una visualizzazione (anche anonimi via API)
-- Nota: L'inserimento avviene tramite server action, non direttamente dal client
CREATE POLICY mercatino_views_insert_all
ON mercatino_views
FOR INSERT
WITH CHECK (true);

-- Policy: Solo admin possono vedere le visualizzazioni (per analytics)
CREATE POLICY mercatino_views_select_admin
ON mercatino_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role IN ('admin', 'super_admin') OR users.admin_role IS NOT NULL)
  )
);

-- Policy: Proprietario annuncio può vedere le proprie visualizzazioni
CREATE POLICY mercatino_views_select_owner
ON mercatino_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM marketplace_items
    WHERE marketplace_items.id = mercatino_views.item_id
    AND marketplace_items.seller_id = auth.uid()
  )
);

-- Policy: Nessuno può modificare o eliminare (immutabile)
-- Le visualizzazioni sono log immutabili

-- ============================================================================
-- 5. FUNZIONE HELPER PER REGISTRARE VISUALIZZAZIONE
-- ============================================================================

-- Funzione RPC per registrare una visualizzazione in modo sicuro
-- Gestisce automaticamente i duplicati grazie al constraint UNIQUE
CREATE OR REPLACE FUNCTION register_mercatino_view(
  p_item_id UUID,
  p_fingerprint VARCHAR(64),
  p_user_id UUID DEFAULT NULL,
  p_ip_partial VARCHAR(20) DEFAULT NULL,
  p_user_agent VARCHAR(500) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_inserted BOOLEAN := false;
BEGIN
  -- Inserisce solo se non esiste già (ON CONFLICT DO NOTHING)
  INSERT INTO mercatino_views (
    item_id,
    visitor_fingerprint,
    user_id,
    ip_partial,
    user_agent
  )
  VALUES (
    p_item_id,
    p_fingerprint,
    p_user_id,
    p_ip_partial,
    p_user_agent
  )
  ON CONFLICT (item_id, visitor_fingerprint) DO NOTHING;

  -- Controlla se è stato inserito
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN v_inserted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute alla funzione
GRANT EXECUTE ON FUNCTION register_mercatino_view TO authenticated;
GRANT EXECUTE ON FUNCTION register_mercatino_view TO anon;

-- ============================================================================
-- 6. COMMENTI DOCUMENTAZIONE
-- ============================================================================

COMMENT ON TABLE mercatino_views IS 'Tracking visualizzazioni uniche per annunci Mercatino. Una sola entry per fingerprint+item.';
COMMENT ON COLUMN mercatino_views.visitor_fingerprint IS 'Hash fingerprint browser generato con FingerprintJS';
COMMENT ON COLUMN mercatino_views.user_id IS 'User ID se loggato, NULL per anonimi';
COMMENT ON COLUMN mercatino_views.ip_partial IS 'IP parziale (primi 3 ottetti) per analytics, privacy-friendly';
COMMENT ON FUNCTION register_mercatino_view IS 'Registra visualizzazione unica. Ritorna TRUE se nuova, FALSE se duplicata.';
