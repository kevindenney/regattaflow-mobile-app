/**
 * DateEnrichmentService — Weather/tide/rig enrichment for detected dates.
 *
 * When a date + location are detected for a sailing interest, fetches
 * weather forecasts, tide data, and generates AI rig/sail recommendations.
 */

import { regionalWeatherService } from '@/services/weather/RegionalWeatherService';
import { tidalIntelService } from '@/services/tides/TidalIntelService';
import { supabase } from '@/services/supabase';
import type { DateEnrichment } from '@/types/step-detail';
import type { SailorBoat } from '@/services/SailorBoatService';
import type { BoatEquipment } from '@/services/EquipmentService';

interface EnrichmentParams {
  dateIso: string;
  coordinates: { lat: number; lng: number };
  venueId?: string;
  userBoats?: SailorBoat[];
  userEquipment?: BoatEquipment[];
}

/**
 * Enrich a date with weather, tides, and rig/sail suggestions.
 * Runs asynchronously — UI shows loading state then reveals the card.
 */
export async function enrichDateForSailing(params: EnrichmentParams): Promise<DateEnrichment> {
  const { dateIso, coordinates, venueId, userBoats = [], userEquipment = [] } = params;
  const enrichment: DateEnrichment = {};

  // Fetch weather and tides in parallel
  const [weatherResult, tideResult] = await Promise.allSettled([
    fetchWeatherForDate(dateIso, coordinates, venueId),
    fetchTidesForDate(dateIso, coordinates),
  ]);

  if (weatherResult.status === 'fulfilled' && weatherResult.value) {
    enrichment.wind = weatherResult.value;
  }

  if (tideResult.status === 'fulfilled' && tideResult.value) {
    enrichment.tide = tideResult.value;
  }

  // Generate rig/sail recommendation if we have wind data + boat info
  if (enrichment.wind && userBoats.length > 0) {
    try {
      const suggestion = await generateRigSuggestion({
        wind: enrichment.wind,
        boat: userBoats.find((b) => b.is_primary) || userBoats[0],
        equipment: userEquipment,
      });
      if (suggestion) {
        enrichment.rig_suggestion = suggestion.rig;
        enrichment.sail_suggestion = suggestion.sail;
      }
    } catch {
      // Rig suggestion is optional — don't fail enrichment
    }
  }

  return enrichment;
}

// ---------------------------------------------------------------------------
// Weather Fetching
// ---------------------------------------------------------------------------

async function fetchWeatherForDate(
  dateIso: string,
  coordinates: { lat: number; lng: number },
  venueId?: string,
): Promise<DateEnrichment['wind'] | null> {
  try {
    const targetDate = new Date(dateIso);
    const now = new Date();
    const hoursAhead = Math.max(24, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60)));

    // Can only forecast ~7 days ahead
    if (hoursAhead > 168) return null;

    // Build a minimal SailingVenue for the weather service
    const venue = {
      id: venueId || 'temp_enrichment',
      name: 'Enrichment Location',
      coordinates: [coordinates.lng, coordinates.lat] as [number, number],
      country: '',
      region: '' as any,
      venueType: 'club' as any,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const weatherData = await regionalWeatherService.getVenueWeather(venue as any, hoursAhead);
    if (!weatherData?.forecast?.length) return null;

    // Find forecast closest to target date/time (default to noon if no time specified)
    const targetNoon = new Date(dateIso.includes('T') ? dateIso + ':00' : dateIso + 'T12:00:00');
    let closestForecast = weatherData.forecast[0];
    let closestDiff = Infinity;

    for (const f of weatherData.forecast) {
      const diff = Math.abs(new Date(f.timestamp).getTime() - targetNoon.getTime());
      if (diff < closestDiff) {
        closestDiff = diff;
        closestForecast = f;
      }
    }

    return {
      speed_knots: Math.round(closestForecast.windSpeed),
      direction: Math.round(closestForecast.windDirection),
      gusts: closestForecast.windGusts ? Math.round(closestForecast.windGusts) : undefined,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tide Fetching
// ---------------------------------------------------------------------------

async function fetchTidesForDate(
  dateIso: string,
  coordinates: { lat: number; lng: number },
): Promise<DateEnrichment['tide'] | null> {
  try {
    const referenceTime = new Date(dateIso.includes('T') ? dateIso + ':00' : dateIso + 'T12:00:00');
    const intel = await tidalIntelService.getTideIntel(
      { latitude: coordinates.lat, longitude: coordinates.lng },
      referenceTime,
    );

    if (!intel) return null;

    return {
      state: intel.current.trend,
      height_m: Math.round(intel.current.height * 100) / 100,
      next_high: intel.extremes.nextHigh
        ? new Date(intel.extremes.nextHigh.time).toISOString()
        : undefined,
      next_low: intel.extremes.nextLow
        ? new Date(intel.extremes.nextLow.time).toISOString()
        : undefined,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Rig/Sail Recommendation (AI-generated)
// ---------------------------------------------------------------------------

async function generateRigSuggestion(params: {
  wind: NonNullable<DateEnrichment['wind']>;
  boat: SailorBoat;
  equipment: BoatEquipment[];
}): Promise<{ rig: string; sail: string } | null> {
  const { wind, boat, equipment } = params;

  const boatClass = boat.boat_class?.name || 'keelboat';
  const sails = equipment
    .filter((e) => e.category === 'sails' || e.category === 'sail')
    .map((e) => `${e.custom_name}${e.manufacturer ? ` (${e.manufacturer})` : ''}`)
    .join(', ');

  const prompt = `Wind forecast: ${wind.speed_knots} knots${wind.gusts ? `, gusts ${wind.gusts} knots` : ''}, direction ${wind.direction}°.
Boat class: ${boatClass}.
${sails ? `Available sails: ${sails}.` : 'No specific sails listed.'}

In 2-3 sentences, recommend:
1. Which sails to use (or rig configuration)
2. Any tuning tips for these conditions

Be specific to the boat class and wind conditions. No markdown.`;

  try {
    const { data, error } = await supabase.functions.invoke('step-plan-suggest', {
      body: { system: 'You are a sailing equipment advisor. Give brief, practical rig recommendations.', prompt, max_tokens: 256 },
    });

    if (error || !data?.text) return null;

    const text = data.text as string;
    // Split into rig and sail suggestions (rough heuristic)
    const sentences = text.split(/[.!]\s+/).filter(Boolean);
    const rigSentences = sentences.filter((s) =>
      /rig|tension|shroud|backstay|mast|vang|cunningham|outhaul/i.test(s));
    const sailSentences = sentences.filter((s) =>
      /sail|jib|genoa|spinnaker|main|gennaker/i.test(s));

    return {
      rig: rigSentences.length > 0 ? rigSentences.join('. ').trim() + '.' : text.trim(),
      sail: sailSentences.length > 0 ? sailSentences.join('. ').trim() + '.' : '',
    };
  } catch {
    return null;
  }
}
