-- Migration: Optimize RLS policies by wrapping auth.uid() and auth.jwt() in subqueries
-- This prevents PostgreSQL from re-evaluating these functions for each row
-- Fixes "Auth RLS Initialization Plan" performance warnings

DO $$
DECLARE
    pol RECORD;
    new_qual TEXT;
    new_with_check TEXT;
    drop_sql TEXT;
    create_sql TEXT;
    cmd_clause TEXT;
    using_clause TEXT;
    with_check_clause TEXT;
    roles_clause TEXT;
    permissive_clause TEXT;
    fixed_count INTEGER := 0;
BEGIN
    -- Loop through all policies in public schema that use auth functions without subquery wrapper
    FOR pol IN
        SELECT
            schemaname,
            tablename,
            policyname,
            cmd,
            permissive,
            roles::text[] as roles_arr,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public'
          AND (
            (qual IS NOT NULL AND qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%')
            OR (qual IS NOT NULL AND qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%' AND qual NOT LIKE '%(select auth.jwt())%')
            OR (with_check IS NOT NULL AND with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%')
            OR (with_check IS NOT NULL AND with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%' AND with_check NOT LIKE '%(select auth.jwt())%')
          )
    LOOP
        -- Replace auth.uid() with (SELECT auth.uid()) and auth.jwt() with (SELECT auth.jwt())
        new_qual := pol.qual;
        new_with_check := pol.with_check;

        IF new_qual IS NOT NULL THEN
            -- Replace auth.uid() - simple string replacement since we filtered out already-wrapped ones
            new_qual := replace(new_qual, 'auth.uid()', '(SELECT auth.uid())');
            -- Replace auth.jwt()
            new_qual := replace(new_qual, 'auth.jwt()', '(SELECT auth.jwt())');
        END IF;

        IF new_with_check IS NOT NULL THEN
            -- Replace auth.uid()
            new_with_check := replace(new_with_check, 'auth.uid()', '(SELECT auth.uid())');
            -- Replace auth.jwt()
            new_with_check := replace(new_with_check, 'auth.jwt()', '(SELECT auth.jwt())');
        END IF;

        -- Build the command clause
        CASE pol.cmd
            WHEN 'SELECT' THEN cmd_clause := 'FOR SELECT';
            WHEN 'INSERT' THEN cmd_clause := 'FOR INSERT';
            WHEN 'UPDATE' THEN cmd_clause := 'FOR UPDATE';
            WHEN 'DELETE' THEN cmd_clause := 'FOR DELETE';
            WHEN 'ALL' THEN cmd_clause := 'FOR ALL';
            ELSE cmd_clause := 'FOR ALL';
        END CASE;

        -- Build roles clause
        IF pol.roles_arr = ARRAY['public'] THEN
            roles_clause := 'TO public';
        ELSE
            roles_clause := 'TO ' || array_to_string(pol.roles_arr, ', ');
        END IF;

        -- Build permissive clause
        IF pol.permissive = 'PERMISSIVE' THEN
            permissive_clause := 'AS PERMISSIVE';
        ELSE
            permissive_clause := 'AS RESTRICTIVE';
        END IF;

        -- Build USING clause
        IF new_qual IS NOT NULL THEN
            using_clause := 'USING (' || new_qual || ')';
        ELSE
            using_clause := '';
        END IF;

        -- Build WITH CHECK clause
        IF new_with_check IS NOT NULL THEN
            with_check_clause := 'WITH CHECK (' || new_with_check || ')';
        ELSE
            with_check_clause := '';
        END IF;

        -- Drop the existing policy
        drop_sql := format('DROP POLICY IF EXISTS %I ON %I.%I',
                          pol.policyname, pol.schemaname, pol.tablename);

        -- Create the new policy
        create_sql := format('CREATE POLICY %I ON %I.%I %s %s %s %s %s',
                            pol.policyname,
                            pol.schemaname,
                            pol.tablename,
                            permissive_clause,
                            cmd_clause,
                            roles_clause,
                            using_clause,
                            with_check_clause);

        -- Execute the drop and create
        BEGIN
            EXECUTE drop_sql;
            EXECUTE create_sql;
            fixed_count := fixed_count + 1;
            RAISE NOTICE 'Fixed policy: %.%', pol.tablename, pol.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to fix policy %.%: %', pol.tablename, pol.policyname, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE 'Successfully optimized % RLS policies', fixed_count;
END $$;
