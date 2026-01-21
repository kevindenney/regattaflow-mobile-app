/**
 * Extract Course from Text Edge Function
 * Extracts course waypoints from raw pasted text using AI
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.26.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RouteWaypoint {
  name: string;
  latitude: number;
  longitude: number;
  type: 'start' | 'waypoint' | 'gate' | 'finish' | 'mark';
  passingSide?: 'port' | 'starboard' | 'either';
  notes?: string;
}

const EXTRACTION_PROMPT = `You are extracting GPS coordinates from sailing instructions. Your ONLY job is to find coordinates that are EXPLICITLY written in the text.

CRITICAL RULES:
1. ONLY extract coordinates that are WRITTEN in the document
2. DO NOT infer, guess, or generate coordinates
3. DO NOT make up coordinates for locations mentioned without coordinates
4. If a location has no coordinates in the text, DO NOT include it

LOOK FOR THIS TABLE FORMAT (common in sailing instructions):
"Mark Name    GPS Co-ordinates    Notes
Chesterman Govt. Buoy    N 22°11.20' E 114°12.00'    Yellow Govt. Buoy
Stanley Bay GATE Mark    N 22°12.00' E 114°12.00'    Black Inflatable Buoy"

COORDINATE FORMATS TO RECOGNIZE:
1. Degrees + Decimal Minutes: N 22°11.20' E 114°12.00' → Convert: lat = 22 + 11.20/60 = 22.1867
2. Decimal Degrees: 22.1867, 114.2000 → Use as-is
3. With N/S/E/W: N22°12.00' E114°12.00' → Same conversion

EXACT CONVERSION FORMULA:
- N 22°11.20' means: 22 + (11.20 ÷ 60) = 22.186667
- E 114°12.00' means: 114 + (12.00 ÷ 60) = 114.200000
- N 22°12.00' means: 22 + (12.00 ÷ 60) = 22.200000
- E 114°09.10' means: 114 + (9.10 ÷ 60) = 114.151667

EXAMPLE EXTRACTION from the Around the Island Race document:
If text contains: "Chesterman Govt. Buoy N 22˚11.20' E 114˚12.00'"
Extract: { "name": "Chesterman Govt. Buoy", "latitude": 22.1867, "longitude": 114.2000 }

If text contains: "Stanley Bay GATE Mark (port end) N 22˚12.00' E 114˚12.00'"
Extract: { "name": "Stanley Bay GATE Mark", "latitude": 22.2000, "longitude": 114.2000, "type": "gate" }

Return JSON:
{
  "courseName": "Course name if found",
  "totalDistanceNm": number or null,
  "raceDirection": "clockwise" | "counterclockwise" | null,
  "startFinishLocation": {
    "name": "Start/Finish location name",
    "latitude": number or null,
    "longitude": number or null
  } or null,
  "waypoints": [
    {
      "name": "Exact name from document",
      "latitude": number (decimal degrees, calculated correctly),
      "longitude": number (decimal degrees, calculated correctly),
      "type": "start" | "waypoint" | "gate" | "finish" | "mark",
      "passingSide": "port" | "starboard" | null,
      "notes": "Any notes from document",
      "sequenceOrder": number (order in which to pass this mark, if mentioned)
    }
  ]
}

VALIDATION:
- Hong Kong coordinates should be approximately: lat 22.1-22.4, lon 114.0-114.3
- If your calculated coordinates are outside this range, recheck your math
- Double-check: N 22°12.00' = 22.2000 (NOT 22.12)

WAYPOINT TYPE DETECTION:
- If name contains "GATE" → type: "gate"
- If name contains "Start" or is a starting line → type: "start"  
- If name contains "Finish" or is a finishing line → type: "finish"
- Otherwise → type: "mark" or "waypoint"

PASSING SIDE DETECTION:
- "Pass to Port" or "leave to port" → passingSide: "port"
- "Pass to Starboard" or "leave to starboard" → passingSide: "starboard"
- "Round to Starboard" → passingSide: "starboard"
- "Round to Port" → passingSide: "port"

SPECIAL HANDLING FOR START/FINISH LINES:
For distance races, if you see start/finish lines mentioned but without coordinates:
1. Look for the course sequence - the first waypoint in the sequence should be preceded by a START waypoint
2. The last waypoint in the sequence should be followed by a FINISH waypoint
3. If start/finish lines are mentioned (e.g., "Starting Line W - E", "Finishing Line W - E"), create waypoints:
   - START waypoint: Use the location of the first waypoint, or if the first waypoint has coordinates, place start slightly before it (e.g., 0.1nm west if first waypoint is east)
   - FINISH waypoint: Use the location of the last waypoint, or if the last waypoint has coordinates, place finish slightly after it (e.g., 0.1nm east if last waypoint is west)
4. For "W - E" lines, infer approximate positions based on the first/last waypoint locations

Example:
- If course says "Starting Line W - E" followed by "Chesterman Government Buoy N 22°11.20' E 114°12.00'"
- Create: { "name": "Start", "type": "start", "latitude": 22.1867, "longitude": 114.15, "notes": "Starting Line W - E (inferred from course sequence)" }
- If course says "Green Island Club Mark N 22°17.70' E 114°06.50'" followed by "Finishing Line W - E"
- Create: { "name": "Finish", "type": "finish", "latitude": 22.295, "longitude": 114.12, "notes": "Finishing Line W - E (inferred from course sequence)" }

Also extract:
- "startFinishLocation": Name and coordinates of start/finish if mentioned (e.g., "RHKYC Kellett Island")
- "raceDirection": "clockwise" or "counterclockwise" if mentioned (e.g., "Hong Kong Island to Starboard" = clockwise)

REMEMBER: 
- For waypoints with coordinates: Extract them exactly as written
- For start/finish lines without coordinates: Infer reasonable positions based on course sequence and first/last waypoint locations
- Always include start and finish waypoints for distance races, even if coordinates must be inferred`;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, raceType } = await req.json();

    if (!text || text.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: 'Please provide more text content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit content size
    const cleanContent = text.slice(0, 30000);

    const anthropic = new Anthropic({ apiKey });
    
    const raceContext = raceType === 'distance' 
      ? 'This is a DISTANCE/OFFSHORE race. Look for route waypoints, turning marks, islands, headlands, and course coordinates that define a long-distance sailing route.'
      : 'This is a FLEET race. Look for windward/leeward marks, gate marks, start/finish lines, and buoy racing course elements.';

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\n${raceContext}\n\nText content:\n${cleanContent}`,
        },
      ],
    });

    const responseText = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    // Parse JSON from response
    let result: any;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[extract-course-text] Parse error:', parseError);
      result = { waypoints: [] };
    }

    // Validate waypoints
    let validWaypoints = (result.waypoints || []).filter((wp: RouteWaypoint) => {
      return (
        typeof wp.latitude === 'number' &&
        typeof wp.longitude === 'number' &&
        !isNaN(wp.latitude) &&
        !isNaN(wp.longitude) &&
        wp.latitude >= -90 && wp.latitude <= 90 &&
        wp.longitude >= -180 && wp.longitude <= 180
      );
    });

    // Auto-detect gate types from names
    validWaypoints = validWaypoints.map((wp: any) => {
      const name = wp.name?.toLowerCase() || '';
      let type = wp.type || 'mark';
      
      if (name.includes('gate')) {
        type = 'gate';
      } else if (name.includes('start')) {
        type = 'start';
      } else if (name.includes('finish')) {
        type = 'finish';
      }
      
      return { ...wp, type };
    });

    // Add start/finish if detected
    const finalWaypoints: any[] = [];
    
    // Check if we have start/finish waypoints already
    const hasStart = validWaypoints.some(wp => wp.type === 'start');
    const hasFinish = validWaypoints.some(wp => wp.type === 'finish');

    // Add start point
    if (hasStart) {
      // Start already in waypoints, add it first
      const startWp = validWaypoints.find(wp => wp.type === 'start');
      if (startWp) {
        finalWaypoints.push(startWp);
      }
    } else if (result.startFinishLocation?.latitude && result.startFinishLocation?.longitude) {
      // Use explicit start/finish location
      finalWaypoints.push({
        name: result.startFinishLocation.name || 'Start',
        latitude: result.startFinishLocation.latitude,
        longitude: result.startFinishLocation.longitude,
        type: 'start',
        passingSide: null,
        notes: 'Race start',
      });
    } else if (validWaypoints.length > 0 && raceType === 'distance') {
      // For distance races, infer start from first waypoint
      const firstWp = validWaypoints[0];
      // Check if text mentions "Starting Line" or "Start" to confirm we should add it
      const textLower = cleanContent.toLowerCase();
      const hasStartLine = textLower.includes('starting line') || textLower.includes('start line') || 
                          textLower.includes('inner or outer starting') || textLower.includes('outer starting');
      
      if (hasStartLine || !hasStart) {
        // Place start slightly before first waypoint (west if line is W-E)
        // For W-E lines, start should be west of first waypoint
        const startLng = textLower.includes('w - e') || textLower.includes('w-e') 
          ? firstWp.longitude - 0.05  // Slightly west
          : firstWp.longitude - 0.02; // Default slight offset
          
        finalWaypoints.push({
          name: 'Start',
          latitude: firstWp.latitude,
          longitude: startLng,
          type: 'start',
          passingSide: null,
          notes: 'Starting Line (inferred from course sequence)',
        });
      }
    }
    
    // Add extracted waypoints (excluding start/finish if we already added them)
    const waypointsToAdd = validWaypoints.filter(wp => 
      wp.type !== 'start' && wp.type !== 'finish'
    );
    finalWaypoints.push(...waypointsToAdd);
    
    // Add finish point
    if (hasFinish) {
      // Finish already in waypoints, add it last
      const finishWp = validWaypoints.find(wp => wp.type === 'finish');
      if (finishWp) {
        finalWaypoints.push(finishWp);
      }
    } else if (result.startFinishLocation?.latitude && result.startFinishLocation?.longitude) {
      // Use explicit start/finish location (same as start for circumnavigation)
      finalWaypoints.push({
        name: result.startFinishLocation.name ? `${result.startFinishLocation.name} (Finish)` : 'Finish',
        latitude: result.startFinishLocation.latitude,
        longitude: result.startFinishLocation.longitude,
        type: 'finish',
        passingSide: null,
        notes: 'Race finish',
      });
    } else if (validWaypoints.length > 0 && raceType === 'distance') {
      // For distance races, infer finish from last waypoint
      const lastWp = validWaypoints[validWaypoints.length - 1];
      // Check if text mentions "Finishing Line" or "Finish" to confirm we should add it
      const textLower = cleanContent.toLowerCase();
      const hasFinishLine = textLower.includes('finishing line') || textLower.includes('finish line') ||
                           textLower.includes('club finishing line');
      
      if (hasFinishLine || !hasFinish) {
        // Place finish slightly after last waypoint (east if line is W-E)
        // For W-E lines, finish should be east of last waypoint
        const finishLng = textLower.includes('w - e') || textLower.includes('w-e')
          ? lastWp.longitude + 0.05  // Slightly east
          : lastWp.longitude + 0.02; // Default slight offset
          
        finalWaypoints.push({
          name: 'Finish',
          latitude: lastWp.latitude,
          longitude: finishLng,
          type: 'finish',
          passingSide: null,
          notes: 'Finishing Line (inferred from course sequence)',
        });
      }
    }

    // Always ensure start is first and finish is last
    finalWaypoints.sort((a, b) => {
      // Start always first
      if (a.type === 'start') return -1;
      if (b.type === 'start') return 1;
      // Finish always last
      if (a.type === 'finish') return 1;
      if (b.type === 'finish') return -1;
      // Use sequence order if provided
      if (a.sequenceOrder != null && b.sequenceOrder != null) {
        return a.sequenceOrder - b.sequenceOrder;
      }
      // Otherwise maintain relative order
      return 0;
    });

    return new Response(
      JSON.stringify({
        waypoints: finalWaypoints,
        courseName: result.courseName,
        totalDistanceNm: result.totalDistanceNm,
        courseDescription: result.courseDescription,
        raceDirection: result.raceDirection,
        startFinishLocation: result.startFinishLocation,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[extract-course-text] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to extract course data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

