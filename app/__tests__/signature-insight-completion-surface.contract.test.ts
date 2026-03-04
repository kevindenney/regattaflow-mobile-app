import fs from 'fs';
import path from 'path';

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('signature insight completion confirmation surface contract', () => {
  it('shows signature insight notice in educational checklist sheet', () => {
    const source = readFile('components/races/review/EducationalChecklistSheet.tsx');
    expect(source).toContain('signatureInsightConfirmation');
    expect(source).toContain('Signature Insight Ready');
    expect(source).toContain('Principle:');
  });

  it('emits checklist completion signature insight from after-race content when AI analysis is available', () => {
    const source = readFile('components/cards/content/phases/AfterRaceContent.tsx');
    expect(source).toContain('maybeEmitChecklistCompletionSignatureInsight');
    expect(source).toContain('hasAIAnalysis');
    expect(source).toContain('signatureInsightService.logSignatureInsightEvent');
    expect(source).toContain('sourceKind: \'timeline_step_completion\'');
    expect(source).toContain('setSignatureInsightConfirmation');
  });
});
