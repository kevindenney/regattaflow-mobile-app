import fs from 'fs';
import path from 'path';

function readApiSource(relativePath: string): string {
  const target = path.resolve(process.cwd(), relativePath);
  return fs.readFileSync(target, 'utf8');
}

describe('AI domain gate contract', () => {
  const aiRouteFiles = [
    'api/ai/club/support.ts',
    'api/ai/events/[id]/documents/draft.ts',
    'api/ai/races/[id]/comms/draft.ts',
  ];

  it('enforces explicit sailing-domain gate and DOMAIN_GATED response in each active AI route', () => {
    for (const file of aiRouteFiles) {
      const source = readApiSource(file);
      expect(source).toContain("organization.organization_type !== 'club'");
      expect(source).toContain("code: 'DOMAIN_GATED'");
      expect(source).toContain('withAuth(');
      expect(source).toContain('requireClub: true');
    }
  });
});

