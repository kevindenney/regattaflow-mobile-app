export type ClubRole =
  | 'admin'
  | 'race_admin'
  | 'volunteer_results'
  | 'member'
  | 'guest';

export type ClubRoleScope =
  | 'management'
  | 'race_operations'
  | 'general';

export type LegacyClubRole =
  | 'owner'
  | 'admin'
  | 'race_officer'
  | 'scorer'
  | 'communications'
  | 'treasurer'
  | 'membership_manager'
  | 'sailing_manager'
  | 'race_committee'
  | 'instructor'
  | 'secretary'
  | 'member'
  | 'guest';

export interface ClubRoleDefinition {
  role: ClubRole;
  label: string;
  description: string;
  scope: ClubRoleScope;
  defaultPermissions: string[];
}

export const CLUB_ROLE_DEFINITIONS: ClubRoleDefinition[] = [
  {
    role: 'admin',
    label: 'Club Administrator',
    description: 'Full control over club configuration, publishing, finance, and user access.',
    scope: 'management',
    defaultPermissions: [
      'clubs.manage',
      'regattas.manage',
      'members.manage',
      'finance.manage',
      'content.publish',
      'results.certify',
    ],
  },
  {
    role: 'race_admin',
    label: 'Race Administrator',
    description: 'Sets up races and documents, manages race-day operations, and certifies results.',
    scope: 'race_operations',
    defaultPermissions: [
      'races.configure',
      'documents.manage',
      'entries.manage',
      'results.review',
      'results.certify',
      'notices.send',
    ],
  },
  {
    role: 'volunteer_results',
    label: 'Results Volunteer',
    description: 'Captures provisional race results only. Cannot modify race setup or publish official results.',
    scope: 'race_operations',
    defaultPermissions: ['results.capture'],
  },
  {
    role: 'member',
    label: 'Club Member',
    description: 'Accesses member-only content, registers for events, and receives updates.',
    scope: 'general',
    defaultPermissions: ['events.register', 'documents.view'],
  },
  {
    role: 'guest',
    label: 'Guest',
    description: 'Limited access to public content and registration requests.',
    scope: 'general',
    defaultPermissions: ['events.request_entry'],
  },
];

const LEGACY_ROLE_MAP: Record<LegacyClubRole, ClubRole> = {
  owner: 'admin',
  admin: 'admin',
  race_officer: 'race_admin',
  scorer: 'volunteer_results',
  communications: 'race_admin',
  treasurer: 'race_admin',
  membership_manager: 'race_admin',
  sailing_manager: 'race_admin',
  race_committee: 'volunteer_results',
  instructor: 'member',
  secretary: 'race_admin',
  member: 'member',
  guest: 'guest',
};

export const ROLE_ALIASES: Record<ClubRole, string[]> = {
  admin: ['owner', 'admin'],
  race_admin: [
    'race_admin',
    'race_officer',
    'communications',
    'treasurer',
    'membership_manager',
    'sailing_manager',
    'secretary',
  ],
  volunteer_results: [
    'volunteer_results',
    'scorer',
    'race_committee',
  ],
  member: ['member', 'instructor'],
  guest: ['guest'],
};

export const ADMIN_ACCESS_ROLES: ClubRole[] = ['admin'];

export const CORE_MANAGEMENT_ROLES: ClubRole[] = [
  ...ADMIN_ACCESS_ROLES,
  'race_admin',
  'volunteer_results',
];

export const getRoleAliases = (role: ClubRole): string[] => ROLE_ALIASES[role] ?? [role];

export const isManagementRole = (role: string | ClubRole | null | undefined): boolean =>
  CORE_MANAGEMENT_ROLES.includes(normalizeClubRole(role));

export const hasAdminAccess = (role: string | ClubRole | null | undefined): boolean =>
  ADMIN_ACCESS_ROLES.includes(normalizeClubRole(role));

const ROLE_DEFINITION_MAP: Record<ClubRole, ClubRoleDefinition> =
  CLUB_ROLE_DEFINITIONS.reduce((acc, definition) => {
    acc[definition.role] = definition;
    return acc;
  }, {} as Record<ClubRole, ClubRoleDefinition>);

export const getClubRoleDefinition = (role: string | ClubRole): ClubRoleDefinition =>
  ROLE_DEFINITION_MAP[normalizeClubRole(role)];

export const isValidClubRole = (role: string | null | undefined): role is ClubRole =>
  !!role && Object.prototype.hasOwnProperty.call(ROLE_DEFINITION_MAP, role);

export const normalizeClubRole = (role?: string | ClubRole | LegacyClubRole | null): ClubRole => {
  if (role && isValidClubRole(role)) {
    return role as ClubRole;
  }

  if (role && Object.prototype.hasOwnProperty.call(LEGACY_ROLE_MAP, role)) {
    return LEGACY_ROLE_MAP[role as LegacyClubRole];
  }

  return 'member';
};
