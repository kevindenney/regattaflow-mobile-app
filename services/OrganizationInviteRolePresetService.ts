import { programService, WorkspaceDomain } from './ProgramService';

export type InviteRolePreset = {
  key: string;
  role: string;
  label: string;
  roleType?: string;
};

const FALLBACK_PRESET: InviteRolePreset = {
  key: 'team_member',
  role: 'Team Member',
  label: 'Invite Team Member',
};

const normalizeRoleKey = (value?: string | null): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const normalizeRoleText = (value?: string | null): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const DEFAULT_STAFF_ROLE_LABELS = new Set([
  'owner',
  'admin',
  'manager',
  'coordinator',
  'coach',
  'faculty',
  'preceptor',
  'instructor',
]);

const STAFF_ROLE_TYPES = new Set([
  'owner',
  'admin',
  'manager',
  'coordinator',
  'coach',
  'faculty',
  'preceptor',
  'instructor',
  'staff',
]);

const DEFAULT_ROLE_TYPE_PRIORITY = [
  'faculty',
  'preceptor',
  'instructor',
  'coach',
  'coordinator',
  'manager',
  'staff',
  'member',
] as const;

class OrganizationInviteRolePresetService {
  private cache = new Map<WorkspaceDomain, InviteRolePreset[]>();

  async listPresets(domain: WorkspaceDomain): Promise<InviteRolePreset[]> {
    const cached = this.cache.get(domain);
    if (cached?.length) return cached;

    const rows = await programService.listDomainCatalog(domain, 'role', true);
    const byKey = new Map<string, InviteRolePreset>();

    for (const row of rows) {
      const key = normalizeRoleKey(row.key);
      const role = String(row.value || '').trim();
      if (!key || !role || byKey.has(key)) continue;
      const metadata = ((row.metadata || {}) as Record<string, unknown>);
      const inviteLabel = String(metadata.invite_label || '').trim();
      byKey.set(key, {
        key,
        role,
        label: inviteLabel || `Invite ${role}`,
        roleType: normalizeRoleText(String(metadata.role_type || '')),
      });
    }

    const presets = Array.from(byKey.values());
    const next = presets.length ? presets : [FALLBACK_PRESET];
    this.cache.set(domain, next);
    return next;
  }

  private findMatchingPreset(
    presets: InviteRolePreset[],
    role?: string | null,
    roleKey?: string | null
  ): InviteRolePreset | null {
    const normalizedRoleKey = normalizeRoleKey(roleKey);
    if (normalizedRoleKey) {
      const byKey = presets.find((preset) => preset.key === normalizedRoleKey);
      if (byKey) return byKey;
    }

    const normalizedRole = normalizeRoleText(role);
    if (!normalizedRole) return null;

    return (
      presets.find((preset) => normalizeRoleText(preset.role) === normalizedRole) ||
      presets.find((preset) => normalizeRoleText(preset.key) === normalizedRole) ||
      null
    );
  }

  resolvePreset(
    presets: InviteRolePreset[],
    role?: string | null,
    roleKey?: string | null
  ): InviteRolePreset {
    const matchedPreset = this.findMatchingPreset(presets, role, roleKey);
    if (matchedPreset) return matchedPreset;

    return (
      presets.find((preset) => preset.key === 'team_member') ||
      presets[0] ||
      FALLBACK_PRESET
    );
  }

  resolveRolePayload(
    presets: InviteRolePreset[],
    role?: string | null,
    roleKey?: string | null
  ): { roleLabel: string; roleKey: string } {
    const preset = this.resolvePreset(presets, role, roleKey);
    return {
      roleLabel: preset.role,
      roleKey: preset.key,
    };
  }

  isStaffRole(role: string | null | undefined, presets: InviteRolePreset[]): boolean {
    const matchedPreset = this.findMatchingPreset(presets, role, null);
    if (matchedPreset?.roleType && STAFF_ROLE_TYPES.has(normalizeRoleText(matchedPreset.roleType))) {
      return true;
    }
    return DEFAULT_STAFF_ROLE_LABELS.has(normalizeRoleText(role));
  }

  resolveDefaultRoleLabel(presets: InviteRolePreset[]): string {
    for (const roleType of DEFAULT_ROLE_TYPE_PRIORITY) {
      const preset = presets.find((row) => normalizeRoleText(row.roleType) === roleType);
      if (preset?.role) return preset.role;
    }
    return (
      presets.find((row) => row.key === 'team_member')?.role ||
      presets[0]?.role ||
      FALLBACK_PRESET.role
    );
  }
}

export const organizationInviteRolePresetService = new OrganizationInviteRolePresetService();
export { normalizeRoleKey };
