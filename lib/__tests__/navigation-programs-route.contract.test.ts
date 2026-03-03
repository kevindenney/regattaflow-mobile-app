import { CLUB_NAV_ITEMS } from '../navigation-config';

describe('navigation programs route contract', () => {
  it('uses programs as canonical club nav route while keeping race-management as alias only', () => {
    const programsNavItem = CLUB_NAV_ITEMS.find((item) => item.key === 'racing');
    expect(programsNavItem).toBeDefined();
    expect(programsNavItem?.route).toBe('/(tabs)/programs');
  });
});
