#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function addMockClients() {
  console.log('Adding mock coaching clients for Coach Anderson...\n');

  // Get user IDs
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const coachAnderson = users.find(u => u.email === 'coach.anderson@sailing.com');
  const sarahChen = users.find(u => u.email === 'sarah.chen@sailing.com');
  const mikeThompson = users.find(u => u.email === 'mike.thompson@racing.com');
  const emmaWilson = users.find(u => u.email === 'emma.wilson@yacht.club');

  if (!coachAnderson) {
    console.error('❌ Coach Anderson not found');
    return;
  }

  console.log(`✅ Found Coach Anderson: ${coachAnderson.id}\n`);

  const clients = [
    {
      _name: 'Sarah Chen',
      coach_id: coachAnderson.id,
      sailor_id: sarahChen?.id,
      status: 'active',
      total_sessions: 12,
      last_session_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      coach_notes: 'Sarah is making excellent progress on starts. Focus on boat handling in heavy air next session.',
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _name: 'Mike Thompson',
      coach_id: coachAnderson.id,
      sailor_id: mikeThompson?.id,
      status: 'active',
      total_sessions: 8,
      last_session_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      coach_notes: 'Working on tactical decision-making and mark roundings. Good improvement in last 3 sessions.',
      created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _name: 'Emma Wilson',
      coach_id: coachAnderson.id,
      sailor_id: emmaWilson?.id,
      status: 'active',
      total_sessions: 15,
      last_session_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      coach_notes: 'Emma has shown remarkable improvement in speed optimization. Ready for regional championships.',
      created_at: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  for (const client of clients) {
    const clientName = client._name;
    const { _name, ...clientData } = client; // Remove _name before upserting

    if (!client.sailor_id) {
      console.log(`⚠️  Skipping ${clientName} - user not found`);
      continue;
    }

    try {
      const { error } = await supabase
        .from('coaching_clients')
        .upsert(clientData, {
          onConflict: 'coach_id,sailor_id',
        });

      if (error) {
        console.error(`❌ Error adding ${clientName}:`, error.message);
      } else {
        console.log(`✅ Added client: ${clientName}`);
      }
    } catch (err) {
      console.error(`❌ Exception adding ${clientName}:`, err);
    }
  }

  console.log('\n✅ Mock client data creation complete!');
}

addMockClients().catch(console.error);
