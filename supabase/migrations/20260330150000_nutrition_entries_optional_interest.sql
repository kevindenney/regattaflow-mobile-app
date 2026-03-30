-- Make interest_id optional on nutrition_entries.
-- Telegram-based nutrition logging doesn't always have an interest context.
-- The column has no FK constraint, so this is safe.

ALTER TABLE nutrition_entries
  ALTER COLUMN interest_id DROP NOT NULL;
