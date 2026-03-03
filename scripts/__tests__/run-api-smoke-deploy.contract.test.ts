import fs from 'fs';
import path from 'path';

function readScript(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('run-api-smoke-deploy contract', () => {
  it('keeps strict invocation-failure semantics and diagnostics', () => {
    const source = readScript('scripts/run-api-smoke-deploy.mjs');
    expect(source).toContain("vercelError === 'FUNCTION_INVOCATION_FAILED'");
    expect(source).toContain("const OUTPUT_PATH = 'docs/api-smoke-deploy.md'");
    expect(source).toContain("const HISTORY_PATH = 'docs/api-smoke-deploy-history.json'");
    expect(source).toContain('extractBodySnippet');
    expect(source).toContain('content-type');
  });

  it('keeps institution authenticated probe body expectation and trend reporting', () => {
    const source = readScript('scripts/run-api-smoke-deploy.mjs');
    expect(source).toContain("id: 'auth-institution-domain-gate-post'");
    expect(source).toContain('expectedBodyIncludes');
    expect(source).toContain('DOMAIN_GATED');
    expect(source).toContain('## Trend');
    expect(source).toContain('Window: last');
    expect(source).toContain('api-smoke-deploy-history.json');
  });
});
