-- Fix the correct Four Peaks Race (11 Four Peaks Race 2026) with start and finish waypoints
-- This is the race being displayed in the UI with ID 6593f820-00cd-430c-b7f8-fd6a196c52e6
-- Previous migrations were updating the wrong race (d19657dd-...)

UPDATE regattas
SET
  route_waypoints = '[
    {
      "name": "Tai Tam Bay Start",
      "type": "start",
      "order": 0,
      "latitude": 22.2375,
      "longitude": 114.2167,
      "required": true
    },
    {
      "name": "Lantau Peak",
      "type": "waypoint",
      "order": 1,
      "latitude": 22.2568,
      "longitude": 113.9438,
      "required": true,
      "notes": "Peak ascent required"
    },
    {
      "name": "Mount Stenhouse",
      "type": "waypoint",
      "order": 2,
      "latitude": 22.2128,
      "longitude": 114.254,
      "required": true,
      "notes": "Peak ascent required"
    },
    {
      "name": "Violet Hill",
      "type": "waypoint",
      "order": 3,
      "latitude": 22.2552,
      "longitude": 114.186,
      "required": true,
      "notes": "Peak ascent required"
    },
    {
      "name": "Ma On Shan",
      "type": "waypoint",
      "order": 4,
      "latitude": 22.4055,
      "longitude": 114.2422,
      "required": true,
      "notes": "Peak ascent required"
    },
    {
      "name": "Tai Tam Bay Finish",
      "type": "finish",
      "order": 5,
      "latitude": 22.2375,
      "longitude": 114.2167,
      "required": true
    }
  ]'::jsonb,
  start_area_name = 'Tai Tam Bay',
  finish_area_name = 'Tai Tam Bay',
  start_date = '2026-01-17T10:30:00+08:00',
  warning_signal_time = '10:30',
  time_limit_hours = 32.5
WHERE id = '6593f820-00cd-430c-b7f8-fd6a196c52e6';
