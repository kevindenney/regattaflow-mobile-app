-- Add blueprint_subscribed to the social_notification_type enum
ALTER TYPE social_notification_type ADD VALUE IF NOT EXISTS 'blueprint_subscribed';
