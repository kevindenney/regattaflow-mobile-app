import { mapInterestSlugToDomain } from '@/lib/domain/mapInterestSlugToDomain';
import { getTabsForUserType } from '@/lib/navigation-config';
import { resolveWorkspaceDomainForAuth } from '@/api/middleware/domain';

describe('secondary packs route/api contract', () => {
  it('supports drawing pack route-level program workspace behavior', () => {
    expect(mapInterestSlugToDomain('drawing-studio')).toBe('drawing');

    const tabs = getTabsForUserType('club', false, undefined, undefined, {
      organizationType: 'institution',
      activeDomain: 'drawing',
    });
    expect(tabs.some((tab) => tab.name === 'programs')).toBe(true);
  });

  it('supports golf pack route-level behavior via fitness domain mapping', () => {
    expect(mapInterestSlugToDomain('golf-performance')).toBe('fitness');

    const tabs = getTabsForUserType('club', false, undefined, undefined, {
      organizationType: 'institution',
      activeDomain: 'fitness',
    });
    expect(tabs.some((tab) => tab.name === 'programs')).toBe(true);
  });

  it('supports drawing and golf API-level domain resolution when org type is absent', () => {
    expect(
      resolveWorkspaceDomainForAuth({
        organizationType: null,
        activeInterestSlug: 'drawing-studio',
      })
    ).toBe('drawing');

    expect(
      resolveWorkspaceDomainForAuth({
        organizationType: null,
        activeInterestSlug: 'golf-performance',
      })
    ).toBe('fitness');
  });
});
