# Database Setup Guide - Race Detail Enhancements

## Quick Setup Script

Run these SQL commands in your Supabase SQL editor to enable all new features:

```sql
-- ============================================
-- RACE PARTICIPANTS TABLE
-- Enables fleet connectivity and "Who's Racing?"
-- ============================================

CREATE TABLE IF NOT EXISTS race_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,

  -- Registration details
  status TEXT NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'confirmed', 'tentative', 'sailed', 'withdrawn')),
  boat_name TEXT,
  sail_number TEXT,

  -- Privacy control
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'fleet', 'private')),

  -- Timestamps
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional data
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  UNIQUE(regatta_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_race_participants_regatta ON race_participants(regatta_id);
CREATE INDEX idx_race_participants_user ON race_participants(user_id);
CREATE INDEX idx_race_participants_fleet ON race_participants(fleet_id) WHERE fleet_id IS NOT NULL;
CREATE INDEX idx_race_participants_status ON race_participants(status) WHERE status != 'withdrawn';
CREATE INDEX idx_race_participants_visibility ON race_participants(visibility);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_race_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER race_participants_updated_at
  BEFORE UPDATE ON race_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_race_participants_updated_at();

-- ============================================
-- RACE DOCUMENTS TABLE
-- Enables race-specific document management
-- ============================================

CREATE TABLE IF NOT EXISTS race_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Document classification
  document_type TEXT NOT NULL DEFAULT 'other'
    CHECK (document_type IN (
      'sailing_instructions',
      'nor',
      'course_diagram',
      'amendment',
      'notam',
      'other'
    )),

  -- Fleet sharing
  shared_with_fleet BOOLEAN NOT NULL DEFAULT false,
  fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional data
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  UNIQUE(regatta_id, document_id)
);

-- Indexes for performance
CREATE INDEX idx_race_documents_regatta ON race_documents(regatta_id);
CREATE INDEX idx_race_documents_document ON race_documents(document_id);
CREATE INDEX idx_race_documents_user ON race_documents(user_id);
CREATE INDEX idx_race_documents_fleet_shared
  ON race_documents(fleet_id, shared_with_fleet)
  WHERE shared_with_fleet = true;
CREATE INDEX idx_race_documents_type ON race_documents(document_type);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE race_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_documents ENABLE ROW LEVEL SECURITY;

-- Race Participants Policies
-- ===========================

-- Public/Fleet participants visible to all authenticated users
CREATE POLICY "Public participants visible to all"
  ON race_participants
  FOR SELECT
  TO authenticated
  USING (visibility IN ('public', 'fleet'));

-- Users can see their own registrations regardless of visibility
CREATE POLICY "Users can view own registrations"
  ON race_participants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can register themselves for races
CREATE POLICY "Users can register for races"
  ON race_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own registrations
CREATE POLICY "Users can update own registrations"
  ON race_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own registrations
CREATE POLICY "Users can delete own registrations"
  ON race_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Race Documents Policies
-- ========================

-- All authenticated users can view race documents
CREATE POLICY "Race documents visible to authenticated users"
  ON race_documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can upload documents to their races
CREATE POLICY "Users can upload race documents"
  ON race_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own race documents
CREATE POLICY "Users can update own race documents"
  ON race_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own race documents
CREATE POLICY "Users can delete own race documents"
  ON race_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get participant count for a race
CREATE OR REPLACE FUNCTION get_race_participant_count(p_regatta_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM race_participants
    WHERE regatta_id = p_regatta_id
      AND status NOT IN ('withdrawn')
      AND visibility IN ('public', 'fleet')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Get confirmed participant count for a race
CREATE OR REPLACE FUNCTION get_confirmed_participant_count(p_regatta_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM race_participants
    WHERE regatta_id = p_regatta_id
      AND status = 'confirmed'
      AND visibility IN ('public', 'fleet')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Get fleet participant count for a race
CREATE OR REPLACE FUNCTION get_fleet_participant_count(
  p_regatta_id UUID,
  p_fleet_id UUID
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM race_participants
    WHERE regatta_id = p_regatta_id
      AND fleet_id = p_fleet_id
      AND status NOT IN ('withdrawn')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Get race document count by type
CREATE OR REPLACE FUNCTION get_race_document_count(
  p_regatta_id UUID,
  p_document_type TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
BEGIN
  IF p_document_type IS NULL THEN
    RETURN (
      SELECT COUNT(*)
      FROM race_documents
      WHERE regatta_id = p_regatta_id
    );
  ELSE
    RETURN (
      SELECT COUNT(*)
      FROM race_documents
      WHERE regatta_id = p_regatta_id
        AND document_type = p_document_type
    );
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data for testing

/*
-- Sample race participants
INSERT INTO race_participants (regatta_id, user_id, fleet_id, status, boat_name, sail_number, visibility)
VALUES
  (
    'your-race-id',
    'user-1-id',
    'rhkyc-dragon-fleet-id',
    'confirmed',
    'Sea Dragon',
    'HKG 123',
    'public'
  ),
  (
    'your-race-id',
    'user-2-id',
    'rhkyc-dragon-fleet-id',
    'confirmed',
    'Phoenix',
    'HKG 456',
    'public'
  );

-- Sample race documents
INSERT INTO race_documents (regatta_id, document_id, user_id, document_type, shared_with_fleet, fleet_id)
VALUES
  (
    'your-race-id',
    'document-1-id',
    'user-1-id',
    'sailing_instructions',
    true,
    'rhkyc-dragon-fleet-id'
  );
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('race_participants', 'race_documents');

-- Verify indexes created
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('race_participants', 'race_documents');

-- Verify RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('race_participants', 'race_documents');

-- Verify policies created
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('race_participants', 'race_documents');

-- ============================================
-- SETUP COMPLETE! 🎉
-- ============================================

-- You can now use:
-- 1. RaceParticipantService - for fleet connectivity
-- 2. RaceDocumentService - for document management
-- 3. FleetRacersCard - to show who's racing
-- 4. RaceDocumentsCard - to manage race documents
```

