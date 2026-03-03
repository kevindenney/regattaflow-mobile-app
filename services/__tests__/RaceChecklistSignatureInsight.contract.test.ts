import fs from 'fs';
import path from 'path';

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('RaceChecklistService signature insight trigger contract', () => {
  it('gates signature insight event emission on completed status + AI analysis availability', () => {
    const source = readFile('services/RaceChecklistService.ts');
    expect(source).toContain('maybeEmitSignatureInsightForChecklistCompletion');
    expect(source).toContain("if (status === 'completed')");
    expect(source).toContain('resolveLatestAiAnalysisForRace');
    expect(source).toContain('if (!ai.aiAnalysisId)');
    expect(source).toContain("eq('outcome', 'dismissed')");
    expect(source).toContain("eq('principle_text', principleText)");
    expect(source).toContain("sourceKind: 'timeline_step_completion'");
    expect(source).toContain('signatureInsightService.logSignatureInsightEvent');
  });
});
