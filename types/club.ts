export type ClubRole =
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

export type ClubRoleScope =
  | 'management'
  | 'race_operations'
  | 'communications'
  | 'finance'
  | 'membership'
  | 'general';

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
    ],
  },
  {
    role: 'race_officer',
    label: 'Principal Race Officer',
    description: 'Sets courses, manages race-day updates, and validates official results.',
    scope: 'race_operations',
    defaultPermissions: [
      'races.manage',
      'courses.publish',
      'results.validate',
      'notices.send',
    ],
  },
  {
    role: 'scorer',
    label: 'Scorer',
    description: 'Records finishes, runs scoring, and publishes standings.',
    scope: 'race_operations',
    defaultPermissions: ['results.manage', 'results.publish'],
  },
  {
    role: 'communications',
    label: 'Communications Manager',
    description: 'Publishes documents, notices of race, and external updates.',
    scope: 'communications',
    defaultPermissions: ['content.publish', 'notices.send'],
  },
  {
    role: 'treasurer',
    label: 'Treasurer',
    description: 'Oversees entry payments, refunds, and settlement reports.',
    scope: 'finance',
    defaultPermissions: ['finance.manage', 'entries.refund', 'reports.finance'],
  },
  {
    role: 'membership_manager',
    label: 'Membership Manager',
    description: 'Approves membership applications and maintains club rosters.',
    scope: 'membership',
    defaultPermissions: ['members.manage', 'membership.approve'],
  },
  {
    role: 'sailing_manager',
    label: 'Sailing Manager',
    description: 'Coordinates programming, training, and volunteer assignments.',
    scope: 'management',
    defaultPermissions: ['programs.manage', 'volunteers.schedule'],
  },
  {
    role: 'race_committee',
    label: 'Race Committee',
    description: 'Supports race execution and updates assigned race data.',
    scope: 'race_operations',
    defaultPermissions: ['races.update', 'results.record'],
  },
  {
    role: 'instructor',
    label: 'Instructor',
    description: 'Shares training material and manages assigned coaching sessions.',
    scope: 'general',
    defaultPermissions: ['training.manage'],
  },
  {
    role: 'secretary',
    label: 'Club Secretary',
    description: 'Handles governance documents, minutes, and official communications.',
    scope: 'management',
    defaultPermissions: ['documents.manage', 'notices.send'],
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

export const ADMIN_ACCESS_ROLES: ClubRole[] = ['admin', 'sailing_manager', 'race_officer'];

export const CORE_MANAGEMENT_ROLES: ClubRole[] = [
  ...ADMIN_ACCESS_ROLES,
  'scorer',
  'communications',
  'treasurer',
  'membership_manager',
];

export const isManagementRole = (role: ClubRole): boolean =>
  CORE_MANAGEMENT_ROLES.includes(role);

export const hasAdminAccess = (role: ClubRole): boolean =>
  ADMIN_ACCESS_ROLES.includes(role);

const ROLE_DEFINITION_MAP: Record<ClubRole, ClubRoleDefinition> =
  CLUB_ROLE_DEFINITIONS.reduce((acc, definition) => {
    acc[definition.role] = definition;
    return acc;
  }, {} as Record<ClubRole, ClubRoleDefinition>);

export const getClubRoleDefinition = (role: ClubRole): ClubRoleDefinition =>
  ROLE_DEFINITION_MAP[role];

export const isValidClubRole = (role: string | null | undefined): role is ClubRole =>
  !!role && Object.prototype.hasOwnProperty.call(ROLE_DEFINITION_MAP, role);

export const normalizeClubRole = (role?: string | ClubRole | null): ClubRole => {
  if (role && isValidClubRole(role)) {
    return role as ClubRole;
  }

  return 'member';
};
