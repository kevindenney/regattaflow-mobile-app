export type AssessmentStatus = 'draft' | 'submitted' | 'reviewed' | 'finalized';
export type AssessmentStatusFilter = AssessmentStatus | 'all';
export type AssessmentFocus = 'all' | 'due_today' | 'overdue';
export type AssessmentDateWindow = 'all' | 'last_7_days' | 'last_30_days' | 'last_8_weeks' | 'custom';

export type AssessmentRouteParams = {
  [key: string]: string | string[] | undefined;
  status?: string | string[];
  focus?: string | string[];
  competency_id?: string | string[];
  competency_title?: string | string[];
  date_window?: string | string[];
  date_from?: string | string[];
  date_to?: string | string[];
  program_id?: string | string[];
  program_title?: string | string[];
  participant_user_id?: string | string[];
  participant_name?: string | string[];
};

export type AssessmentRouteState = {
  selectedStatus: AssessmentStatusFilter;
  selectedFocus: AssessmentFocus;
  selectedDateWindow: AssessmentDateWindow;
  selectedCompetencyId: string | null;
  selectedCompetencyTitle: string | null;
  selectedProgramId: string | null;
  selectedProgramTitle: string | null;
  selectedParticipantUserId: string | null;
  selectedParticipantName: string | null;
  dateFromOverride: string | null;
  dateToOverride: string | null;
};

export type AssessmentRecordFilters = {
  program_id: string | null;
  competency_id: string | null;
  assessed_from: string | null;
  assessed_to: string | null;
};

export type CompetencyTrendDrillDownInput = {
  competencyId: string;
  competencyTitle: string;
  periodStartIso?: string | null;
};

export type LearnerProgressDrillDownInput = {
  participantUserId: string;
  participantName?: string | null;
};

export type ProgramAssessmentDrillDownInput = {
  programId: string;
  programTitle?: string | null;
};

const DRILL_DOWN_PARAM_KEYS = new Set([
  'competency_id',
  'competency_title',
  'date_window',
  'date_from',
  'date_to',
  'program_id',
  'program_title',
  'participant_user_id',
  'participant_name',
]);

function normalizeRouteParamValue(value: unknown): string {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = String(entry || '').trim();
      if (normalized) return normalized;
    }
    return '';
  }
  return String(value || '').trim();
}

function normalizeRouteParamValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry || '').trim())
      .filter(Boolean);
  }
  const normalized = String(value || '').trim();
  return normalized ? [normalized] : [];
}

export function parseStatusParam(value: unknown): AssessmentStatusFilter {
  const normalized = normalizeRouteParamValue(value).toLowerCase();
  if (normalized === 'draft' || normalized === 'submitted' || normalized === 'reviewed' || normalized === 'finalized') {
    return normalized;
  }
  return 'all';
}

export function parseFocusParam(value: unknown): AssessmentFocus {
  const normalized = normalizeRouteParamValue(value).toLowerCase();
  if (normalized === 'due_today' || normalized === 'overdue') return normalized;
  return 'all';
}

export function parseDateWindowParam(value: unknown): AssessmentDateWindow {
  const normalized = normalizeRouteParamValue(value).toLowerCase();
  if (
    normalized === 'last_7_days' ||
    normalized === 'last_30_days' ||
    normalized === 'last_8_weeks' ||
    normalized === 'custom'
  ) {
    return normalized;
  }
  return 'all';
}

export function parseIsoDateParam(value: unknown): string | null {
  const raw = normalizeRouteParamValue(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function parseCompetencyIdParam(value: unknown): string | null {
  const raw = normalizeRouteParamValue(value);
  if (!raw) return null;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(raw)) return null;
  return raw;
}

export function parseParticipantUserIdParam(value: unknown): string | null {
  const raw = normalizeRouteParamValue(value);
  if (!raw) return null;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(raw)) return null;
  return raw;
}

export function parseProgramIdParam(value: unknown): string | null {
  const raw = normalizeRouteParamValue(value);
  if (!raw) return null;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(raw)) return null;
  return raw;
}

