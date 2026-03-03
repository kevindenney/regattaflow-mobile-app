import {
  ClubRole,
  getClubRoleDefinition,
  normalizeClubRole,
} from '@/types/club';

export type ClubAction =
  | 'club.manage'
  | 'events.create'
  | 'events.publish'
  | 'entries.manage'
  | 'documents.manage'
  | 'results.capture'
  | 'results.certify'
  | 'members.view'
  | 'members.manage'
  | 'roles.assign'
  | 'finance.manage';

type MembershipLike = {
  club_id?: string | null;
  role?: string | null;
  status?: string | null;
};

const ROLE_PRIORITY: Record<ClubRole, number> = {
  admin: 5,
  race_admin: 4,
  volunteer_results: 3,
  member: 2,
  guest: 1,
};

const ACTION_PERMISSIONS: Record<ClubAction, string[]> = {
  'club.manage': ['clubs.manage'],
  'events.create': ['regattas.manage', 'races.configure'],
  'events.publish': ['content.publish', 'races.configure'],
  'entries.manage': ['entries.manage'],
  'documents.manage': ['documents.manage'],
  'results.capture': ['results.capture', 'results.review', 'results.certify'],
  'results.certify': ['results.certify'],
  'members.view': ['members.manage', 'events.register', 'documents.view'],
  'members.manage': ['members.manage'],
  'roles.assign': ['members.manage'],
  'finance.manage': ['finance.manage'],
};

const ACTIVE_STATUSES = new Set(['active', 'approved', 'confirmed', 'current', null, undefined]);

export const getRolePermissions = (role: string | ClubRole | null | undefined): string[] => {
  const definition = getClubRoleDefinition(normalizeClubRole(role));
  return definition.defaultPermissions ?? [];
};

export const hasClubAccess = (
  role: string | ClubRole | null | undefined,
  action: ClubAction
): boolean => {
  const permissionSet = new Set(getRolePermissions(role));
  const required = ACTION_PERMISSIONS[action] ?? [];
  if (required.length === 0) return false;
  return required.some((permission) => permissionSet.has(permission));
};

export const resolveClubRole = (
  memberships: MembershipLike[] | null | undefined,
  clubId?: string | null
): ClubRole => {
  const rows = (memberships ?? []).filter((membership) => {
    const isActive = ACTIVE_STATUSES.has((membership.status as any) ?? null);
    if (!isActive) return false;
    if (!clubId) return true;
    return membership.club_id === clubId;
  });

  if (rows.length === 0) {
    return 'member';
  }

  let resolved: ClubRole = normalizeClubRole(rows[0]?.role);
  for (let i = 1; i < rows.length; i += 1) {
    const next = normalizeClubRole(rows[i]?.role);
    if (ROLE_PRIORITY[next] > ROLE_PRIORITY[resolved]) {
      resolved = next;
    }
  }
  return resolved;
};

