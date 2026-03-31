-- Add the real Telegram user (Kyle E Denney) to the JHU nursing cohort
-- so competency progress from Telegram flows through to the faculty dashboard
INSERT INTO betterat_org_cohort_members (user_id, cohort_id)
VALUES ('d67f765e-7fe6-4f79-b514-f1b7f9a1ba3f', '99d86cd8-aa39-4d9b-a664-bef240d3133b')
ON CONFLICT DO NOTHING;
