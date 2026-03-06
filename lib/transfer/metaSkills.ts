export type MetaSkillId =
  | 'debrief_discipline'
  | 'decision_under_uncertainty'
  | 'situational_awareness'
  | 'communication_under_load'
  | 'consistency_recovery';

const META_SKILL_LABELS:Record<MetaSkillId,string> = {
  debrief_discipline: 'Debrief Discipline',
  decision_under_uncertainty: 'Decision Under Uncertainty',
  situational_awareness: 'Situational Awareness',
  communication_under_load: 'Communication Under Load',
  consistency_recovery: 'Consistency & Recovery',
};

const DEBRIEF_MODULE_HINTS = new globalThis.Set([
  'gibbs_reflection',
  'self_assessment',
  'learning_notes',
  'post_race_analysis',
  'debrief_notes',
  'race_notes',
]);

const DECISION_MODULE_HINTS = new globalThis.Set([
  'clinical_reasoning',
  'strategy',
  'start_sequence',
  'tactics',
  'race_decisions',
]);

const COMMUNICATION_MODULE_HINTS = new globalThis.Set([
  'sbar_handoff',
  'share_with_preceptor',
  'preceptor_feedback',
  'crew_communication',
]);

const CONSISTENCY_MODULE_HINTS = new globalThis.Set([
  'hours_logged',
  'time_log',
  'practice_log',
  'habit_tracking',
]);

const parseStringList = (value:unknown):string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // Ignore and fall back to CSV parsing.
      }
    }
    return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const getMetadata = (step:any):Record<string,unknown> => {
  const raw = step?.metadata;
  return raw && typeof raw === 'object' ? raw as Record<string,unknown> : {};
};

const getInterestSlug = (step:any):string => {
  const metadata = getMetadata(step);
  return String(
    step?.interestSlug
    || step?.interest_slug
    || metadata.interest_slug
    || ''
  ).toLowerCase();
};

const getEventSubtype = (step:any):string => {
  const metadata = getMetadata(step);
  return String(
    step?.eventSubtype
    || step?.event_subtype
    || metadata.event_subtype
    || step?.race_type
    || ''
  ).toLowerCase();
};

const hasModuleHint = (moduleIds:string[], hints:Set<string>):boolean => {
  for (const moduleId of moduleIds) {
    if (hints.has(moduleId)) return true;
  }
  return false;
};

export const inferMetaSkillsFromStep = (step:any):MetaSkillId[] => {
  const metadata = getMetadata(step);
  const interestSlug = getInterestSlug(step);
  const eventSubtype = getEventSubtype(step);
  const moduleIds = Array.from(new globalThis.Set([
    ...parseStringList((step as any)?.module_ids),
    ...parseStringList(metadata.module_ids),
    ...parseStringList(metadata.org_template_module_ids),
  ])).map((id) => id.toLowerCase());

  const inferred:MetaSkillId[] = [];
  const add = (id:MetaSkillId) => {
    if (!inferred.includes(id) && inferred.length < 3) inferred.push(id);
  };

  if (
    hasModuleHint(moduleIds, DEBRIEF_MODULE_HINTS)
    || eventSubtype.includes('debrief')
    || eventSubtype.includes('reflection')
  ) {
    add('debrief_discipline');
  }

  if (
    hasModuleHint(moduleIds, DECISION_MODULE_HINTS)
    || eventSubtype.includes('clinical_shift')
    || eventSubtype.includes('simulation')
    || eventSubtype.includes('race')
    || eventSubtype.includes('match')
  ) {
    add('decision_under_uncertainty');
  }

  if (
    eventSubtype.includes('clinical_shift')
    || eventSubtype.includes('simulation')
    || eventSubtype.includes('skills_lab')
    || eventSubtype.includes('fleet')
    || eventSubtype.includes('distance')
    || eventSubtype.includes('team')
    || eventSubtype.includes('match')
  ) {
    add('situational_awareness');
  }

  if (
    hasModuleHint(moduleIds, COMMUNICATION_MODULE_HINTS)
    || eventSubtype.includes('team')
    || eventSubtype.includes('clinical_shift')
    || eventSubtype.includes('simulation')
  ) {
    add('communication_under_load');
  }

  if (
    hasModuleHint(moduleIds, CONSISTENCY_MODULE_HINTS)
    || eventSubtype.includes('fitness')
    || eventSubtype.includes('practice')
    || eventSubtype.includes('study')
  ) {
    add('consistency_recovery');
  }

  if (interestSlug === 'nursing') {
    if (!inferred.includes('decision_under_uncertainty')) add('decision_under_uncertainty');
    if (eventSubtype.includes('debrief') || hasModuleHint(moduleIds, DEBRIEF_MODULE_HINTS)) add('debrief_discipline');
  } else if (interestSlug === 'sail-racing' || interestSlug === 'sailing' || interestSlug === 'race') {
    if (!inferred.includes('situational_awareness')) add('situational_awareness');
  } else if (interestSlug === 'drawing') {
    if (!inferred.includes('consistency_recovery')) add('consistency_recovery');
  } else if (interestSlug === 'fitness') {
    if (!inferred.includes('consistency_recovery')) add('consistency_recovery');
    if (!inferred.includes('situational_awareness')) add('situational_awareness');
  }

  return inferred.slice(0, 3);
};

export const metaSkillToLabel = (id:MetaSkillId):string => {
  return META_SKILL_LABELS[id] || id;
};
