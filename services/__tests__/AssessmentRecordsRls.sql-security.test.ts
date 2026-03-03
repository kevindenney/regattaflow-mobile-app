import fs from 'fs';
import path from 'path';

describe('assessment_records SELECT RLS security matrix', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260302203000_harden_assessment_records_select_rls.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const normalized = sql.replace(/\s+/g, ' ').toLowerCase();

  it('defines the canonical institution/non-institution select policy set', () => {
    expect(normalized).toContain('drop policy if exists "assessment_records_select_org_members"');
    expect(normalized).toContain('create policy "assessment_records_select_non_institution_org_members"');
    expect(normalized).toContain('create policy "assessment_records_select_institution_owner_admin"');
    expect(normalized).toContain('create policy "assessment_records_select_institution_learner_self"');
    expect(normalized).toContain('create policy "assessment_records_select_institution_assigned_staff"');
  });

  it('scopes institution learners to their own participant rows only', () => {
    expect(normalized).toContain('from public.program_participants pp');
    expect(normalized).toContain('pp.id = assessment_records.participant_id');
    expect(normalized).toContain('pp.user_id = auth.uid()');
    expect(normalized).toContain("pp.status in ('active', 'completed')");
  });

  it('scopes institution faculty/preceptors/coordinators/instructors to assigned program participants', () => {
    expect(normalized).toContain(
      "viewer.role in ('faculty', 'instructor', 'preceptor', 'coordinator')"
    );
    expect(normalized).toContain('viewer.program_id = assessed.program_id');
    expect(normalized).toContain("assessed.status in ('invited', 'active', 'completed')");
  });

  it('retains institution owner/admin org-wide access and non-institution member split', () => {
    expect(normalized).toContain("array['owner', 'admin']::text[]");
    expect(normalized).toContain("o.organization_type = 'institution'");
    expect(normalized).toContain("o.organization_type <> 'institution'");
  });
});
