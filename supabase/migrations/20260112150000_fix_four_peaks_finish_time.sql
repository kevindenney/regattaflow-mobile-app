-- Fix Four Peaks Race 2026 time limit to 30.5 hours
-- Race starts Saturday 10:30, finishes Sunday 17:00 = 30.5 hours
UPDATE regattas
SET time_limit_hours = 30.5
WHERE id = '2f4df6a8-842c-40a1-8ddf-2b83b2aba467';
