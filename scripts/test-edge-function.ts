/**
 * Quick test of the anthropic-skills-proxy Edge Function
 */

async function testEdgeFunction() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  const url = `${supabaseUrl}/functions/v1/anthropic-skills-proxy`;

  console.log('Testing Edge Function:', url);
  console.log('Action: list_skills\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ action: 'list_skills' }),
    });

    console.log('Status:', response.status, response.statusText);

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('\n❌ Request failed');
      process.exit(1);
    }

    console.log('\n✅ Success!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testEdgeFunction();
