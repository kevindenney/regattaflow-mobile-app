/**
 * CourseDecompositionService — AI-powered extraction of course lesson structure
 * from a URL or description. Tries step-plan-suggest, falls back to race-coaching-chat.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import type { CourseModule, CourseStructure } from '@/types/library';

const logger = createLogger('CourseDecompositionService');

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

interface DecompositionInput {
  courseTitle: string;
  courseUrl?: string;
  authorOrCreator?: string;
  description?: string;
  interestName: string;
}

/**
 * Ask AI to decompose a course into modules and lessons.
 * Returns a CourseStructure that the user can review/edit before saving.
 */
export async function decomposeCourse(
  input: DecompositionInput,
): Promise<CourseStructure> {
  const systemPrompt = `You are an expert curriculum analyst. Given information about an online course, extract or infer its lesson structure.

Output ONLY valid JSON with this exact shape (no markdown, no explanation):
{
  "modules": [
    {
      "title": "Module title",
      "lessons": [
        { "title": "Lesson title", "duration_minutes": 15, "description": "Brief description" }
      ]
    }
  ],
  "estimated_hours": 10
}

Rules:
- If you know the actual course structure, reproduce it accurately
- If you don't know the exact structure, infer a reasonable one based on the course title, topic, and typical online course patterns
- Each module should have 3-8 lessons
- A typical course has 3-10 modules
- Include realistic duration estimates
- Keep lesson titles concise but descriptive
- Output ONLY the JSON object, nothing else`;

  const userMessage = `Course: "${input.courseTitle}"
${input.authorOrCreator ? `Creator: ${input.authorOrCreator}` : ''}
${input.courseUrl ? `URL: ${input.courseUrl}` : ''}
${input.description ? `Description: ${input.description}` : ''}
Interest/domain: ${input.interestName}

Extract or infer the lesson structure for this course.`;

  let text = '';

  // Try step-plan-suggest first (supports system prompt separately)
  try {
    const { data, error } = await supabase.functions.invoke('step-plan-suggest', {
      body: { system: systemPrompt, prompt: userMessage, max_tokens: 2048 },
    });
    if (!error && data?.text) {
      text = data.text;
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback: race-coaching-chat (combines system + user into one prompt)
  if (!text) {
    try {
      const fallbackPrompt = `${systemPrompt}\n\n${userMessage}`;
      const { data, error } = await supabase.functions.invoke('race-coaching-chat', {
        body: { prompt: fallbackPrompt, max_tokens: 2048 },
      });
      if (error) throw error;
      text = data?.text || '';
    } catch (err) {
      logger.error('Both AI endpoints failed for course decomposition', err);
      throw new Error('Could not extract course structure. Please add lessons manually.');
    }
  }

  if (!text) {
    throw new Error('AI returned empty response. Please add lessons manually.');
  }

  try {
    // Parse the JSON response — strip any accidental markdown fences
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Convert to our typed structure with IDs
    let lessonCount = 0;
    const modules: CourseModule[] = (parsed.modules || []).map(
      (m: any, mi: number) => {
        const lessons = (m.lessons || []).map((l: any, li: number) => {
          lessonCount++;
          return {
            id: generateId(),
            title: l.title || `Lesson ${li + 1}`,
            sort_order: li,
            url: l.url,
            duration_minutes: l.duration_minutes,
            description: l.description,
          };
        });
        return {
          id: generateId(),
          title: m.title || `Module ${mi + 1}`,
          sort_order: mi,
          lessons,
        };
      },
    );

    return {
      modules,
      total_lessons: lessonCount,
      estimated_hours: parsed.estimated_hours,
    };
  } catch (err) {
    logger.error('Failed to parse AI response as course structure', err);
    throw new Error('AI response was not valid course structure. Please add lessons manually.');
  }
}
