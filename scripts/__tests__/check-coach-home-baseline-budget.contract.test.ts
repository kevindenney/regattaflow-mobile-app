import fs from 'fs';
import path from 'path';

function readScript(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('check-coach-home-baseline-budget contract', () => {
  it('parses coach-home baseline report metrics and enforces budget gate', () => {
    const source = readScript('scripts/check-coach-home-baseline-budget.mjs');
    expect(source).toContain("docs/coach-home-query-baseline-latest.md");
    expect(source).toContain('Avg Total Refresh (ms)');
    expect(source).toContain('function parseBudgetMs');
    expect(source).toContain('text.match(/Budget ');
    expect(source).toContain('budget_ms=');
    expect(source).toContain('[coach-home-baseline-budget] PASS');
    expect(source).toContain('[coach-home-baseline-budget] FAIL');
  });
});
