-- Drop org step templates infrastructure (consolidated into blueprints)
-- Templates have been replaced by timeline_blueprints + blueprint_steps

DROP TABLE IF EXISTS betterat_org_step_template_cohorts CASCADE;
DROP TABLE IF EXISTS betterat_org_step_templates CASCADE;
