export type CommunicationsRouteParams = {
  focus?: string | string[];
  program_id?: string | string[];
  program_title?: string | string[];
};

export type ProgramCommunicationsDrillDownInput = {
  programId: string;
  programTitle?: string | null;
  focus?: 'all' | 'unread';
};

const normalizeRouteParamValue = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeRouteParamValue(item);
      if (normalized) return normalized;
    }
    return null;
  }

  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

export function parseProgramIdParam(value: unknown): string | null {
  const raw = normalizeRouteParamValue(value);
  if (!raw) return null;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(raw)) return null;
  return raw;
}

export function parseCommunicationsFocusParam(value: unknown): 'all' | 'unread' {
  const raw = normalizeRouteParamValue(value);
  return raw?.toLowerCase() === 'unread' ? 'unread' : 'all';
}

export function parseProgramTitleParam(value: unknown, hasProgramId: boolean): string | null {
  if (!hasProgramId) return null;
  return normalizeRouteParamValue(value);
}

export function buildProgramCommunicationsHref(input: ProgramCommunicationsDrillDownInput): string {
  const params = new URLSearchParams();
  params.set('program_id', input.programId);
  if (String(input.programTitle || '').trim()) {
    params.set('program_title', String(input.programTitle).trim());
  }
  if (input.focus === 'unread') {
    params.set('focus', 'unread');
  }
  return `/communications?${params.toString()}`;
}

export function buildClearProgramCommunicationsHref(
  params: Pick<CommunicationsRouteParams, 'focus'>
): string {
  const focus = parseCommunicationsFocusParam(params.focus);
  if (focus === 'unread') {
    return '/communications?focus=unread';
  }
  return '/communications';
}
