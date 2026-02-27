-- Add publisher_name to activity templates so the catalog can display it
-- without needing a separate join to profiles/organizations tables.

ALTER TABLE betterat_activity_templates
  ADD COLUMN IF NOT EXISTS publisher_name text;

-- Backfill existing seed data with publisher names
UPDATE betterat_activity_templates SET publisher_name = 'RHKYC'
  WHERE publisher_id = 'a1000001-0000-0000-0000-000000000001';

UPDATE betterat_activity_templates SET publisher_name = 'JHU School of Nursing'
  WHERE publisher_id = 'a1000002-0000-0000-0000-000000000002';

UPDATE betterat_activity_templates SET publisher_name = 'Urban Sketchers HK'
  WHERE publisher_id = 'a1000003-0000-0000-0000-000000000003';

UPDATE betterat_activity_templates SET publisher_name = 'CrossFit Central'
  WHERE publisher_id = 'a1000004-0000-0000-0000-000000000004';

-- Coach publishers — look up names from the seed migration comments
UPDATE betterat_activity_templates SET publisher_name = 'Coach (Sailing)'
  WHERE publisher_id = 'c1000001-0000-0000-0000-000000000001' AND publisher_name IS NULL;

UPDATE betterat_activity_templates SET publisher_name = 'Coach (Nursing)'
  WHERE publisher_id = 'c1000002-0000-0000-0000-000000000002' AND publisher_name IS NULL;

UPDATE betterat_activity_templates SET publisher_name = 'Coach (Drawing)'
  WHERE publisher_id = 'c1000003-0000-0000-0000-000000000003' AND publisher_name IS NULL;

UPDATE betterat_activity_templates SET publisher_name = 'Coach (Fitness)'
  WHERE publisher_id = 'c1000004-0000-0000-0000-000000000004' AND publisher_name IS NULL;
