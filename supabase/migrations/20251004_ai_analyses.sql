-- AI Analyses Table for Document Processing Agent Results
-- Stores race course extractions, strategic analysis, and AI-generated insights

CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User & Regatta Association
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  regatta_id UUID REFERENCES regattas(id) ON DELETE CASCADE,

  -- Analysis Type & Source
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('course_extraction', 'strategy', 'tactical_advice', 'document_summary')),
  source_document TEXT, -- Original filename
  source_document_url TEXT, -- Storage URL if uploaded

  -- Extracted Course Data (for course_extraction type)
  course_data JSONB, -- RaceCourseExtraction interface
  course_marks JSONB, -- Array of marks with coordinates
  visualization_geojson JSONB, -- MapLibre GeoJSON for 3D visualization

  -- Strategic Analysis (for strategy type)
  strategy_data JSONB, -- Strategic recommendations
  tactical_recommendations JSONB, -- Array of TacticalRecommendation

  -- Metadata
  confidence_score DECIMAL(3,2) DEFAULT 0.0, -- Overall confidence 0.0-1.0
  processing_notes TEXT[], -- Agent processing logs
  model_used TEXT, -- AI model identifier
  tokens_used INTEGER DEFAULT 0,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user ON ai_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_regatta ON ai_analyses(regatta_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_status ON ai_analyses(status);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created ON ai_analyses(created_at DESC);

-- RLS Policies
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own AI analyses" ON ai_analyses;
CREATE POLICY "Users can view their own AI analyses"
  ON ai_analyses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own AI analyses" ON ai_analyses;
CREATE POLICY "Users can create their own AI analyses"
  ON ai_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own AI analyses" ON ai_analyses;
CREATE POLICY "Users can update their own AI analyses"
  ON ai_analyses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own AI analyses" ON ai_analyses;
CREATE POLICY "Users can delete their own AI analyses"
  ON ai_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ai_analyses_updated_at_trigger ON ai_analyses;
CREATE TRIGGER update_ai_analyses_updated_at_trigger
  BEFORE UPDATE ON ai_analyses
  FOR EACH ROW EXECUTE FUNCTION update_ai_analyses_updated_at();

-- Grant permissions
GRANT ALL ON ai_analyses TO authenticated;

COMMENT ON TABLE ai_analyses IS 'AI-generated analyses from DocumentProcessingAgent including course extraction and strategic insights';
COMMENT ON COLUMN ai_analyses.course_data IS 'Full RaceCourseExtraction interface data';
COMMENT ON COLUMN ai_analyses.visualization_geojson IS 'MapLibre-compatible GeoJSON for 3D course visualization';
COMMENT ON COLUMN ai_analyses.strategy_data IS 'Strategic analysis and recommendations';
