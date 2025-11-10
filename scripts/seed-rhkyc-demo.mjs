#!/usr/bin/env node

/**
 * Royal Hong Kong Yacht Club immersive seed
 * ------------------------------------------
 * Populates yacht club metadata, regattas, events, documents, services, fleets,
 * and demo memberships so the /clubs tab renders a complete experience.
 *
 * Run:  node scripts/seed-rhkyc-demo.mjs
 * Requires: EXPO_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import rhkycData from '../data/demo/rhkycClubData.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// RHKYC exists in both yacht_clubs (string ID) and clubs (UUID) tables
// club_members and other tables reference the clubs table (UUID-based)
const YACHT_CLUB_ID = rhkycData.club.id; // "rhkyc" - for yacht_clubs table
const CLUB_ID = '15621949-7086-418a-8245-0f932e6edd70'; // UUID for clubs table

const log = {
  info: (msg, ...args) => console.log(`⚓ ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`⚠️ ${msg}`, ...args),
  error: (msg, ...args) => console.error(`❌ ${msg}`, ...args),
};

const deterministicUuid = (namespace, value) => {
  const hash = createHash('sha1').update(`${namespace}:${value}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
};

async function resolveUserId(email) {
  if (!email) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    log.warn(`Unable to look up user ${email}: ${error.message}`);
    return null;
  }

  if (!data?.id) {
    log.warn(`No user record found for ${email}; skipping membership.`);
    return null;
  }

  return data.id;
}

async function upsertYachtClub() {
  log.info('Syncing yacht_clubs row...');
  // Only use columns that exist in yacht_clubs table
  const payload = {
    id: YACHT_CLUB_ID,
    name: rhkycData.club.name,
    short_name: rhkycData.club.shortName,
    venue_id: rhkycData.club.venueId ?? null,
    founded: rhkycData.club.founded ?? null,
    prestige_level: 'international',
    membership_type: 'private',
  };

  const { error } = await supabase
    .from('yacht_clubs')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    throw new Error(`yacht_clubs upsert failed: ${error.message}`);
  }
}

async function upsertDirectoryClub() {
  log.info('Updating clubs table entry...');

  // clubs table already has RHKYC record, just update it
  const payload = {
    name: rhkycData.club.name,
    short_name: rhkycData.club.shortName,
    description: rhkycData.club.description,
    website: rhkycData.club.website,
    address: rhkycData.club.address,
    phone: rhkycData.club.phone,
    email: rhkycData.club.contactEmail,
  };

  const { error } = await supabase
    .from('clubs')
    .update(payload)
    .eq('id', CLUB_ID);

  if (error) {
    log.warn(`clubs table update skipped: ${error.message}`);
  }
}

async function upsertMemberships() {
  if (!Array.isArray(rhkycData.memberships)) return;
  log.info(`Linking ${rhkycData.memberships.length} demo memberships...`);

  for (const membership of rhkycData.memberships) {
    const userId = await resolveUserId(membership.email);
    if (!userId) continue;

    // Try user_id first, then sailor_id
    let payload = {
      club_id: CLUB_ID,
      user_id: userId,
    };

    let { error } = await supabase
      .from('club_members')
      .upsert(payload, { onConflict: 'club_id,user_id' });

    if (error && error.message.includes('user_id')) {
      // Try with sailor_id instead
      payload = {
        club_id: CLUB_ID,
        sailor_id: userId,
      };
      const result = await supabase
        .from('club_members')
        .upsert(payload, { onConflict: 'club_id,sailor_id' });
      error = result.error;
    }

    if (error) {
      log.warn(`  ↳ Could not link ${membership.email}: ${error.message}`);
    } else {
      log.info(`  ↳ Linked ${membership.email}`);
    }
  }
}

async function upsertRaceCalendar() {
  if (!Array.isArray(rhkycData.regattas)) return;
  log.info(`Seeding ${rhkycData.regattas.length} regattas into club_race_calendar...`);

  // Map to valid event_type values: weeknight_series, championship, weekend_regatta, clinic, distance_race
  const eventTypeMap = {
    offshore: 'weekend_regatta',
    team_race: 'championship',
    distance_race: 'distance_race',
    training_series: 'clinic',
  };

  for (const regatta of rhkycData.regattas) {
    const payload = {
      id: deterministicUuid('club_race_calendar', regatta.slug),
      club_id: CLUB_ID,
      event_name: regatta.name,
      event_type: eventTypeMap[regatta.eventType] || 'weekend_regatta',
      start_date: regatta.startDate,
      end_date: regatta.endDate,
      entry_fee: regatta.entryFee,
      currency: regatta.currency,
      nor_url: regatta.norUrl,
      si_url: regatta.siUrl,
      results_url: regatta.resultsUrl,
      venue_id: regatta.venueId,
    };

    const { error } = await supabase
      .from('club_race_calendar')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      log.warn(`  ↳ Could not seed ${regatta.name}: ${error.message}`);
    } else {
      log.info(`  ↳ Seeded ${regatta.name}`);
    }
  }
}

async function upsertEvents() {
  if (!Array.isArray(rhkycData.events)) return;
  log.info(`Seeding ${rhkycData.events.length} club_events...`);

  for (const event of rhkycData.events) {
    const payload = {
      id: deterministicUuid('club_events', event.slug),
      club_id: CLUB_ID,
      title: event.title,
      event_type: event.eventType,
      status: event.status,
      start_date: event.startDate,
      end_date: event.endDate,
      registration_opens: event.registrationOpens,
      registration_closes: event.registrationCloses,
      venue_id: null, // venue_id expects UUID, skip for now
      location_name: event.locationName,
      max_participants: event.maxParticipants,
    };

    const { error } = await supabase
      .from('club_events')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      log.warn(`  ↳ Could not seed ${event.title}: ${error.message}`);
    } else {
      log.info(`  ↳ Seeded ${event.title}`);
    }
  }
}

async function upsertDocuments() {
  if (!Array.isArray(rhkycData.documents)) return;
  log.info(`Seeding ${rhkycData.documents.length} club_ai_documents...`);

  for (const doc of rhkycData.documents) {
    const payload = {
      id: deterministicUuid('club_ai_documents', doc.slug),
      club_id: CLUB_ID,
      title: doc.title,
      document_type: doc.documentType,
      publish_date: doc.publishDate,
      url: doc.url,
      parsed: doc.parsed ?? false,
    };

    const { error} = await supabase
      .from('club_ai_documents')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      if (error.message.includes('relation') || error.message.includes('table')) {
        log.warn('club_ai_documents table not available; skipping documents.');
        return;
      }
      log.warn(`  ↳ Could not seed ${doc.title}: ${error.message}`);
    } else {
      log.info(`  ↳ Seeded ${doc.title}`);
    }
  }
}

async function upsertServices() {
  if (!Array.isArray(rhkycData.services)) return;
  log.info(`Seeding ${rhkycData.services.length} club_services...`);

  for (const service of rhkycData.services) {
    const payload = {
      id: deterministicUuid('club_services', service.slug),
      club_id: CLUB_ID,
      service_type: service.serviceType,
      business_name: service.businessName,
      contact_name: service.contactName,
      email: service.email,
      phone: service.phone,
      website: service.website,
      specialties: service.specialties,
      classes_supported: service.classesSupported,
      preferred_by_club: service.preferredByClub ?? false,
    };

    const { error } = await supabase
      .from('club_services')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      if (error.message.includes('relation') || error.message.includes('table')) {
        log.warn('club_services table not available; skipping services.');
        return;
      }
      log.warn(`  ↳ Could not seed ${service.businessName}: ${error.message}`);
    } else {
      log.info(`  ↳ Seeded ${service.businessName}`);
    }
  }
}

async function upsertFleets() {
  if (!Array.isArray(rhkycData.fleets)) return;
  log.info(`Seeding ${rhkycData.fleets.length} fleets + memberships...`);

  for (const fleet of rhkycData.fleets) {
    const fleetId = deterministicUuid('fleets', fleet.slug);
    const fleetPayload = {
      id: fleetId,
      name: fleet.name,
      slug: fleet.slug,
      description: fleet.description,
      region: fleet.region,
      visibility: fleet.visibility ?? 'private',
      whatsapp_link: fleet.whatsappLink ?? null,
      club_id: CLUB_ID,
      metadata: {
        ...fleet.metadata,
        class: fleet.class,
      },
    };

    const { error } = await supabase
      .from('fleets')
      .upsert(fleetPayload, { onConflict: 'id' });

    if (error) {
      if (error.message.includes('relation')) {
        log.warn('fleets table is not available; skipping fleet seed.');
        return;
      }
      throw new Error(`fleets upsert failed: ${error.message}`);
    }

    if (!Array.isArray(fleet.members) || fleet.members.length === 0) continue;

    for (const member of fleet.members) {
      const userId = await resolveUserId(member.email);
      if (!userId) continue;

      const memberPayload = {
        fleet_id: fleetId,
        user_id: userId,
        role: member.role ?? 'member',
        status: 'active',
      };

      const { error: fmError } = await supabase
        .from('fleet_members')
        .upsert(memberPayload, { onConflict: 'fleet_id,user_id' });

      if (fmError) {
        log.warn(`    ↳ Failed to link ${member.email} to ${fleet.slug}: ${fmError.message}`);
      } else {
        log.info(`    ↳ Added ${member.email} to ${fleet.name}`);
      }
    }
  }
}

async function main() {
  log.info('Starting Royal Hong Kong Yacht Club seed...');
  await upsertYachtClub();
  await upsertDirectoryClub();
  await upsertMemberships();
  await upsertRaceCalendar();
  await upsertEvents();
  await upsertDocuments();
  await upsertServices();
  await upsertFleets();
  log.info('✅ RHKYC data seed complete. Refresh the /clubs tab to see the full experience.');
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
