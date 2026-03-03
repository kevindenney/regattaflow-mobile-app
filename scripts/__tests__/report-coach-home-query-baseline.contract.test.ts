import fs from 'fs';
import path from 'path';

function readScript(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('report-coach-home-query-baseline contract', () => {
  it('expects explicit baseline input env and deterministic output path', () => {
    const source = readScript('scripts/report-coach-home-query-baseline.mjs');
    expect(source).toContain("const OUTPUT_PATH = 'docs/coach-home-query-baseline-latest.md'");
    expect(source).toContain('COACH_HOME_BASELINE_INPUT');
    expect(source).toContain('Set COACH_HOME_BASELINE_INPUT to a baseline JSON file path.');
  });

  it('renders step table and budget status in generated markdown', () => {
    const source = readScript('scripts/report-coach-home-query-baseline.mjs');
    expect(source).toContain('Coach Home Query Baseline (Latest)');
    expect(source).toContain('| Step | Samples | Avg Duration (ms) |');
    expect(source).toContain('Budget Exceeded');
    expect(source).toContain('deterministic for identical input JSON');
  });
});
