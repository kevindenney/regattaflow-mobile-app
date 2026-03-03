-- =============================================================================
-- Seed Secondary Pack Domain Catalog Stubs
--
-- Canonical ownership:
-- - Owns additive `domain_catalog` stub entries for canonical secondary packs
--   (`drawing`, `golf` mapped to fitness domain).
-- Override intent:
-- - Additive only; does not modify RLS/policies/functions.
-- =============================================================================

BEGIN;

INSERT INTO public.domain_catalog (domain, catalog_type, key, value, metadata, is_active)
VALUES
  (
    'drawing',
    'label',
    'pack.display_name',
    'Drawing',
    jsonb_build_object('pack', 'drawing', 'tier', 'secondary'),
    true
  ),
  (
    'drawing',
    'action',
    'program.quick_action',
    'Critique Cycle',
    jsonb_build_object('pack', 'drawing', 'tier', 'secondary', 'surface', 'programs'),
    true
  ),
  (
    'drawing',
    'template',
    'program.stub',
    'Studio Sprint Template',
    jsonb_build_object('pack', 'drawing', 'tier', 'secondary', 'status', 'stub'),
    true
  ),
  (
    'fitness',
    'label',
    'pack.display_name',
    'Golf',
    jsonb_build_object('pack', 'golf', 'mapped_domain', 'fitness', 'tier', 'secondary'),
    true
  ),
  (
    'fitness',
    'action',
    'program.quick_action',
    'Checkpoint Review',
    jsonb_build_object('pack', 'golf', 'mapped_domain', 'fitness', 'tier', 'secondary', 'surface', 'programs'),
    true
  ),
  (
    'fitness',
    'template',
    'program.stub',
    'Lesson Block Template',
    jsonb_build_object('pack', 'golf', 'mapped_domain', 'fitness', 'tier', 'secondary', 'status', 'stub'),
    true
  )
ON CONFLICT (domain, catalog_type, key)
DO UPDATE SET
  value = EXCLUDED.value,
  metadata = EXCLUDED.metadata,
  is_active = EXCLUDED.is_active,
  updated_at = now();

COMMIT;
