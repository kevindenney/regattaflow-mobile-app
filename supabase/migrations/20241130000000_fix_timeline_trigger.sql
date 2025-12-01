-- Fix timeline_events trigger issue
-- Drop the problematic triggers that cause errors when deleting races
-- timeline_events is a regular VIEW (not materialized), so it doesn't need refresh triggers

-- Drop all triggers that use trigger_refresh_timeline_events()
DROP TRIGGER IF EXISTS refresh_timeline_events_after_regattas ON regattas;
DROP TRIGGER IF EXISTS refresh_timeline_events_after_race_events ON race_events;
DROP TRIGGER IF EXISTS refresh_timeline_events_after_clinical_sessions ON clinical_sessions;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS trigger_refresh_timeline_events();

-- Add a comment explaining why this was removed
COMMENT ON VIEW timeline_events IS 'Timeline view combining regattas and clinical_sessions. Regular views auto-update, so no refresh trigger needed.';
