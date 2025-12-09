-- Seed Demo Sailor with complete data for race suggestions
-- Fixed to match actual club_events schema

DO $$
DECLARE
    demo_sailor_id UUID;
    sfyc_id UUID;
    hkryc_id UUID;
BEGIN
    -- Get Demo Sailor's ID
    SELECT id INTO demo_sailor_id
    FROM auth.users
    WHERE email = 'demo-sailor@regattaflow.io';

    IF demo_sailor_id IS NULL THEN
        RAISE EXCEPTION 'Demo Sailor not found';
    END IF;

    RAISE NOTICE 'Demo Sailor ID: %', demo_sailor_id;

    -- Get club IDs (or create if they don't exist)
    SELECT id INTO sfyc_id FROM clubs WHERE short_name = 'SFYC' LIMIT 1;
    SELECT id INTO hkryc_id FROM clubs WHERE short_name = 'HKRYC' LIMIT 1;

    -- Create San Francisco YC if it doesn't exist
    IF sfyc_id IS NULL THEN
        INSERT INTO clubs (name, short_name, website, location)
        VALUES (
            'San Francisco Yacht Club',
            'SFYC',
            'https://sfyc.org',
            ST_GeogFromText('POINT(-122.4680 37.8651)')
        )
        RETURNING id INTO sfyc_id;
        RAISE NOTICE 'Created SFYC: %', sfyc_id;
    END IF;

    -- Create Hong Kong Royal YC if it doesn't exist
    IF hkryc_id IS NULL THEN
        INSERT INTO clubs (name, short_name, website, location)
        VALUES (
            'Hong Kong Royal Yacht Club',
            'HKRYC',
            'https://rhkyc.org.hk',
            ST_GeogFromText('POINT(114.1733 22.2840)')
        )
        RETURNING id INTO hkryc_id;
        RAISE NOTICE 'Created HKRYC: %', hkryc_id;
    END IF;

    -- Add Demo Sailor to clubs
    INSERT INTO club_members (user_id, club_id, role, is_active)
    VALUES (demo_sailor_id, sfyc_id, 'member', true)
    ON CONFLICT (user_id, club_id) DO UPDATE SET is_active = true;

    INSERT INTO club_members (user_id, club_id, role, is_active)
    VALUES (demo_sailor_id, hkryc_id, 'member', true)
    ON CONFLICT (user_id, club_id) DO UPDATE SET is_active = true;

    RAISE NOTICE 'Added Demo Sailor to clubs';

    -- Create upcoming club events for SFYC
    INSERT INTO club_events (
        club_id,
        title,
        description,
        event_type,
        start_date,
        end_date,
        location_name,
        location_coordinates,
        website_url,
        status,
        created_by,
        created_at
    ) VALUES
    (
        sfyc_id,
        'Spring Championship Series - Race 1',
        'First race of the Spring Championship Series. All divisions welcome.',
        'regatta',
        (CURRENT_DATE + INTERVAL '14 days')::timestamp,
        (CURRENT_DATE + INTERVAL '14 days')::timestamp,
        'San Francisco Bay',
        '{"lat": 37.8651, "lng": -122.4680}'::jsonb,
        'https://sfyc.org/spring-champs',
        'upcoming',
        demo_sailor_id,
        NOW()
    ),
    (
        sfyc_id,
        'Spring Championship Series - Race 2',
        'Second race of the Spring Championship Series.',
        'regatta',
        (CURRENT_DATE + INTERVAL '21 days')::timestamp,
        (CURRENT_DATE + INTERVAL '21 days')::timestamp,
        'San Francisco Bay',
        '{"lat": 37.8651, "lng": -122.4680}'::jsonb,
        'https://sfyc.org/spring-champs',
        'upcoming',
        demo_sailor_id,
        NOW()
    ),
    (
        sfyc_id,
        'Summer Twilight Series',
        'Evening racing series every Thursday. Casual racing with post-race social.',
        'series',
        (CURRENT_DATE + INTERVAL '30 days')::timestamp,
        (CURRENT_DATE + INTERVAL '90 days')::timestamp,
        'San Francisco Bay',
        '{"lat": 37.8651, "lng": -122.4680}'::jsonb,
        'https://sfyc.org/twilight',
        'upcoming',
        demo_sailor_id,
        NOW()
    ),
    (
        sfyc_id,
        'Big Boat Series 2025',
        'Premier big boat regatta on San Francisco Bay.',
        'regatta',
        (CURRENT_DATE + INTERVAL '45 days')::timestamp,
        (CURRENT_DATE + INTERVAL '48 days')::timestamp,
        'San Francisco Bay',
        '{"lat": 37.8651, "lng": -122.4680}'::jsonb,
        'https://sfyc.org/bigboat',
        'upcoming',
        demo_sailor_id,
        NOW()
    )
    ON CONFLICT DO NOTHING;

    -- Create upcoming club events for HKRYC
    INSERT INTO club_events (
        club_id,
        title,
        description,
        event_type,
        start_date,
        end_date,
        location_name,
        location_coordinates,
        website_url,
        status,
        created_by,
        created_at
    ) VALUES
    (
        hkryc_id,
        'Hong Kong Dragon Championships 2025',
        'Annual dragon boat racing championship.',
        'regatta',
        (CURRENT_DATE + INTERVAL '60 days')::timestamp,
        (CURRENT_DATE + INTERVAL '62 days')::timestamp,
        'Victoria Harbour',
        '{"lat": 22.2840, "lng": 114.1733}'::jsonb,
        'https://rhkyc.org.hk/dragon-champs',
        'upcoming',
        demo_sailor_id,
        NOW()
    ),
    (
        hkryc_id,
        'Around the Island Race',
        'Classic circumnavigation of Hong Kong Island.',
        'distance_race',
        (CURRENT_DATE + INTERVAL '75 days')::timestamp,
        (CURRENT_DATE + INTERVAL '75 days')::timestamp,
        'Hong Kong',
        '{"lat": 22.2840, "lng": 114.1733}'::jsonb,
        'https://rhkyc.org.hk/around-island',
        'upcoming',
        demo_sailor_id,
        NOW()
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created 6 upcoming club events';

    -- Invalidate Demo Sailor's suggestion cache so fresh suggestions are generated
    DELETE FROM race_suggestions_cache WHERE user_id = demo_sailor_id;

    RAISE NOTICE '✅ Demo Sailor data seeded successfully!';
    RAISE NOTICE '   - Added to 2 clubs (SFYC, HKRYC)';
    RAISE NOTICE '   - Created 6 upcoming club events';
    RAISE NOTICE '   - Invalidated suggestion cache';
    RAISE NOTICE '   - Demo Sailor already has 1 fleet and 6 historical races';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Refresh the Add Race page to see suggestions!';
END $$;
