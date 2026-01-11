-- Sail Inspection System
-- Creates tables for photo-first, AI-guided sail inspections with zone-based condition tracking

-- =============================================================================
-- SAIL EQUIPMENT DETAILS (extends boat_equipment with sail-specific metadata)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sail_equipment_details (
  equipment_id UUID PRIMARY KEY REFERENCES boat_equipment(id) ON DELETE CASCADE,

  -- Sail identity
  sail_number TEXT,
  sailmaker TEXT,
  loft_location TEXT,
  design_name TEXT,

  -- Sail specifications
  material TEXT,
  construction_type TEXT CHECK (construction_type IN ('cross-cut', 'radial', 'tri-radial', 'membrane', 'laminate', 'woven')),
  weight_grams_per_sqm INTEGER,
  area_sqm DECIMAL(6,2),

  -- Battens
  batten_count INTEGER,
  batten_type TEXT CHECK (batten_type IN ('full', 'partial', 'none')),

  -- Usage context
  optimal_wind_range_min INTEGER, -- knots
  optimal_wind_range_max INTEGER, -- knots
  primary_use TEXT CHECK (primary_use IN ('racing', 'cruising', 'training', 'heavy_weather')),

  -- Lifecycle tracking
  estimated_race_hours DECIMAL(7,1) DEFAULT 0,
  estimated_race_hours_remaining INTEGER,
  sailmaker_service_due BOOLEAN DEFAULT false,
  last_professional_inspection DATE,

  -- Class rules compliance
  class_measurement_cert TEXT,
  measurement_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_sail_equipment_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sail_equipment_details_updated_at
  BEFORE UPDATE ON sail_equipment_details
  FOR EACH ROW
  EXECUTE FUNCTION update_sail_equipment_details_updated_at();

-- =============================================================================
-- SAIL INSPECTIONS (core inspection records with zone-based tracking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sail_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES boat_equipment(id) ON DELETE CASCADE,
  sailor_id UUID NOT NULL REFERENCES users(id),
  boat_id UUID NOT NULL REFERENCES sailor_boats(id),

  -- Inspection metadata
  inspection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('quick', 'full', 'pre_race', 'post_race')),
  inspection_mode TEXT NOT NULL DEFAULT 'guided' CHECK (inspection_mode IN ('guided', 'quick')),

  -- Overall assessment
  overall_condition_score INTEGER CHECK (overall_condition_score BETWEEN 0 AND 100),
  race_ready BOOLEAN DEFAULT true,

  -- AI-generated content
  ai_summary TEXT,
  ai_recommendations JSONB DEFAULT '[]',
  -- Structure: [{ priority: 'high'|'medium'|'low', category: string, action: string, reasoning: string }]

  -- Zone-based condition tracking (0-100 scale per zone)
  zone_scores JSONB NOT NULL DEFAULT '{}',
  -- Structure: {
  --   "head": { "score": 85, "issues": [], "photos": ["url1"], "notes": "" },
  --   "leech": { "score": 70, "issues": ["UV damage detected"], "photos": [], "notes": "" },
  --   "foot": { "score": 90, "issues": [], "photos": [], "notes": "" },
  --   "luff": { "score": 95, "issues": [], "photos": [], "notes": "" },
  --   "battens": { "score": 80, "issues": ["Batten pocket wear"], "photos": [], "notes": "" },
  --   "cloth": { "score": 75, "issues": [], "photos": [], "notes": "" }
  -- }

  -- Issue tracking (aggregated from all zones)
  issues_detected JSONB DEFAULT '[]',
  -- Structure: [{ zone, severity, type, description, photo_url, ai_detected, confidence }]

  -- Photo collection (master list of all inspection photos)
  photos JSONB DEFAULT '[]',
  -- Structure: [{ url, zone, timestamp, ai_analyzed }]

  -- User notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_sail_inspections_equipment ON sail_inspections(equipment_id);
CREATE INDEX idx_sail_inspections_sailor ON sail_inspections(sailor_id);
CREATE INDEX idx_sail_inspections_boat ON sail_inspections(boat_id);
CREATE INDEX idx_sail_inspections_date ON sail_inspections(inspection_date DESC);
CREATE INDEX idx_sail_inspections_type ON sail_inspections(inspection_type);

-- Trigger to update updated_at
CREATE TRIGGER sail_inspections_updated_at
  BEFORE UPDATE ON sail_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_sail_equipment_details_updated_at();

-- =============================================================================
-- SAIL INSPECTION PHOTOS (individual photo analysis records)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sail_inspection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES sail_inspections(id) ON DELETE CASCADE,

  -- Photo metadata
  photo_url TEXT NOT NULL,
  photo_storage_path TEXT,
  zone TEXT NOT NULL CHECK (zone IN ('head', 'leech', 'foot', 'luff', 'battens', 'cloth', 'overview', 'detail')),
  capture_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- AI Analysis results
  ai_analysis JSONB,
  -- Structure: {
  --   condition_score: 85,
  --   issues: [{ type, severity, description, location_in_image, confidence }],
  --   recommendations: [],
  --   damage_types_detected: ['UV_fading', 'stitching_wear'],
  --   confidence: 0.92,
  --   processing_time_ms: 450
  -- }
  ai_model_used TEXT,
  analysis_timestamp TIMESTAMPTZ,

  -- User annotations
  user_notes TEXT,
  user_marked_issues JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sail_inspection_photos_inspection ON sail_inspection_photos(inspection_id);
CREATE INDEX idx_sail_inspection_photos_zone ON sail_inspection_photos(zone);

-- =============================================================================
-- RACE EQUIPMENT USAGE (link sails to races)
-- =============================================================================
CREATE TABLE IF NOT EXISTS race_equipment_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES race_events(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES boat_equipment(id) ON DELETE CASCADE,
  sailor_id UUID NOT NULL REFERENCES users(id),

  -- Inspection links
  pre_race_inspection_id UUID REFERENCES sail_inspections(id),
  post_race_inspection_id UUID REFERENCES sail_inspections(id),

  -- Usage tracking
  sail_hours_this_race DECIMAL(5,2),
  wind_conditions_category TEXT CHECK (wind_conditions_category IN ('light', 'medium', 'heavy', 'storm')),

  -- Condition notes
  pre_race_notes TEXT,
  post_race_notes TEXT,
  issues_during_race TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(race_id, equipment_id)
);

CREATE INDEX idx_race_equipment_usage_race ON race_equipment_usage(race_id);
CREATE INDEX idx_race_equipment_usage_equipment ON race_equipment_usage(equipment_id);
CREATE INDEX idx_race_equipment_usage_sailor ON race_equipment_usage(sailor_id);

-- =============================================================================
-- VIEW: Sail inventory with latest inspection health
-- =============================================================================
CREATE OR REPLACE VIEW sail_inventory_with_health AS
SELECT
  be.id,
  be.boat_id,
  be.sailor_id,
  be.custom_name,
  be.category AS sail_type,
  be.subcategory,
  be.serial_number,
  be.purchase_date,
  be.condition,
  be.status,
  be.photos,
  be.specifications,
  be.total_usage_hours,
  be.total_races_used,
  sed.sailmaker,
  sed.sail_number,
  sed.design_name,
  sed.material,
  sed.construction_type,
  sed.area_sqm,
  sed.optimal_wind_range_min,
  sed.optimal_wind_range_max,
  sed.estimated_race_hours,
  sed.estimated_race_hours_remaining,
  sed.primary_use,
  latest_inspection.id AS last_inspection_id,
  latest_inspection.overall_condition_score AS last_inspection_score,
  latest_inspection.inspection_date AS last_inspection_date,
  latest_inspection.race_ready AS last_inspection_race_ready,
  latest_inspection.ai_recommendations,
  latest_inspection.issues_detected,
  CASE
    WHEN latest_inspection.overall_condition_score >= 80 THEN 'good'
    WHEN latest_inspection.overall_condition_score >= 60 THEN 'fair'
    WHEN latest_inspection.overall_condition_score >= 40 THEN 'poor'
    WHEN latest_inspection.overall_condition_score IS NOT NULL THEN 'critical'
    ELSE 'unknown'
  END AS condition_status,
  CASE
    WHEN latest_inspection.inspection_date < NOW() - INTERVAL '30 days' THEN true
    ELSE false
  END AS inspection_overdue
FROM boat_equipment be
LEFT JOIN sail_equipment_details sed ON be.id = sed.equipment_id
LEFT JOIN LATERAL (
  SELECT * FROM sail_inspections si
  WHERE si.equipment_id = be.id
  ORDER BY si.inspection_date DESC
  LIMIT 1
) latest_inspection ON true
WHERE be.category IN ('mainsail', 'jib', 'genoa', 'spinnaker', 'code_zero', 'storm_jib', 'trysail');

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE sail_equipment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE sail_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sail_inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_equipment_usage ENABLE ROW LEVEL SECURITY;

-- sail_equipment_details: Owner can manage via boat_equipment relationship
CREATE POLICY "Users can view sail details for their equipment"
  ON sail_equipment_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boat_equipment be
      JOIN sailor_boats sb ON be.boat_id = sb.id
      WHERE be.id = sail_equipment_details.equipment_id
      AND sb.sailor_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sail details for their equipment"
  ON sail_equipment_details FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boat_equipment be
      JOIN sailor_boats sb ON be.boat_id = sb.id
      WHERE be.id = sail_equipment_details.equipment_id
      AND sb.sailor_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sail details for their equipment"
  ON sail_equipment_details FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM boat_equipment be
      JOIN sailor_boats sb ON be.boat_id = sb.id
      WHERE be.id = sail_equipment_details.equipment_id
      AND sb.sailor_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sail details for their equipment"
  ON sail_equipment_details FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boat_equipment be
      JOIN sailor_boats sb ON be.boat_id = sb.id
      WHERE be.id = sail_equipment_details.equipment_id
      AND sb.sailor_id = auth.uid()
    )
  );

