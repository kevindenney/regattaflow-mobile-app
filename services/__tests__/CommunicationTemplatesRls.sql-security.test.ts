import fs from 'fs';
import path from 'path';

describe('communication threads and templates RLS security matrix', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260302110000_programs_core_model.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const normalized = sql.replace(/\s+/g, ' ').toLowerCase();

  it('defines canonical communication thread policy set', () => {
    expect(normalized).toContain('create policy "communication_threads_select_org_members"');
    expect(normalized).toContain('create policy "communication_threads_insert_staff"');
    expect(normalized).toContain('create policy "communication_threads_update_staff"');
    expect(normalized).toContain('create policy "communication_threads_delete_admins"');
    expect(normalized).toContain("array['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach', 'coordinator']::text[]");
  });

  it('defines canonical program template policy set with shared/org visibility split', () => {
    expect(normalized).toContain('create policy "program_templates_select_visible"');
    expect(normalized).toContain('create policy "program_templates_insert_staff"');
    expect(normalized).toContain('create policy "program_templates_update_staff"');
    expect(normalized).toContain('create policy "program_templates_delete_staff"');
    expect(normalized).toContain('is_shared = true or ( organization_id is not null and public.is_active_org_member(organization_id) )');
  });

  it('keeps template write controls scoped to creator or owner/admin/manager roles', () => {
    expect(normalized).toContain('created_by = auth.uid()');
    expect(normalized).toContain("public.has_org_role(organization_id, array['owner', 'admin', 'manager']::text[])");
  });
});
