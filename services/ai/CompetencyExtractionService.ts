/**
 * CompetencyExtractionService — AI-powered competency assessment from step evidence.
 *
 * Analyzes evidence (notes, photos, measurements, nutrition) against planned
 * competencies and outputs structured assessment. Follows the same async
 * extraction pattern as NutritionExtractionService.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import { updateStepMetadata } from '@/services/TimelineStepService';
import * as competencyService from '@/services/competencyService';
import type { StepPlanData, StepActData, StepCompetencyAssessment, CompetencyEvidenceItem } from '@/types/step-detail';

const logger = createLogger('CompetencyExtraction');

const ASSESSMENT_SYSTEM_PROMPT = `You are a competency assessment system. Analyze the provided training evidence and output ONLY valid JSON assessing whether each planned competency was demonstrated.

Output format:
{
  "planned_competency_results": [{
    "competency_id": "uuid or null",
    "competency_title": "title",
    "category": "category",
    "demonstrated_level": "initial_exposure|developing|proficient|not_demonstrated",
    "evidence_basis": "specific evidence that led to this assessment",
    "advancement_suggestion": "what to do next for this competency"
  }],
  "additional_competencies_found": [{
    "competency_title": "title of skill not explicitly planned but demonstrated",
    "demonstrated_level": "initial_exposure|developing|proficient",
    "evidence_basis": "what evidence showed this"
  }],
  "gap_summary": "1-3 sentences on what's still needed overall"
}

Rules:
- Only assess based on evidence actually provided. Do not invent demonstrations.
- "initial_exposure" = first attempt or minimal evidence; "developing" = repeated practice with some success; "proficient" = consistent competent execution.
- If no evidence relates to a planned competency, mark it "not_demonstrated".
- Keep additional_competencies_found to 3 max — only genuinely demonstrated skills.
- gap_summary should be actionable and specific.
- If photos are provided, analyze them as visual evidence. Look for technique, body positioning, equipment handling, procedural correctness, and safety practices. Reference specific visual observations in evidence_basis (e.g., "photo shows correct tourniquet placement above the antecubital fossa").`;

/**
 * Extract competency assessment from step evidence and write to step metadata.
 * Runs async on Review tab mount — does not block UI.
 */
