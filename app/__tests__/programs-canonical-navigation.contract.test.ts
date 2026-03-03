import fs from 'node:fs';
import path from 'node:path';

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('programs canonical navigation contract', () => {
  const canonicalFiles = [
    'components/landing/LandingNav.tsx',
    'app/(auth)/club-onboarding-enhanced.tsx',
    'app/(tabs)/events.tsx',
    'app/(tabs)/fleets.tsx',
    'app/(tabs)/profile.tsx',
    'lib/navigation-config.ts',
  ];

  it('keeps shared navigation pointers on /(tabs)/programs', () => {
    for (const file of canonicalFiles) {
      const source = readRepoFile(file);
      expect(source).toContain('/(tabs)/programs');
      expect(source).not.toContain('/(tabs)/race-management');
    }
  });
});
