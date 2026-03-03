import fs from 'node:fs';
import path from 'node:path';

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('coach-home endpoint profile report contract', () => {
  it('builds endpoint profile artifact from baseline latest report', () => {
    const source = readSource('scripts/report-coach-home-endpoint-profile.mjs');
    expect(source).toContain("coach-home-query-baseline-latest.md");
    expect(source).toContain("coach-home-endpoint-profile.md");
    expect(source).toContain('## Bottleneck Summary');
    expect(source).toContain('## Step Ranking (Avg ms)');
  });
});
