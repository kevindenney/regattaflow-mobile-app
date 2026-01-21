import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

/**
 * Course Image/PDF Extraction Edge Function
 *
 * Uses Claude Vision to extract course marks, sequence, and wind direction
 * from sailing course diagram images or PDFs.
 *
 * Accepts: { imageBase64?: string, pdfBase64?: string, mediaType?: string }
 * Returns: { success: boolean, data?: ExtractedCourse, error?: string }
 */

interface ExtractedMark {
  name: string;
  type: 'start' | 'windward' | 'leeward' | 'wing' | 'offset' | 'finish' | 'gate';
  position?: {
    relative: string;
    description?: string;
  };
  rounding?: 'port' | 'starboard';
  color?: string;
  shape?: string;
}

interface ExtractedCourse {
  marks: ExtractedMark[];
  sequence: string[];
  windDirection?: string;
  courseType?: 'windward_leeward' | 'triangle' | 'olympic' | 'trapezoid' | 'custom';
  laps?: number;
  notes?: string[];
  confidence: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, pdfBase64, mediaType = 'image/png' } = await req.json();

    if (!imageBase64 && !pdfBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'No image or PDF data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isPdf = !!pdfBase64;
    const base64Data = pdfBase64 || imageBase64;

    const prompt = `Analyze this sailing course diagram${isPdf ? ' document' : ' image'}. You are an expert sailing race officer and course analyst.

Extract all course marks, their types, rounding directions, and the course sequence. Look carefully for:

1. MARK IDENTIFICATION:
   - Start/Finish line marks (often called "Pin", "RC Boat", "Committee Boat")
   - Windward marks (usually at top of diagram, labeled "1", "W", "Windward", etc.)
   - Leeward marks (usually at bottom, labeled "2", "L", "Leeward", etc.)
   - Gate marks (paired marks like "3p" and "3s" for port and starboard gates)
   - Offset marks (smaller marks near main marks)
   - Wing marks (side marks in triangle or trapezoid courses)

2. ROUNDING DIRECTIONS:
   - Look for arrows showing direction of travel
   - Port roundings = mark on your left when rounding (counterclockwise)
   - Starboard roundings = mark on your right when rounding (clockwise)

3. COURSE SEQUENCE:
   - Follow the course from start to finish
   - Note the order of mark roundings
   - Identify if there are multiple laps

4. WIND DIRECTION:
   - Usually indicated by an arrow or "WIND" label
   - Windward marks are upwind, leeward marks are downwind

5. COURSE TYPE:
   - windward_leeward: Simple up-down course
   - triangle: Three-sided course
   - trapezoid: Four-sided course
   - olympic: Triangle + windward-leeward
   - custom: Any other configuration

Respond with ONLY valid JSON in this exact format:
{
  "marks": [
    {
      "name": "Pin",
      "type": "start",
      "position": {
        "relative": "bottom-left",
        "description": "Port end of start line"
      },
      "rounding": "port",
      "color": "orange"
    },
    {
      "name": "1",
      "type": "windward",
      "position": {
        "relative": "top",
        "description": "Windward mark"
      },
      "rounding": "port"
    },
    {
      "name": "2",
      "type": "leeward",
      "position": {
        "relative": "bottom",
        "description": "Leeward mark"
      },
      "rounding": "port"
    }
  ],
  "sequence": ["Start", "1", "2", "1", "Finish"],
  "windDirection": "from bottom",
  "courseType": "windward_leeward",
  "laps": 2,
  "notes": ["Gate at leeward mark", "Offset after windward"],
  "confidence": 85
}

If you cannot identify marks clearly, still provide your best interpretation with a lower confidence score.

IMPORTANT for PDFs with MULTIPLE courses: If the document contains multiple course diagrams (e.g., Course A, Course B, Course C), extract ALL of them and return them in a "courses" array format:
{
  "courses": [
    {"name": "Course A", "marks": [...], "sequence": [...], "courseType": "...", "laps": 2},
    {"name": "Course B", "marks": [...], "sequence": [...], "courseType": "...", "laps": 1}
  ],
  "windDirection": "from bottom",
  "confidence": 85
}

If there's only one course, return the standard single-course format.`;

    // Build content array based on whether it's PDF or image
    const contentArray: any[] = [];

    if (isPdf) {
      // Use Claude's document capability for PDFs
      contentArray.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64Data,
        },
      });
    } else {
      // Use image capability for images
      contentArray.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Data,
        },
      });
    }

    contentArray.push({
      type: 'text',
      text: prompt,
    });

    // Call Claude Vision API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: contentArray,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[extract-course-image] Claude API error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: `Claude API error: ${response.status}`,
          details: errorText.substring(0, 500),
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();

    // Extract the text content
    let content = result.content[0].text;

    // Clean up markdown code blocks if present
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    content = content.trim();

    // Parse the JSON
    let extractedData: any;
    try {
      extractedData = JSON.parse(content);
    } catch (parseError) {
      console.error('[extract-course-image] Failed to parse Claude response as JSON:', parseError);
      console.error('[extract-course-image] Content preview:', content.substring(0, 500));
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse AI response',
          details: content.substring(0, 300),
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if response contains multiple courses
    if (extractedData.courses && Array.isArray(extractedData.courses)) {
      // Multi-course response
      const validatedCourses = extractedData.courses.map((course: any) => ({
        name: course.name || 'Unnamed Course',
        ...validateExtractedCourse(course),
      }));

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            courses: validatedCourses,
            windDirection: extractedData.windDirection,
            confidence: typeof extractedData.confidence === 'number' ? extractedData.confidence : 50,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single course response - validate and clean the result
    const validatedResult = validateExtractedCourse(extractedData);

    return new Response(
      JSON.stringify({
        success: true,
        data: validatedResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[extract-course-image] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Validate and clean up extracted course data
 */
function validateExtractedCourse(data: any): ExtractedCourse {
  // Ensure marks array exists
  const marks = Array.isArray(data.marks) ? data.marks : [];

  // Validate each mark
  const validatedMarks: ExtractedMark[] = marks.map((mark: any) => ({
    name: mark.name || 'Unknown',
    type: validateMarkType(mark.type),
    position: mark.position,
    rounding: mark.rounding === 'port' || mark.rounding === 'starboard' ? mark.rounding : undefined,
    color: mark.color,
    shape: mark.shape,
  }));

  // Ensure sequence array exists
  const sequence = Array.isArray(data.sequence) ? data.sequence : [];

  // Validate course type
  const courseType = validateCourseType(data.courseType);

  return {
    marks: validatedMarks,
    sequence,
    windDirection: data.windDirection,
    courseType,
    laps: typeof data.laps === 'number' ? data.laps : undefined,
    notes: Array.isArray(data.notes) ? data.notes : undefined,
    confidence: typeof data.confidence === 'number' ? Math.min(100, Math.max(0, data.confidence)) : 50,
  };
}

/**
 * Validate mark type
 */
function validateMarkType(type: any): ExtractedMark['type'] {
  const validTypes = ['start', 'windward', 'leeward', 'wing', 'offset', 'finish', 'gate'];
  if (validTypes.includes(type)) {
    return type;
  }
  // Map common variations
  const typeMap: Record<string, ExtractedMark['type']> = {
    'committee': 'start',
    'rc': 'start',
    'pin': 'start',
    'weather': 'windward',
    'upwind': 'windward',
    'downwind': 'leeward',
    'spreader': 'offset',
    'reaching': 'wing',
  };
  const normalized = String(type).toLowerCase();
  return typeMap[normalized] || 'windward';
}

/**
 * Validate course type
 */
function validateCourseType(type: any): ExtractedCourse['courseType'] | undefined {
  const validTypes = ['windward_leeward', 'triangle', 'olympic', 'trapezoid', 'custom'];
  if (validTypes.includes(type)) {
    return type as ExtractedCourse['courseType'];
  }
  return undefined;
}
