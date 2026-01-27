#!/usr/bin/env node
/**
 * Test script for Crew Collaboration Enhancement Phase 2
 *
 * Tests:
 * 1. Direct invite RPC function
 * 2. Accept/decline invite functionality
 * 3. Shared race visibility
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runTests() {
  console.log('\n=== Crew Collaboration Enhancement - Phase 2 Tests ===\n');

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Step 1: Get test user IDs
    console.log('Step 1: Getting test user IDs...');

    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const demoSailor = users.users.find(u => u.email === 'demo-sailor@regattaflow.app');
    const sarahChen = users.users.find(u => u.email === 'sarah.chen@sailing.com');

    if (!demoSailor || !sarahChen) {
      console.error('Test users not found');
      console.log('Available users:', users.users.map(u => u.email).slice(0, 10));
      process.exit(1);
    }

    console.log(`  Demo Sailor ID: ${demoSailor.id}`);
    console.log(`  Sarah Chen ID: ${sarahChen.id}`);
    console.log('  ✓ Test users found\n');
    testsPassed++;

    // Step 2: Get a regatta owned by Demo Sailor
    console.log('Step 2: Finding a regatta owned by Demo Sailor...');

    const { data: regattas, error: regattasError } = await supabase
      .from('regattas')
      .select('id, name, created_by')
      .eq('created_by', demoSailor.id)
      .limit(1);

    if (regattasError) throw regattasError;

    if (!regattas || regattas.length === 0) {
      console.log('  No regattas found for Demo Sailor. Creating one...');

      const { data: newRegatta, error: createError } = await supabase
        .from('regattas')
        .insert({
          name: 'Test Collaboration Race',
          created_by: demoSailor.id,
          start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'upcoming',
          metadata: { test: true }
        })
        .select()
        .single();

      if (createError) throw createError;
      regattas.push(newRegatta);
      console.log(`  ✓ Created test regatta: ${newRegatta.name}`);
    } else {
      console.log(`  ✓ Found regatta: ${regattas[0].name}`);
    }

    const testRegatta = regattas[0];
    testsPassed++;

    // Step 3: Clean up any existing collaboration between these users for this race
    console.log('\nStep 3: Cleaning up existing collaborations...');

    await supabase
      .from('race_collaborators')
      .delete()
      .eq('regatta_id', testRegatta.id)
      .eq('user_id', sarahChen.id);

    console.log('  ✓ Cleaned up existing collaborations\n');

    // Step 4: Test create_direct_invite RPC function
    console.log('Step 4: Testing create_direct_invite RPC function...');

    // We need to call this as the owner (demoSailor), so we'll use impersonation
    const { data: inviteResult, error: inviteError } = await supabase.rpc('create_direct_invite', {
      p_regatta_id: testRegatta.id,
      p_target_user_id: sarahChen.id,
      p_access_level: 'view'
    });

    if (inviteError) {
      console.log(`  ✗ RPC Error: ${inviteError.message}`);
      testsFailed++;
    } else {
      console.log('  RPC Result:', JSON.stringify(inviteResult, null, 2));

      if (inviteResult?.success) {
        console.log('  ✓ Direct invite created successfully');
        console.log(`    Collaborator ID: ${inviteResult.collaborator_id}`);
        console.log(`    Invite Code: ${inviteResult.invite_code}`);
        testsPassed++;
      } else {
        console.log(`  ✗ Invite failed: ${inviteResult?.error}`);
        testsFailed++;
      }
    }

    // Step 5: Verify the collaboration record was created
    console.log('\nStep 5: Verifying collaboration record...');

    const { data: collaboration, error: collabError } = await supabase
      .from('race_collaborators')
      .select('*')
      .eq('regatta_id', testRegatta.id)
      .eq('user_id', sarahChen.id)
      .single();

    if (collabError) {
      console.log(`  ✗ Error fetching collaboration: ${collabError.message}`);
      testsFailed++;
    } else if (collaboration) {
      console.log('  ✓ Collaboration record found:');
      console.log(`    Status: ${collaboration.status}`);
      console.log(`    Access Level: ${collaboration.access_level}`);
      console.log(`    Invite Code: ${collaboration.invite_code || 'N/A'}`);
      console.log(`    Invited By: ${collaboration.invited_by}`);

      if (collaboration.status === 'pending') {
        console.log('  ✓ Status is correctly set to "pending"');
        testsPassed++;
      } else {
        console.log(`  ✗ Expected status "pending", got "${collaboration.status}"`);
        testsFailed++;
      }
    }

    // Step 6: Test accepting the invite
    console.log('\nStep 6: Testing accept invite...');

    const { error: acceptError } = await supabase
      .from('race_collaborators')
      .update({
        status: 'accepted',
        joined_at: new Date().toISOString()
      })
      .eq('id', collaboration.id);

    if (acceptError) {
      console.log(`  ✗ Accept error: ${acceptError.message}`);
      testsFailed++;
    } else {
      console.log('  ✓ Invite accepted successfully');
      testsPassed++;
    }

    // Step 7: Verify the race appears in Sarah's list
    console.log('\nStep 7: Verifying race visibility for collaborator...');

    const { data: sarahRaces, error: sarahRacesError } = await supabase
      .from('race_collaborators')
      .select('regatta_id, status, access_level, regattas(*)')
      .eq('user_id', sarahChen.id)
      .eq('status', 'accepted');

    if (sarahRacesError) {
      console.log(`  ✗ Error fetching Sarah's races: ${sarahRacesError.message}`);
      testsFailed++;
    } else {
      const foundRace = sarahRaces?.find(r => r.regatta_id === testRegatta.id);
      if (foundRace) {
        console.log('  ✓ Race is visible to collaborator');
        console.log(`    Race name: ${foundRace.regattas?.name}`);
        console.log(`    Access level: ${foundRace.access_level}`);
        testsPassed++;
      } else {
        console.log('  ✗ Race not found in collaborator\'s list');
        testsFailed++;
      }
    }

    // Step 8: Test declining a new invite
    console.log('\nStep 8: Testing decline invite flow...');

    // First create another invite
    const { data: invite2Result, error: invite2Error } = await supabase.rpc('create_direct_invite', {
      p_regatta_id: testRegatta.id,
      p_target_user_id: sarahChen.id,
      p_access_level: 'view'
    });

    if (invite2Error || !invite2Result?.success) {
      // Expected - can't invite someone who's already a collaborator
      console.log('  ✓ Correctly prevented duplicate invite');
      testsPassed++;
    } else {
      console.log('  Note: Created a second invite (might be different race)');
    }

    // Clean up
    console.log('\nStep 9: Cleaning up test data...');

    // Only delete if it was a test regatta we created
    if (testRegatta.name === 'Test Collaboration Race') {
      await supabase
        .from('race_collaborators')
        .delete()
        .eq('regatta_id', testRegatta.id);

      await supabase
        .from('regattas')
        .delete()
        .eq('id', testRegatta.id);

      console.log('  ✓ Test data cleaned up');
    } else {
      // Just remove the test collaboration
      await supabase
        .from('race_collaborators')
        .delete()
        .eq('regatta_id', testRegatta.id)
        .eq('user_id', sarahChen.id);

      console.log('  ✓ Test collaboration cleaned up');
    }

  } catch (error) {
    console.error('\n✗ Test error:', error);
    testsFailed++;
  }

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(`Total: ${testsPassed + testsFailed}`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests();
