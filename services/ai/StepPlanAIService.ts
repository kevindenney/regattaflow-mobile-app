/**
 * StepPlanAIService — generates AI-powered planning suggestions
 * for timeline steps based on enriched context:
 *
 * - User's full step history with reflections and capability ratings
 * - Organization memberships and their competency definitions
 * - Followed users' recent completed steps (social learning)
 * - Organization programs the user participates in
 * - Linked library resources and capability goals
 *
 * Uses the step-plan-suggest edge function with a structured system prompt.
 * Falls back to race-coaching-chat if the new function is unavailable.
 */

import { supabase } from '@/services/supabase';
import type { LibraryResourceRecord } from '@/types/library';
import type { StepPlanData, StepReviewData, StepActData, CrossInterestSuggestion, ChatMessage } from '@/types/step-detail';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EnrichedPlanContext {
  interestName: string;
  interestId?: string;
  stepTitle: string;
  currentWhat?: string;
  linkedResources: LibraryResourceRecord[];
  capabilityGoals: string[];
  // Enriched context (gathered automatically)
  stepHistory: StepHistoryEntry[];
  orgCompetencies: OrgCompetencySummary[];
  followedUsersActivity: FollowedUserActivity[];
  orgPrograms: OrgProgramSummary[];
  userCapabilityProgress: CapabilityProgressEntry[];
}

/** Legacy interface kept for backward compat */
interface PlanContext {
  interestName: string;
  stepTitle: string;
  currentWhat?: string;
  linkedResources: LibraryResourceRecord[];
  capabilityGoals: string[];
  previousStepSummaries: PreviousStepSummary[];
}

interface PreviousStepSummary {
  title: string;
  what: string;
  learned: string;
  nextNotes: string;
}

export interface StepHistoryEntry {
  title: string;
  status: string;
  what: string;
  learned: string;
  nextNotes: string;
  capabilityRatings: Record<string, number>;
  subStepsCompleted: number;
  subStepsTotal: number;
  updatedAt: string;
}

export interface OrgCompetencySummary {
  orgName: string;
  competencies: { title: string; category: string; status: string }[];
}

export interface FollowedUserActivity {
  userName: string;
  recentSteps: { title: string; what: string; learned: string }[];
}

export interface OrgProgramSummary {
  orgName: string;
  programName: string;
  description?: string;
  status: string;
}

export interface CapabilityProgressEntry {
  competencyTitle: string;
  category: string;
  status: string;
  attemptCount: number;
}

// ---------------------------------------------------------------------------
// Context Gathering
// ---------------------------------------------------------------------------

/**
 * Gather all enriched context for AI planning in parallel.
 */
export async function gatherEnrichedContext(
  userId: string,
  interestId: string,
): Promise<{
  stepHistory: StepHistoryEntry[];
  orgCompetencies: OrgCompetencySummary[];
  followedUsersActivity: FollowedUserActivity[];
  orgPrograms: OrgProgramSummary[];
  userCapabilityProgress: CapabilityProgressEntry[];
}> {
  const [stepHistory, orgCompetencies, followedUsersActivity, orgPrograms, userCapabilityProgress] =
    await Promise.all([
      getFullStepHistory(userId, interestId),
      getOrgCompetencies(userId, interestId),
      getFollowedUsersActivity(userId, interestId),
      getUserOrgPrograms(userId, interestId),
      getUserCapabilityProgress(userId, interestId),
    ]);

  return { stepHistory, orgCompetencies, followedUsersActivity, orgPrograms, userCapabilityProgress };
}

/**
 * Full step history (up to 10 most recent completed + in-progress).
 */
