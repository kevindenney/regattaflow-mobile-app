-- Add direct paste fields to races table for user-provided calendar and document data
-- These fields allow users to paste CSV/table data, SI/NOR text, and race area images

ALTER TABLE races
ADD COLUMN IF NOT EXISTS calendar_paste_data TEXT,
ADD COLUMN IF NOT EXISTS si_nor_paste_data TEXT,
ADD COLUMN IF NOT EXISTS race_area_image_url TEXT;

COMMENT ON COLUMN races.calendar_paste_data IS 'Raw CSV or table data pasted by user from racing calendar (Excel, Google Sheets, etc.)';
COMMENT ON COLUMN races.si_nor_paste_data IS 'Sailing Instructions or Notice of Race text pasted by user for AI analysis';
COMMENT ON COLUMN races.race_area_image_url IS 'URL to course map, race area diagram, or aerial photo of racing area';
