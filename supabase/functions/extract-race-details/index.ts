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
      // === RACE TYPE (Fleet vs Distance) ===
      // IMPORTANT: Detect race type from document content
      "raceType": "fleet" | "distance",  // "fleet" = buoy/mark racing, "distance" = offshore/passage racing
      // Distance race indicators: "offshore", "distance race", "circumnavigation", "around the island", 
      // "passage race", "point-to-point", waypoint coordinates, total distance in nm, time limits in hours
      // Fleet race indicators: "windward/leeward", "mark rounding", "course mark", "start sequence", 
      // "class start", multiple classes, course selection criteria
      
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
      "eligibleClasses": Array<string> | null,  // e.g., ["IRC Monohull", "PHS Monohull", "Dragon", "J/80"]
      "entryFormUrl": string | null,
      "entryDeadline": string | null,  // e.g., "1800hrs Friday 5 December 2025"
      "entryFees": Array<{type: string, amount: string, deadline?: string}> | null,  // e.g., [{type: "Early Bird", amount: "HK$580", deadline: "7 Nov"}]
      "signOnRequirement": string | null,  // e.g., "via SailSys text message"
      "crewListDeadline": string | null,  // e.g., "1700hrs Friday 12 December"
      "safetyBriefingRequired": boolean | null,
      "safetyBriefingDetails": string | null,  // e.g., "Tuesday 9 or Thursday 11 December at 1900hrs"
      
      // === TIME LIMITS ===
      "absoluteTimeLimit": string | null,  // e.g., "1700hrs"
      "cutOffPoints": Array<{location: string, time: string}> | null,  // e.g., [{location: "Lei Yue Mun Gap", time: "1230hrs"}]
      
      // === CONTACTS & LOGISTICS ===
      "raceOfficeLocation": string | null,  // e.g., "RHKYC Kellett Island Gun Room"
      "raceOfficePhone": Array<string> | null,  // e.g., ["2239 0376", "5402 7089"]
      "contactEmail": string | null,
      
      // === PRIZEGIVING ===
      "prizegivingDate": string | null,  // e.g., "Wednesday 17 December 2025"
      "prizegivingTime": string | null,  // e.g., "1930hrs"  
      "prizegivingLocation": string | null,  // e.g., "RHKYC Kellett Island"

      // === CLASS & FLEET ===
      "boatClass": string | null,  // e.g., "Dragon"
      "classDivisions": Array<{name: string, fleet_size: number}> | null,

      // === SCORING & HANDICAPS ===
      "scoringSystem": string | null,  // e.g., "Low Point System", "RHKATI", "IRC", "PHS", "ORC"
      "handicapSystem": string | null,  // e.g., "RHKATI", "IRC", "PHS", "ORC", "ORCi"
      "seriesRacesRequired": number | null,  // Minimum races to constitute a series
      "discardsPolicy": string | null,

      // === PENALTY SYSTEM ===
      "penaltySystem": string | null,  // e.g., "One-Turn Penalty", "Two-Turns Penalty", "Scoring Penalty"
      "penaltyDetails": string | null,  // Additional details (e.g., "RRS 44.1 changed - Two-Turns replaced by One-Turn")
      "ocsPolicy": string | null,  // OCS handling (e.g., "5% time penalty if no significant advantage")

      // === COURSE & VENUE ===
      "courseArea": string | null,  // e.g., "Harbour", "Port Shelter", "Clearwater Bay"
      "courseSelectionCriteria": string | null,
      
      // === MULTIPLE START LINES (IMPORTANT: Many races have multiple start lines!) ===
      "startLines": [  // Array of all starting lines
        {
          "name": string,           // e.g., "Inner Starting Line", "Outer Starting Line"
          "description": string | null,  // e.g., "between IDM and ODM from west to east"
          "classes": Array<string>,  // Which classes use this line
          "vhfChannel": string | null,  // VHF channel for this line
          "marks": {
            "starboardEnd": string | null,  // e.g., "Starter's Box", "Kellett VIII"
            "portEnd": string | null        // e.g., "ODM", "orange inflatable buoy"
          } | null,
          "direction": string | null,  // e.g., "W-E"
          "startTimes": [  // Start schedule for this line
            {
              "class": string,
              "flag": string,  // IC Flag/Pennant
              "time": string   // Start time (HH:MM or HHMMhrs)
            }
          ] | null
        }
      ] | null,
      
      // === RACING AREA & COURSE ===
      "racingAreaName": string | null,        // e.g., "Hong Kong Island"
      "racingAreaDescription": string | null, // e.g., "Hong Kong Island to Starboard"
      "approximateDistance": string | null,   // e.g., "26nm"
      "courseDescription": string | null,     // Full course description
      
      // === DISTANCE RACING FIELDS (only for raceType === "distance") ===
      "totalDistanceNm": number | null,       // Total race distance in nautical miles
      "timeLimitHours": number | null,        // Time limit for race completion in hours
      "startFinishSameLocation": boolean | null,  // True for circumnavigation, false for point-to-point
      "routeWaypoints": [  // Array of waypoints for distance races
        {
          "name": string,                     // Waypoint name (e.g., "Green Island Gate")
          "latitude": number | null,          // Decimal degrees
          "longitude": number | null,
          "type": "start" | "waypoint" | "gate" | "finish",  // Type of waypoint
          "required": boolean,                // Is this waypoint mandatory?
          "passingSide": "port" | "starboard" | "either" | null,  // How to pass
          "notes": string | null              // Additional instructions
        }
      ] | null,
      "tideGates": [  // Timing windows based on tidal currents
        {
          "location": string,
          "optimalPassingTime": string | null,  // e.g., "Before 1230hrs"
          "currentDirection": "favorable" | "adverse" | null,
          "notes": string | null
        }
      ] | null
      
      // === COURSE GATES ===
      "gates": [
        {
          "name": string,
          "description": string | null,
          "orientation": string | null,  // e.g., "SE-NW"
          "portMark": string | null,
          "starboardMark": string | null,
          "canShortenHere": boolean | null
        }
      ] | null,
      
      // === COURSE MARKS (with GPS coordinates if available) ===
      "courseMarks": [
        {
          "name": string,
          "type": string,  // "government_buoy", "club_mark", "gate", "geographical"
          "latitude": number | null,  // Decimal degrees
          "longitude": number | null,
          "description": string | null,
          "rounding": string | null,  // "to_port", "to_starboard", "pass_through"
          "color": string | null
        }
      ] | null,
      
      // === PROHIBITED AREAS (TSS, military zones, etc.) ===
      "prohibitedAreas": [
        {
          "name": string,
          "description": string | null,
          "coordinates": Array<{lat: number, lng: number}> | null,
          "consequence": string | null  // e.g., "disqualified without a hearing"
        }
      ] | null,

      // === SAFETY ===
      "safetyRequirements": string | null,  // e.g., "Keep clear of commercial traffic"
      "safetyConsequences": string | null,  // What happens if safety rule broken

      // === INSURANCE ===
      "insuranceRequired": boolean | null,
      "minimumInsuranceCoverage": string | null,  // e.g., "Third-party liability minimum per HKSAR law"

      // === PRIZES ===
      "prizesDescription": string | null,  // e.g., "Trophies presented at Annual Prizegiving Dinner"

      // === FINISH AREA ===
      "finishAreaName": string | null,  // e.g., "Club Finishing Line"
      "finishAreaDescription": string | null,  // e.g., "Between ODM and IDM from west to east"
      "finishMarks": {
        "starboardEnd": string | null,  // e.g., "RHKYC Kellett Island Starter's Box"
        "portEnd": string | null  // e.g., "ODM"
      } | null,

      // === DOCUMENT URLS ===
      "sailingInstructionsUrl": string | null,  // URL to SI document or race page
      "noticeOfRaceUrl": string | null,  // URL to NOR document
      "onlineNoticeBoard": string | null,  // URL where notices are posted

      // === ADDITIONAL INFO ===
      "organizer": string | null,  // e.g., "Royal Hong Kong Yacht Club"
      "classSecretary": string | null,  // Contact person
      "specialDesignations": Array<string> | null,  // e.g., ["Clean Regatta by Sailors for the Sea"]

      // === COMMUNICATIONS (IMPORTANT: Extract ALL VHF channels mentioned) ===
      "vhfChannel": string | null,  // Primary/default VHF channel
      "safetyChannel": string | null,  // Safety/distress channel
      "vhfChannels": [  // Array of ALL VHF channels with their purposes
        {
          "channel": string,  // Channel number (e.g., "72", "73", "77")
          "purpose": string,  // Purpose (e.g., "Inner Starting Line", "Outer Starting Line", "Safety Watch", "Race Committee")
          "classes": Array<string> | null  // Which classes use this channel (e.g., ["Dragon", "J/80", "Fast Fleet"])
        }
      ] | null,
      "raceOfficer": string | null,  // Principal Race Officer name

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

