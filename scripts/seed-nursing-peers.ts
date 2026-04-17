/**
 * Seed demo nursing peer students for the JHU dean demo.
 *
 * Creates 5 fake peer users, subscribes each of them to every nursing
 * blueprint the target user is currently subscribed to, and populates each
 * peer's timeline_steps with a distinct slice of the MSN Entry into Nursing
 * curriculum so the Peers rail on the races tab actually reads as populated.
 *
 * Run with:
 *   EXPO_PUBLIC_SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   DEMO_PASSWORD=... \
 *   npx tsx scripts/seed-nursing-peers.ts --user-email denneyke@gmail.com
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

const NURSING_INTEREST_ID = 'bec249c5-6412-4d16-bb84-bfcfb887ff67';

// Parse --user-email arg, default to denneyke@gmail.com
function parseUserEmail(): string {
  const args = process.argv.slice(2);
  const idx = args.findIndex((a) => a === '--user-email');
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  const eqArg = args.find((a) => a.startsWith('--user-email='));
  if (eqArg) return eqArg.split('=')[1];
  return 'denneyke@gmail.com';
}

type PeerSpec = {
  slot: number;
  email: string;
  fullName: string;
  progressCursor: number; // 1..7 — which MSN template they are currently on
};

const PEERS: PeerSpec[] = [
  { slot: 1, email: 'nursing-peer-1@demo.regattaflow.io', fullName: 'Maya Patel', progressCursor: 2 },
  { slot: 2, email: 'nursing-peer-2@demo.regattaflow.io', fullName: 'Jordan Kim', progressCursor: 4 },
  { slot: 3, email: 'nursing-peer-3@demo.regattaflow.io', fullName: 'Ariana Lopez', progressCursor: 5 },
  { slot: 4, email: 'nursing-peer-4@demo.regattaflow.io', fullName: 'Sam Chen', progressCursor: 6 },
  { slot: 5, email: 'nursing-peer-5@demo.regattaflow.io', fullName: 'Priya Nair', progressCursor: 7 },
];

// MSN Entry into Nursing curriculum, matches templates seeded in
// supabase/migrations/20260410120000_seed_jhu_degree_programs_and_templates.sql
const MSN_CURRICULUM: Array<{ title: string; description: string; category: string }> = [
  {
    title: 'Fundamentals & Patient Safety',
    description: 'Health assessment foundations, nursing fundamentals, patient safety, simulation lab orientation',
    category: 'foundational',
  },
  {
    title: 'Adult Health Nursing',
    description: 'Adult health nursing, medication administration, wound care, IV therapy, clinical rotations at JH Hospital',
    category: 'clinical',
  },
  {
    title: 'Pediatric Nursing',
    description: 'Pediatric assessment, family-centered care, developmental milestones, clinical at Kennedy Krieger Institute',
    category: 'clinical',
  },
  {
    title: 'Maternal-Newborn Nursing',
    description: 'Maternal-newborn care, prenatal assessment, labor & delivery, postpartum — clinical at JH Bayview',
    category: 'clinical',
  },
  {
    title: 'Critical Care Nursing',
    description: 'Critical care nursing, ventilator management, hemodynamic monitoring, code response, ICU rotations',
    category: 'clinical',
  },
  {
    title: 'Psych & Behavioral Health',
    description: 'Psychiatric & behavioral health nursing, therapeutic communication — clinical at MedStar Harbor',
    category: 'clinical',
  },
  {
    title: 'Capstone & NCLEX Prep',
    description: 'Capstone clinical immersion integrating all competencies, NCLEX preparation',
    category: 'capstone',
  },
];

// Per-peer wording variety so the rail does not look copy-pasted. Only
// applied to in-progress / planned steps for the given peer slot; falls
// back to the base curriculum title when no override is set.
const PEER_TITLE_OVERRIDES: Record<number, Partial<Record<number, string>>> = {
  1: {
    2: 'Adult Health: first med-surg rotation',
  },
  2: {
    4: 'Maternal-Newborn: L&D clinical week',
    5: 'Upcoming: ICU critical care rotation',
  },
  3: {
    5: 'Clinical shift: ICU head-to-toe assessments',
    6: 'Upcoming: psych rotation at MedStar Harbor',
  },
  4: {
    6: 'Psych rotation: therapeutic communication sims',
    7: 'NCLEX review plan kickoff',
  },
  5: {
    7: 'Capstone immersion + NCLEX cram',
  },
};

function dayOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!DEMO_PASSWORD) {
    console.error('❌ DEMO_PASSWORD environment variable is required');
    process.exit(1);
  }

  const targetEmail = parseUserEmail();
  console.log(`🎯 Target user: ${targetEmail}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Resolve target user id
  console.log('\n📡 Resolving target user...');
  const { data: allUsersPage, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    console.error('❌ auth.admin.listUsers failed:', listErr.message);
    process.exit(1);
  }
  const targetUser = allUsersPage?.users.find((u) => u.email === targetEmail);
  if (!targetUser) {
    console.error(`❌ No user with email ${targetEmail} found. Aborting.`);
    process.exit(1);
  }
  const targetUserId = targetUser.id;
  console.log(`   ✅ ${targetEmail} → ${targetUserId}`);

  // 2. Find the target user's subscribed nursing blueprints
  console.log('\n📚 Looking up subscribed nursing blueprints...');
  const { data: subs, error: subsErr } = await supabase
    .from('blueprint_subscriptions')
    .select('blueprint_id, timeline_blueprints!inner(id, title, interest_id)')
    .eq('subscriber_id', targetUserId)
    .eq('timeline_blueprints.interest_id', NURSING_INTEREST_ID);

  if (subsErr) {
    console.error('❌ Failed to query blueprint_subscriptions:', subsErr.message);
    process.exit(1);
  }

  const blueprintIds = (subs ?? [])
    .map((row: any) => row.timeline_blueprints?.id)
    .filter((id: string | undefined): id is string => typeof id === 'string');
  const blueprintTitles = new Map<string, string>();
  (subs ?? []).forEach((row: any) => {
    if (row.timeline_blueprints?.id) {
      blueprintTitles.set(row.timeline_blueprints.id, row.timeline_blueprints.title ?? '');
    }
  });

  if (blueprintIds.length === 0) {
    console.warn(
      '⚠️  Target user has no subscribed nursing blueprints. Peers will still be created but not subscribed to anything.'
    );
  } else {
    console.log(`   ✅ Found ${blueprintIds.length} nursing blueprint(s):`);
    blueprintIds.forEach((id) => console.log(`      • ${blueprintTitles.get(id) || id}`));
  }

  // 3. Create (or reuse) 5 peer users
  console.log('\n👥 Creating demo peer users...');
  const existingByEmail = new Map<string, string>();
  for (const u of allUsersPage?.users ?? []) {
    if (u.email) existingByEmail.set(u.email, u.id);
  }

  const resolvedPeers: Array<{ spec: PeerSpec; userId: string; reused: boolean }> = [];

  for (const spec of PEERS) {
    let userId = existingByEmail.get(spec.email);
    let reused = false;

    if (userId) {
      reused = true;
      console.log(`   ♻️  ${spec.email} already exists (${userId})`);
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: spec.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: spec.fullName,
          name: spec.fullName,
          role: 'sailor',
        },
      });
      if (createErr || !created.user) {
        console.error(`   ❌ Failed to create ${spec.email}:`, createErr?.message);
        continue;
      }
      userId = created.user.id;
      console.log(`   ✅ Created ${spec.email} → ${userId}`);
    }

    // Upsert profile with full_name so the Peers rail shows a readable name.
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: spec.email,
          full_name: spec.fullName,
        },
        { onConflict: 'id' }
      );
    if (profileErr) {
      console.warn(`   ⚠️  Could not upsert profile for ${spec.email}:`, profileErr.message);
    }

    resolvedPeers.push({ spec, userId, reused });
  }

  // 4. Subscribe each peer to every resolved blueprint
  if (blueprintIds.length > 0 && resolvedPeers.length > 0) {
    console.log('\n🔗 Subscribing peers to blueprints...');
    const subscriptionRows = resolvedPeers.flatMap(({ userId }) =>
      blueprintIds.map((blueprintId) => ({
        blueprint_id: blueprintId,
        subscriber_id: userId,
        subscribed_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
        auto_adopt: false,
      }))
    );
    const { error: subUpsertErr } = await supabase
      .from('blueprint_subscriptions')
      .upsert(subscriptionRows, { onConflict: 'blueprint_id,subscriber_id' });
    if (subUpsertErr) {
      console.error('   ❌ Failed to upsert subscriptions:', subUpsertErr.message);
    } else {
      console.log(
        `   ✅ Upserted ${subscriptionRows.length} subscription row(s) (${resolvedPeers.length} peers × ${blueprintIds.length} blueprints)`
      );
    }
  }

  // 5. Seed timeline_steps for each peer
  console.log('\n🧭 Seeding timeline_steps for each peer...');
  let stepsInserted = 0;
  let stepsSkipped = 0;

  // Primary blueprint used for source_blueprint_id lineage; if the user has
  // multiple, we link steps to the first one so the Peers query (which loads
  // per-blueprint) still surfaces each peer under every subscribed blueprint.
  const primaryBlueprintId = blueprintIds[0] ?? null;

  for (const { spec, userId } of resolvedPeers) {
    // Check if this peer already has MSN steps (idempotency).
    const { data: existingSteps, error: existingErr } = await supabase
      .from('timeline_steps')
      .select('id, title')
      .eq('user_id', userId)
      .eq('interest_id', NURSING_INTEREST_ID)
      .in(
        'title',
        MSN_CURRICULUM.map((c) => c.title)
      );
    if (existingErr) {
      console.warn(`   ⚠️  Could not check existing steps for ${spec.fullName}:`, existingErr.message);
    }
    if ((existingSteps?.length ?? 0) >= MSN_CURRICULUM.length) {
      console.log(`   ♻️  ${spec.fullName}: already has ${existingSteps?.length} steps, skipping`);
      stepsSkipped += existingSteps?.length ?? 0;
      continue;
    }

    const rows = MSN_CURRICULUM.map((tpl, idx) => {
      const oneBasedIdx = idx + 1;
      const overrideTitle = PEER_TITLE_OVERRIDES[spec.slot]?.[oneBasedIdx];
      let status: 'pending' | 'in_progress' | 'completed';
      let completedAt: string | null = null;
      let dueAt: string | null = null;
      let title = tpl.title;

      if (oneBasedIdx < spec.progressCursor) {
        status = 'completed';
        // Space completions back over the past ~semester
        const daysAgo = (spec.progressCursor - oneBasedIdx) * 45;
        completedAt = dayOffset(-daysAgo);
      } else if (oneBasedIdx === spec.progressCursor) {
        status = 'in_progress';
        dueAt = dayOffset(7);
        if (overrideTitle) title = overrideTitle;
      } else {
        status = 'pending';
        dueAt = dayOffset((oneBasedIdx - spec.progressCursor) * 35);
        if (overrideTitle) title = overrideTitle;
      }

      return {
        user_id: userId,
        interest_id: NURSING_INTEREST_ID,
        source_type: 'blueprint' as const,
        source_blueprint_id: primaryBlueprintId,
        title,
        description: tpl.description,
        category: tpl.category,
        status,
        completed_at: completedAt,
        due_at: dueAt,
        visibility: 'followers' as const,
        sort_order: idx,
        metadata: {
          demo_peer: true,
          msn_template_index: oneBasedIdx,
        },
      };
    });

    const { error: insertErr, count } = await supabase
      .from('timeline_steps')
      .insert(rows, { count: 'exact' });
    if (insertErr) {
      console.error(`   ❌ Failed to insert steps for ${spec.fullName}:`, insertErr.message);
      continue;
    }
    stepsInserted += count ?? rows.length;
    console.log(
      `   ✅ ${spec.fullName}: inserted ${count ?? rows.length} steps (cursor=${spec.progressCursor})`
    );
  }

  // 6. Summary
  console.log('\n──────────────────────────────────────');
  console.log('✨ Seed complete.');
  console.log(`   peers resolved:      ${resolvedPeers.length}`);
  console.log(`   blueprints resolved: ${blueprintIds.length}`);
  console.log(`   steps inserted:      ${stepsInserted}`);
  console.log(`   steps skipped:       ${stepsSkipped}`);
  console.log('──────────────────────────────────────\n');
}

main().catch((err) => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});
