/**
 * SkillExtractionService — AI-powered extraction of trackable skill goals
 * from library resources, URLs, or pasted text.
 * Follows CourseDecompositionService pattern: tries step-plan-suggest,
 * falls back to race-coaching-chat, parses JSON response.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('SkillExtractionService');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtractedSkill {
  title: string;
  description: string;
  category: string;
}

export interface SkillExtractionResult {
  skills: ExtractedSkill[];
  source_summary: string;
}

// ---------------------------------------------------------------------------
// Shared AI call + parse
// ---------------------------------------------------------------------------

async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
  let text = '';

  // Try step-plan-suggest first
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

  // Fallback: race-coaching-chat
  if (!text) {
    try {
      const fallbackPrompt = `${systemPrompt}\n\n${userMessage}`;
      const { data, error } = await supabase.functions.invoke('race-coaching-chat', {
        body: { prompt: fallbackPrompt, max_tokens: 2048 },
      });
      if (error) throw error;
      text = data?.text || '';
    } catch (err) {
      logger.error('Both AI endpoints failed for skill extraction', err);
      throw new Error('Could not extract skills. Please try again or add skills manually.');
    }
  }

  if (!text) {
    throw new Error('AI returned empty response. Please try again or add skills manually.');
  }

  return text;
}

function parseResponse(text: string): SkillExtractionResult {
  try {
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const skills: ExtractedSkill[] = (parsed.skills || []).map((s: any) => ({
      title: s.title || 'Untitled Skill',
      description: s.description || '',
      category: s.category || 'General',
    }));

    return {
      skills,
      source_summary: parsed.source_summary || '',
    };
  } catch (err) {
    logger.error('Failed to parse AI response as skill extraction', err);
    throw new Error('AI response was not valid. Please try again or add skills manually.');
  }
}

// ---------------------------------------------------------------------------
// System prompt shared across all extraction modes
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert skill analyst. Given information about a learning resource, extract specific, trackable skill goals that a learner can develop by studying this material.

Output ONLY valid JSON with this exact shape (no markdown, no explanation):
{
  "skills": [
    {
      "title": "Actionable skill title",
      "description": "What competence in this skill looks like",
      "category": "Skill category"
    }
  ],
  "source_summary": "Brief description of the source material"
}

Rules:
- Group skills into 3-7 categories maximum
- Each category should have 2-6 skills
- Skill titles should be actionable and specific enough to rate on a 1-5 scale
- Descriptions should clarify what competence looks like (1-2 sentences)
- Categories should be concise labels (e.g., "Rig Tuning", "Boat Handling", "Tactics")
- Output ONLY the JSON object, nothing else`;

// ---------------------------------------------------------------------------
// Extraction functions
// ---------------------------------------------------------------------------

interface ResourceInput {
  title: string;
  author?: string | null;
  description?: string | null;
  url?: string | null;
  resource_type?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Extract skills from an existing library resource */
export async function extractSkillsFromResource(
  resource: ResourceInput,
  interestName: string,
): Promise<SkillExtractionResult> {
  const courseInfo = resource.metadata?.course_structure
    ? `\nCourse structure: ${JSON.stringify(resource.metadata.course_structure)}`
    : '';

  const userMessage = `Resource: "${resource.title}"
${resource.author ? `Author/Creator: ${resource.author}` : ''}
${resource.url ? `URL: ${resource.url}` : ''}
${resource.resource_type ? `Type: ${resource.resource_type}` : ''}
${resource.description ? `Description: ${resource.description}` : ''}${courseInfo}
Interest/domain: ${interestName}

Extract trackable skill goals from this resource.`;

  const text = await callAI(SYSTEM_PROMPT, userMessage);
  return parseResponse(text);
}

/** Extract skills from a URL */
export async function extractSkillsFromUrl(
  url: string,
  title: string | undefined,
  interestName: string,
): Promise<SkillExtractionResult> {
  const userMessage = `URL: ${url}
${title ? `Title: ${title}` : ''}
Interest/domain: ${interestName}

Infer what this resource teaches based on the URL${title ? ' and title' : ''}, then extract trackable skill goals.`;

  const text = await callAI(SYSTEM_PROMPT, userMessage);
  return parseResponse(text);
}

/** Extract skills from pasted text (table of contents, chapter outline, etc.) */
export async function extractSkillsFromText(
  text: string,
  interestName: string,
): Promise<SkillExtractionResult> {
  const userMessage = `The following text describes learning content (possibly a table of contents, chapter outline, competency list, or course description):

---
${text.slice(0, 5000)}
---

Interest/domain: ${interestName}

Extract trackable skill goals from this content.`;

  const aiText = await callAI(SYSTEM_PROMPT, userMessage);
  return parseResponse(aiText);
}