async function getFullStepHistory(userId: string, interestId: string): Promise<StepHistoryEntry[]> {
  try {
    const { data, error } = await supabase
      .from('timeline_steps')
      .select('title, status, metadata, updated_at')
      .eq('user_id', userId)
      .eq('interest_id', interestId)
      .in('status', ['completed', 'in_progress'])
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error || !data) return [];

    return data.map((row: any) => {
      const plan: StepPlanData = row.metadata?.plan ?? {};
      const review: StepReviewData = row.metadata?.review ?? {};
      const act: StepActData = row.metadata?.act ?? {};
      const subSteps = plan.how_sub_steps ?? [];
      const progress = act.sub_step_progress ?? {};
      return {
        title: row.title,
        status: row.status,
        what: plan.what_will_you_do ?? '',
        learned: review.what_learned ?? '',
        nextNotes: review.next_step_notes ?? '',
        capabilityRatings: review.capability_progress ?? {},
        subStepsCompleted: subSteps.filter((s) => progress[s.id]).length,
        subStepsTotal: subSteps.length,
        updatedAt: row.updated_at,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Competency definitions from organizations the user belongs to.
 */
async function getOrgCompetencies(userId: string, interestId: string): Promise<OrgCompetencySummary[]> {
  try {
    // Get user's active org memberships
    const { data: memberships, error: memErr } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', userId)
      .in('status', ['active', 'verified']);

    if (memErr || !memberships?.length) return [];

    const orgIds = memberships.map((m: any) => m.organization_id);

    // Get org names
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', orgIds);

    const orgMap = new Map((orgs ?? []).map((o: any) => [o.id, o.name]));

    // Get competencies for this interest from these orgs
    const { data: competencies } = await supabase
      .from('betterat_competencies')
      .select('id, title, category, interest_id, organization_id')
      .eq('interest_id', interestId)
      .in('organization_id', orgIds)
      .order('sort_order', { ascending: true })
      .limit(50);

    if (!competencies?.length) return [];

    // Get user's progress on these competencies
    const compIds = competencies.map((c: any) => c.id);
    const { data: progressRows } = await supabase
      .from('betterat_competency_progress')
      .select('competency_id, status')
      .eq('user_id', userId)
      .in('competency_id', compIds);

    const progressMap = new Map((progressRows ?? []).map((p: any) => [p.competency_id, p.status]));

    // Group by org
    const byOrg = new Map<string, { title: string; category: string; status: string }[]>();
    for (const c of competencies as any[]) {
      const orgName = orgMap.get(c.organization_id) || 'Unknown';
      if (!byOrg.has(orgName)) byOrg.set(orgName, []);
      byOrg.get(orgName)!.push({
        title: c.title,
        category: c.category ?? '',
        status: progressMap.get(c.id) ?? 'not_started',
      });
    }

    return Array.from(byOrg.entries()).map(([orgName, competencies]) => ({
      orgName,
      competencies,
    }));
  } catch {
    return [];
  }
}

/**
 * Recent completed steps from users this person follows.
 */
async function getFollowedUsersActivity(
  userId: string,
  interestId: string,
): Promise<FollowedUserActivity[]> {
  try {
    // Get followed user IDs
    const { data: follows, error: followErr } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId)
      .limit(20);

    if (followErr || !follows?.length) return [];

    const followedIds = follows.map((f: any) => f.following_id);

    // Get recent completed steps from followed users for same interest
    const { data: steps } = await supabase
      .from('timeline_steps')
      .select('user_id, title, metadata')
      .in('user_id', followedIds)
      .eq('interest_id', interestId)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(15);

    if (!steps?.length) return [];

    // Get user names
    const uniqueUserIds = [...new Set(steps.map((s: any) => s.user_id))];
    const { data: profiles } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', uniqueUserIds);

    const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name || 'Someone you follow']));

    // Group by user
    const byUser = new Map<string, { title: string; what: string; learned: string }[]>();
    for (const s of steps as any[]) {
      const name = nameMap.get(s.user_id) || 'Someone you follow';
      if (!byUser.has(name)) byUser.set(name, []);
      const plan: StepPlanData = s.metadata?.plan ?? {};
      const review: StepReviewData = s.metadata?.review ?? {};
      byUser.get(name)!.push({
        title: s.title,
        what: plan.what_will_you_do ?? '',
        learned: review.what_learned ?? '',
      });
    }

    return Array.from(byUser.entries()).map(([userName, recentSteps]) => ({
      userName,
      recentSteps: recentSteps.slice(0, 3), // max 3 per user
    }));
  } catch {
    return [];
  }
}

/**
 * Organization programs the user participates in.
 */
