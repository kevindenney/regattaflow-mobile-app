-- SECURITY DEFINER function to copy library resources from one user to another
-- during step adoption. Bypasses RLS so the adopter can read the author's resources.
-- Returns a JSON object mapping old resource IDs to new resource IDs.

CREATE OR REPLACE FUNCTION copy_library_resources_for_adoption(
  p_source_resource_ids UUID[],
  p_adopter_user_id UUID,
  p_interest_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_library_id UUID;
  v_resource RECORD;
  v_new_id UUID;
  v_id_map JSONB := '{}'::JSONB;
BEGIN
  -- Nothing to copy
  IF array_length(p_source_resource_ids, 1) IS NULL THEN
    RETURN v_id_map;
  END IF;

  -- Ensure adopter has a library for this interest
  SELECT id INTO v_library_id
  FROM user_libraries
  WHERE user_id = p_adopter_user_id AND interest_id = p_interest_id
  LIMIT 1;

  IF v_library_id IS NULL THEN
    INSERT INTO user_libraries (user_id, interest_id, name)
    VALUES (p_adopter_user_id, p_interest_id, 'My Library')
    RETURNING id INTO v_library_id;
  END IF;

  -- Copy each source resource into the adopter's library
  FOR v_resource IN
    SELECT * FROM library_resources
    WHERE id = ANY(p_source_resource_ids)
  LOOP
    INSERT INTO library_resources (
      library_id, user_id, title, url, resource_type,
      source_platform, author_or_creator, description,
      thumbnail_url, capability_goals, tags, metadata
    ) VALUES (
      v_library_id, p_adopter_user_id, v_resource.title, v_resource.url,
      COALESCE(v_resource.resource_type, 'other'),
      v_resource.source_platform, v_resource.author_or_creator,
      v_resource.description, v_resource.thumbnail_url,
      COALESCE(v_resource.capability_goals, '[]'::JSONB),
      COALESCE(v_resource.tags, '[]'::JSONB),
      COALESCE(v_resource.metadata, '{}'::JSONB) || jsonb_build_object('copied_from', v_resource.id)
    )
    RETURNING id INTO v_new_id;

    v_id_map := v_id_map || jsonb_build_object(v_resource.id::TEXT, v_new_id::TEXT);
  END LOOP;

  RETURN v_id_map;
END;
$$;
