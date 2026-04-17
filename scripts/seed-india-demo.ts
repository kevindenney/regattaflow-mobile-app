/**
 * Seed demo content for the India women entrepreneur use case.
 *
 * Creates a complete demo scenario set in Khunti, Jharkhand:
 * - Interest: "Lac Craft Business"
 * - Organization: "PRADAN — Khunti Unit"
 * - 6 users: Savitri (entrepreneur), Suman (NGO coach), Rakesh (BDO), 3 SHG peers
 * - 4 blueprints: MUDRA loan, Mukhyamantri scheme, DAY-NRLM SHG, Business skills
 * - Pre-seeded timelines at various progress stages
 *
 * Run with:
 *   EXPO_PUBLIC_SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   DEMO_PASSWORD=... \
 *   npx tsx scripts/seed-india-demo.ts
 *
 * Optional: --telegram-user-id <id> to link Savitri's account to your Telegram
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

function parseTelegramUserId(): string | null {
  const args = process.argv.slice(2);
  const idx = args.findIndex((a) => a === '--telegram-user-id');
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  const eqArg = args.find((a) => a.startsWith('--telegram-user-id='));
  if (eqArg) return eqArg.split('=')[1];
  return null;
}

function dayOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function uuid(): string {
  return crypto.randomUUID();
}

// ─── Demo Users ──────────────────────────────────────────────────────────────

type UserSpec = {
  email: string;
  fullName: string;
  role: string;
};

const USERS: Record<string, UserSpec> = {
  savitri: {
    email: 'demo-savitri@betterat.app',
    fullName: 'Savitri Devi Munda',
    role: 'sailor', // base role in the system
  },
  suman: {
    email: 'demo-suman@betterat.app',
    fullName: 'Suman Tirkey',
    role: 'coach',
  },
  rakesh: {
    email: 'demo-bdo@betterat.app',
    fullName: 'Rakesh Kumar Singh',
    role: 'club_manager', // admin/institutional role
  },
  phulmani: {
    email: 'demo-shg-1@betterat.app',
    fullName: 'Phulmani Oraon',
    role: 'sailor',
  },
  champa: {
    email: 'demo-shg-2@betterat.app',
    fullName: 'Champa Kumari',
    role: 'sailor',
  },
  basanti: {
    email: 'demo-shg-3@betterat.app',
    fullName: 'Basanti Mahto',
    role: 'sailor',
  },
};

// ─── Blueprint Content ───────────────────────────────────────────────────────

type StepSpec = {
  title: string;
  description: string;
  category: string;
  subSteps: string[];
};

const MUDRA_STEPS: StepSpec[] = [
  {
    title: 'Check if you qualify for MUDRA Shishu',
    description:
      'MUDRA Shishu loans give up to ₹50,000 with no collateral. Most lac bangle makers qualify automatically.',
    category: 'lesson',
    subSteps: [
      'Your business is less than 5 years old',
      'You don\'t already have a MUDRA loan',
      'You have an Aadhaar card',
      'You have a bank account (Jan Dhan is fine)',
    ],
  },
  {
    title: 'Gather your MUDRA documents',
    description:
      'Collect everything you need before visiting the bank. PRADAN can help you get the SHG recommendation letter.',
    category: 'drill',
    subSteps: [
      'Aadhaar card (photo both sides)',
      'Bank passbook (first page + last 6 months)',
      'Business proof (photos of your bangles, haat receipts, SHG membership card)',
      '2 passport photos',
      'SHG recommendation letter (ask Suman)',
    ],
  },
  {
    title: 'Visit the bank branch',
    description:
      'Go to SBI Khunti or Bank of India Khunti. Ask specifically for the MUDRA Shishu loan application form. The form is free.',
    category: 'drill',
    subSteps: [
      'Nearest MUDRA branches: SBI Khunti or Bank of India Khunti',
      'Ask specifically for "MUDRA Shishu loan application form"',
      'The form is free — do not pay anyone for it',
      'If they say MUDRA is not available, ask to speak to the Branch Manager',
    ],
  },
  {
    title: 'Fill the MUDRA application',
    description:
      'Fill in your details. If you need help writing, the bank officer must assist you — this is their job.',
    category: 'drill',
    subSteps: [
      'Write your name, Aadhaar number, business type: "lac bangle manufacturing"',
      'Loan amount: up to ₹50,000',
      'Business purpose: "Purchase lac raw material and tools for bangle making"',
      'If you need help writing, the bank officer is required to assist',
    ],
  },
  {
    title: 'Submit and get your receipt',
    description:
      'Hand in the form with all documents. Always get a dated acknowledgment receipt.',
    category: 'drill',
    subSteps: [
      'Hand in form + all documents + photos',
      'Ask for a dated acknowledgment receipt with application number',
      'If they refuse the receipt — insist or ask for the Branch Manager',
      'Write down the officer\'s name',
      'Photograph the receipt',
    ],
  },
  {
    title: 'Follow up after 7-14 days',
    description:
      'Visit the bank with your receipt after 7 working days. If no progress after 14 days, escalate.',
    category: 'drill',
    subSteps: [
      'Visit after 7 working days with your receipt',
      'Ask for status by application number',
      'If no progress after 14 days, call MUDRA helpline: 1800-599-0007',
      'You can also complain at pgportal.gov.in (Suman can help file)',
    ],
  },
  {
    title: 'What to do if MUDRA is rejected',
    description:
      'Rejection is not final — it is a starting point for negotiation. Ask for written reasons and escalate if needed.',
    category: 'drill',
    subSteps: [
      'Ask for written rejection with the specific reason',
      'Common fixable reasons: incomplete documents (resubmit), need guarantor (your SHG can guarantee)',
      'If the reason seems wrong, escalate to Lead District Manager, SBI Ranchi',
      'PRADAN can write a support letter',
    ],
  },
];

const MUKHYAMANTRI_STEPS: StepSpec[] = [
  {
    title: 'Understand Mukhyamantri Protsahan Yojana',
    description:
      'Jharkhand state scheme: loan up to ₹5 lakh at only 4% interest. State government pays the difference (normally 12%).',
    category: 'lesson',
    subSteps: [
      'Loan up to ₹5 lakh at only 4% annual interest',
      'State government pays the interest difference',
      'For any income-generating activity',
      'Must be Jharkhand resident, woman, age 18-50',
    ],
  },
  {
    title: 'Check Mukhyamantri eligibility',
    description:
      'Most women in Khunti qualify on income. The main hurdle is usually the residential certificate.',
    category: 'lesson',
    subSteps: [
      'Jharkhand domicile (residential certificate from panchayat)',
      'Age 18-50',
      'Family income below ₹6 lakh/year',
      'Not a defaulter on any existing bank loan',
      'SHG membership is a plus but not required',
    ],
  },
  {
    title: 'Get your residential certificate',
    description:
      'Apply at your Gram Panchayat office. This is often the biggest document hurdle.',
    category: 'drill',
    subSteps: [
      'Apply at your Gram Panchayat office',
      'Need: Aadhaar, ration card or voter ID',
      'Processing time: 7-15 days',
      'If the Panchayat delays, BDO office (Rakesh Kumar) can expedite',
    ],
  },
  {
    title: 'Apply through JSLPS',
    description:
      'Jharkhand State Livelihood Promotion Society handles applications. Apply at the Block office or through your SHG.',
    category: 'drill',
    subSteps: [
      'Apply at the Block office in Khunti',
      'Or through your SHG\'s Village Organization (VO)',
      'PRADAN field team can submit on your behalf',
      'JSLPS is the implementing agency',
    ],
  },
  {
    title: 'Prepare a simple business plan',
    description:
      'One page is enough. Suman has a template. PRADAN helps you write this.',
    category: 'drill',
    subSteps: [
      'What you make (lac bangles)',
      'How much you sell now (₹X per month at haat)',
      'What you\'d do with ₹5 lakh (better tools, bulk raw material, packaging, transport to Ranchi)',
      'Expected increase in income',
    ],
  },
  {
    title: 'Bank verification and disbursement',
    description:
      'After JSLPS approval, the partner bank verifies and disburses. Keep your passbook updated.',
    category: 'drill',
    subSteps: [
      'JSLPS forwards approved application to partner bank',
      'Bank may visit your home/workshop (this is normal)',
      'Disbursement into your bank account in 2-4 weeks',
      'Repayment starts after 3-month grace period',
    ],
  },
];

const NRLM_STEPS: StepSpec[] = [
  {
    title: 'Confirm your SHG is NRLM-registered',
    description:
      'Your SHG (Johar Mahila Mandal) must be registered with JSLPS. Most PRADAN-organized SHGs already are.',
    category: 'lesson',
    subSteps: [
      'Check with your Community Resource Person (CRP)',
      'If not registered, PRADAN can help register',
      'Need: member list, meeting minutes, savings records',
      'Most PRADAN-organized SHGs are already registered',
    ],
  },
  {
    title: 'Claim Revolving Fund (₹15,000 — free)',
    description:
      '₹15,000 given to your SHG with no repayment needed. Many SHGs don\'t know about this.',
    category: 'drill',
    subSteps: [
      '₹15,000 given to your SHG — no repayment needed',
      'SHG decides how to distribute among members',
      'Apply through Block Mission Management Unit',
      'Typically approved in 2-4 weeks',
    ],
  },
  {
    title: 'Apply for Community Investment Fund (up to ₹2.5 lakh)',
    description:
      'Larger fund for member livelihoods. Your SHG has been active 2 years — you qualify.',
    category: 'drill',
    subSteps: [
      'Low interest, flexible repayment decided by SHG',
      'Requires 6+ months of good savings and meeting records',
      'Apply through Village Organization → Block office',
      'Your SHG qualifies (active 2+ years)',
    ],
  },
  {
    title: 'Get bank linkage loan (up to 4x your savings)',
    description:
      'The biggest SHG benefit. After good CIF repayment, banks lend up to 4x your group savings at subsidized rates.',
    category: 'drill',
    subSteps: [
      'After 6 months of good CIF repayment',
      'Bank lends up to 4x your group\'s total savings',
      'Interest subsidy: you pay 4-5% instead of 12%',
      'Can be ₹2-4 lakh for a mature SHG',
    ],
  },
];

const BUSINESS_STEPS: StepSpec[] = [
  {
    title: 'Calculate your real costs',
    description:
      'Know your cost per bangle set before pricing. Most women undercount their time.',
    category: 'lesson',
    subSteps: [
      'Raw lac cost per kg',
      'Other materials (mirror pieces, glitter, thread)',
      'Your time (count it — it has value)',
      'Cost per bangle set = materials + time + fuel',
    ],
  },
  {
    title: 'Price for different markets',
    description:
      'Your haat price of ₹30/set is too low. Higher markets need packaging and transport but pay 3-10x more.',
    category: 'lesson',
    subSteps: [
      'Haat price: ₹30-50/set (volume, local)',
      'Ranchi shop price: ₹100-150/set (need packaging, transport)',
      'Online/export price: ₹200-500/set (need photos, shipping)',
      'MUDRA money lets you access higher markets',
    ],
  },
  {
    title: 'Improve your packaging',
    description:
      'Simple packaging multiplies your perceived value. "Jharkhand Tribal Craft" label adds premium.',
    category: 'drill',
    subSteps: [
      'Simple cardboard box with your name: ₹5-8 per box',
      'Transparent plastic case: ₹10-15 per box',
      'Branded packaging with logo: ₹15-25 per box',
      '"Jharkhand Tribal Craft" label adds perceived value',
    ],
  },
  {
    title: 'Find Ranchi shop buyers',
    description:
      'Start with 2-3 shops. Consignment reduces their risk — they pay after selling.',
    category: 'drill',
    subSteps: [
      'Target 2-3 shops in Ranchi Main Road or Lalpur',
      'Bring samples in good packaging',
      'Offer 5 sets on consignment (they pay after selling)',
      'Get a written agreement (even simple, on paper)',
    ],
  },
  {
    title: 'Explore online marketplaces',
    description:
      'For when you\'re ready to scale. Each needs good product photos and consistent supply.',
    category: 'drill',
    subSteps: [
      'Tribes India (government e-marketplace for tribal products)',
      'Amazon Karigar (artisan program)',
      'GoCoop (cooperative marketplace)',
      'Each needs: good photos, consistent supply, shipping ability',
    ],
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!DEMO_PASSWORD) {
    console.error('❌ DEMO_PASSWORD environment variable is required');
    process.exit(1);
  }

  const telegramUserId = parseTelegramUserId();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── 1. Create Interest ──────────────────────────────────────────────────

  console.log('\n🎯 Creating interest: Lac Craft Business...');
  const { data: existingInterest } = await supabase
    .from('interests')
    .select('id')
    .eq('slug', 'lac-craft-business')
    .maybeSingle();

  let interestId: string;
  if (existingInterest) {
    interestId = existingInterest.id;
    console.log(`   ♻️  Already exists: ${interestId}`);
  } else {
    const { data: newInterest, error: intErr } = await supabase
      .from('interests')
      .insert({
        name: 'Lac Craft Business',
        slug: 'lac-craft-business',
        description:
          'Growing a lac bangle or lac craft business — production, quality, packaging, market access, and government scheme navigation',
        type: 'official',
        visibility: 'public',
        status: 'active',
      })
      .select('id')
      .single();
    if (intErr || !newInterest) {
      console.error('   ❌ Failed to create interest:', intErr?.message);
      process.exit(1);
    }
    interestId = newInterest.id;
    console.log(`   ✅ Created: ${interestId}`);
  }

  // ── 2. Create Organization ──────────────────────────────────────────────

  console.log('\n🏛️  Creating organization: PRADAN — Khunti Unit...');
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'pradan-khunti')
    .maybeSingle();

  let orgId: string;
  if (existingOrg) {
    orgId = existingOrg.id;
    console.log(`   ♻️  Already exists: ${orgId}`);
  } else {
    // interest_slug has a check constraint — query what values are allowed
    // and use the interest we just created (its slug is in the interests table)
    const { data: newOrg, error: orgErr } = await supabase
      .from('organizations')
      .insert({
        name: 'PRADAN — Khunti Unit',
        slug: 'pradan-khunti',
        organization_type: 'association',
      })
      .select('id')
      .single();
    if (orgErr || !newOrg) {
      console.error('   ❌ Failed to create organization:', orgErr?.message);
      process.exit(1);
    }
    orgId = newOrg.id;
    console.log(`   ✅ Created: ${orgId}`);
  }

  // ── 3. Create Users ─────────────────────────────────────────────────────

  console.log('\n👥 Creating demo users...');
  const { data: allUsersPage, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    console.error('❌ auth.admin.listUsers failed:', listErr.message);
    process.exit(1);
  }

  const existingByEmail = new Map<string, string>();
  for (const u of allUsersPage?.users ?? []) {
    if (u.email) existingByEmail.set(u.email, u.id);
  }

  const userIds: Record<string, string> = {};

  for (const [key, spec] of Object.entries(USERS)) {
    let userId = existingByEmail.get(spec.email);

    if (userId) {
      console.log(`   ♻️  ${spec.fullName} (${spec.email}) already exists: ${userId}`);
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: spec.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: spec.fullName,
          name: spec.fullName,
          role: spec.role,
        },
      });
      if (createErr || !created.user) {
        console.error(`   ❌ Failed to create ${spec.email}:`, createErr?.message);
        continue;
      }
      userId = created.user.id;
      console.log(`   ✅ Created ${spec.fullName}: ${userId}`);
    }

    // Upsert profile with pro tier (needed for Telegram write operations)
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, email: spec.email, full_name: spec.fullName, subscription_tier: 'pro' }, { onConflict: 'id' });
    if (profileErr) {
      console.warn(`   ⚠️  Profile upsert for ${spec.fullName}:`, profileErr.message);
    }

    // Also set tier on public.users (the webhook reads tier from here, not profiles)
    const { error: usersTierErr } = await supabase
      .from('users')
      .update({ subscription_tier: 'pro' })
      .eq('id', userId);
    if (usersTierErr) {
      console.warn(`   ⚠️  users tier update for ${spec.fullName}:`, usersTierErr.message);
    }

    userIds[key] = userId!;
  }

  // ── 4. Link Users to Interest & Organization ───────────────────────────

  console.log('\n🔗 Linking users to interest and organization...');

  // All users get the interest
  for (const [key, userId] of Object.entries(userIds)) {
    const { error } = await supabase
      .from('user_interests')
      .upsert(
        { user_id: userId, interest_id: interestId },
        { onConflict: 'user_id,interest_id' }
      );
    if (error) {
      console.warn(`   ⚠️  user_interests for ${key}:`, error.message);
    }
  }
  console.log(`   ✅ Linked ${Object.keys(userIds).length} users to interest`);

  // All users get org membership
  for (const [key, userId] of Object.entries(userIds)) {
    const role =
      key === 'suman' ? 'coach' : key === 'rakesh' ? 'admin' : 'member';
    const { error } = await supabase.from('organization_memberships').upsert(
      {
        organization_id: orgId,
        user_id: userId,
        role,
      },
      { onConflict: 'organization_id,user_id' }
    );
    if (error) {
      console.warn(`   ⚠️  org membership for ${key}:`, error.message);
    }
  }
  console.log(`   ✅ Linked ${Object.keys(userIds).length} users to organization`);

  // ── 5. Create Blueprint Steps (authored by Suman) ──────────────────────

  console.log('\n📝 Creating blueprint steps...');

  const sumanId = userIds.suman;
  if (!sumanId) {
    console.error('❌ Suman user not created, cannot create blueprints');
    process.exit(1);
  }

  async function createSteps(specs: StepSpec[]): Promise<string[]> {
    const stepIds: string[] = [];
    for (let i = 0; i < specs.length; i++) {
      const spec = specs[i];
      const subSteps = spec.subSteps.map((text, j) => ({
        id: uuid(),
        text,
        sort_order: j,
      }));

      const { data: step, error } = await supabase
        .from('timeline_steps')
        .insert({
          user_id: sumanId,
          interest_id: interestId,
          organization_id: orgId,
          title: spec.title,
          description: spec.description,
          category: spec.category,
          status: 'completed',
          visibility: 'followers',
          sort_order: i,
          metadata: {
            plan: {
              how_sub_steps: subSteps,
            },
            india_demo: true,
          },
        })
        .select('id')
        .single();
      if (error || !step) {
        console.error(`   ❌ Failed to create step "${spec.title}":`, error?.message);
        continue;
      }
      stepIds.push(step.id);
    }
    return stepIds;
  }

  const mudraStepIds = await createSteps(MUDRA_STEPS);
  console.log(`   ✅ MUDRA steps: ${mudraStepIds.length}`);

  const mukhyamantriStepIds = await createSteps(MUKHYAMANTRI_STEPS);
  console.log(`   ✅ Mukhyamantri steps: ${mukhyamantriStepIds.length}`);

  const nrlmStepIds = await createSteps(NRLM_STEPS);
  console.log(`   ✅ DAY-NRLM steps: ${nrlmStepIds.length}`);

  const businessStepIds = await createSteps(BUSINESS_STEPS);
  console.log(`   ✅ Business skills steps: ${businessStepIds.length}`);

  // ── 6. Create Blueprints ───────────────────────────────────────────────

  console.log('\n📚 Creating blueprints...');

  type BlueprintSpec = {
    title: string;
    slug: string;
    description: string;
    stepIds: string[];
  };

  const blueprintSpecs: BlueprintSpec[] = [
    {
      title: 'MUDRA Shishu Loan — Step by Step',
      slug: 'mudra-shishu-khunti',
      description:
        'How to get a MUDRA Shishu loan of up to ₹50,000 with no collateral. Curated by PRADAN Khunti for lac craft entrepreneurs.',
      stepIds: mudraStepIds,
    },
    {
      title: 'Mukhyamantri Protsahan Yojana — ₹5 Lakh at 4%',
      slug: 'mukhyamantri-protsahan-khunti',
      description:
        'Jharkhand state scheme for women entrepreneurs. Up to ₹5 lakh loan at 4% interest. Step-by-step guide by PRADAN.',
      stepIds: mukhyamantriStepIds,
    },
    {
      title: 'DAY-NRLM SHG Benefits',
      slug: 'day-nrlm-shg-khunti',
      description:
        'Unlock your self-help group\'s full benefits: Revolving Fund, Community Investment Fund, and bank linkage loans.',
      stepIds: nrlmStepIds,
    },
    {
      title: 'Growing Your Lac Bangle Business',
      slug: 'lac-bangle-business-growth',
      description:
        'Practical business skills: costing, pricing, packaging, finding shop buyers, and going online.',
      stepIds: businessStepIds,
    },
  ];

  const blueprintIds: Record<string, string> = {};

  for (const bSpec of blueprintSpecs) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('timeline_blueprints')
      .select('id')
      .eq('slug', bSpec.slug)
      .maybeSingle();

    let blueprintId: string;
    if (existing) {
      blueprintId = existing.id;
      console.log(`   ♻️  ${bSpec.title} already exists: ${blueprintId}`);
    } else {
      const { data: bp, error } = await supabase
        .from('timeline_blueprints')
        .insert({
          user_id: sumanId,
          interest_id: interestId,
          organization_id: orgId,
          title: bSpec.title,
          slug: bSpec.slug,
          description: bSpec.description,
          is_published: true,
          access_level: 'public',
        })
        .select('id')
        .single();
      if (error || !bp) {
        console.error(`   ❌ Failed to create blueprint "${bSpec.title}":`, error?.message);
        continue;
      }
      blueprintId = bp.id;
      console.log(`   ✅ Created "${bSpec.title}": ${blueprintId}`);
    }

    blueprintIds[bSpec.slug] = blueprintId;

    // Link steps to blueprint
    if (!existing) {
      const linkRows = bSpec.stepIds.map((stepId, i) => ({
        blueprint_id: blueprintId,
        step_id: stepId,
        sort_order: i,
      }));
      const { error: linkErr } = await supabase
        .from('blueprint_steps')
        .upsert(linkRows, { onConflict: 'blueprint_id,step_id' });
      if (linkErr) {
        console.warn(`   ⚠️  Failed to link steps to "${bSpec.title}":`, linkErr.message);
      }
    }
  }

  // ── 7. Subscribe Users to Blueprints ───────────────────────────────────

  console.log('\n🔗 Subscribing users to blueprints...');

  const subscriberKeys = ['savitri', 'phulmani', 'champa', 'basanti'];
  const allBlueprintIds = Object.values(blueprintIds);

  for (const key of subscriberKeys) {
    const userId = userIds[key];
    if (!userId) continue;

    const subRows = allBlueprintIds.map((bpId) => ({
      blueprint_id: bpId,
      subscriber_id: userId,
      subscribed_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
      auto_adopt: false,
    }));

    const { error } = await supabase
      .from('blueprint_subscriptions')
      .upsert(subRows, { onConflict: 'blueprint_id,subscriber_id' });
    if (error) {
      console.warn(`   ⚠️  Subscriptions for ${key}:`, error.message);
    } else {
      console.log(`   ✅ ${USERS[key].fullName}: subscribed to ${allBlueprintIds.length} blueprints`);
    }
  }

  // ── 8. Seed Savitri's Timeline ─────────────────────────────────────────

  console.log('\n🧭 Seeding Savitri\'s timeline...');

  const savitriId = userIds.savitri;
  if (!savitriId) {
    console.error('❌ Savitri not created');
    process.exit(1);
  }

  // Check for existing steps
  const { data: existingSavitriSteps } = await supabase
    .from('timeline_steps')
    .select('id')
    .eq('user_id', savitriId)
    .eq('interest_id', interestId);

  if ((existingSavitriSteps?.length ?? 0) > 0) {
    console.log(`   ♻️  Savitri already has ${existingSavitriSteps?.length} steps, skipping`);
  } else {
    const mudraBlueprint = blueprintIds['mudra-shishu-khunti'];
    const mukhyamantriBlueprint = blueprintIds['mukhyamantri-protsahan-khunti'];
    const nrlmBlueprint = blueprintIds['day-nrlm-shg-khunti'];
    const businessBlueprint = blueprintIds['lac-bangle-business-growth'];

    const savitriSteps = [
      {
        title: 'Check if you qualify for MUDRA Shishu',
        description: MUDRA_STEPS[0].description,
        category: 'lesson',
        status: 'completed' as const,
        completed_at: dayOffset(-14),
        source_type: 'blueprint' as const,
        source_blueprint_id: mudraBlueprint,
        sort_order: 0,
        metadata: {
          plan: {
            how_sub_steps: MUDRA_STEPS[0].subSteps.map((text, j) => ({
              id: uuid(),
              text,
              sort_order: j,
            })),
          },
          act: {
            sub_step_progress: Object.fromEntries(
              MUDRA_STEPS[0].subSteps.map((_, j) => [`sub-${j}`, true])
            ),
          },
          india_demo: true,
        },
      },
      {
        title: 'Gather your MUDRA documents',
        description: MUDRA_STEPS[1].description,
        category: 'drill',
        status: 'in_progress' as const,
        completed_at: null,
        source_type: 'blueprint' as const,
        source_blueprint_id: mudraBlueprint,
        sort_order: 1,
        metadata: {
          plan: {
            how_sub_steps: MUDRA_STEPS[1].subSteps.map((text, j) => ({
              id: `doc-sub-${j}`,
              text,
              sort_order: j,
            })),
          },
          act: {
            sub_step_progress: {
              'doc-sub-0': true, // Has Aadhaar
              'doc-sub-1': true, // Has bank passbook
              'doc-sub-2': false, // Needs business proof
              'doc-sub-3': false, // Needs passport photos
              'doc-sub-4': false, // Needs SHG letter
            },
            notes: 'I have my Aadhaar card and bank passbook. Need to get passport photos taken in Khunti town.',
          },
          india_demo: true,
        },
      },
      {
        title: 'Understand Mukhyamantri Protsahan Yojana',
        description: MUKHYAMANTRI_STEPS[0].description,
        category: 'lesson',
        status: 'completed' as const,
        completed_at: dayOffset(-7),
        source_type: 'blueprint' as const,
        source_blueprint_id: mukhyamantriBlueprint,
        sort_order: 2,
        metadata: {
          plan: {
            how_sub_steps: MUKHYAMANTRI_STEPS[0].subSteps.map((text, j) => ({
              id: uuid(),
              text,
              sort_order: j,
            })),
          },
          act: {
            notes: 'Suman explained this scheme at our SHG meeting. ₹5 lakh at 4% — much bigger than MUDRA.',
          },
          india_demo: true,
        },
      },
      {
        title: 'Calculate your real costs',
        description: BUSINESS_STEPS[0].description,
        category: 'lesson',
        status: 'in_progress' as const,
        completed_at: null,
        source_type: 'blueprint' as const,
        source_blueprint_id: businessBlueprint,
        sort_order: 3,
        metadata: {
          plan: {
            how_sub_steps: BUSINESS_STEPS[0].subSteps.map((text, j) => ({
              id: `cost-sub-${j}`,
              text,
              sort_order: j,
            })),
          },
          act: {
            sub_step_progress: {
              'cost-sub-0': true, // Lac cost
              'cost-sub-1': false,
              'cost-sub-2': false,
              'cost-sub-3': false,
            },
            notes: 'Raw lac costs about ₹800/kg. I use about 200g per set of 4 bangles.',
          },
          india_demo: true,
        },
      },
      {
        title: 'Claim Revolving Fund (₹15,000 — free)',
        description: NRLM_STEPS[1].description,
        category: 'drill',
        status: 'pending' as const,
        completed_at: null,
        due_at: dayOffset(14),
        source_type: 'blueprint' as const,
        source_blueprint_id: nrlmBlueprint,
        sort_order: 4,
        metadata: {
          plan: {
            how_sub_steps: NRLM_STEPS[1].subSteps.map((text, j) => ({
              id: uuid(),
              text,
              sort_order: j,
            })),
            plan_notes:
              'Need to discuss this at next SHG meeting. Phulmani says her group already got theirs.',
          },
          india_demo: true,
        },
      },
    ];

    for (const step of savitriSteps) {
      const { error } = await supabase.from('timeline_steps').insert({
        user_id: savitriId,
        interest_id: interestId,
        organization_id: orgId,
        visibility: 'followers',
        ...step,
      });
      if (error) {
        console.error(`   ❌ Failed to create "${step.title}":`, error.message);
      }
    }
    console.log(`   ✅ Created ${savitriSteps.length} steps for Savitri`);
  }

  // ── 9. Seed Peer Timelines ─────────────────────────────────────────────

  console.log('\n👥 Seeding peer timelines...');

  // Phulmani — advanced: MUDRA completed, working on business growth
  if (userIds.phulmani) {
    const { data: existing } = await supabase
      .from('timeline_steps')
      .select('id')
      .eq('user_id', userIds.phulmani)
      .eq('interest_id', interestId);

    if ((existing?.length ?? 0) > 0) {
      console.log(`   ♻️  Phulmani already has steps, skipping`);
    } else {
      const phulmaniSteps = [
        { title: 'Check MUDRA eligibility', status: 'completed', completed_at: dayOffset(-90), sort_order: 0 },
        { title: 'Gather MUDRA documents', status: 'completed', completed_at: dayOffset(-80), sort_order: 1 },
        { title: 'Visit bank branch', status: 'completed', completed_at: dayOffset(-75), sort_order: 2 },
        { title: 'Fill MUDRA application', status: 'completed', completed_at: dayOffset(-75), sort_order: 3 },
        { title: 'Submit and get receipt', status: 'completed', completed_at: dayOffset(-74), sort_order: 4 },
        {
          title: 'MUDRA loan received — ₹40,000',
          status: 'completed',
          completed_at: dayOffset(-60),
          sort_order: 5,
          metadata: {
            act: { notes: 'Got ₹40,000 in my Jan Dhan account! Bought lac in bulk from Ranchi wholesale market.' },
            review: { overall_rating: 5 },
          },
        },
        { title: 'Calculate real costs', status: 'completed', completed_at: dayOffset(-45), sort_order: 6 },
        { title: 'Improve packaging', status: 'completed', completed_at: dayOffset(-30), sort_order: 7 },
        { title: 'Find Ranchi shop buyers', status: 'in_progress', sort_order: 8 },
      ];

      for (const step of phulmaniSteps) {
        await supabase.from('timeline_steps').insert({
          user_id: userIds.phulmani,
          interest_id: interestId,
          organization_id: orgId,
          title: step.title,
          description: '',
          category: 'drill',
          status: step.status,
          completed_at: step.completed_at ?? null,
          visibility: 'followers',
          sort_order: step.sort_order,
          source_type: 'blueprint',
          source_blueprint_id: blueprintIds['mudra-shishu-khunti'],
          metadata: { india_demo: true, ...(step as any).metadata },
        });
      }
      console.log(`   ✅ Phulmani: ${phulmaniSteps.length} steps (MUDRA completed, finding Ranchi buyers)`);
    }
  }

  // Champa — mid-progress: working on Mukhyamantri scheme for puffed rice
  if (userIds.champa) {
    const { data: existing } = await supabase
      .from('timeline_steps')
      .select('id')
      .eq('user_id', userIds.champa)
      .eq('interest_id', interestId);

    if ((existing?.length ?? 0) > 0) {
      console.log(`   ♻️  Champa already has steps, skipping`);
    } else {
      const champaSteps = [
        { title: 'Understand Mukhyamantri scheme', status: 'completed', completed_at: dayOffset(-30), sort_order: 0 },
        { title: 'Check Mukhyamantri eligibility', status: 'completed', completed_at: dayOffset(-25), sort_order: 1 },
        { title: 'Get residential certificate', status: 'completed', completed_at: dayOffset(-15), sort_order: 2 },
        {
          title: 'Apply through JSLPS',
          status: 'in_progress',
          sort_order: 3,
          metadata: {
            act: { notes: 'Submitted application through Suman at PRADAN. Waiting for JSLPS processing.' },
          },
        },
        { title: 'Prepare business plan', status: 'pending', sort_order: 4 },
      ];

      for (const step of champaSteps) {
        await supabase.from('timeline_steps').insert({
          user_id: userIds.champa,
          interest_id: interestId,
          organization_id: orgId,
          title: step.title,
          description: '',
          category: 'drill',
          status: step.status,
          completed_at: step.completed_at ?? null,
          visibility: 'followers',
          sort_order: step.sort_order,
          source_type: 'blueprint',
          source_blueprint_id: blueprintIds['mukhyamantri-protsahan-khunti'],
          metadata: { india_demo: true, ...(step as any).metadata },
        });
      }
      console.log(`   ✅ Champa: ${champaSteps.length} steps (Mukhyamantri application submitted)`);
    }
  }

  // Basanti — just starting
  if (userIds.basanti) {
    const { data: existing } = await supabase
      .from('timeline_steps')
      .select('id')
      .eq('user_id', userIds.basanti)
      .eq('interest_id', interestId);

    if ((existing?.length ?? 0) > 0) {
      console.log(`   ♻️  Basanti already has steps, skipping`);
    } else {
      const basantiSteps = [
        {
          title: 'Check MUDRA eligibility',
          status: 'completed',
          completed_at: dayOffset(-3),
          sort_order: 0,
          metadata: {
            act: { notes: 'Suman helped me check. I qualify! Going to gather documents next.' },
          },
        },
        { title: 'Gather MUDRA documents', status: 'pending', sort_order: 1 },
      ];

      for (const step of basantiSteps) {
        await supabase.from('timeline_steps').insert({
          user_id: userIds.basanti,
          interest_id: interestId,
          organization_id: orgId,
          title: step.title,
          description: '',
          category: 'drill',
          status: step.status,
          completed_at: step.completed_at ?? null,
          visibility: 'followers',
          sort_order: step.sort_order,
          source_type: 'blueprint',
          source_blueprint_id: blueprintIds['mudra-shishu-khunti'],
          metadata: { india_demo: true, ...(step as any).metadata },
        });
      }
      console.log(`   ✅ Basanti: ${basantiSteps.length} steps (just started exploring)`);
    }
  }

  // ── 10. Link Telegram ──────────────────────────────────────────────────

  if (telegramUserId && savitriId) {
    console.log(`\n📱 Linking Telegram user ${telegramUserId} to Savitri...`);
    const { error } = await supabase.from('telegram_links').upsert(
      {
        user_id: savitriId,
        telegram_user_id: parseInt(telegramUserId, 10),
        telegram_chat_id: parseInt(telegramUserId, 10),
        linked_at: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: 'telegram_user_id' }
    );
    if (error) {
      console.warn(`   ⚠️  Telegram link:`, error.message);
    } else {
      console.log(`   ✅ Linked Telegram ${telegramUserId} → Savitri`);
    }
  } else if (!telegramUserId) {
    console.log(
      '\n📱 Telegram: skipped (pass --telegram-user-id <id> to link Savitri to your Telegram)'
    );
  }

  // ── Summary ────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('✨ India demo seed complete!');
  console.log('');
  console.log('  Interest:      Lac Craft Business');
  console.log('  Organization:  PRADAN — Khunti Unit');
  console.log('  Users:');
  for (const [key, userId] of Object.entries(userIds)) {
    console.log(`    ${USERS[key].fullName.padEnd(25)} ${userId}`);
  }
  console.log('  Blueprints:');
  for (const [slug, bpId] of Object.entries(blueprintIds)) {
    console.log(`    ${slug.padEnd(40)} ${bpId}`);
  }
  console.log('');
  console.log('  Demo login: demo-savitri@betterat.app / $DEMO_PASSWORD');
  console.log('══════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});