-- sail_inspections: Owner can manage their inspections
CREATE POLICY "Users can view their own sail inspections"
  ON sail_inspections FOR SELECT
  USING (sailor_id = auth.uid());

CREATE POLICY "Users can insert their own sail inspections"
  ON sail_inspections FOR INSERT
  WITH CHECK (sailor_id = auth.uid());

CREATE POLICY "Users can update their own sail inspections"
  ON sail_inspections FOR UPDATE
  USING (sailor_id = auth.uid());

CREATE POLICY "Users can delete their own sail inspections"
  ON sail_inspections FOR DELETE
  USING (sailor_id = auth.uid());

-- Coaches can view inspections for sailors they coach
CREATE POLICY "Coaches can view athlete sail inspections"
  ON sail_inspections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coaching_clients cc
      WHERE cc.coach_id = auth.uid()
      AND cc.sailor_id = sail_inspections.sailor_id
    )
  );

-- sail_inspection_photos: Via inspection ownership
CREATE POLICY "Users can view photos for their inspections"
  ON sail_inspection_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sail_inspections si
      WHERE si.id = sail_inspection_photos.inspection_id
      AND si.sailor_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos for their inspections"
  ON sail_inspection_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sail_inspections si
      WHERE si.id = sail_inspection_photos.inspection_id
      AND si.sailor_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos for their inspections"
  ON sail_inspection_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sail_inspections si
      WHERE si.id = sail_inspection_photos.inspection_id
      AND si.sailor_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos for their inspections"
  ON sail_inspection_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sail_inspections si
      WHERE si.id = sail_inspection_photos.inspection_id
      AND si.sailor_id = auth.uid()
    )
  );