**RACE TYPE DETECTION (CRITICAL)**:
   - Detect "fleet" vs "distance" race type from document content
   - **DISTANCE race indicators**: 
     * Words: "offshore", "distance race", "circumnavigation", "around the island", "passage race", "point-to-point", "ocean race", "coastal race"
     * Features: Time limits in hours (not minutes), total distance in nautical miles, named waypoints/gates along route, different start/finish locations
     * Example: "Around Hong Kong Island Race" = distance
   - **FLEET race indicators**: 
     * Words: "windward/leeward", "mark rounding", "course mark", "start sequence", "class start", "buoy racing"
     * Features: Multiple boat classes with class flags, start sequences with minute intervals, course selection criteria, RC boat signals
     * Example: "Lipton Trophy" with classes Dragon, J/80, etc. = fleet
   - When in doubt, default to "fleet"
   - For distance races, extract routeWaypoints, totalDistanceNm, timeLimitHours, and tideGates
9. **VHF CHANNELS**: Extract ALL VHF channels mentioned in the document!
   - Different channels may be used for different starting lines (Inner vs Outer)
   - Different classes may use different channels
   - Safety/listening watch channels are common (often Channel 77 or 16)
   - Example: If document says "VHF Channel 73 for One Design" and "VHF 72 for IRC/PHS", extract BOTH as separate entries in vhfChannels array

