-- Correct Four Peaks Race 2026 data from official NOR
-- Source: https://www.4peaksrace.com/_files/ugd/de4579_08c0321147ab4f59b47202af60e78a09.pdf
--
-- Start: Tai Tam Bay, Saturday 17th January 2026, Warning signal 10:30
-- Finish: Sunday 18th January 2026, 19:00 (32.5 hour time limit)
-- Race Safety Control Centre: ABC Main Club

UPDATE regattas
SET
  start_date = '2026-01-17T10:30:00+08:00',
  warning_signal_time = '10:30',
  time_limit_hours = 32.5,
  start_area_name = 'Tai Tam Bay',
  finish_area_name = 'ABC Main Club'
WHERE id = 'd19657dd-722c-423b-a07b-8060e5a57f31';