async function getUserOrgPrograms(userId: string, interestId: string): Promise<OrgProgramSummary[]> {
  try {
    // Get programs user participates in
    const { data: participations } = await supabase
      .from('program_participants')
      .select('program_id')
      .eq('user_id', userId)
      .limit(10);

    if (!participations?.length) return [];

    const programIds = participations.map((p: any) => p.program_id);

    const { data: programs } = await supabase
      .from('programs')
      .select('id, name, description, status, organization_id, interest_id')
      .in('id', programIds);

    if (!programs?.length) return [];

    // Filter to relevant interest (or include all if interest_id isn't set on program)
    const relevant = (programs as any[]).filter(
      (p) => !p.interest_id || p.interest_id === interestId,
    );

    if (!relevant.length) return [];

    // Get org names
    const orgIds = [...new Set(relevant.map((p) => p.organization_id).filter(Boolean))];
    const { data: orgs } = orgIds.length
      ? await supabase.from('organizations').select('id, name').in('id', orgIds)
      : { data: [] };

    const orgMap = new Map((orgs ?? []).map((o: any) => [o.id, o.name]));

    return relevant.map((p) => ({
      orgName: orgMap.get(p.organization_id) || '',
      programName: p.name,
      description: p.description ?? undefined,
      status: p.status,
    }));
  } catch {
    return [];
  }
}

/**
 * User's competency progress across all orgs for this interest.
 */
