-- Backfill descriptions and icons for interests that were missing them.
-- The InterestSelection picker uses
-- `interest.hero_tagline || interest.description` as the card subtitle, and
-- icon_name to render the visual badge. Without these, cards render bare.

UPDATE interests
SET description = 'Visual problem-solving across products, brands, and digital experiences.'
WHERE slug = 'design'
  AND (description IS NULL OR description = '');

UPDATE interests
SET description = 'Knit garments, accessories, and patterns — from first stitches to finished sweaters.'
WHERE slug = 'knitting'
  AND (description IS NULL OR description = '');

UPDATE interests
SET description = 'Public health, infectious disease, and improving health outcomes worldwide.'
WHERE slug = 'global-health'
  AND (description IS NULL OR description = '');

-- Backfill Ionicons names for interests that don't have one yet.
UPDATE interests SET icon_name = 'pencil'   WHERE slug = 'drawing'      AND icon_name IS NULL;
UPDATE interests SET icon_name = 'barbell'  WHERE slug = 'fitness'      AND icon_name IS NULL;
UPDATE interests SET icon_name = 'medkit'   WHERE slug = 'global-health' AND icon_name IS NULL;
UPDATE interests SET icon_name = 'golf'     WHERE slug = 'golf'         AND icon_name IS NULL;
UPDATE interests SET icon_name = 'pulse'    WHERE slug = 'nursing'      AND icon_name IS NULL;
UPDATE interests SET icon_name = 'boat'     WHERE slug = 'sail-racing'  AND icon_name IS NULL;
