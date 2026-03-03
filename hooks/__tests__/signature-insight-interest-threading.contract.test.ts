import fs from 'fs';
import path from 'path';

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('signature insight interest threading contract', () => {
  it('threads active interest into checklist status updates', () => {
    const source = readFile('hooks/useExcellenceChecklist.ts');
    expect(source).toContain("const interestId = activeInterestSlug || activeDomain || 'sailing'");
    expect(source).toContain('RaceChecklistService.updateChecklistStatus(itemId, status, { interestId })');
  });

  it('threads active interest into personalized nudge generation', () => {
    const source = readFile('hooks/useAdaptiveLearning.ts');
    expect(source).toContain("const interestId = activeInterestSlug || activeDomain || 'sailing'");
    expect(source).toContain('interestId,');
    expect(source).toContain('ADAPTIVE_LEARNING_KEYS.nudges(raceEventId), interestId');
  });
});
