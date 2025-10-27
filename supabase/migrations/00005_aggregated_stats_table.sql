-- =====================================================
-- AGGREGATED STATS TABLE
-- Pre-calculated dashboard statistics for performance
-- =====================================================

CREATE TABLE aggregated_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stat_key TEXT NOT NULL,
  stat_value BIGINT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(tenant_id, stat_key)
);

-- Index for fast lookups by tenant and key
CREATE INDEX idx_aggregated_stats_tenant ON aggregated_stats(tenant_id);
CREATE INDEX idx_aggregated_stats_key ON aggregated_stats(tenant_id, stat_key);
CREATE INDEX idx_aggregated_stats_updated ON aggregated_stats(updated_at DESC);

-- Enable RLS
ALTER TABLE aggregated_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read all stats for their tenant
CREATE POLICY "Admins can read aggregated stats" ON aggregated_stats
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Policy: Service role can insert/update stats (for Edge Function)
CREATE POLICY "Service role can manage stats" ON aggregated_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE aggregated_stats IS 'Pre-calculated dashboard statistics updated periodically by Edge Function';
COMMENT ON COLUMN aggregated_stats.stat_key IS 'Unique identifier for the statistic (e.g., total_users, events_this_month)';
COMMENT ON COLUMN aggregated_stats.stat_value IS 'Calculated numeric value';
COMMENT ON COLUMN aggregated_stats.metadata IS 'Additional context like date ranges, filters applied, etc.';
