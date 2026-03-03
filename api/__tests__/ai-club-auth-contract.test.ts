import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..', '..');

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('API auth contract (ai + club)', () => {
  it('enforces withAuth + requireClub on AI club/race/event handlers', () => {
    const aiFiles = [
      'api/ai/club/support.ts',
      'api/ai/events/[id]/documents/draft.ts',
      'api/ai/races/[id]/comms/draft.ts',
    ];

    for (const file of aiFiles) {
      const source = readFile(file);
      expect(source).toContain('withAuth(');
      expect(source).toContain('requireClub: true');
    }
  });

  it('keeps club workspace protected by withAuth and intentionally allows non-club bootstrap access', () => {
    const source = readFile('api/club/workspace.ts');
    expect(source).toContain('export default withAuth(handler)');
    expect(source).not.toContain('requireClub: true');
  });

  it('keeps method guards outside auth wrapper on AI handlers (avoid auth-driven 500s on GET)', () => {
    const aiFiles = [
      'api/ai/club/support.ts',
      'api/ai/events/[id]/documents/draft.ts',
      'api/ai/races/[id]/comms/draft.ts',
    ];

    for (const file of aiFiles) {
      const source = readFile(file);
      expect(source).toContain('const handler = async (req: VercelRequest, res: VercelResponse)');
      expect(source).toContain("if (req.method !== 'POST')");
      expect(source).toContain('await authedHandler(req, res);');
    }
  });
});

