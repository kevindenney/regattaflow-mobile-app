-- Add 'step_suggested' to the notification type enum
-- Allows users to suggest steps to peers via notifications

ALTER TYPE social_notification_type ADD VALUE IF NOT EXISTS 'step_suggested';
