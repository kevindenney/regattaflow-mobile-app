import fs from 'fs';
import path from 'path';

function readApiSource(relativePath: string): string {
  const target = path.resolve(process.cwd(), relativePath);
  return fs.readFileSync(target, 'utf8');
}

function collectActiveAiRoutes(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectActiveAiRoutes(abs));
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
    const rel = path.relative(process.cwd(), abs).replace(/\\/g, '/');
    if (rel.includes('/__tests__/')) continue;
    if (rel.includes('/cron.disabled/')) continue;
    files.push(rel);
  }

  return files.sort((a, b) => a.localeCompare(b));
}

describe('AI domain gate contract', () => {
  const aiRouteFiles = collectActiveAiRoutes(path.resolve(process.cwd(), 'api/ai'));

  it('enforces explicit sailing-domain gate and DOMAIN_GATED response in each active AI route', () => {
    expect(aiRouteFiles.length).toBeGreaterThan(0);
    for (const file of aiRouteFiles) {
      const source = readApiSource(file);
      expect(source).toContain('resolveWorkspaceDomainForAuth');
      expect(source).toContain("code: 'DOMAIN_GATED'");
      expect(source).toContain('withAuth(');
      expect(source).toContain('requireClub: true');
    }
  });
});
