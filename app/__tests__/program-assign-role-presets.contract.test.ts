import fs from 'fs';
import path from 'path';

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('program assignment role options', () => {
  it('derives role options from invite role presets and active participant roles', () => {
    const source = readAppFile('app/programs/assign.tsx');

    expect(source).toContain('organizationInviteRolePresetService.listPresets(domain)');
    expect(source).toContain("const FALLBACK_ROLE_OPTIONS = [");
    expect(source).toContain("'Team Member'");
    expect(source).toContain('const activeParticipantRoles = participants');
    expect(source).toContain("const options = ['all', ...resolvedRoleOptions, ...activeParticipantRoles]");
    expect(source).not.toContain('FALLBACK_ROLE_FILTER_OPTIONS');
    expect(source).not.toContain("const FALLBACK_ROLE_OPTIONS = [\n  'student'");
  });
});
