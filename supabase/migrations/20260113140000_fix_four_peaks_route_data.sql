-- Fix Four Peaks Race 2026 route data with proper start/finish and accurate waypoints
UPDATE regattas
SET
  route_waypoints = '[
    {"name": "RHKYC Start Line", "type": "start", "latitude": 22.2896, "longitude": 114.1760, "order": 0, "required": true},
    {"name": "Lantau Peak", "type": "waypoint", "latitude": 22.2568, "longitude": 113.9438, "order": 1, "required": true, "notes": "Peak ascent required"},
    {"name": "Mount Stenhouse", "type": "waypoint", "latitude": 22.2128, "longitude": 114.2540, "order": 2, "required": true, "notes": "Peak ascent required"},
    {"name": "Violet Hill", "type": "waypoint", "latitude": 22.2552, "longitude": 114.1860, "order": 3, "required": true, "notes": "Peak ascent required"},
    {"name": "Ma On Shan", "type": "waypoint", "latitude": 22.4055, "longitude": 114.2422, "order": 4, "required": true, "notes": "Peak ascent required"},
    {"name": "Aberdeen Boat Club Finish", "type": "finish", "latitude": 22.2420, "longitude": 114.1540, "order": 5, "required": true}
  ]'::jsonb,
  finish_area_name = 'Aberdeen Boat Club',
  total_distance_nm = 45,
  time_limit_hours = 32.5
WHERE id = 'd19657dd-722c-423b-a07b-8060e5a57f31';
