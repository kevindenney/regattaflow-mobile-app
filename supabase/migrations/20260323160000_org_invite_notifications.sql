-- Org invite notifications: notify inviter when invite is accepted, notify invitee when invited
-- Also adds step_collaborator_added which was missing from previous migrations

ALTER TYPE social_notification_type ADD VALUE IF NOT EXISTS 'org_invite_accepted';
ALTER TYPE social_notification_type ADD VALUE IF NOT EXISTS 'org_invite_received';
ALTER TYPE social_notification_type ADD VALUE IF NOT EXISTS 'step_collaborator_added';
