-- Find all constraints referencing timeline_events
SELECT
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    LEFT JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'regattas'
  AND (ccu.table_name = 'timeline_events' OR tc.constraint_name LIKE '%timeline%');

-- Find all triggers on regattas table
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'regattas';

-- Check if timeline_events exists as table or view
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'timeline_events';
