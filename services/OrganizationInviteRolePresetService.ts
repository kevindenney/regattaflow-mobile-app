import { programService, WorkspaceDomain } from './ProgramService';

export type InviteRolePreset = {
  key: string;
  role: string;
  label: string;
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
      });
    }

    const presets = Array.from(byKey.values());
    const next = presets.length ? presets : [FALLBACK_PRESET];
    this.cache.set(domain, next);
    return next;
  }

  resolvePreset(
    presets: InviteRolePreset[],
    role?: string | null,
    roleKey?: string | null
  ): InviteRolePreset {
    const normalizedRoleKey = normalizeRoleKey(roleKey);
    if (normalizedRoleKey) {
      const byKey = presets.find((preset) => preset.key === normalizedRoleKey);
      if (byKey) return byKey;
    }

    const normalizedRole = normalizeRoleText(role);
    if (normalizedRole) {
      const byRoleValue = presets.find((preset) => normalizeRoleText(preset.role) === normalizedRole);
      if (byRoleValue) return byRoleValue;
      const byRoleKey = presets.find((preset) => normalizeRoleText(preset.key) === normalizedRole);
      if (byRoleKey) return byRoleKey;
    }

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
}

export const organizationInviteRolePresetService = new OrganizationInviteRolePresetService();
export { normalizeRoleKey };
