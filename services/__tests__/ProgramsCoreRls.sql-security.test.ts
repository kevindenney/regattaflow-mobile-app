import fs from 'fs';
import path from 'path';

describe('programs core RLS security matrix', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260302110000_programs_core_model.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const normalized = sql.replace(/\s+/g, ' ').toLowerCase();

  it('defines canonical policy sets for programs, sessions, and participants', () => {
    expect(normalized).toContain('create policy "programs_select_org_members"');
    expect(normalized).toContain('create policy "programs_insert_org_managers"');
    expect(normalized).toContain('create policy "programs_update_org_managers"');
    expect(normalized).toContain('create policy "programs_delete_org_admins"');

    expect(normalized).toContain('create policy "program_sessions_select_org_members"');
    expect(normalized).toContain('create policy "program_sessions_insert_org_managers"');
    expect(normalized).toContain('create policy "program_sessions_update_org_managers"');
    expect(normalized).toContain('create policy "program_sessions_delete_org_admins"');

    expect(normalized).toContain('create policy "program_participants_select_org_members"');
    expect(normalized).toContain('create policy "program_participants_insert_org_managers"');
    expect(normalized).toContain('create policy "program_participants_update_org_managers_or_self"');
    expect(normalized).toContain('create policy "program_participants_delete_org_admins"');
  });

  it('keeps manager/staff write role scope for programs and sessions', () => {
    expect(normalized).toContain(
      "array['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach']::text[]"
    );
    expect(normalized).toContain("array['owner', 'admin', 'manager']::text[]");
  });

  it('keeps participant self-service update/read exceptions with coordinator-enabled staff scope', () => {
    expect(normalized).toContain('or user_id = auth.uid()');
    expect(normalized).toContain('user_id = auth.uid() or public.has_org_role(');
    expect(normalized).toContain(
      "array['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach', 'coordinator']::text[]"
    );
  });
});
