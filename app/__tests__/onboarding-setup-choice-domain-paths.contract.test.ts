import fs from 'fs';
import path from 'path';

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('onboarding setup-choice domain paths', () => {
  it('keeps quick-start routing split by domain', () => {
    const source = readAppFile('app/onboarding/setup-choice.tsx');

    expect(source).toContain("const isSailingDomain = !normalizedDomain || normalizedDomain === 'sailing'");
    expect(source).toContain('if (isSailingDomain) {');
    expect(source).toContain("pathname: '/onboarding/complete'");
    expect(source).toContain("pathname: '/onboarding/profile/name-photo'");
    expect(source).toContain("...(resolvedDomain ? { domain: resolvedDomain } : {})");
  });

  it('keeps full setup path domain-aware via propagated domain params', () => {
    const source = readAppFile('app/onboarding/setup-choice.tsx');

    expect(source).toContain("pathname: '/onboarding/experience'");
    expect(source).toContain("...(resolvedDomain ? { domain: resolvedDomain } : {})");
    expect(source).toContain("isNursingDomain ? 'Select your clinical track'");
    expect(source).toContain("isNursingDomain ? 'Join your cohort'");
  });
});
