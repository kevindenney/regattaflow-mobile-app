import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyRLSPolicies() {
  console.log('🔒 Applying RLS policies to users table...\n')

  const sql = `
-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users read own row" ON public.users;
DROP POLICY IF EXISTS "Users update own row" ON public.users;

-- Create new policies
CREATE POLICY "Users read own row"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own row"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Create a convenience view
DROP VIEW IF EXISTS public.me CASCADE;
CREATE OR REPLACE VIEW public.me AS
SELECT id, email, user_type FROM public.users WHERE id = auth.uid();

-- Grant permissions on the view
GRANT SELECT ON public.me TO anon, authenticated;
`

  try {
    // Execute SQL using raw query
    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error('❌ Error applying RLS policies:', error)
      throw error
    }

    console.log('✅ RLS policies applied successfully!')

    // Verify the policies
    console.log('\n📋 Verifying policies...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname')
      .eq('tablename', 'users')

    if (policiesError) {
      console.error('❌ Error fetching policies:', policiesError)
    } else {
      console.log('Policies on users table:')
      console.table(policies)
    }

    // Check if RLS is enabled
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename, rowsecurity')
      .eq('tablename', 'users')

    if (tablesError) {
      console.error('❌ Error checking RLS status:', tablesError)
    } else {
      console.log('\nRLS Status:')
      console.table(tables)
    }

    // Check columns
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')

    if (columnsError) {
      console.error('❌ Error fetching columns:', columnsError)
    } else {
      console.log('\nColumns in users table:')
      console.log(columns.map(c => c.column_name).join(', '))
    }

  } catch (err) {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  }
}

applyRLSPolicies()