10. **MULTIPLE START LINES**: Many races have separate starting lines for different classes!
    - Extract EACH starting line as a separate entry in startLines array
    - Include ALL classes that start from each line
    - Include start times for each class on that line
    - Example: "Inner Starting Line" for One Design (Dragon 0840, J/80 0855) and "Outer Starting Line" for IRC/PHS
    - Link VHF channels to their respective start lines

11. **COURSE MARKS & GPS**: Extract ALL course marks with GPS coordinates when available
    - Government buoys, club marks, gates, geographical features
    - Include rounding instructions (to port, to starboard, pass through)
    - Include approximate positions if GPS not explicit (e.g., "0.83nm west north-west of Bluff Head Light")

12. **PROHIBITED AREAS**: Extract TSS zones, military areas, and other prohibited zones
    - Include GPS coordinates when provided
    - Include consequences for violation

13. **PENALTY SYSTEM**: Extract penalty rules from the document
    - Look for section titled "PENALTY SYSTEM" or "PENALTIES"
    - Common penalties: "One-Turn Penalty", "Two-Turns Penalty", "Scoring Penalty"
    - Note any modifications to standard RRS (e.g., "Two-Turns Penalty replaced by One-Turn Penalty")
    - Extract OCS (On Course Side) policies (e.g., "5% time penalty if no significant advantage")
    - Include rule references (e.g., "RRS 44.1 and 44.2 apply")

14. **FINISH AREA**: Extract finish line details from "THE FINISH" section
    - finishAreaName: Name of the finish line (e.g., "Club Finishing Line")
    - finishAreaDescription: How boats finish (e.g., "passing between ODM and IDM from west to east")
    - finishMarks: The marks defining the finish line ends

15. **DOCUMENT URLS**: Extract any URLs mentioned in the document
    - sailingInstructionsUrl: URL where race info is posted (often in "COMMUNICATIONS" section)
    - noticeOfRaceUrl: Link to NOR if mentioned
    - onlineNoticeBoard: URL for official notice board
    - Example: "www.rhkyc.org.hk/sailing/races-and-regattas/localracing/aroundtheislandrace"

16. **SCORING & HANDICAPS**: Extract handicap and scoring information
    - Look for "HANDICAPS" section
    - Common handicap systems: RHKATI, IRC, PHS, ORC, ORCi, ORR
    - scoringSystem: How results are calculated (e.g., "Corrected time using RHKATI")
    - handicapSystem: The specific system used (e.g., "RHKATI", "IRC")
    - Extract discards policy if mentioned

17. **PRIZES**: Extract prize information if present
    - Often in "PRIZES" or "AWARDS" section
    - May reference "Annual Prizegiving" or specific trophy names
    - If not explicitly mentioned, set to null (prizes often in NOR, not SI)

18. **ENTRY INFORMATION** (typically from NOR):
    - eligibleClasses: List ALL boat classes that can enter
    - entryFees: Extract different fee tiers (Early Bird, Standard, Late)
    - entryDeadline: Final entry deadline
    - entryFormUrl: URL to entry form if mentioned
    - crewListDeadline: When crew lists are due

19. **SAFETY BRIEFING**:
    - safetyBriefingRequired: true if briefing is mandatory
    - safetyBriefingDetails: Date, time, and location of briefing

20. **TIME LIMITS**:
    - absoluteTimeLimit: Final time to finish (e.g., "1700hrs")
    - cutOffPoints: Intermediate cut-off times at specific locations

21. **CONTACTS & LOGISTICS**:
    - raceOfficeLocation: Where the race office is located
    - raceOfficePhone: Phone numbers to call
    - contactEmail: Contact email addresses

22. **PRIZEGIVING**:
    - prizegivingDate, prizegivingTime, prizegivingLocation
    - Extract from "PRIZES" or "PRIZEGIVING" section

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
