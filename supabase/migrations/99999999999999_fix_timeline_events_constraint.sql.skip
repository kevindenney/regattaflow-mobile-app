-- ==========================================
-- Fix timeline_events Constraint Issue
-- ==========================================
-- This migration diagnoses and fixes the timeline_events constraint error
-- when deleting regattas

-- Step 1: Check if timeline_events exists
DO $$
BEGIN
    RAISE NOTICE '=== Checking for timeline_events table ===';
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'timeline_events') THEN
        RAISE NOTICE 'timeline_events table EXISTS';
    ELSE
        RAISE NOTICE 'timeline_events table DOES NOT EXIST';
    END IF;
END $$;

-- Step 2: Find all constraints on regattas that reference timeline_events
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '=== Finding constraints on regattas referencing timeline_events ===';
    FOR r IN
        SELECT
            tc.constraint_name,
            tc.table_name,
            tc.constraint_type,
            pg_get_constraintdef(pgc.oid) as constraint_definition
        FROM information_schema.table_constraints AS tc
        JOIN pg_constraint pgc ON tc.constraint_name = pgc.conname
        WHERE tc.table_name = 'regattas'
        AND pg_get_constraintdef(pgc.oid) LIKE '%timeline_events%'
    LOOP
        RAISE NOTICE 'Found constraint: % (type: %) - %',
            r.constraint_name, r.constraint_type, r.constraint_definition;
    END LOOP;
END $$;

-- Step 3: Find all triggers on regattas that reference timeline_events
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '=== Finding triggers on regattas referencing timeline_events ===';
    FOR r IN
        SELECT
            trigger_name,
            event_manipulation,
            action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'regattas'
        AND action_statement LIKE '%timeline_events%'
    LOOP
        RAISE NOTICE 'Found trigger: % on % - %',
            r.trigger_name, r.event_manipulation, r.action_statement;
    END LOOP;
END $$;

-- Step 4: OPTIONAL FIX - Create timeline_events table if it doesn't exist
-- Uncomment this block if you want to create the table
/*
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID REFERENCES regattas(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_timeline_events_regatta_id ON timeline_events(regatta_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_event_type ON timeline_events(event_type);

COMMENT ON TABLE timeline_events IS 'Timeline of events for each regatta';
*/

-- Step 5: ALTERNATIVE FIX - Drop constraints/triggers referencing timeline_events
-- Run this manually after reviewing the output from steps 2 and 3
-- EXAMPLE (replace with actual constraint/trigger names):
-- ALTER TABLE regattas DROP CONSTRAINT IF EXISTS constraint_name_here;
-- DROP TRIGGER IF EXISTS trigger_name_here ON regattas;

RAISE NOTICE '=== Diagnosis Complete ===';
RAISE NOTICE 'Review the output above and either:';
RAISE NOTICE '1. Uncomment and run the CREATE TABLE block to create timeline_events';
RAISE NOTICE '2. Drop the problematic constraints/triggers manually';
