import fs from 'fs';
import path from 'path';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('QA matrix automation hook contracts', () => {
  it('keeps requester/admin learn cues stable', () => {
    const source = read('app/(tabs)/learn.tsx');

    expect(source).toContain('Admin tools');
    expect(source).toContain('Request sent');
    expect(source).toContain('Invite required');
    expect(source).toContain('Use invite token');
    expect(source).toContain('Restricted');
    expect(source).toContain('Recommended for your cohort');
    expect(source).toContain('Leave organization?');
  });

  it('keeps members management actions and filters available', () => {
    const source = read('app/organization/members.tsx');

    expect(source).toContain('Search members');
    expect(source).toContain('Role');
    expect(source).toContain('Reset to pending');
    expect(source).toContain('Remove access');
    expect(source).toContain("setSortOption('status')");
    expect(source).toContain("setSortOption('role')");
  });

  it('keeps cohort and template authoring cues available', () => {
    const cohortsSource = read('app/organization/cohorts.tsx');
    const cohortDetailSource = read('app/organization/cohort/[cohortId].tsx');
    const templatesSource = read('app/organization/templates.tsx');

    expect(cohortsSource).toContain('Create cohort');
    expect(cohortDetailSource).toContain('Add members');
    expect(templatesSource).toContain('Save template');
    expect(templatesSource).toContain('Assign to cohorts');
    expect(templatesSource).toContain('Using organization context:');
  });
});