export async function extractCompetencyAssessment(
  userId: string,
  interestId: string,
  stepId: string,
  plan: StepPlanData,
  act: StepActData,
  interestName: string,
  existingAssessedAt?: string,
): Promise<StepCompetencyAssessment | null> {
  // Guard: skip if already assessed recently (< 24h)
  if (existingAssessedAt) {
    const assessedAge = Date.now() - new Date(existingAssessedAt).getTime();
    if (assessedAge < 24 * 60 * 60 * 1000) {
      logger.debug('Skipping — assessed less than 24h ago');
      return null;
    }
  }

  // Guard: need either competency IDs or capability goals
  const competencyIds = plan.competency_ids ?? [];
  const capabilityGoals = plan.capability_goals ?? [];
  if (!competencyIds.length && !capabilityGoals.length) {
    logger.debug('Skipping — no competencies or capability goals');
    return null;
  }

  // Guard: need some evidence to assess
  const hasEvidence = (act.notes?.trim())
    || (act.media_uploads?.length ?? 0) > 0
    || (act.sub_step_progress && Object.values(act.sub_step_progress).some(Boolean))
    || (act.nutrition?.entries?.length ?? 0) > 0
    || (act.measurements?.extracted?.length ?? 0) > 0;

  if (!hasEvidence) {
    logger.debug('Skipping — no evidence to assess');
    return null;
  }

  try {
    // Fetch planned competency definitions
    let plannedCompetencies: { id: string; title: string; category: string; description: string | null }[] = [];
    if (competencyIds.length) {
      const allComps = await competencyService.getCompetencies(interestId);
      plannedCompetencies = allComps
        .filter(c => competencyIds.includes(c.id))
        .map(c => ({ id: c.id, title: c.title, category: c.category, description: c.description }));
    }

    // Fetch user's competency progress (returns CompetencyWithProgress[])
    const progressList = await competencyService.getUserCompetencyProgress(userId, interestId).catch(() => []);

    // Build evidence block
    const subSteps = plan.how_sub_steps ?? [];
    const subProgress = act.sub_step_progress ?? {};
    const subDeviations = act.sub_step_deviations ?? {};
    const completedCount = subSteps.filter(ss => subProgress[ss.id]).length;

    const evidenceParts = [
      act.notes ? `Session notes: ${act.notes}` : '',
      (act.media_uploads?.length ?? 0) > 0
        ? `Evidence uploads: ${act.media_uploads!.map(m => m.caption ? `"${m.caption}" (${m.type})` : `(${m.type})`).join(', ')}`
        : '',
      subSteps.length > 0
        ? `Sub-steps: ${completedCount}/${subSteps.length} completed. ${subSteps.map(ss => {
            const done = subProgress[ss.id] ? '✓' : '○';
            const deviation = subDeviations[ss.id] ? ` (did instead: ${subDeviations[ss.id]})` : '';
            return `${done} ${ss.text}${deviation}`;
          }).join('; ')}`
        : '',
      (act.measurements?.extracted?.length ?? 0) > 0
        ? `Measurements: ${act.measurements!.extracted!.slice(0, 5).map(m => m.extracted_from_text || '').filter(Boolean).join('; ')}`
        : '',
      (act.nutrition?.entries?.length ?? 0) > 0
        ? `Nutrition: ${act.nutrition!.entries!.length} entries, ~${act.nutrition!.entries!.reduce((s, e) => s + (e.calories ?? 0), 0)} cal`
        : '',
    ].filter(Boolean).join('\n');

    // Collect photo URLs for vision analysis (up to 4 photos, photos only)
    const photoUploads = (act.media_uploads ?? [])
      .filter(m => m.type === 'photo' && m.uri)
      .slice(0, 4);

    // Build competency context
    const competencyBlock = plannedCompetencies.map(c => {
      const prog = progressList.find(p => p.id === c.id);
      return `- ${c.title} [${c.category}]: ${c.description || '(no description)'} — Current: ${prog?.progress?.status ?? 'not started'}, ${prog?.progress?.attempts_count ?? 0} attempts`;
    }).join('\n');

    const goalsBlock = capabilityGoals.length
      ? `\nCapability goals (free-text): ${capabilityGoals.join(', ')}`
      : '';

    const textContent = `Interest: ${interestName}
${competencyBlock ? `\nPLANNED COMPETENCIES:\n${competencyBlock}` : ''}${goalsBlock}

EVIDENCE FROM THIS SESSION:
${evidenceParts}`;

    // Build message content — include photos as image blocks for vision analysis
    let messageContent: string | { type: string; [key: string]: unknown }[];
    if (photoUploads.length > 0) {
      const imageBlocks = photoUploads.map(photo => ({
        type: 'image' as const,
        source: { type: 'url' as const, url: photo.uri },
        ...(photo.caption ? {} : {}), // caption is in text content
      }));
      const captionNote = photoUploads
        .filter(p => p.caption)
        .map(p => `Photo: "${p.caption}"`)
        .join('; ');
      messageContent = [
        ...imageBlocks,
        {
          type: 'text' as const,
          text: `${textContent}${captionNote ? `\n\nPhoto captions: ${captionNote}` : ''}\n\nAnalyze the photos above as visual evidence for the competency assessment. Look for technique, form, equipment setup, procedure execution, and any observable clinical skills.`,
        },
      ];
      logger.info(`Including ${photoUploads.length} photos for vision analysis`);
    } else {
      messageContent = textContent;
    }

    // Call AI — use 2048 tokens to avoid truncated JSON on large competency sets
    const { data, error } = await supabase.functions.invoke('step-plan-suggest', {
      body: {
        system: ASSESSMENT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: messageContent }],
        max_tokens: 2048,
      },
    });

    if (error || !data?.text) {
      logger.warn('AI extraction failed', error);
      return null;
    }

    // Parse JSON response
    const cleaned = data.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('Could not parse JSON from AI response');
      return null;
    }

    let parsed: {
      planned_competency_results?: CompetencyEvidenceItem[];
      additional_competencies_found?: CompetencyEvidenceItem[];
      gap_summary?: string;
    };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      // AI response may be truncated — try to salvage by closing open arrays/objects
      let fixable = jsonMatch[0];
      // Close any unclosed strings, arrays, objects
      const openBraces = (fixable.match(/\{/g) || []).length - (fixable.match(/\}/g) || []).length;
      const openBrackets = (fixable.match(/\[/g) || []).length - (fixable.match(/\]/g) || []).length;
      // Trim trailing partial entry (after last comma or opening bracket)
      fixable = fixable.replace(/,\s*\{[^}]*$/, '');
      fixable = fixable.replace(/,\s*"[^"]*$/, '');
      for (let i = 0; i < openBrackets; i++) fixable += ']';
      for (let i = 0; i < openBraces; i++) fixable += '}';
      try {
        parsed = JSON.parse(fixable);
        logger.warn('Recovered truncated JSON from AI response');
      } catch {
        logger.error('Could not parse or recover AI JSON', parseErr);
        return null;
      }
    }

    const assessment: StepCompetencyAssessment = {
      assessed_at: new Date().toISOString(),
      planned_competency_results: parsed.planned_competency_results ?? [],
      additional_competencies_found: (parsed.additional_competencies_found ?? []).slice(0, 3),
      gap_summary: parsed.gap_summary ?? '',
    };

    // Write to step metadata
    await updateStepMetadata(stepId, {
      review: { competency_assessment: assessment },
    });

    // Write progress back to betterat_competency_progress so faculty dashboard reflects it
    const allResults = [
      ...assessment.planned_competency_results,
      ...assessment.additional_competencies_found,
    ];
    await competencyService.recordAIAssessedProgress(userId, allResults, stepId).catch(err => {
      logger.warn('Failed to write AI progress back', err);
    });

    logger.info(`Extracted ${assessment.planned_competency_results.length} competency assessments for step ${stepId}`);
    return assessment;
  } catch (err) {
    logger.error('Competency extraction failed', err);
    return null;
  }
}