export function parseAssessmentRouteState(params: AssessmentRouteParams): AssessmentRouteState {
  const selectedDateWindowRaw = parseDateWindowParam(params.date_window);
  const selectedCompetencyId = parseCompetencyIdParam(params.competency_id);
  const selectedProgramId = parseProgramIdParam(params.program_id);
  const selectedParticipantUserId = parseParticipantUserIdParam(params.participant_user_id);
  const dateFromOverride = parseIsoDateParam(params.date_from);
  const dateToOverride = parseIsoDateParam(params.date_to);
  const hasInvalidDateRange = (() => {
    if (!dateFromOverride || !dateToOverride) return false;
    return new Date(dateFromOverride).getTime() > new Date(dateToOverride).getTime();
  })();
  const hasCustomDates = Boolean(dateFromOverride || dateToOverride) && !hasInvalidDateRange;
  const selectedDateWindow =
    selectedDateWindowRaw === 'custom' && !hasCustomDates
      ? 'all'
      : selectedDateWindowRaw;

  return {
    selectedStatus: parseStatusParam(params.status),
    selectedFocus: parseFocusParam(params.focus),
    selectedDateWindow,
    selectedCompetencyId,
    selectedCompetencyTitle: selectedCompetencyId ? normalizeRouteParamValue(params.competency_title) || null : null,
    selectedProgramId,
    selectedProgramTitle: selectedProgramId ? normalizeRouteParamValue(params.program_title) || null : null,
    selectedParticipantUserId,
    selectedParticipantName: selectedParticipantUserId ? normalizeRouteParamValue(params.participant_name) || null : null,
    dateFromOverride: hasInvalidDateRange ? null : dateFromOverride,
    dateToOverride: hasInvalidDateRange ? null : dateToOverride,
  };
}

export function getDateWindowFilters(
  state: Pick<AssessmentRouteState, 'selectedDateWindow' | 'dateFromOverride' | 'dateToOverride'>,
  now: Date = new Date()
): { assessed_from: string | null; assessed_to: string | null } {
  if (state.selectedDateWindow === 'all') {
    return { assessed_from: null, assessed_to: null };
  }

  if (state.selectedDateWindow === 'custom') {
    return {
      assessed_from: state.dateFromOverride,
      assessed_to: state.dateToOverride,
    };
  }

  const from = new Date(now);
  if (state.selectedDateWindow === 'last_7_days') {
    from.setDate(from.getDate() - 7);
  } else if (state.selectedDateWindow === 'last_30_days') {
    from.setDate(from.getDate() - 30);
  } else {
    from.setDate(from.getDate() - 56);
  }

  return {
    assessed_from: from.toISOString(),
    assessed_to: now.toISOString(),
  };
}

export function buildAssessmentQueryFilters(
  state: Pick<AssessmentRouteState, 'selectedProgramId' | 'selectedCompetencyId' | 'selectedDateWindow' | 'dateFromOverride' | 'dateToOverride'>,
  now: Date = new Date()
): AssessmentRecordFilters {
  const windowFilters = getDateWindowFilters(state, now);
  return {
    program_id: state.selectedProgramId,
    competency_id: state.selectedCompetencyId,
    assessed_from: windowFilters.assessed_from,
    assessed_to: windowFilters.assessed_to,
  };
}

export function buildAssessmentsDrillDownHref(
  input: CompetencyTrendDrillDownInput,
  now: Date = new Date()
): string {
  const dateFrom = input.periodStartIso ? parseIsoDateParam(input.periodStartIso) : null;
  const dateTo = now.toISOString();
  const params = new URLSearchParams();
  params.set('status', 'all');
  params.set('focus', 'all');
  params.set('date_window', 'custom');
  params.set('competency_id', input.competencyId);
  params.set('competency_title', input.competencyTitle);
  if (dateFrom) {
    params.set('date_from', dateFrom);
  }
  params.set('date_to', dateTo);
  return `/assessments?${params.toString()}`;
}

export function buildClearDrillDownHref(existingParams: AssessmentRouteParams = {}): string {
  const params = new URLSearchParams();
  params.set('status', 'all');
  params.set('focus', 'all');

  for (const [key, value] of Object.entries(existingParams)) {
    if (key === 'status' || key === 'focus') continue;
    if (DRILL_DOWN_PARAM_KEYS.has(key)) continue;
    for (const resolved of normalizeRouteParamValues(value)) {
      params.append(key, resolved);
    }
  }

  return `/assessments?${params.toString()}`;
}

export function buildLearnerProgressHref(input: LearnerProgressDrillDownInput): string {
  const params = new URLSearchParams();
  params.set('status', 'all');
  params.set('focus', 'all');
  params.set('date_window', 'last_8_weeks');
  params.set('participant_user_id', input.participantUserId);
  if (String(input.participantName || '').trim()) {
    params.set('participant_name', String(input.participantName).trim());
  }
  return `/assessments?${params.toString()}`;
}

export function buildProgramAssessmentHref(input: ProgramAssessmentDrillDownInput): string {
  const params = new URLSearchParams();
  params.set('status', 'all');
  params.set('focus', 'all');
  params.set('date_window', 'last_8_weeks');
  params.set('program_id', input.programId);
  if (String(input.programTitle || '').trim()) {
    params.set('program_title', String(input.programTitle).trim());
  }
  return `/assessments?${params.toString()}`;
}
