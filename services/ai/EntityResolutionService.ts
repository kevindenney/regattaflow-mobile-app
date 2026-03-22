/**
 * EntityResolutionService — Resolves extracted entities against platform data.
 *
 * Works with both AI-returned entities and client-side extracted entities.
 * Matches people against real users, boats/equipment against user inventory,
 * and locations against venues. Falls back to user's home club for coordinates
 * when a location can't be resolved.
 */

import { CrewFinderService } from '@/services/CrewFinderService';
import { sailorBoatService, type SailorBoat } from '@/services/SailorBoatService';
import { equipmentService, type BoatEquipment } from '@/services/EquipmentService';
import { supabase } from '@/services/supabase';
import type {
  ExtractedPersonEntity,
  ExtractedEquipmentEntity,
  ExtractedLocationEntity,
  ExtractedDateEntity,
  AnyExtractedEntity,
  BrainDumpData,
} from '@/types/step-detail';
import type { BrainDumpPlanResult } from './StepPlanAIService';

// ---------------------------------------------------------------------------
// People Resolution
// ---------------------------------------------------------------------------

async function resolvePeople(
  names: { name: string; context?: string }[],
): Promise<ExtractedPersonEntity[]> {
  if (!names.length) return [];

  const results: ExtractedPersonEntity[] = [];

  for (const { name } of names) {
    try {
      const matches = await CrewFinderService.searchUsers(name, 3);

      if (matches.length === 0) {
        results.push({
          raw_text: name,
          type: 'person',
          confidence: 'unmatched',
        });
      } else if (matches.length === 1) {
        // Check if name is a close match
        const match = matches[0];
        const nameLower = name.toLowerCase();
        const matchLower = match.fullName.toLowerCase();
        const isExact = matchLower === nameLower ||
          matchLower.startsWith(nameLower) ||
          matchLower.split(' ').some((part) => part === nameLower);

        results.push({
          raw_text: name,
          type: 'person',
          matched_user_id: match.userId,
          matched_display_name: match.fullName,
          confidence: isExact ? 'exact' : 'likely',
        });
      } else {
        // Multiple matches — check for exact match first
        const exactMatch = matches.find((m) => {
          const mLower = m.fullName.toLowerCase();
          const nLower = name.toLowerCase();
          return mLower === nLower || mLower.split(' ')[0] === nLower;
        });

        if (exactMatch) {
          results.push({
            raw_text: name,
            type: 'person',
            matched_user_id: exactMatch.userId,
            matched_display_name: exactMatch.fullName,
            confidence: 'exact',
          });
        } else {
          results.push({
            raw_text: name,
            type: 'person',
            confidence: 'ambiguous',
            ambiguous_matches: matches.slice(0, 3).map((m) => ({
              user_id: m.userId,
              display_name: m.fullName,
              avatar_emoji: m.avatarEmoji,
            })),
          });
        }
      }
    } catch {
      results.push({
        raw_text: name,
        type: 'person',
        confidence: 'unmatched',
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Equipment Resolution
// ---------------------------------------------------------------------------

async function resolveEquipment(
  items: { text: string; category: string; ownership: string }[],
  userBoats: SailorBoat[],
  userEquipment: BoatEquipment[],
): Promise<ExtractedEquipmentEntity[]> {
  if (!items.length) return [];

  return items.map((item) => {
    const entity: ExtractedEquipmentEntity = {
      raw_text: item.text,
      type: 'equipment',
      category: (item.category as ExtractedEquipmentEntity['category']) || 'other',
      ownership: (item.ownership as ExtractedEquipmentEntity['ownership']) || 'unknown',
    };

    const textLower = item.text.toLowerCase();

    // Try to match boats by class name or boat name
    if (item.category === 'boat') {
      const matchedBoat = userBoats.find((b) => {
        const className = b.boat_class?.name?.toLowerCase() ?? '';
        const boatName = b.name?.toLowerCase() ?? '';
        return className === textLower ||
          boatName === textLower ||
          textLower.includes(className) ||
          textLower.includes(boatName);
      });
      if (matchedBoat) {
        entity.matched_boat_id = matchedBoat.id;
        entity.resolved_name = `${matchedBoat.boat_class?.name || ''} "${matchedBoat.name || ''}"`.trim();
        entity.ownership = 'mine';
      }
    }

    // Try to match sails/equipment against user's equipment list
    if (item.category === 'sail' || item.category === 'gear' || item.category === 'tool' || item.category === 'instrument') {
      const matchedEquip = userEquipment.find((e) => {
        const equipName = e.custom_name?.toLowerCase() ?? '';
        const mfg = e.manufacturer?.toLowerCase() ?? '';
        const model = e.model?.toLowerCase() ?? '';
        return textLower.includes(equipName) ||
          equipName.includes(textLower) ||
          (mfg && textLower.includes(mfg)) ||
          (model && textLower.includes(model));
      });
      if (matchedEquip) {
        entity.matched_equipment_id = matchedEquip.id;
        entity.resolved_name = matchedEquip.custom_name;
        entity.ownership = 'mine';
      }
    }

    return entity;
  });
}

// ---------------------------------------------------------------------------
// Location Resolution
// ---------------------------------------------------------------------------

async function resolveLocations(
  locations: { text: string; context?: string }[],
): Promise<ExtractedLocationEntity[]> {
  if (!locations.length) return [];

  const results: ExtractedLocationEntity[] = [];

  for (const loc of locations) {
    try {
      // 1. Try sailing_venues DB first (fast, gives venue_id)
      const { data: venues } = await supabase
        .from('sailing_venues')
        .select('id, name, coordinates_lat, coordinates_lng')
        .ilike('name', `%${loc.text}%`)
        .limit(1);

      if (venues?.length) {
        const venue = venues[0];
        results.push({
          raw_text: loc.text,
          type: 'location',
          venue_id: venue.id,
          resolved_name: venue.name,
          coordinates: venue.coordinates_lat && venue.coordinates_lng
            ? { lat: Number(venue.coordinates_lat), lng: Number(venue.coordinates_lng) }
            : undefined,
        });
        continue;
      }

      // 2. Try racing_area_aliases
      const { data: aliases } = await supabase
        .from('racing_area_aliases')
        .select('id, racing_area_name, venue_id, map_bounds')
        .ilike('racing_area_name', `%${loc.text}%`)
        .limit(1);

      if (aliases?.length) {
        const alias = aliases[0];
        let coords: { lat: number; lng: number } | undefined;
        if (alias.venue_id) {
          const { data: venueData } = await supabase
            .from('sailing_venues')
            .select('coordinates_lat, coordinates_lng')
            .eq('id', alias.venue_id)
            .single();
          if (venueData?.coordinates_lat && venueData?.coordinates_lng) {
            coords = { lat: Number(venueData.coordinates_lat), lng: Number(venueData.coordinates_lng) };
          }
        }
        if (!coords && alias.map_bounds) {
          const b = alias.map_bounds as any;
          if (b.north && b.south && b.east && b.west) {
            coords = { lat: (b.north + b.south) / 2, lng: (b.east + b.west) / 2 };
          }
        }
        results.push({
          raw_text: loc.text,
          type: 'location',
          venue_id: alias.venue_id,
          resolved_name: alias.racing_area_name,
          coordinates: coords,
        });
        continue;
      }

      // 3. Fallback: geocode via Google Maps API
      const geocoded = await geocodeLocation(loc.text);
      if (geocoded) {
        results.push({
          raw_text: loc.text,
          type: 'location',
          resolved_name: geocoded.name,
          coordinates: geocoded.coordinates,
        });
      } else {
        results.push({ raw_text: loc.text, type: 'location' });
      }
    } catch {
      results.push({ raw_text: loc.text, type: 'location' });
    }
  }

  return results;
}

/**
 * Geocode a location string using Google Maps Geocoding API.
 * Returns coordinates and formatted name, or null if not found.
 */
async function geocodeLocation(
  text: string,
): Promise<{ name: string; coordinates: { lat: number; lng: number } } | null> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    const encoded = encodeURIComponent(text);
    const resp = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`,
    );
    if (!resp.ok) return null;

    const data = await resp.json();
    if (!data.results?.length) return null;

    const result = data.results[0];
    return {
      name: result.formatted_address || text,
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Date Resolution
// ---------------------------------------------------------------------------

function resolveDates(
  dates: { text: string; iso: string; has_time: boolean }[],
): ExtractedDateEntity[] {
  return dates.map((d) => ({
    raw_text: d.text,
    type: 'date' as const,
    parsed_iso: d.iso,
    has_time: d.has_time,
  }));
}

// ---------------------------------------------------------------------------
// Build entity input from client-side brain dump data
// ---------------------------------------------------------------------------

/**
 * Build entity resolution input from client-side extracted data and/or AI entities.
 * Merges both sources, preferring AI entities when available.
 */
export function buildEntityInput(
  brainDump: BrainDumpData,
  aiEntities?: BrainDumpPlanResult['extracted_entities'],
  aiCollaborators?: string[],
): BrainDumpPlanResult['extracted_entities'] {
  // Start with AI entities if available
  const people = aiEntities?.people ?? [];
  const equipment = aiEntities?.equipment ?? [];
  const locations = aiEntities?.locations ?? [];
  const dates = aiEntities?.dates ?? [];

  // Merge in client-side people (from brain dump + AI who_collaborators)
  const seenPeople = new Set(people.map((p) => p.name.toLowerCase()));
  // Add AI collaborators that aren't already in people entities
  for (const name of (aiCollaborators ?? [])) {
    if (!seenPeople.has(name.toLowerCase())) {
      seenPeople.add(name.toLowerCase());
      people.push({ name, context: 'collaborator' });
    }
  }
  // Add client-side extracted people
  for (const name of (brainDump.extracted_people ?? [])) {
    if (!seenPeople.has(name.toLowerCase())) {
      seenPeople.add(name.toLowerCase());
      people.push({ name });
    }
  }

  // Merge in client-side equipment
  const seenEquipment = new Set(equipment.map((e) => e.text.toLowerCase()));
  for (const eq of (brainDump.extracted_equipment ?? [])) {
    if (!seenEquipment.has(eq.toLowerCase())) {
      seenEquipment.add(eq.toLowerCase());
      equipment.push({ text: eq, category: 'other', ownership: 'unknown' });
    }
  }

  // Merge in client-side locations
  const seenLocations = new Set(locations.map((l) => l.text.toLowerCase()));
  for (const loc of (brainDump.extracted_locations ?? [])) {
    if (!seenLocations.has(loc.toLowerCase())) {
      seenLocations.add(loc.toLowerCase());
      locations.push({ text: loc });
    }
  }

  // Merge in client-side dates
  const seenDates = new Set(dates.map((d) => d.iso));
  for (const d of (brainDump.extracted_dates ?? [])) {
    if (!seenDates.has(d.rough_iso)) {
      seenDates.add(d.rough_iso);
      dates.push({ text: d.raw, iso: d.rough_iso, has_time: d.rough_iso.includes('T') });
    }
  }

  return { people, equipment, locations, dates };
}

// ---------------------------------------------------------------------------
// Get user's home club coordinates as fallback
// ---------------------------------------------------------------------------

async function getUserHomeClubCoords(userId: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Get sailor_profile home_club_id
    const { data: profile } = await supabase
      .from('sailor_profiles')
      .select('home_club_id')
      .eq('user_id', userId)
      .single();

    if (!profile?.home_club_id) return null;

    // Try global_clubs first (has coordinates)
    const { data: globalClub } = await supabase
      .from('global_clubs')
      .select('latitude, longitude')
      .eq('platform_club_id', profile.home_club_id)
      .single();

    if (globalClub?.latitude && globalClub?.longitude) {
      return { lat: Number(globalClub.latitude), lng: Number(globalClub.longitude) };
    }

    // Fallback: try sailing_venues linked to the club
    const { data: venue } = await supabase
      .from('sailing_venues')
      .select('coordinates_lat, coordinates_lng')
      .ilike('name', `%${profile.home_club_id}%`)
      .limit(1)
      .single();

    if (venue?.coordinates_lat && venue?.coordinates_lng) {
      return { lat: Number(venue.coordinates_lat), lng: Number(venue.coordinates_lng) };
    }

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main Resolution Function
// ---------------------------------------------------------------------------

export interface EntityResolutionResult {
  entities: AnyExtractedEntity[];
  firstDateIso?: string;
  resolvedLocationCoords?: { lat: number; lng: number };
  resolvedVenueId?: string;
}

/**
 * Resolve all entities against platform data.
 * Accepts merged entity input from buildEntityInput().
 */
export async function resolveEntities(
  entityInput: BrainDumpPlanResult['extracted_entities'],
  userId: string,
): Promise<EntityResolutionResult> {
  if (!entityInput) {
    return { entities: [] };
  }

  // Fetch user boats for equipment resolution
  let userBoats: SailorBoat[] = [];
  let userEquipment: BoatEquipment[] = [];
  try {
    userBoats = await sailorBoatService.listBoatsForSailor(userId);
    const primaryBoat = userBoats.find((b) => b.is_primary) || userBoats[0];
    if (primaryBoat) {
      userEquipment = await equipmentService.getEquipmentForBoat(primaryBoat.id);
    }
  } catch {}

  // Resolve all entity types in parallel
  const [people, equipment, locations, dates] = await Promise.all([
    resolvePeople(entityInput.people ?? []),
    resolveEquipment(entityInput.equipment ?? [], userBoats, userEquipment),
    resolveLocations(entityInput.locations ?? []),
    Promise.resolve(resolveDates(entityInput.dates ?? [])),
  ]);

  const entities: AnyExtractedEntity[] = [...people, ...equipment, ...locations, ...dates];

  // Extract first date and location for enrichment
  const firstDate = dates[0];
  let firstResolvedLocation = locations.find((l) => l.coordinates);

  // Fallback: if no location resolved to coordinates, try user's home club
  let fallbackCoords: { lat: number; lng: number } | undefined;
  if (!firstResolvedLocation?.coordinates && firstDate) {
    const homeCoords = await getUserHomeClubCoords(userId);
    if (homeCoords) {
      fallbackCoords = homeCoords;
    }
  }

  return {
    entities,
    firstDateIso: firstDate?.parsed_iso,
    resolvedLocationCoords: firstResolvedLocation?.coordinates ?? fallbackCoords,
    resolvedVenueId: firstResolvedLocation?.venue_id,
  };
}
