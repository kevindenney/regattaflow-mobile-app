import fs from 'fs';
import path from 'path';

function readWorkflow(): string {
  const workflowPath = path.resolve(process.cwd(), '.github/workflows/deployment-smoke.yml');
  return fs.readFileSync(workflowPath, 'utf8');
}

describe('deployment-smoke workflow contract', () => {
  it('keeps concurrency + permissions hardening in place', () => {
    const source = readWorkflow();
    expect(source).toContain('concurrency:');
    expect(source).toContain('group: deployment-smoke-${{ github.ref }}');
    expect(source).toContain('cancel-in-progress: true');
    expect(source).toContain('permissions:');
    expect(source).toContain('contents: read');
    expect(source).toContain('actions: read');
  });

  it('runs migration convention lint and strict smoke gates', () => {
    const source = readWorkflow();
    expect(source).toContain('Reset generated report artifacts');
    expect(source).toContain('rm -f docs/integration-validation-latest.md');
    expect(source).toContain('rm -f docs/integration-validation-latest.json');
    expect(source).toContain('rm -f docs/api-smoke-deploy-history.json');
    expect(source).toContain('Lint 20260302 migration header conventions');
    expect(source).toContain('npm run lint:migrations:20260302');
    expect(source).toContain('npm run validate:integration:strict');
    expect(source).toContain('npm run validate:api-smoke:deploy');
    expect(source).toContain('npm run gate:integration-validation');
    expect(source).toContain('Ensure deploy API smoke history JSON exists');
    expect(source).toContain('Upload deployment readiness artifact');
    expect(source).toContain('docs/api-smoke-deploy-history.json');
    expect(source).toContain('docs/deployment-readiness.md');
    expect(source).toContain('Ensure integration validation JSON exists');
    expect(source).toContain('docs/integration-validation-latest.json');
  });

  it('reports optional authenticated probe configuration', () => {
    const source = readWorkflow();
    expect(source).toContain('Report optional authenticated smoke probe configuration');
    expect(source).toContain('Sailing authenticated probe: enabled');
    expect(source).toContain('Institution authenticated probe: enabled');
    expect(source).toContain('missing INTEGRATION_AUTH_SAILING_BEARER secret');
    expect(source).toContain('missing INTEGRATION_AUTH_INSTITUTION_BEARER secret');
  });
});
