-- Add foreign key relationship from boat_equipment to sailor_boats
-- This enables PostgREST nested selects like: boat:sailor_boats(id, name)

ALTER TABLE boat_equipment
ADD CONSTRAINT fk_boat_equipment_boat
FOREIGN KEY (boat_id) REFERENCES sailor_boats(id) ON DELETE CASCADE;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
