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

  it('emits signature insight memory migration and service contract rows', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'signature-insight-memory-migration-coverage'");
    expect(source).toContain("id: 'signature-insight-service-contract'");
    expect(source).toContain("id: 'signature-insight-timeline-trigger-contract'");
    expect(source).toContain('20260303153000_signature_insight_memory.sql');
    expect(source).toContain('apply_signature_insight_outcome_v1');
    expect(source).toContain('services/SignatureInsightService.ts');
    expect(source).toContain('services/RaceChecklistService.ts');
    expect(source).toContain("eq('outcome', 'dismissed')");
    expect(source).toContain("eq('principle_text', principleText)");
  });

  it('emits signature insight principle reuse contract row', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'signature-insight-principle-reuse-contract'");
    expect(source).toContain("from('user_principle_memory')");
    expect(source).toContain('buildPrincipleReminders');
    expect(source).toContain("options.interestId || 'sailing'");
    expect(source).toContain('hooks/useAdaptiveLearning.ts');
    expect(source).toContain('hooks/useExcellenceChecklist.ts');
    expect(source).toContain('My Principles');
    expect(source).toContain('hooks/useSignaturePrinciples.ts');
  });

  it('emits signature insight behavior gate contract row', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'signature-insight-behavior-gate-contract'");
    expect(source).toContain('RaceChecklistSignatureInsight.behavior.test.ts');
    expect(source).toContain('signature-insight-interest-threading.contract.test.ts');
    expect(source).toContain('test:ci:gates:unit');
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

  it('emits presentation-domain UI copy contract check row', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'ui-copy-presentation-domain-contract'");
    expect(source).toContain('isSailingPresentationDomain');
    expect(source).toContain('isNursingPresentationDomain');
    expect(source).toContain('app/settings/notifications.tsx, app/(tabs)/clients.tsx, app/(tabs)/programs-experience.tsx');
  });

  it('emits programs-core migration coverage check row', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'programs-core-migration-coverage'");
    expect(source).toContain("category: 'Programs Core'");
    expect(source).toContain('CREATE TABLE IF NOT EXISTS public.programs');
    expect(source).toContain('CREATE TABLE IF NOT EXISTS public.program_sessions');
    expect(source).toContain('CREATE TABLE IF NOT EXISTS public.program_participants');
  });

  it('emits alias lifecycle checks for redirect flag + release checklist', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'programs-route-alias'");
    expect(source).toContain('trackRaceManagementAliasUsage');
    expect(source).toContain("isFeatureEnabled('RACE_MANAGEMENT_ALIAS_REDIRECT_ONLY')");
    expect(source).toContain("id: 'programs-alias-removal-checklist'");
    expect(source).toContain("reference: aliasReleaseNotesPath");
  });

  it('emits feature-flag rollback contract check row', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'feature-flag-rollback-contract'");
    expect(source).toContain("category: 'Feature Flags'");
    expect(source).toContain('PROGRAM_DATA_MODEL_V1');
    expect(source).toContain('COACH_SHELL_V1');
    expect(source).toContain('DOMAIN_GATE_AI_STRICT_V1');
    expect(source).toContain('SECONDARY_PACKS_V1');
    expect(source).toContain('EXPO_PUBLIC_FF_PROGRAM_DATA_MODEL_V1');
    expect(source).toContain('EXPO_PUBLIC_FF_COACH_SHELL_V1');
    expect(source).toContain('EXPO_PUBLIC_FF_DOMAIN_GATE_AI_STRICT_V1');
    expect(source).toContain('EXPO_PUBLIC_FF_SECONDARY_PACKS_V1');
    expect(source).toContain('docs/feature-flag-rollback-runbook.md');
  });

  it('emits secondary-packs canonical contract check row', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'secondary-packs-canonical-contract'");
    expect(source).toContain("category: 'Secondary Packs'");
    expect(source).toContain('docs/secondary-packs-canonical.md');
    expect(source).toContain('1. `drawing`');
    expect(source).toContain('2. `golf`');
  });

  it('emits secondary-packs domain-catalog stubs check row', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'secondary-packs-domain-catalog-stubs'");
    expect(source).toContain('20260303143000_seed_secondary_pack_domain_catalog_stubs.sql');
    expect(source).toContain('Studio Sprint Template');
    expect(source).toContain('Lesson Block Template');
  });

  it('emits ProgramService CRUD/assignment and institution data-source contract rows', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'program-service-crud-assignment-contract'");
    expect(source).toContain("id: 'programs-ui-real-data-contract'");
    expect(source).toContain('services/ProgramService.ts');
    expect(source).toContain('app/(tabs)/programs-experience.tsx');
    expect(source).toContain('async listAssignedProgramIdsForStaff(');
    expect(source).toContain('programService.listPrograms(activeOrganization.id');
  });

  it('emits coach-home endpoint profile report contract row', () => {
    const source = readScript('scripts/run-integration-validation.mjs');
    expect(source).toContain("id: 'coach-home-endpoint-profile-report'");
    expect(source).toContain("category: 'Coach Home'");
    expect(source).toContain('docs/coach-home-endpoint-profile.md');
    expect(source).toContain('## Bottleneck Summary');
  });
});
