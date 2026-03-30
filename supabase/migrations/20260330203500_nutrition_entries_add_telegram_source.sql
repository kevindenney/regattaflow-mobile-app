-- Add 'telegram' as an allowed source for nutrition_entries.
-- The Telegram bot logs nutrition via the log_nutrition tool.

ALTER TABLE nutrition_entries
  DROP CONSTRAINT nutrition_entries_source_check,
  ADD CONSTRAINT nutrition_entries_source_check
    CHECK (source = ANY (ARRAY['conversation', 'quick_log', 'photo', 'manual', 'telegram']));
