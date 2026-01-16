-- Add missing route_description column to regattas table
-- This column stores a text description of the race route for distance races

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS route_description TEXT;

COMMENT ON COLUMN regattas.route_description IS 'Text description of the race route, particularly for distance/offshore races';
