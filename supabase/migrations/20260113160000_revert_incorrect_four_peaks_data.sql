-- Revert incorrect assumptions made about Four Peaks Race route data
-- The start is at Tai Tam Bay, finish location is unknown
-- Only the four peaks should be waypoints (not made-up start/finish points)

UPDATE regattas
SET
  -- Keep start_area_name as Tai Tam Bay (this was correct)
  start_area_name = 'Tai Tam Bay',
  -- Remove the made-up finish location
  finish_area_name = NULL,
  -- Keep distance as 45nm (this appears correct from previous data)
  total_distance_nm = 45.00,
  -- Update waypoints to only include the four peaks (remove made-up start/finish)
  route_waypoints = '[
    {
      "name": "Lantau Peak",
      "type": "waypoint",
      "order": 0,
      "latitude": 22.2568,
      "longitude": 113.9438,
      "required": true,
      "notes": "Peak ascent required"
    },
    {
      "name": "Mount Stenhouse",
      "type": "waypoint",
      "order": 1,
      "latitude": 22.2128,
      "longitude": 114.254,
      "required": true,
      "notes": "Peak ascent required"
    },
    {
      "name": "Violet Hill",
      "type": "waypoint",
      "order": 2,
      "latitude": 22.2552,
      "longitude": 114.186,
      "required": true,
      "notes": "Peak ascent required"
    },
    {
      "name": "Ma On Shan",
      "type": "waypoint",
      "order": 3,
      "latitude": 22.4055,
      "longitude": 114.2422,
      "required": true,
      "notes": "Peak ascent required"
    }
  ]'::jsonb
WHERE id = 'd19657dd-722c-423b-a07b-8060e5a57f31';
