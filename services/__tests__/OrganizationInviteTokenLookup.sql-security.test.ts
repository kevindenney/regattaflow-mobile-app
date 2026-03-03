import fs from 'fs';
import path from 'path';

describe('organization invite token lookup RPC security', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260302223000_invite_token_lookup_by_id_rpc.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf8');
  const normalized = sql.replace(/\s+/g, ' ').toLowerCase();

  it('creates a SECURITY DEFINER RPC with authenticated execute grant', () => {
    expect(normalized).toContain('create or replace function public.get_organization_invite_token_by_id');
    expect(normalized).toContain('security definer');
    expect(normalized).toContain(
      'grant execute on function public.get_organization_invite_token_by_id(uuid) to authenticated'
    );
  });

  it('enforces invitee email match and active invite statuses before returning token', () => {
    expect(normalized).toContain("v_email text := lower(coalesce(auth.jwt() ->> 'email', ''))");
    expect(normalized).toContain("and lower(coalesce(oi.invitee_email, '')) = v_email");
    expect(normalized).toContain("and oi.status in ('draft', 'sent', 'opened', 'accepted', 'declined')");
    expect(normalized).toContain('and oi.invite_token is not null');
  });
});
