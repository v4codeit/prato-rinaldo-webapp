-- Tabella per impostazioni generali del sito
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- chiave setting (es. 'social_facebook')
  value TEXT, -- valore setting
  category TEXT NOT NULL, -- categoria (es. 'social', 'general')
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

-- Indici
CREATE INDEX idx_site_settings_category ON site_settings(category);
CREATE UNIQUE INDEX idx_site_settings_key ON site_settings(key);

-- RLS Policies
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Tutti possono leggere
CREATE POLICY "Anyone can read site settings"
  ON site_settings FOR SELECT
  USING (true);

-- Solo admin possono modificare
CREATE POLICY "Admins can update site settings"
  ON site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Trigger per updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed dati iniziali per social links
INSERT INTO site_settings (key, value, category, description) VALUES
  ('social_facebook', '', 'social', 'URL pagina Facebook'),
  ('social_instagram', '', 'social', 'URL profilo Instagram'),
  ('social_youtube', '', 'social', 'URL canale YouTube'),
  ('social_tiktok', '', 'social', 'URL profilo TikTok')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE site_settings IS 'Impostazioni configurabili del sito';
