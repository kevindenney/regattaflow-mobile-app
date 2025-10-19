-- Migration Template - Use this as a starting point for new database migrations
-- This template demonstrates RegattaFlow migration conventions:
-- - Proper table structure with foreign keys
-- - Comprehensive indexing strategy
-- - Row Level Security (RLS) policies
-- - Useful database functions
--
-- To use: Copy this template, rename with timestamp and description, modify for your use case
--
-- File naming: YYYYMMDD_description_of_change.sql
-- Example: 20251018_add_race_results_table.sql

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

-- Create the main table
CREATE TABLE IF NOT EXISTS example_items (
  -- Primary key (always UUID, always with gen_random_uuid())
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys (reference other tables)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES example_parents(id) ON DELETE CASCADE,

  -- Standard fields
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),

  -- Numeric fields
  count INTEGER DEFAULT 0 CHECK (count >= 0),
  amount DECIMAL(10, 2),

  -- Boolean fields
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,

  -- Geographic fields (if applicable)
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location GEOGRAPHY(POINT, 4326), -- PostGIS geography type

  -- Timestamp fields (ALWAYS include these two)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index naming convention: idx_table_column(s)_purpose

-- 1. Foreign key indexes (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_example_items_user_id
  ON example_items(user_id);

CREATE INDEX IF NOT EXISTS idx_example_items_parent_id
  ON example_items(parent_id);

-- 2. Query optimization indexes (based on common WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_example_items_status
  ON example_items(status);

CREATE INDEX IF NOT EXISTS idx_example_items_created_at
  ON example_items(created_at DESC); -- DESC for recent-first queries

-- 3. Composite indexes (for multi-column queries)
CREATE INDEX IF NOT EXISTS idx_example_items_user_status
  ON example_items(user_id, status);

-- 4. Geographic indexes (if using PostGIS)
CREATE INDEX IF NOT EXISTS idx_example_items_location
  ON example_items USING GIST(location);

-- 5. Full-text search indexes (if needed)
CREATE INDEX IF NOT EXISTS idx_example_items_search
  ON example_items USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON example_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: update_updated_at_column() should already exist from initial migrations
-- If not, create it:
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE example_items ENABLE ROW LEVEL SECURITY;

-- Pattern 1: User-Owned Data (most common pattern)
-- Users can only access their own records

CREATE POLICY "Users can view their own items"
  ON example_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
  ON example_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON example_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON example_items FOR DELETE
  USING (auth.uid() = user_id);

-- Pattern 2: Public Read, Owner Write
-- Anyone can view, but only owner can modify
-- (Uncomment if needed, comment out Pattern 1)

/*
CREATE POLICY "Anyone can view items"
  ON example_items FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own items"
  ON example_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON example_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON example_items FOR DELETE
  USING (auth.uid() = user_id);
*/

-- Pattern 3: Conditional Public Access
-- Public if is_public = true, owner-only if false
-- (Uncomment if needed, comment out Pattern 1)

/*
CREATE POLICY "Users can view public items or their own items"
  ON example_items FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
  ON example_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON example_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON example_items FOR DELETE
  USING (auth.uid() = user_id);
*/

-- ============================================================================
-- UTILITY FUNCTIONS (Optional)
-- ============================================================================

-- Example: Get user's item count
CREATE OR REPLACE FUNCTION get_user_item_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM example_items
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example: Get items within radius (geographic queries)
CREATE OR REPLACE FUNCTION get_items_within_radius(
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION
)
RETURNS SETOF example_items AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM example_items
  WHERE location IS NOT NULL
    AND ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY ST_Distance(
    location,
    ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS (Security)
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON example_items TO authenticated;
GRANT USAGE ON SEQUENCE example_items_id_seq TO authenticated; -- If using SERIAL instead of UUID

-- Grant read-only access to anonymous users (if needed)
-- GRANT SELECT ON example_items TO anon;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE example_items IS 'Stores user-created items with full RLS security';
COMMENT ON COLUMN example_items.user_id IS 'References the user who owns this item';
COMMENT ON COLUMN example_items.status IS 'Item status: draft, active, or archived';
COMMENT ON COLUMN example_items.location IS 'PostGIS geography point for geographic queries';

-- ============================================================================
-- TESTING QUERIES (Run these to verify)
-- ============================================================================

-- Verify table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'example_items'
-- ORDER BY ordinal_position;

-- Verify indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'example_items';

-- Verify RLS policies
-- SELECT policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'example_items';

-- Test insert (should succeed for authenticated user)
-- INSERT INTO example_items (user_id, name, description, status)
-- VALUES (auth.uid(), 'Test Item', 'Test description', 'draft');

-- Test select (should only return user's own items)
-- SELECT * FROM example_items;
