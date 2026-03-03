import fs from 'fs';
import path from 'path';

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('progress principles contract', () => {
  it('renders My Principles section backed by signature principle hook', () => {
    const progressSource = readFile('components/progress/ProgressContent.tsx');
    expect(progressSource).toContain('My Principles');
    expect(progressSource).toContain('useSignaturePrinciples');
    expect(progressSource).toContain('principles.map');
    expect(progressSource).toContain('times_reinforced');
  });

  it('defines hook for querying user principle memory', () => {
    const hookSource = readFile('hooks/useSignaturePrinciples.ts');
    expect(hookSource).toContain('useSignaturePrinciples');
    expect(hookSource).toContain('signatureInsightService.listPrincipleMemory');
    expect(hookSource).toContain("activeInterestSlug || activeDomain || 'sailing'");
  });
});
