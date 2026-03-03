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
});

