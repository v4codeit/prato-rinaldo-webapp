-- ============================================================================
-- MERCATINO TYPES - ENUM e tipi per il nuovo sistema Mercatino
-- ============================================================================
-- Questa migrazione aggiunge i nuovi tipi ENUM per supportare:
-- - Tipi di annuncio (Immobili vs Oggetti)
-- - Sottotipi immobiliari (Affitto vs Vendita)
-- - Sottotipi oggetti (Vendita vs Regalo)
-- ============================================================================

-- Tipo principale annuncio (Immobile o Oggetto)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mercatino_listing_type') THEN
    CREATE TYPE mercatino_listing_type AS ENUM (
      'real_estate',   -- Immobili (case, terreni, locali)
      'objects'        -- Oggetti (usati, da regalare)
    );
    RAISE NOTICE 'Created enum type: mercatino_listing_type';
  END IF;
END$$;

-- Sottotipo per immobili
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mercatino_real_estate_type') THEN
    CREATE TYPE mercatino_real_estate_type AS ENUM (
      'rent',          -- Affitto
      'sale'           -- Vendita
    );
    RAISE NOTICE 'Created enum type: mercatino_real_estate_type';
  END IF;
END$$;

-- Sottotipo per oggetti
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mercatino_object_type') THEN
    CREATE TYPE mercatino_object_type AS ENUM (
      'sale',          -- Vendita
      'gift'           -- Regalo
    );
    RAISE NOTICE 'Created enum type: mercatino_object_type';
  END IF;
END$$;

-- Tipo metodo di contatto
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mercatino_contact_method') THEN
    CREATE TYPE mercatino_contact_method AS ENUM (
      'whatsapp',
      'email',
      'telegram',
      'phone'
    );
    RAISE NOTICE 'Created enum type: mercatino_contact_method';
  END IF;
END$$;

-- Commento per documentazione
COMMENT ON TYPE mercatino_listing_type IS 'Tipo principale annuncio Mercatino: real_estate (immobili) o objects (oggetti)';
COMMENT ON TYPE mercatino_real_estate_type IS 'Sottotipo immobili: rent (affitto) o sale (vendita)';
COMMENT ON TYPE mercatino_object_type IS 'Sottotipo oggetti: sale (vendita) o gift (regalo)';
COMMENT ON TYPE mercatino_contact_method IS 'Metodi di contatto disponibili per gli annunci';
