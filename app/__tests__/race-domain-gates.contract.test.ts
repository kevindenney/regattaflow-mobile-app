import fs from 'fs';
import path from 'path';

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('race-only domain gates', () => {
  it('keeps non-sailing redirects on race-only club result/control routes', () => {
    const raceControl = readSource('app/club/race/control/[id].tsx');
    const resultsIndex = readSource('app/club/results/index.tsx');
    const resultsEntry = readSource('app/club/results/entry.tsx');
    const resultsDetail = readSource('app/club/results/[raceId].tsx');

    for (const source of [raceControl, resultsIndex, resultsEntry, resultsDetail]) {
      expect(source).toContain('useClubWorkspace');
    }

    for (const source of [raceControl, resultsIndex, resultsDetail]) {
      expect(source).toContain('if (!clubId)');
      expect(source).toContain('Connect Your Club Workspace');
      expect(source).toContain('Open Club Onboarding');
    }
  });

  it('keeps server-side DOMAIN_GATED enforcement on sailing-only AI endpoints', () => {
    const raceCommsDraft = readSource('api/ai/races/[id]/comms/draft.ts');
    const eventDocumentsDraft = readSource('api/ai/events/[id]/documents/draft.ts');
    const clubSupport = readSource('api/ai/club/support.ts');

    for (const source of [raceCommsDraft, eventDocumentsDraft, clubSupport]) {
      expect(source).toContain('resolveWorkspaceDomainForAuth');
      expect(source).toContain("code: 'DOMAIN_GATED'");
      expect(source).toContain('res.status(403).json');
    }
  });
});