async function getUserCapabilityProgress(
  userId: string,
  interestId: string,
): Promise<CapabilityProgressEntry[]> {
  try {
    // Get competencies for this interest
    const { data: competencies } = await supabase
      .from('betterat_competencies')
      .select('id, title, category')
      .eq('interest_id', interestId)
      .limit(100);

    if (!competencies?.length) return [];

    const compIds = competencies.map((c: any) => c.id);
    const compMap = new Map(
      (competencies as any[]).map((c) => [c.id, { title: c.title, category: c.category ?? '' }]),
    );

    // Get user's progress
    const { data: progressRows } = await supabase
      .from('betterat_competency_progress')
      .select('competency_id, status, attempts_count')
      .eq('user_id', userId)
      .in('competency_id', compIds);

    if (!progressRows?.length) return [];

    return (progressRows as any[]).map((p) => ({
      competencyTitle: compMap.get(p.competency_id)?.title ?? '',
      category: compMap.get(p.competency_id)?.category ?? '',
      status: p.status,
      attemptCount: p.attempts_count ?? 0,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Prompt Building
// ---------------------------------------------------------------------------

function buildEnrichedPrompt(ctx: EnrichedPlanContext): string {
  const sections: string[] = [];

  // Step history
  if (ctx.stepHistory.length) {
    const historyLines = ctx.stepHistory.map((s) => {
      let line = `- "${s.title}" (${s.status})`;
      if (s.what) line += `\n  Focus: ${s.what}`;
      if (s.learned) line += `\n  Learned: ${s.learned}`;
      if (s.nextNotes) line += `\n  Next ideas: ${s.nextNotes}`;
      if (s.subStepsTotal > 0) line += `\n  Sub-steps: ${s.subStepsCompleted}/${s.subStepsTotal} completed`;
      const ratings = Object.entries(s.capabilityRatings);
      if (ratings.length) {
        line += `\n  Self-ratings: ${ratings.map(([k, v]) => `${k}: ${v}/5`).join(', ')}`;
      }
      return line;
    });
    sections.push(`STEP HISTORY (most recent first):\n${historyLines.join('\n')}`);
  } else {
    sections.push('STEP HISTORY: This is their first step — no prior history.');
  }

  // Org competencies
  if (ctx.orgCompetencies.length) {
    const orgLines = ctx.orgCompetencies.map((org) => {
      const compLines = org.competencies.map(
        (c) => `  - ${c.title} [${c.category}] — ${c.status}`,
      );
      return `${org.orgName}:\n${compLines.join('\n')}`;
    });
    sections.push(`ORGANIZATION COMPETENCIES:\n${orgLines.join('\n')}`);
  }

  // User's capability progress
  if (ctx.userCapabilityProgress.length) {
    const inProgress = ctx.userCapabilityProgress.filter((c) => c.status !== 'competent');
    const mastered = ctx.userCapabilityProgress.filter((c) => c.status === 'competent');
    const lines: string[] = [];
    if (inProgress.length) {
      lines.push('Still developing:');
      inProgress.forEach((c) => lines.push(`  - ${c.competencyTitle} [${c.category}]: ${c.status} (${c.attemptCount} attempts)`));
    }
    if (mastered.length) {
      lines.push('Mastered:');
      mastered.forEach((c) => lines.push(`  - ${c.competencyTitle} [${c.category}]`));
    }
    sections.push(`CAPABILITY PROGRESS:\n${lines.join('\n')}`);
  }

  // Followed users' activity
  if (ctx.followedUsersActivity.length) {
    const activityLines = ctx.followedUsersActivity.map((u) => {
      const stepLines = u.recentSteps.map((s) => {
        let line = `  - "${s.title}"`;
        if (s.what) line += `: ${s.what}`;
        if (s.learned) line += ` → Learned: ${s.learned}`;
        return line;
      });
      return `${u.userName}:\n${stepLines.join('\n')}`;
    });
    sections.push(`WHAT PEOPLE YOU FOLLOW ARE WORKING ON:\n${activityLines.join('\n')}`);
  }

  // Org programs
  if (ctx.orgPrograms.length) {
    const progLines = ctx.orgPrograms.map(
      (p) => `- ${p.programName}${p.orgName ? ` (${p.orgName})` : ''}: ${p.status}${p.description ? ` — ${p.description}` : ''}`,
    );
    sections.push(`PROGRAMS YOU'RE ENROLLED IN:\n${progLines.join('\n')}`);
  }

  // Linked resources
  const resourceList = ctx.linkedResources
    .map((r) => `- ${r.title}${r.author_or_creator ? ` by ${r.author_or_creator}` : ''} (${r.resource_type})`)
    .join('\n');
  if (resourceList) {
    sections.push(`LINKED LIBRARY RESOURCES:\n${resourceList}`);
  }

  // Capability goals for this step
  if (ctx.capabilityGoals.length) {
    sections.push(`CAPABILITY GOALS FOR THIS STEP:\n${ctx.capabilityGoals.map((g) => `- ${g}`).join('\n')}`);
  }

  return sections.join('\n\n');
}

// ---------------------------------------------------------------------------
// Main API
// ---------------------------------------------------------------------------

/**
 * Generate an enriched plan suggestion using full user context.
 */
export async function generateEnrichedPlanSuggestion(ctx: EnrichedPlanContext): Promise<string> {
  const contextBlock = buildEnrichedPrompt(ctx);

  const systemPrompt = `You are an expert learning coach on the BetterAt platform. You help people deliberately practice and improve at "${ctx.interestName}".

Your role is to suggest what the user should focus on in their next practice session, considering:
1. Their full step history — what they've done, learned, and where they rated themselves low
2. Organization-defined competencies — especially ones they haven't mastered yet
3. What people they follow are working on — for social learning and inspiration
4. Programs they're enrolled in — to align with structured learning paths
5. Their linked resources — to suggest specific exercises from materials they have

Be specific and practical. Suggest 2-3 concrete activities or exercises. Prioritize:
- Competencies where they're still developing (not yet "competent")
- Skills where they rated themselves low (1-2 out of 5)
- Natural progressions from what they learned in recent steps
- Alignment with any active program curriculum
- Interesting approaches from people they follow

Keep it under 200 words. Write in second person ("You could..."). Do not use markdown formatting.`;

  const userMessage = `The user is planning a step titled "${ctx.stepTitle}".
${ctx.currentWhat ? `They've started writing: "${ctx.currentWhat}"` : 'They haven\'t written anything yet.'}

Here is their full context:

${contextBlock}

Based on all of this, suggest what they should focus on in this session.`;

  // Try the dedicated edge function first, fall back to generic
  try {
    const { data, error } = await supabase.functions.invoke('step-plan-suggest', {
      body: { system: systemPrompt, prompt: userMessage, max_tokens: 768 },
    });
    if (!error && data?.text) return data.text;
  } catch {
    // Fall through to fallback
  }

  // Fallback: pack everything into a single prompt for the generic function
  const fallbackPrompt = `${systemPrompt}\n\n${userMessage}`;
  const { data, error } = await supabase.functions.invoke('race-coaching-chat', {
    body: { prompt: fallbackPrompt, max_tokens: 768 },
  });

  if (error) throw error;
  return data?.text || 'Unable to generate suggestion. Try again.';
}

/**
 * Generate a chat-based plan suggestion using multi-turn conversation.
 * Prepends enriched context as the first user message, then appends the full chat history.
 */
export async function generateChatPlanSuggestion(
  ctx: EnrichedPlanContext,
  chatHistory: ChatMessage[],
): Promise<string> {
  const contextBlock = buildEnrichedPrompt(ctx);

  const systemPrompt = `You are an expert learning coach on the BetterAt platform. You help people deliberately practice and improve at "${ctx.interestName}".

Your role is to have a conversation about what the user should focus on in their practice session. Consider:
1. Their full step history — what they've done, learned, and where they rated themselves low
2. Organization-defined competencies — especially ones they haven't mastered yet
3. What people they follow are working on — for social learning and inspiration
4. Programs they're enrolled in — to align with structured learning paths
5. Their linked resources — to suggest specific exercises from materials they have

Be specific and practical. When suggesting activities, give 2-3 concrete exercises. Respond conversationally but concisely (under 200 words per response). Write in second person ("You could..."). Do not use markdown formatting.`;

  // Build messages array: enriched context as first user message, then full chat history
  const contextMessage = `The user is planning a step titled "${ctx.stepTitle}".
${ctx.currentWhat ? `They've started writing: "${ctx.currentWhat}"` : 'They haven\'t written anything yet.'}

Here is their full context:

${contextBlock}

Based on all of this, suggest what they should focus on in this session.`;

  const messages: { role: string; content: string }[] = [
    { role: 'user', content: contextMessage },
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
  ];

  // Try dedicated edge function with messages array
  try {
    const { data, error } = await supabase.functions.invoke('step-plan-suggest', {
      body: { system: systemPrompt, messages, max_tokens: 768 },
    });
    if (!error && data?.text) return data.text;
  } catch {
    // Fall through to fallback
  }

  // Fallback: pack into single prompt
  const fallbackPrompt = `${systemPrompt}\n\n${messages.map((m) => `${m.role}: ${m.content}`).join('\n\n')}`;
  const { data, error } = await supabase.functions.invoke('race-coaching-chat', {
    body: { prompt: fallbackPrompt, max_tokens: 768 },
  });

  if (error) throw error;
  return data?.text || 'Unable to generate suggestion. Try again.';
}

// ---------------------------------------------------------------------------
// Critique / Review Insight
// ---------------------------------------------------------------------------

export interface CritiqueInsightContext {
  interestName: string;
  stepTitle: string;
  planWhat: string;
  actNotes: string;
  subStepsCompleted: number;
  subStepsTotal: number;
  workedToPlan: boolean | null;
  deviationReason: string;
  whatLearned: string;
  capabilityRatings: Record<string, number>;
  stepHistory: StepHistoryEntry[];
}

/**
 * Generate an AI insight for the critique/review phase.
 * Analyzes patterns across the user's learning history.
 */
export async function generateCritiqueInsight(ctx: CritiqueInsightContext): Promise<string> {
  const historyBlock = ctx.stepHistory.length
    ? ctx.stepHistory.map((s) => {
        let line = `- "${s.title}" (${s.status})`;
        if (s.what) line += `\n  Focus: ${s.what}`;
        if (s.learned) line += `\n  Learned: ${s.learned}`;
        const ratings = Object.entries(s.capabilityRatings);
        if (ratings.length) {
          line += `\n  Ratings: ${ratings.map(([k, v]) => `${k}: ${v}/5`).join(', ')}`;
        }
        return line;
      }).join('\n')
    : '(no prior steps)';

  const currentRatings = Object.entries(ctx.capabilityRatings);
  const ratingsBlock = currentRatings.length
    ? currentRatings.map(([k, v]) => `- ${k}: ${v}/5`).join('\n')
    : '(no ratings yet)';

  const systemPrompt = `You are an expert learning coach on the BetterAt platform, helping someone reflect on their ${ctx.interestName} practice.

Your role is to analyze their learning patterns and provide insight they might not see themselves. Consider:
1. How their self-ratings have changed over time — are they improving? Plateauing?
2. Whether they consistently deviate from plans — and what that means
3. Recurring themes in what they learn — are they circling the same challenges?
4. Skills that remain low-rated across multiple sessions
5. What their strongest growth areas are

Be encouraging but honest. Point out 2-3 specific patterns you notice. If they're improving, celebrate it. If they're stuck, gently suggest why and what to try differently.

Keep it under 180 words. Write in second person ("You've been..."). Do not use markdown formatting.`;

  const userMessage = `Current session: "${ctx.stepTitle}"
Plan: ${ctx.planWhat || '(not specified)'}
Session notes: ${ctx.actNotes || '(none)'}
Sub-steps: ${ctx.subStepsCompleted}/${ctx.subStepsTotal} completed
Worked to plan: ${ctx.workedToPlan === null ? 'not answered' : ctx.workedToPlan ? 'yes' : 'no'}${ctx.deviationReason ? `\nDeviation: ${ctx.deviationReason}` : ''}
What they learned: ${ctx.whatLearned || '(not yet filled in)'}

Current session ratings:
${ratingsBlock}

Previous step history (most recent first):
${historyBlock}

Based on their full history and this session, what patterns do you notice in their learning?`;

  try {
    const { data, error } = await supabase.functions.invoke('step-plan-suggest', {
      body: { system: systemPrompt, prompt: userMessage, max_tokens: 768 },
    });
    if (!error && data?.text) return data.text;
  } catch {
    // Fall through
  }

  const fallbackPrompt = `${systemPrompt}\n\n${userMessage}`;
  const { data, error } = await supabase.functions.invoke('race-coaching-chat', {
    body: { prompt: fallbackPrompt, max_tokens: 768 },
  });

  if (error) throw error;
  return data?.text || 'Unable to generate insight. Try again.';
}

// ---------------------------------------------------------------------------
// Cross-Interest Suggestions
// ---------------------------------------------------------------------------

export interface OtherInterestSummary {
  slug: string;
  name: string;
  accentColor: string;
  iconName: string | null;
  recentSteps: { title: string; what: string }[];
  capabilityProgress: { title: string; status: string }[];
}

export interface CrossInterestContextData {
  otherInterests: OtherInterestSummary[];
}

/**
 * Gather context from user's other interests (max 4) for cross-interest suggestions.
 */
export async function gatherCrossInterestContext(
  userId: string,
  currentInterestId: string,
  otherInterests: { id: string; slug: string; name: string; accent_color: string; icon_name: string | null }[],
): Promise<CrossInterestContextData> {
  const limited = otherInterests.slice(0, 4);

  const results = await Promise.all(
    limited.map(async (interest) => {
      const [stepsResult, progressResult] = await Promise.all([
        Promise.resolve(
          supabase
            .from('timeline_steps')
            .select('title, metadata')
            .eq('user_id', userId)
            .eq('interest_id', interest.id)
            .in('status', ['completed', 'in_progress'])
            .order('updated_at', { ascending: false })
            .limit(5),
        )
          .then(({ data }) =>
            (data ?? []).map((row: any) => ({
              title: row.title,
              what: (row.metadata?.plan as StepPlanData)?.what_will_you_do ?? '',
            })),
          )
          .catch(() => [] as { title: string; what: string }[]),
        getUserCapabilityProgress(userId, interest.id)
          .then((entries) =>
            entries.slice(0, 5).map((e) => ({ title: e.competencyTitle, status: e.status })),
          )
          .catch(() => [] as { title: string; status: string }[]),
      ]);

      return {
        slug: interest.slug,
        name: interest.name,
        accentColor: interest.accent_color,
        iconName: interest.icon_name,
        recentSteps: stepsResult,
        capabilityProgress: progressResult,
      } satisfies OtherInterestSummary;
    }),
  );

  return { otherInterests: results };
}

/**
 * Generate cross-interest suggestions using AI.
 */
export async function generateCrossInterestSuggestions(ctx: {
  currentInterestName: string;
  stepTitle: string;
  currentWhat?: string;
  capabilityGoals: string[];
  crossContext: CrossInterestContextData;
  focusHint?: string;
}): Promise<CrossInterestSuggestion[]> {
  if (ctx.crossContext.otherInterests.length === 0) return [];

  const otherInterestBlock = ctx.crossContext.otherInterests
    .map((oi) => {
      const steps = oi.recentSteps.length
        ? oi.recentSteps.map((s) => `  - "${s.title}"${s.what ? `: ${s.what}` : ''}`).join('\n')
        : '  (no recent steps)';
      const progress = oi.capabilityProgress.length
        ? oi.capabilityProgress.map((c) => `  - ${c.title}: ${c.status}`).join('\n')
        : '  (no capability data)';
      return `${oi.name} (${oi.slug}):\n  Recent steps:\n${steps}\n  Skills:\n${progress}`;
    })
    .join('\n\n');

  const systemPrompt = `You are a creative learning coach on the BetterAt platform. You find meaningful connections between a user's different interests to suggest cross-disciplinary activities.

Given the user's current interest (${ctx.currentInterestName}) and their other interests, suggest 2-3 concrete activities that draw on skills or knowledge from their other interests to enhance their current practice.

Each suggestion should:
- Be a specific, actionable activity (under 60 words)
- Genuinely connect two interests in a useful way
- Include a brief relevance note (under 30 words) explaining why it helps

Respond with ONLY a JSON array, no other text:
[{ "source_interest_slug": "slug", "suggestion": "...", "relevance": "..." }]`;

  const userMessage = `Current interest: ${ctx.currentInterestName}
Step: "${ctx.stepTitle}"
${ctx.currentWhat ? `Current plan: "${ctx.currentWhat}"` : 'No plan written yet.'}
${ctx.capabilityGoals.length ? `Goals: ${ctx.capabilityGoals.join(', ')}` : ''}
${ctx.focusHint ? `\nUser focus: "${ctx.focusHint}" — tailor suggestions toward this area.` : ''}

Other interests:
${otherInterestBlock}`;

  try {
    let responseText = '';

    // Try dedicated edge function
    try {
      const { data, error } = await supabase.functions.invoke('step-plan-suggest', {
        body: { system: systemPrompt, prompt: userMessage, max_tokens: 512 },
      });
      if (!error && data?.text) responseText = data.text;
    } catch {
      // Fall through to fallback
    }

    // Fallback
    if (!responseText) {
      const fallbackPrompt = `${systemPrompt}\n\n${userMessage}`;
      const { data, error } = await supabase.functions.invoke('race-coaching-chat', {
        body: { prompt: fallbackPrompt, max_tokens: 512 },
      });
      if (error || !data?.text) return [];
      responseText = data.text;
    }

    // Parse JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as {
      source_interest_slug: string;
      suggestion: string;
      relevance: string;
    }[];

    // Enrich with interest metadata
    const interestMap = new Map(
      ctx.crossContext.otherInterests.map((oi) => [oi.slug, oi]),
    );

    return parsed
      .filter((item) => item.source_interest_slug && item.suggestion)
      .map((item) => {
        const interest = interestMap.get(item.source_interest_slug);
        return {
          id: `cis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          sourceInterestSlug: item.source_interest_slug,
          sourceInterestName: interest?.name ?? item.source_interest_slug,
          sourceInterestColor: interest?.accentColor ?? '#888888',
          sourceInterestIcon: interest?.iconName ?? null,
          suggestion: item.suggestion,
          relevance: item.relevance,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Legacy: basic plan suggestion (kept for backward compat).
 */
export async function generatePlanSuggestion(ctx: PlanContext): Promise<string> {
  const resourceList = ctx.linkedResources
    .map((r) => `- ${r.title}${r.author_or_creator ? ` by ${r.author_or_creator}` : ''} (${r.resource_type})`)
    .join('\n');

  const goalList = ctx.capabilityGoals.length
    ? ctx.capabilityGoals.map((g) => `- ${g}`).join('\n')
    : '(none set)';

  const historyBlock = ctx.previousStepSummaries.length
    ? ctx.previousStepSummaries
        .map(
          (s) =>
            `Step: ${s.title}\n  What they did: ${s.what || '(empty)'}\n  Learned: ${s.learned || '(empty)'}\n  Next ideas: ${s.nextNotes || '(empty)'}`,
        )
        .join('\n\n')
    : '(first step — no history)';

  const prompt = `You are a learning coach helping someone plan their next practice session for ${ctx.interestName}.

Their step is titled "${ctx.stepTitle}".
${ctx.currentWhat ? `They've started writing: "${ctx.currentWhat}"` : ''}

Library resources they can reference:
${resourceList || '(no resources linked)'}

Capability goals:
${goalList}

Recent step history:
${historyBlock}

Based on this context, suggest what they should focus on in this session. Be specific and practical — give 2-3 concrete activities or exercises. Keep it under 150 words. Write in second person ("You could..."). Do not use markdown formatting.`;

  const { data, error } = await supabase.functions.invoke('race-coaching-chat', {
    body: { prompt, max_tokens: 512 },
  });

  if (error) throw error;
  return data?.text || 'Unable to generate suggestion. Try again.';
}

/**
 * Fetch recent completed steps for context (legacy helper).
 */
export async function getRecentStepSummaries(
  userId: string,
  interestId: string,
  limit = 3,
): Promise<PreviousStepSummary[]> {
  const { data, error } = await supabase
    .from('timeline_steps')
    .select('title, metadata')
    .eq('user_id', userId)
    .eq('interest_id', interestId)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: any) => {
    const plan: StepPlanData = row.metadata?.plan ?? {};
    const review: StepReviewData = row.metadata?.review ?? {};
    return {
      title: row.title,
      what: plan.what_will_you_do ?? '',
      learned: review.what_learned ?? '',
      nextNotes: review.next_step_notes ?? '',
    };
  });
}

// ---------------------------------------------------------------------------
// Resource-Driven Plan Generation
// ---------------------------------------------------------------------------

export interface ResourcePlanSuggestion {
  what_will_you_do: string;
  how_sub_steps: string[];
  why_reasoning: string;
  capability_goals: string[];
}

/**
 * Generate a full plan (what, how, why, capabilities) from a library resource.
 * Called when user links a resource via "Add from Library".
 */
export async function generatePlanFromResource(params: {
  resource: LibraryResourceRecord;
  interestName: string;
  stepHistory?: StepHistoryEntry[];
}): Promise<ResourcePlanSuggestion> {
  const { resource, interestName, stepHistory = [] } = params;

  const resourceInfo = [
    `Title: ${resource.title}`,
    resource.author_or_creator ? `Creator: ${resource.author_or_creator}` : null,
    resource.description ? `Description: ${resource.description}` : null,
    `Type: ${resource.resource_type}`,
    resource.url ? `URL: ${resource.url}` : null,
  ].filter(Boolean).join('\n');

  const historyBlock = stepHistory.length
    ? stepHistory.slice(0, 5).map((s) => {
        let line = `- "${s.title}"`;
        if (s.what) line += `: ${s.what}`;
        if (s.learned) line += ` → Learned: ${s.learned}`;
        return line;
      }).join('\n')
    : '(first session — no prior history)';

  const systemPrompt = `You are an expert learning coach on BetterAt. The user is planning a ${interestName} practice session using a resource from their library.

Generate a structured practice plan based on this resource. Your response must be ONLY valid JSON with this exact shape:

{
  "what_will_you_do": "A 1-2 sentence description of what to focus on during this session",
  "how_sub_steps": ["Step 1...", "Step 2...", "Step 3..."],
  "why_reasoning": "A 1-2 sentence explanation of why this is the right thing to work on next",
  "capability_goals": ["Skill 1", "Skill 2"]
}

Guidelines:
- what_will_you_do: Be specific about the activity, referencing the resource
- how_sub_steps: 3-6 concrete, actionable steps. Include time estimates where helpful
- why_reasoning: Connect to their learning journey and the specific skills this develops
- capability_goals: 2-4 specific skills this session develops (e.g., "Line confidence", "Perspective accuracy")

Respond with ONLY the JSON object, no markdown or other text.`;

  const userMessage = `Resource:
${resourceInfo}

User's recent ${interestName} history:
${historyBlock}

Generate a practice plan for a session using this resource.`;

  try {
    let responseText = '';

    try {
      const { data, error } = await supabase.functions.invoke('step-plan-suggest', {
        body: { system: systemPrompt, prompt: userMessage, max_tokens: 768 },
      });
      if (!error && data?.text) responseText = data.text;
    } catch {
      // Fall through
    }

    if (!responseText) {
      const fallbackPrompt = `${systemPrompt}\n\n${userMessage}`;
      const { data, error } = await supabase.functions.invoke('race-coaching-chat', {
        body: { prompt: fallbackPrompt, max_tokens: 768 },
      });
      if (error || !data?.text) throw new Error('AI generation failed');
      responseText = data.text;
    }

    // Strip markdown fences if present
    const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]) as ResourcePlanSuggestion;

    return {
      what_will_you_do: parsed.what_will_you_do || '',
      how_sub_steps: Array.isArray(parsed.how_sub_steps) ? parsed.how_sub_steps : [],
      why_reasoning: parsed.why_reasoning || '',
      capability_goals: Array.isArray(parsed.capability_goals) ? parsed.capability_goals : [],
    };
  } catch (err) {
    console.error('generatePlanFromResource failed:', err);
    // Return a basic fallback based on the resource info
    return {
      what_will_you_do: `Study and practice along with "${resource.title}"${resource.author_or_creator ? ` by ${resource.author_or_creator}` : ''}.`,
      how_sub_steps: [
        `Watch/review "${resource.title}"`,
        'Take notes on key techniques and concepts',
        'Practice the main technique or exercise shown',
        'Reflect on what worked and what to revisit',
      ],
      why_reasoning: `This resource covers important ${interestName} fundamentals worth studying.`,
      capability_goals: [],
    };
  }
}
