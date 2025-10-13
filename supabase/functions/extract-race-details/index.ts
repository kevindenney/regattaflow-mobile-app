/**
 * Extract Race Details Edge Function
 * Uses Anthropic Claude to extract comprehensive race data from sailing instructions
 * This runs server-side to protect API keys
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

interface ExtractRequest {
  text: string;
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { text } = (await req.json()) as ExtractRequest;

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call Anthropic API
    const systemPrompt = `You are an expert sailing race data extraction assistant. Extract structured race information from sailing instructions, notices of race, or any text containing race details.

CRITICAL RULES:
1. Extract ALL available information, no matter how detailed
2. Return valid JSON only - no explanations, no markdown
3. Use null for missing information
4. Be intelligent about extracting timing, venues, and race details
5. Parse start sequences into structured format
6. Extract VHF channels, RC boat info, and committee details
7. Identify course types (Windward/Leeward, Triangle, etc.)
8. Extract scoring and penalty systems
9. Parse weather and condition expectations
10. Extract tactical notes if present

Return JSON matching this TypeScript interface:
{
  raceName: string;
  raceDate: string; // YYYY-MM-DD format
  venue: string;
  description?: string;
  warningSignalTime?: string; // HH:MM format
  warningSignalType?: "sound" | "flag" | "both";
  preparatoryMinutes?: number;
  classIntervalMinutes?: number;
  totalStarts?: number;
  startSequence?: Array<{class: string; warning: string; start: string}>;
  plannedFinishTime?: string;
  timeLimitMinutes?: number;
  vhfChannel?: string;
  vhfBackupChannel?: string;
  safetyChannel?: string;
  rcBoatName?: string;
  rcBoatPosition?: string;
  markBoats?: Array<{mark: string; boat: string; position: string}>;
  raceOfficer?: string;
  protestCommittee?: string;
  startAreaName?: string;
  startAreaDescription?: string;
  startLineLength?: number; // meters
  potentialCourses?: string[]; // ["Windward/Leeward", "Triangle", etc.]
  courseSelectionCriteria?: string;
  courseDiagramUrl?: string;
  scoringSystem?: string; // "Low Point", "Bonus Point", etc.
  penaltySystem?: string; // "720°", "Scoring", "Protest", etc.
  penaltyDetails?: string;
  specialRules?: string[];
  sailingInstructionsUrl?: string;
  noticeOfRaceUrl?: string;
  classDivisions?: Array<{name: string; fleet_size: number}>;
  expectedFleetSize?: number;
  expectedWindDirection?: number; // 0-360 degrees
  expectedWindSpeedMin?: number; // knots
  expectedWindSpeedMax?: number; // knots
  expectedConditions?: string;
  tideAtStart?: string;
  venueSpecificNotes?: string;
  favoredSide?: "Left" | "Right" | "Middle" | "TBD";
  laylineStrategy?: string;
  startStrategy?: string;
  registrationDeadline?: string; // ISO 8601
  entryFeeAmount?: number;
  entryFeeCurrency?: string;
  checkInTime?: string; // HH:MM
  skipperBriefingTime?: string; // HH:MM
}

EXAMPLES:

Input: "Hong Kong Dragon Championship at RHKYC, October 15, 2025. First warning 10:00. VHF 72. RC boat at east end. 720° penalty system."

Output:
{
  "raceName": "Hong Kong Dragon Championship",
  "raceDate": "2025-10-15",
  "venue": "Royal Hong Kong Yacht Club",
  "warningSignalTime": "10:00",
  "vhfChannel": "72",
  "rcBoatPosition": "East end",
  "penaltySystem": "720°"
}

Input: "Croucher Series Race 3, Victoria Harbour, Nov 17 2025, 2 starts (Dragon 10:00, J/70 10:05), 5 minute class interval, PRO: John Smith, Channel 72"

Output:
{
  "raceName": "Croucher Series Race 3",
  "raceDate": "2025-11-17",
  "venue": "Victoria Harbour",
  "totalStarts": 2,
  "classIntervalMinutes": 5,
  "warningSignalTime": "10:00",
  "startSequence": [
    {"class": "Dragon", "warning": "10:00", "start": "10:05"},
    {"class": "J/70", "warning": "10:05", "start": "10:10"}
  ],
  "raceOfficer": "John Smith",
  "vhfChannel": "72",
  "classDivisions": [
    {"name": "Dragon", "fleet_size": 0},
    {"name": "J/70", "fleet_size": 0}
  ]
}

Be thorough and extract everything possible!`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Extract all race details from this text:\n\n${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return new Response(JSON.stringify({ error: 'AI extraction failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.content[0];

    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON response, handling markdown code blocks if present
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    const extracted = JSON.parse(jsonText);

    // Validate required fields
    if (!extracted.raceName || !extracted.raceDate || !extracted.venue) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not extract required fields (race name, date, venue). Please provide more information.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Calculate confidence based on how many fields were extracted
    const totalFields = Object.keys(extracted).length;
    const confidence = Math.min(0.95, 0.5 + (totalFields / 40) * 0.5); // 40 possible fields

    return new Response(
      JSON.stringify({
        success: true,
        data: extracted,
        confidence,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Error:', error);

    let errorMessage = 'Failed to extract race details';
    if (error.message?.includes('JSON')) {
      errorMessage = 'Failed to parse AI response. Please try rephrasing your input.';
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
