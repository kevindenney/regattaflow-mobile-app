import { mapInterestSlugToDomain } from '@/lib/domain/mapInterestSlugToDomain';
import fs from 'fs';
import path from 'path';

describe('useWorkspaceDomain helpers', () => {
  it('maps sailing-like interest slugs to sailing domain', () => {
    expect(mapInterestSlugToDomain('sail-racing')).toBe('sailing');
    expect(mapInterestSlugToDomain('regatta-ops')).toBe('sailing');
  });

  it('maps nursing-like interest slugs to nursing domain', () => {
    expect(mapInterestSlugToDomain('nursing')).toBe('nursing');
    expect(mapInterestSlugToDomain('clinical-skills')).toBe('nursing');
  });

  it('maps drawing and fitness-like slugs', () => {
    expect(mapInterestSlugToDomain('drawing')).toBe('drawing');
    expect(mapInterestSlugToDomain('art-studio')).toBe('drawing');
    expect(mapInterestSlugToDomain('fitness')).toBe('fitness');
    expect(mapInterestSlugToDomain('golf-performance')).toBe('fitness');
  });

  it('falls back to generic for empty or unknown slugs', () => {
    expect(mapInterestSlugToDomain('')).toBe('generic');
    expect(mapInterestSlugToDomain(null)).toBe('generic');
    expect(mapInterestSlugToDomain(undefined)).toBe('generic');
    expect(mapInterestSlugToDomain('robotics')).toBe('generic');
  });

  it('exposes presentation domain helpers for UI copy overrides', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'hooks/useWorkspaceDomain.ts'), 'utf8');
    expect(source).toContain('presentationDomain');
    expect(source).toContain('isSailingPresentationDomain');
    expect(source).toContain('isNursingPresentationDomain');
    expect(source).toContain('fromInterest !== \'generic\' ? fromInterest : domain');
  });
});
