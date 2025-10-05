import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyRLSPolicies() {
  console.log('🔒 Checking and applying RLS policies to users table...\n')

  try {
    // Check if RLS is enabled by querying the users table metadata
    console.log('📋 Checking current table structure...')
    const { data: users, error: checkError } = await supabase
      .from('users')
      .select('id, email, user_type')
      .limit(1)

    if (checkError) {
      console.error('❌ Error querying users table:', checkError)
      console.log('\nℹ️  This might indicate RLS is already enabled or there are permission issues.')
    } else {
      console.log('✅ Users table is accessible')
      console.log(`Found ${users?.length || 0} user(s) in test query`)
    }

    // Check columns
    console.log('\n📊 Checking columns in users table...')
    const { data: columns, error: colError } = await supabase
      .from('users')
      .select('*')
      .limit(0)

    if (!colError) {
      const columnNames = Object.keys(columns?.[0] || {})
      console.log('Columns:', columnNames.length > 0 ? columnNames.join(', ') : 'Unable to determine columns')

      const hasUserType = columnNames.includes('user_type')
      console.log(`\nuser_type column exists: ${hasUserType ? '✅ YES' : '❌ NO'}`)
    }

    // Note: We cannot directly check RLS status or policies without direct database access
    // The migration file at supabase/migrations/20251015_users_rls_policies.sql contains:
    // - ALTER TABLE public.users ENABLE ROW LEVEL SECURITY
    // - CREATE POLICY "Users read own row" ON public.users FOR SELECT USING (auth.uid() = id)
    // - CREATE POLICY "Users update own row" ON public.users FOR UPDATE USING (auth.uid() = id)
    // - CREATE VIEW public.me AS SELECT id, email, user_type FROM users WHERE id = auth.uid()

    console.log('\n⚠️  RLS Policies Setup Instructions:')
    console.log('==========================================')
    console.log('The RLS migration file exists at:')
    console.log('  supabase/migrations/20251015_users_rls_policies.sql')
    console.log('\nTo apply it, you have two options:')
    console.log('\n1. Using Supabase Dashboard:')
    console.log('   - Go to https://supabase.com/dashboard/project/qavekrwdbsobecwrfxwu/editor')
    console.log('   - Navigate to SQL Editor')
    console.log('   - Copy and paste the SQL from the migration file')
    console.log('   - Run the SQL')
    console.log('\n2. Using psql (if you have database password):')
    console.log('   - Get your database password from Supabase dashboard')
    console.log('   - Run: psql "postgresql://postgres:[PASSWORD]@db.qavekrwdbsobecwrfxwu.supabase.co:5432/postgres"')
    console.log('   - Copy/paste the SQL from migration file')
    console.log('\n3. Using Supabase CLI (recommended):')
    console.log('   - The migration will be applied when you run: npx supabase db push')
    console.log('   - Note: You may need to resolve migration conflicts first')

    console.log('\n📄 Migration SQL Summary:')
    console.log('==========================================')
    console.log('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;')
    console.log('CREATE POLICY "Users read own row" ON public.users FOR SELECT USING (auth.uid() = id);')
    console.log('CREATE POLICY "Users update own row" ON public.users FOR UPDATE USING (auth.uid() = id);')
    console.log('CREATE VIEW public.me AS SELECT id, email, user_type FROM users WHERE id = auth.uid();')
    console.log('GRANT SELECT ON public.me TO anon, authenticated;')

  } catch (err) {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  }
}

applyRLSPolicies()
