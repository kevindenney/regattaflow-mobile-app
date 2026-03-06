import {NURSING_CORE_V1_CATALOG_ID,NURSING_CORE_V1_CAPABILITIES,type NursingCoreV1Capability} from './competencies/nursing-core-v1';
import {SAILING_CORE_V1_CATALOG_ID,SAILING_CORE_V1_SKILLS,type SailingCoreV1Skill} from './competencies/sailing-core-v1';

type CatalogItem = NursingCoreV1Capability | SailingCoreV1Skill;

export type CompetencyCandidateSet = {
  catalogId: string;
  moduleId: string;
  candidates: CatalogItem[];
};

const toItemMap = (items: CatalogItem[]) => new Map(items.map((item) => [item.id,item]));
const pickByIds = (ids: string[],itemMap: Map<string,CatalogItem>) =>
  ids.map((id) => itemMap.get(id)).filter((item): item is CatalogItem => Boolean(item));

const nursingById = toItemMap(NURSING_CORE_V1_CAPABILITIES);
const sailingById = toItemMap(SAILING_CORE_V1_SKILLS);

export const NURSING_COMPETENCY_CANDIDATES_V1: CompetencyCandidateSet[] = [
  {
    catalogId: NURSING_CORE_V1_CATALOG_ID,
    moduleId: 'clinical_reasoning',
    candidates: pickByIds([
      'nurs-kp-clinical-reasoning-foundations',
      'nurs-kp-prioritization-frameworks',
      'nurs-kp-lab-and-diagnostic-interpretation',
      'nurs-qs-patient-safety-vigilance',
      'nurs-qs-medication-safety-practices',
      'nurs-ip-sbar-handoff-clarity',
      'nurs-sbp-escalation-and-chain-of-command',
      'nurs-inf-data-trend-recognition',
      'nurs-pro-ethical-practice-judgment',
      'nurs-lpd-leadership-in-micro-moments',
    ], nursingById),
  },
  {
    catalogId: NURSING_CORE_V1_CATALOG_ID,
    moduleId: 'gibbs_reflection',
    candidates: pickByIds([
      'nurs-sch-reflective-practice-depth',
      'nurs-sch-learning-goal-planning',
      'nurs-sch-practice-change-rationale',
      'nurs-pro-accountability-and-follow-through',
      'nurs-pro-advocacy-for-patient-needs',
      'nurs-lpd-self-assessment-accuracy',
      'nurs-lpd-feedback-integration',
      'nurs-lpd-resilience-and-stress-management',
      'nurs-pcc-therapeutic-communication',
      'nurs-sbp-documentation-for-continuity',
    ], nursingById),
  },
  {
    catalogId: NURSING_CORE_V1_CATALOG_ID,
    moduleId: 'self_assessment',
    candidates: pickByIds([
      'nurs-kp-evidence-to-bedside-linkage',
      'nurs-pcc-shared-decision-support',
      'nurs-ph-transition-of-care-planning',
      'nurs-qs-improvement-cycle-participation',
      'nurs-ip-team-role-awareness',
      'nurs-sbp-workflow-and-throughput-awareness',
      'nurs-inf-clinical-decision-support-use',
      'nurs-pro-inclusive-and-respectful-practice',
      'nurs-lpd-self-assessment-accuracy',
      'nurs-lpd-career-readiness-planning',
    ], nursingById),
  },
  {
    catalogId: NURSING_CORE_V1_CATALOG_ID,
    moduleId: 'learning_notes',
    candidates: pickByIds([
      'nurs-kp-medication-knowledge-application',
      'nurs-ph-community-resource-navigation',
      'nurs-sch-clinical-question-formulation',
      'nurs-sch-evidence-appraisal-basics',
      'nurs-qs-near-miss-reporting',
      'nurs-ip-interprofessional-care-planning',
      'nurs-sbp-policy-and-protocol-adherence',
      'nurs-inf-ehr-documentation-quality',
      'nurs-pro-boundaries-and-therapeutic-use-of-self',
      'nurs-lpd-feedback-integration',
    ], nursingById),
  },
];

export const SAILING_COMPETENCY_CANDIDATES_V1: CompetencyCandidateSet[] = [
  {
    catalogId: SAILING_CORE_V1_CATALOG_ID,
    moduleId: 'start_sequence',
    candidates: pickByIds([
      'sail-start-time-distance-judgment',
      'sail-start-line-bias-reads',
      'sail-start-gap-creation-and-protection',
      'sail-start-acceleration-timing',
      'sail-start-high-risk-management',
      'sail-start-comms-under-sequence',
      'sail-tact-lane-protection',
      'sail-strat-pre-race-plan-quality',
    ], sailingById),
  },
  {
    catalogId: SAILING_CORE_V1_CATALOG_ID,
    moduleId: 'conditions',
    candidates: pickByIds([
      'sail-speed-pressure-connection',
      'sail-speed-wave-and-chop-technique',
      'sail-speed-mode-shift-discipline',
      'sail-strat-wind-shift-modeling',
      'sail-strat-course-side-selection',
      'sail-strat-current-and-tide-integration',
      'sail-strat-adaptation-speed',
    ], sailingById),
  },
  {
    catalogId: SAILING_CORE_V1_CATALOG_ID,
    moduleId: 'strategy',
    candidates: pickByIds([
      'sail-tact-cross-or-tack-decisions',
      'sail-tact-leverage-management',
      'sail-tact-covering-when-ahead',
      'sail-tact-breaking-cover-when-behind',
      'sail-tact-fleet-position-awareness',
      'sail-strat-risk-profile-by-series-state',
      'sail-strat-pre-race-plan-quality',
      'sail-strat-post-race-debrief-quality',
      'sail-strat-adaptation-speed',
    ], sailingById),
  },
  {
    catalogId: SAILING_CORE_V1_CATALOG_ID,
    moduleId: 'learning_notes',
    candidates: pickByIds([
      'sail-hndl-tack-exit-quality',
      'sail-hndl-gybe-exit-quality',
      'sail-hndl-mark-rounding-entries',
      'sail-hndl-boathandling-in-traffic',
      'sail-speed-upwind-target-mode',
      'sail-speed-downwind-target-mode',
      'sail-speed-sail-shape-adjustment',
      'sail-strat-post-race-debrief-quality',
    ], sailingById),
  },
  {
    catalogId: SAILING_CORE_V1_CATALOG_ID,
    moduleId: 'self_assessment',
    candidates: pickByIds([
      'sail-start-acceleration-timing',
      'sail-hndl-boat-balance-control',
      'sail-speed-crew-weight-placement',
      'sail-speed-mode-shift-discipline',
      'sail-tact-mark-room-and-rules-use',
      'sail-tact-fleet-position-awareness',
      'sail-strat-risk-profile-by-series-state',
      'sail-strat-adaptation-speed',
    ], sailingById),
  },
];

export const COMPETENCY_CANDIDATES_BY_CATALOG_V1 = {
  [NURSING_CORE_V1_CATALOG_ID]: NURSING_COMPETENCY_CANDIDATES_V1,
  [SAILING_CORE_V1_CATALOG_ID]: SAILING_COMPETENCY_CANDIDATES_V1,
} as const;
