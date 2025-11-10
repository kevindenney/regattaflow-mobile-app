import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

/**
 * Enhanced Race Extraction Edge Function
 * - Detects single race OR multiple races (series/calendar)
 * - Extracts comprehensive fields from NOR/SI documents
 * - Returns multi-race data when calendar detected
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[extract-race-details] Processing text, length:', text.length);

    // Call Claude API with enhanced multi-race detection prompt
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 8192,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: `You are an expert at extracting structured race information from sailing documents (NOR, SI, calendars).

CRITICAL: First determine if this document contains:
1. **SINGLE RACE**: One race event with one date
2. **RACE SERIES**: Multiple races under one series name (e.g., "Croucher Series")
3. **MULTIPLE SERIES**: Multiple distinct race series (e.g., "Croucher Series", "Corinthian Series")

If multiple races/series are detected, extract ALL of them. Do not limit to one race.

Extract ALL available information from the following document. Be thorough and extract every field you can find.

Document:
${text}

Return a JSON object with this EXACT structure:

{
  "multipleRaces": boolean,  // true if document contains 2+ races/series
  "races": [  // Array of race objects (even if just one race)
    {
      // === BASIC INFORMATION ===
      "raceName": string,  // Full race name (include series name if applicable, e.g., "Croucher Series Race 1")
      "raceSeriesName": string | null,  // Series name if part of a series (e.g., "Croucher Series")
      "raceDate": string,  // ISO 8601 format (YYYY-MM-DD)
      "venue": string,
      "venueVariant": string | null,  // If venue changes per race (e.g., "Port Shelter", "Clearwater Bay")
      "description": string | null,

      // === TIMING & SCHEDULE ===
      "warningSignalTime": string | null,  // HH:MM format or "HHMMhrs"
      "racesPerDay": number | null,
      "raceNumber": number | null,  // Race number within series
      "totalRacesInSeries": number | null,

      // === GOVERNING RULES ===
      "racingRulesSystem": string | null,  // e.g., "Racing Rules of Sailing (RRS)"
      "prescriptions": string | null,  // e.g., "HKSF Prescriptions"
      "classRules": string | null,  // e.g., "International Dragon Class Rules"
      "ssiReference": string | null,  // e.g., "Part 1 and Appendix D for Harbour racing"
      "courseAttachmentReference": string | null,  // e.g., "SSI Attachment A" or "SSI Attachment B"

      // === ELIGIBILITY & ENTRY ===
      "eligibilityRequirements": string | null,  // e.g., "Open to all boats of the Dragon class"
      "entryFormUrl": string | null,
      "entryDeadline": string | null,  // e.g., "before first race day"
      "signOnRequirement": string | null,  // e.g., "10 minutes before warning signal via SMS/SailSys"
      "crewListRequirement": string | null,
      "safetyBriefingRequired": boolean | null,

      // === CLASS & FLEET ===
      "boatClass": string | null,  // e.g., "Dragon"
      "classDivisions": Array<{name: string, fleet_size: number}> | null,

      // === SCORING ===
      "scoringSystem": string | null,  // Usually "Low Point System" per RRS
      "seriesRacesRequired": number | null,  // Minimum races to constitute a series
      "discardsPolicy": string | null,

      // === COURSE & VENUE ===
      "courseArea": string | null,  // e.g., "Harbour", "Port Shelter", "Clearwater Bay"
      "courseSelectionCriteria": string | null,

      // === SAFETY ===
      "safetyRequirements": string | null,  // e.g., "Keep clear of commercial traffic"
      "safetyConsequences": string | null,  // What happens if safety rule broken

      // === INSURANCE ===
      "insuranceRequired": boolean | null,
      "minimumInsuranceCoverage": string | null,  // e.g., "Third-party liability minimum per HKSAR law"

      // === PRIZES ===
      "prizesDescription": string | null,  // e.g., "Trophies presented at Annual Prizegiving Dinner"

      // === ADDITIONAL INFO ===
      "organizer": string | null,  // e.g., "Royal Hong Kong Yacht Club"
      "classSecretary": string | null,  // Contact person
      "specialDesignations": Array<string> | null,  // e.g., ["Clean Regatta by Sailors for the Sea"]

      // === COMMUNICATIONS (if available) ===
      "vhfChannel": string | null,
      "safetyChannel": string | null,

      // === CONFIDENCE SCORES ===
      "confidenceScores": {
        "raceName": number,  // 0.0 to 1.0
        "raceDate": number,
        "venue": number,
        "overall": number
      }
    }
  ],
  "documentType": "NOR" | "SI" | "CALENDAR" | "AMENDMENT" | "OTHER",
  "organizingAuthority": string | null,
  "overallConfidence": number  // 0.0 to 1.0
}

IMPORTANT INSTRUCTIONS:
1. If you detect multiple race series (like Croucher, Corinthian, Commodore), extract ALL of them
2. For each race in a series with multiple race days, create a separate race object
3. Extract dates carefully - they may be in various formats (e.g., "Saturday 27 September 2025")
4. Extract ALL governing rules, SSI references, and course attachments
5. If a field is not found in the document, set it to null (not undefined)
6. Be generous with confidence scores for clearly stated information (0.9-1.0 for explicit data)
7. For race series, use naming like "Croucher Series Race 1", "Croucher Series Race 2", etc.
8. Extract venue variants carefully (Port Shelter vs Clearwater Bay vs Harbour)

Return ONLY the JSON object, no additional text.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[extract-race-details] Claude API error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
      });
      return new Response(
        JSON.stringify({
          error: `Claude API error: ${response.status}`,
          details: errorText.substring(0, 500)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('[extract-race-details] Claude response received');

    // Extract the JSON from Claude's response
    let content = result.content[0].text;
    console.log('[extract-race-details] Raw content length:', content.length);
    console.log('[extract-race-details] Content preview:', content.substring(0, 200));

    // Claude sometimes wraps JSON in markdown code blocks, so clean it up
    // Remove markdown code fences if present
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    content = content.trim();

    console.log('[extract-race-details] Cleaned content preview:', content.substring(0, 200));

    // Parse the JSON
    let extractedData;
    try {
      extractedData = JSON.parse(content);
    } catch (parseError) {
      console.error('[extract-race-details] Failed to parse Claude response as JSON:', parseError);
      console.error('[extract-race-details] Content preview:', content.substring(0, 500));
      return new Response(
        JSON.stringify({
          error: 'Failed to parse AI response',
          details: content.substring(0, 300),
          parseError: parseError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[extract-race-details] Extracted data:', {
      multipleRaces: extractedData.multipleRaces,
      raceCount: extractedData.races?.length || 0,
      documentType: extractedData.documentType,
    });

    // Return the extracted data
    return new Response(
      JSON.stringify({
        success: true,
        ...extractedData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[extract-race-details] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
