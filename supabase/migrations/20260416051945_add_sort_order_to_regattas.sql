-- Add sort_order to regattas so user-driven reorders on the race grid
-- can be persisted (mirrors timeline_steps.sort_order).
--
-- Default 0 matches timeline_steps. The grid's chronological sort uses
-- date as the primary key and sort_order only as a tiebreaker, so existing
-- rows are unaffected by the default until a user reorders them.

ALTER TABLE regattas
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_regattas_sort_order
  ON regattas (sort_order);
