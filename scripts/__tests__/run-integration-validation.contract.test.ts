import fs from 'fs';
import path from 'path';

function readScript(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('run-integration-validation contract', () => {
  it('emits explicit authenticated probe configuration check row', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'api-smoke-auth-probe-configuration'");
    expect(source).toContain('Authenticated probe configuration: sailing=');
    expect(source).toContain('INTEGRATION_AUTH_SAILING_BEARER');
    expect(source).toContain('INTEGRATION_AUTH_INSTITUTION_BEARER');
  });

  it('emits weekly recap payload completeness guard check row', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'coach-retention-weekly-recap-payload-guard'");
    expect(source).toContain("category: 'Retention Loop'");
    expect(source).toContain('isCompleteWeeklyRecapPayload');
    expect(source).toContain('invalid_weekly_recap_payload');
  });

  it('emits assessment RLS semantic role-scope check row', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'assessment-rls-policy-semantics'");
    expect(source).toContain("ARRAY['owner', 'admin']::text[]");
    expect(source).toContain("pp.user_id = auth.uid()");
    expect(source).toContain("viewer.role IN ('faculty', 'instructor', 'preceptor', 'coordinator')");
  });

  it('requires program table signatures in DB assertions matrix', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("table: 'programs'");
    expect(source).toContain("table: 'program_sessions'");
    expect(source).toContain("table: 'program_participants'");
    expect(source).toContain("'program_id'");
    expect(source).toContain("'starts_at'");
    expect(source).toContain("'session_id'");
  });

  it('emits programs core RLS semantic role-scope check row', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'programs-core-rls-policy-semantics'");
    expect(source).toContain("category: 'Programs Core RLS'");
    expect(source).toContain('"program_sessions_select_org_members"');
    expect(source).toContain("ARRAY['owner', 'admin', 'manager', 'faculty', 'instructor', 'preceptor', 'coach']::text[]");
    expect(source).toContain('user_id = auth.uid()');
  });

  it('emits domain resolver precedence contract check row', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'domain-resolver-precedence-contract'");
    expect(source).toContain("reference: 'api/middleware/domain.ts'");
    expect(source).toContain("if (orgType === 'club') return 'sailing'");
    expect(source).toContain("if (orgType === 'institution') return 'nursing'");
  });
});
