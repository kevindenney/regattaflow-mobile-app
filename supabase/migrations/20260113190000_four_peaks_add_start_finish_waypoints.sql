-- Four Peaks Race 2026: Add start and finish waypoints to the route
-- Start and finish are both at Tai Tam Bay (coordinates: 22.2375, 114.2167)
-- This gives 6 waypoints total = 5 legs

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
  ]'::jsonb
WHERE id = 'd19657dd-722c-423b-a07b-8060e5a57f31';
