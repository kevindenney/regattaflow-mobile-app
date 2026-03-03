import fs from 'fs';
import path from 'path';

function readScript(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('generate-deployment-readiness contract', () => {
  it('surfaces authenticated probe coverage details and action item', () => {
    const source = readScript('scripts/generate-deployment-readiness.mjs');
    expect(source).toContain('api-smoke-auth-probe-configuration');
    expect(source).toContain('- Authenticated probe coverage:');
    expect(source).toContain('Configure authenticated smoke probe secrets');
    expect(source).toContain('INTEGRATION_AUTH_SAILING_BEARER');
    expect(source).toContain('INTEGRATION_AUTH_INSTITUTION_BEARER');
  });
});

