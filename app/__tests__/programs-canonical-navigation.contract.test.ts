import fs from 'node:fs';
import path from 'node:path';

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('programs canonical navigation contract', () => {
  it('uses /(tabs)/programs in shared landing and fleet navigation', () => {
    const landingNav = readRepoFile('components/landing/LandingNav.tsx');
    const fleetsTab = readRepoFile('app/(tabs)/fleets.tsx');

    expect(landingNav).toContain('/(tabs)/programs');
    expect(landingNav).not.toContain('/(tabs)/race-management');

    expect(fleetsTab).toContain('/(tabs)/programs');
    expect(fleetsTab).not.toContain('/(tabs)/race-management');
  });
});
