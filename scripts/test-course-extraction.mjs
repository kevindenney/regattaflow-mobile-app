/**
 * Test script for course image extraction
 * Usage: node scripts/test-course-extraction.mjs [image-path]
 */
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('Missing EXPO_PUBLIC_ANTHROPIC_API_KEY environment variable');
  process.exit(1);
}

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

async function testCourseExtraction(imagePath) {
  if (!fs.existsSync(imagePath)) {
    console.error('Test image not found at:', imagePath);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  // Determine media type
  const ext = path.extname(imagePath).toLowerCase();
  const mediaType = ext === '.png' ? 'image/png' :
                    ext === '.gif' ? 'image/gif' :
                    ext === '.webp' ? 'image/webp' : 'image/jpeg';

  console.log('Image loaded:', imagePath);
  console.log('Base64 length:', base64Image.length);
  console.log('Media type:', mediaType);

  const prompt = `Analyze this sailing course diagram image. You are an expert sailing race officer and course analyst.

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
    }
  ],
  "sequence": ["Start", "1", "2", "1", "Finish"],
  "windDirection": "from bottom",
  "courseType": "windward_leeward",
  "laps": 2,
  "notes": ["Gate at leeward mark", "Offset after windward"],
  "confidence": 85
}

If you cannot identify marks clearly, still provide your best interpretation with a lower confidence score.`;

  console.log('\nCalling Claude Vision API...\n');

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const response = message.content[0].type === 'text' ? message.content[0].text : '';

    console.log('=== Raw Claude Response ===');
    console.log(response);
    console.log('\n=== Parsed Result ===');

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(JSON.stringify(parsed, null, 2));

      console.log('\n=== Summary ===');
      console.log('Marks found:', parsed.marks?.length || 0);
      console.log('Sequence:', parsed.sequence?.join(' → ') || 'N/A');
      console.log('Course type:', parsed.courseType || 'Unknown');
      console.log('Wind direction:', parsed.windDirection || 'Unknown');
      console.log('Confidence:', parsed.confidence || 'N/A');

      if (parsed.notes?.length > 0) {
        console.log('Notes:', parsed.notes.join('; '));
      }
    } else {
      console.log('Could not parse JSON from response');
    }
  } catch (error) {
    console.error('API Error:', error);
  }
}

// Get image path from command line or use default
const imagePath = process.argv[2] || '/tmp/course_diagram_test.png';
testCourseExtraction(imagePath);
