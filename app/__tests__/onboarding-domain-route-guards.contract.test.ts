import fs from 'fs';
import path from 'path';

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('onboarding domain route guards', () => {
  it('guards sailing-first boat-class screen for non-sailing domains', () => {
    const source = readAppFile('app/onboarding/boat-class.tsx');
    expect(source).toContain('useWorkspaceDomain');
    expect(source).toContain("String(resolvedDomain || '').toLowerCase().trim() === 'sailing'");
    expect(source).toContain('if (isSailingDomain) return;');
    expect(source).toContain("pathname: '/onboarding/profile/name-photo'");
    expect(source).toContain("pathname: '/onboarding/home-club'");
    expect(source).toContain("...(resolvedDomain ? { domain: resolvedDomain } : {})");
  });

  it('guards race-calendar onboarding for non-sailing domains and preserves sailing continuation path', () => {
    const source = readAppFile('app/onboarding/first-activity/race-calendar.tsx');
    expect(source).toContain('useWorkspaceDomain');
    expect(source).toContain("String(resolvedDomain || '').toLowerCase().trim() === 'sailing'");
    expect(source).toContain('if (!isSailingDomain) {');
    expect(source).toContain("router.replace(getDashboardRoute('sailor', resolvedDomain));");
    expect(source).toContain("pathname: '/onboarding/first-activity/add-race'");
    expect(source).toContain('params: resolvedDomain ? { domain: resolvedDomain } : undefined');
  });
});

