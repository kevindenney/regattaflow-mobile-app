-- Migration: Add trigger to create sample coach annotations
-- Purpose: Automatically insert coach annotations when a completed sample race is created
-- Design: Uses SECURITY DEFINER to bypass RLS (coach annotations require coach_id = auth.uid())

-- Create trigger function to insert sample coach annotations
CREATE OR REPLACE FUNCTION insert_sample_coach_annotations()
RETURNS TRIGGER AS $$
DECLARE
  coach_profile_id uuid := 'd6c95c89-43e6-4d69-8f2c-58d392c22d16'; -- Sarah Chen mock coach
BEGIN
  -- Only trigger for sample data with completed status
  IF NEW.metadata->>'is_sample' = 'true' AND NEW.status = 'completed' THEN
    -- Check if coach profile exists
    IF EXISTS (SELECT 1 FROM profiles WHERE id = coach_profile_id) THEN
      -- Insert sample annotations
      INSERT INTO coach_race_annotations (race_id, coach_id, sailor_id, field, comment, is_read)
      VALUES
        (NEW.id, coach_profile_id, NEW.created_by, 'result',
         'Excellent result! Top 3 in this fleet is a significant achievement. Keep building on this momentum.', true),
        (NEW.id, coach_profile_id, NEW.created_by, 'keyMoment',
         'Great awareness on that wave set. This kind of observation comes from experience - you''re developing good downwind instincts.', true),
        (NEW.id, coach_profile_id, NEW.created_by, 'start',
         'Your start execution has really improved. The boat end choice showed good pre-race analysis of the wind patterns.', false),
        (NEW.id, coach_profile_id, NEW.created_by, 'upwind',
         'Staying in phase with shifts is one of the most important skills - you''re clearly getting better at reading the wind.', true);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on regattas table
DROP TRIGGER IF EXISTS sample_coach_annotations_trigger ON regattas;
CREATE TRIGGER sample_coach_annotations_trigger
  AFTER INSERT ON regattas
  FOR EACH ROW
  EXECUTE FUNCTION insert_sample_coach_annotations();

-- Comment for documentation
COMMENT ON FUNCTION insert_sample_coach_annotations() IS
  'Automatically creates sample coach annotations when a completed sample race is inserted (for new user onboarding)';
