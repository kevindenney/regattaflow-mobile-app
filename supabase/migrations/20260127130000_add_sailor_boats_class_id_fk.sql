-- Add missing foreign key from sailor_boats.class_id to boat_classes.id
-- This is required for PostgREST join syntax: sailor_boats?select=class_id,boat_classes(id,name)
-- Without this FK, all queries using boat_classes(...) on sailor_boats return 400 Bad Request

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sailor_boats_class_id_fkey'
  ) THEN
    ALTER TABLE sailor_boats
    ADD CONSTRAINT sailor_boats_class_id_fkey
    FOREIGN KEY (class_id) REFERENCES boat_classes(id) ON DELETE SET NULL;
  END IF;
END $$;
