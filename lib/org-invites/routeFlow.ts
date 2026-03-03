export const INVITE_TOKEN_REGEX = /^[a-z0-9]{24}$/;

export type OrgInviteEntryParams = {
  token?: string | string[];
  inviteToken?: string | string[];
  inviteRole?: string | string[];
  inviteRoleKey?: string | string[];
};

export type OrgInviteEntryResolution =
  | {
      kind: 'redirect';
      params: {
        inviteToken: string;
        inviteRole?: string;
        inviteRoleKey?: string;
      };
    }
  | {
      kind: 'manual';
      reason: 'missing' | 'malformed';
      malformedToken?: string;
    };

export function normalizeInviteToken(value?: string | string[] | null): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw || '').trim().toLowerCase();
}

export function normalizeOptionalParam(value?: string | string[] | null): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw || '').trim();
}

export function isValidInviteToken(token: string): boolean {
  return INVITE_TOKEN_REGEX.test(token);
}

export function resolveOrgInviteEntry(params: OrgInviteEntryParams): OrgInviteEntryResolution {
  const inviteToken = normalizeInviteToken(params.inviteToken || params.token);
  const inviteRole = normalizeOptionalParam(params.inviteRole);
  const inviteRoleKey = normalizeOptionalParam(params.inviteRoleKey);

  if (!inviteToken) {
    return { kind: 'manual', reason: 'missing' };
  }

  if (!isValidInviteToken(inviteToken)) {
    return { kind: 'manual', reason: 'malformed', malformedToken: inviteToken };
  }

  return {
    kind: 'redirect',
    params: {
      inviteToken,
      ...(inviteRole ? { inviteRole } : {}),
      ...(inviteRoleKey ? { inviteRoleKey } : {}),
    },
  };
}

export type OrganizationInviteDecisionStatus =
  | 'draft'
  | 'sent'
  | 'opened'
  | 'accepted'
  | 'declined'
  | 'revoked'
  | 'failed';

export function normalizeInviteDecisionStatus(
  value?: string | null
): OrganizationInviteDecisionStatus | null {
  const normalized = String(value || '').trim().toLowerCase();
  if (
    normalized === 'draft' ||
    normalized === 'sent' ||
    normalized === 'opened' ||
    normalized === 'accepted' ||
    normalized === 'declined' ||
    normalized === 'revoked' ||
    normalized === 'failed'
  ) {
    return normalized;
  }
  return null;
}

export function canRespondToInviteStatus(value?: string | null): boolean {
  const status = normalizeInviteDecisionStatus(value);
  return status === 'draft' || status === 'sent' || status === 'opened';
}

export function isInviteDecisionTerminal(value?: string | null): boolean {
  const status = normalizeInviteDecisionStatus(value);
  return status === 'accepted' || status === 'declined';
}