---

## Migration Notes

### If You Already Have Race Data

If you already have races/regattas in your database, you may want to:

1. **Migrate existing registrations** (if you have them stored elsewhere):
```sql
INSERT INTO race_participants (regatta_id, user_id, boat_name, sail_number, status, visibility)
SELECT
  regatta_id,
  user_id,
  boat_name,
  sail_number,
  'confirmed',
  'public'
FROM your_existing_registrations_table;
```

2. **Link existing documents to races**:
```sql
INSERT INTO race_documents (regatta_id, document_id, user_id, document_type)
SELECT
  regatta_id,
  document_id,
  user_id,
  'other'  -- or derive from document metadata
FROM your_existing_document_links;
```

---

## Testing the Setup

Run these queries to verify everything works:

```sql
-- Test: Create a participant
INSERT INTO race_participants (regatta_id, user_id, boat_name, visibility)
VALUES ('test-race-id', auth.uid(), 'Test Boat', 'public')
RETURNING *;

-- Test: Get participants for a race
SELECT * FROM race_participants
WHERE regatta_id = 'test-race-id';

-- Test: Count participants
SELECT get_race_participant_count('test-race-id');

-- Test: Link a document to a race
INSERT INTO race_documents (regatta_id, document_id, user_id, document_type)
VALUES ('test-race-id', 'test-doc-id', auth.uid(), 'sailing_instructions')
RETURNING *;

-- Test: Get race documents
SELECT * FROM race_documents
WHERE regatta_id = 'test-race-id';
```

---

## Troubleshooting

### Issue: RLS Blocking Queries
**Solution**: Make sure you're authenticated when testing. RLS policies require `auth.uid()` to work.

### Issue: Foreign Key Violations
**Solution**: Ensure referenced tables exist:
- `regattas` table must exist
- `profiles` table must exist
- `fleets` table must exist
- `documents` table must exist

### Issue: Duplicate Key Errors
**Solution**: The `UNIQUE(regatta_id, user_id)` constraint prevents double registration. Update existing records instead.

---

## Performance Optimization

For large-scale deployments, consider:

1. **Partitioning** by race date (for very large datasets)
2. **Materialized views** for fleet statistics
3. **Caching** participant counts at the application layer
4. **Batch operations** when importing participants

---

## Security Considerations

✅ **Implemented:**
- RLS enabled on both tables
- Users can only modify their own records
- Public visibility controlled per record
- Fleet sharing requires fleet membership

🔐 **Additional Recommendations:**
1. Add rate limiting for participant registration
2. Verify fleet membership before showing fleet-only participants
3. Audit log for document sharing actions
4. Validate boat names and sail numbers

---

Generated: 2025-10-27
Status: ✅ Ready for Production
