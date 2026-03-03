import {
  resolveWorkspaceDomainForAuth,
  resolveWorkspaceDomainForPresentation,
} from '../middleware/domain';

describe('domain resolution precedence contract', () => {
  it('uses organization_type precedence for auth gating over active interest hints', () => {
    expect(
      resolveWorkspaceDomainForAuth({
        organizationType: 'club',
        activeInterestSlug: 'nursing-clinical',
      })
    ).toBe('sailing');

    expect(
      resolveWorkspaceDomainForAuth({
        organizationType: 'institution',
        activeInterestSlug: 'sailing-race-strategy',
      })
    ).toBe('nursing');
  });

  it('falls back to active interest hints when organization_type is absent', () => {
    expect(
      resolveWorkspaceDomainForAuth({
        organizationType: null,
        activeInterestSlug: 'drawing-studio',
      })
    ).toBe('drawing');

    expect(
      resolveWorkspaceDomainForAuth({
        organizationType: '',
        activeInterestId: 'golf-fitness-interest',
      })
    ).toBe('fitness');
  });

  it('allows presentation-domain override via active interest hints', () => {
    expect(
      resolveWorkspaceDomainForPresentation({
        organizationType: 'institution',
        activeInterestSlug: 'sailing-race-strategy',
      })
    ).toBe('sailing');
  });
});
