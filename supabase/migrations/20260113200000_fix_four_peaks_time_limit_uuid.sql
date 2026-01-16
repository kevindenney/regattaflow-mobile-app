-- Fix time_limit_hours for Four Peaks Race 2026 (32.5-hour distance race)
-- Previous migration (20260112120000) used wrong UUID, this one uses correct ID and name match
-- Race starts Sat Jan 17 at 10:30 and finishes Sun Jan 18 at 19:00 = 32.5 hours
UPDATE regattas
SET time_limit_hours = 32.5
WHERE id = 'd19657dd-722c-423b-a07b-8060e5a57f31'
   OR (name = 'Four Peaks Race 2026' AND time_limit_hours IS NULL);
