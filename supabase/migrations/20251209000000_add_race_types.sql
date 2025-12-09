-- Add race type support for Fleet Racing and Distance Racing
-- This migration adds the race_type field and distance-specific fields to regattas table

-- Add race_type column with default 'fleet' for existing races
ALTER TABLE regattas
  ADD COLUMN IF NOT EXISTS race_type TEXT DEFAULT 'fleet' 
    CHECK (race_type IN ('fleet', 'distance'));

-- Distance race specific fields
ALTER TABLE regattas
  -- Route waypoints for distance races
  ADD COLUMN IF NOT EXISTS route_waypoints JSONB,
  -- Structure: [{ 
  --   name: string,
  --   latitude: number,
  --   longitude: number, 
  --   type: 'start' | 'waypoint' | 'gate' | 'finish',
  --   required: boolean,
  --   passingSide?: 'port' | 'starboard' | 'either'
  -- }]
  
  -- Total race distance in nautical miles
  ADD COLUMN IF NOT EXISTS total_distance_nm NUMERIC(6,2),
  
  -- Time limit in hours
  ADD COLUMN IF NOT EXISTS time_limit_hours NUMERIC(5,2),
  
  -- Whether start and finish are at the same location
  ADD COLUMN IF NOT EXISTS start_finish_same_location BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN regattas.race_type IS 'Type of race: fleet (buoy racing) or distance (offshore/passage racing)';
COMMENT ON COLUMN regattas.route_waypoints IS 'Array of waypoints for distance races with coordinates, type, and passing requirements';
COMMENT ON COLUMN regattas.total_distance_nm IS 'Total race distance in nautical miles (primarily for distance races)';
COMMENT ON COLUMN regattas.time_limit_hours IS 'Time limit for the race in hours';
COMMENT ON COLUMN regattas.start_finish_same_location IS 'Whether the race starts and finishes at the same location';

-- Create index for faster filtering by race type
CREATE INDEX IF NOT EXISTS idx_regattas_race_type ON regattas(race_type);

-- Create index for distance races with waypoints
CREATE INDEX IF NOT EXISTS idx_regattas_route_waypoints ON regattas USING gin(route_waypoints) WHERE route_waypoints IS NOT NULL;