-- Coaches can view photos for athletes they coach
CREATE POLICY "Coaches can view athlete inspection photos"
  ON sail_inspection_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sail_inspections si
      JOIN coaching_clients cc ON cc.sailor_id = si.sailor_id
      WHERE si.id = sail_inspection_photos.inspection_id
      AND cc.coach_id = auth.uid()
    )
  );

-- race_equipment_usage: Owner can manage
CREATE POLICY "Users can view their own race equipment usage"
  ON race_equipment_usage FOR SELECT
  USING (sailor_id = auth.uid());

CREATE POLICY "Users can insert their own race equipment usage"
  ON race_equipment_usage FOR INSERT
  WITH CHECK (sailor_id = auth.uid());

CREATE POLICY "Users can update their own race equipment usage"
  ON race_equipment_usage FOR UPDATE
  USING (sailor_id = auth.uid());

CREATE POLICY "Users can delete their own race equipment usage"
  ON race_equipment_usage FOR DELETE
  USING (sailor_id = auth.uid());

-- =============================================================================
-- FUNCTION: Get sails needing inspection before a race
-- =============================================================================
CREATE OR REPLACE FUNCTION get_sails_needing_inspection(
  p_boat_id UUID,
  p_days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE (
  equipment_id UUID,
  sail_name TEXT,
  sail_type TEXT,
  last_inspection_date TIMESTAMPTZ,
  last_inspection_score INTEGER,
  days_since_inspection INTEGER,
  alert_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sih.id AS equipment_id,
    COALESCE(sih.custom_name, sih.sail_type::TEXT) AS sail_name,
    sih.sail_type::TEXT,
    sih.last_inspection_date,
    sih.last_inspection_score::INTEGER,
    EXTRACT(DAY FROM NOW() - sih.last_inspection_date)::INTEGER AS days_since_inspection,
    CASE
      WHEN sih.last_inspection_date IS NULL THEN 'critical'
      WHEN sih.last_inspection_score < 60 THEN 'critical'
      WHEN sih.last_inspection_date < NOW() - (p_days_threshold || ' days')::INTERVAL THEN 'warning'
      WHEN sih.last_inspection_score < 80 THEN 'info'
      ELSE 'ok'
    END::TEXT AS alert_level
  FROM sail_inventory_with_health sih
  WHERE sih.boat_id = p_boat_id
  AND (
    sih.last_inspection_date IS NULL
    OR sih.last_inspection_date < NOW() - (p_days_threshold || ' days')::INTERVAL
    OR sih.last_inspection_score < 80
  )
  ORDER BY
    CASE
      WHEN sih.last_inspection_date IS NULL THEN 0
      WHEN sih.last_inspection_score < 60 THEN 1
      ELSE 2
    END,
    sih.last_inspection_date ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_sails_needing_inspection TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE sail_equipment_details IS 'Sail-specific metadata extending boat_equipment for sails';
COMMENT ON TABLE sail_inspections IS 'Photo-first sail inspection records with zone-based condition tracking';
COMMENT ON TABLE sail_inspection_photos IS 'Individual photos from sail inspections with AI analysis results';
COMMENT ON TABLE race_equipment_usage IS 'Links equipment (primarily sails) to races for usage tracking';
COMMENT ON VIEW sail_inventory_with_health IS 'Sail inventory with latest inspection health status';
COMMENT ON FUNCTION get_sails_needing_inspection IS 'Returns sails that need inspection before racing';
