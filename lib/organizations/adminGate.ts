import { isUuid } from '@/utils/uuid';

type MembershipLike = {
  organization_id?: unknown;
  organizationId?: unknown;
  role?: unknown;
  membership_status?: unknown;
  status?: unknown;
};

type ResolveActiveOrgInput = {
  activeOrganizationId?: string | null;
  memberships: MembershipLike[];
};

type GetActiveMembershipInput = {
  memberships: MembershipLike[];
  activeOrgId: string | null;
};

export type AdminGateMembership = {
  organizationId: string;
  role: string | null;
  membershipStatus: string | null;
};

function normalize(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

export function isOrgAdminRole(role: string | null): boolean {
  const normalized = normalize(role);
  return normalized === 'owner' || normalized === 'admin' || normalized === 'manager';
}

export function isActiveMembership(status: string | null): boolean {
  const normalized = normalize(status);
  return normalized === 'active' || normalized === 'verified';
}

export function resolveActiveOrgId({ activeOrganizationId, memberships }: ResolveActiveOrgInput): string | null {
  const providerId = String(activeOrganizationId || '').trim();
  if (providerId && isUuid(providerId)) return providerId;

  const activeMembership = memberships.find((membership) => {
    const rawStatus = String(membership.membership_status ?? membership.status ?? '').trim() || null;
    return isActiveMembership(rawStatus);
  });

  if (!activeMembership) return null;
  const resolved = String(activeMembership.organization_id ?? activeMembership.organizationId ?? '').trim();
  return isUuid(resolved) ? resolved : null;
}

export function getActiveMembership({ memberships, activeOrgId }: GetActiveMembershipInput): AdminGateMembership | null {
  if (!activeOrgId) return null;

  const match = memberships.find((membership) => {
    const membershipOrgId = String(membership.organization_id ?? membership.organizationId ?? '').trim();
    return membershipOrgId === activeOrgId;
  });

  if (!match) return null;

  return {
    organizationId: activeOrgId,
    role: String(match.role || '').trim() || null,
    membershipStatus: String(match.membership_status ?? match.status ?? '').trim() || null,
  };
}
