-- Four Peaks Race 2026: If no explicit finish line given, assume finish = start
-- ABC Main Club is the Race Safety Control Centre for reporting, not the finish line
-- The race starts and finishes at Tai Tam Bay

UPDATE regattas
SET
  finish_area_name = 'Tai Tam Bay'
WHERE id = 'd19657dd-722c-423b-a07b-8060e5a57f31';
