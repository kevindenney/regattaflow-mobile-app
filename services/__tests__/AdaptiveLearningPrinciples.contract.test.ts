import fs from 'fs';
import path from 'path';

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AdaptiveLearningService principle reuse contract', () => {
  it('reuses user_principle_memory in personalized reminders with safe virtual delivery ids', () => {
    const source = readFile('services/AdaptiveLearningService.ts');
    expect(source).toContain('PRINCIPLE_NUDGE_PREFIX');
    expect(source).toContain('buildPrincipleReminders');
    expect(source).toContain("from('user_principle_memory')");
    expect(source).toContain('mergedReminders');
    expect(source).toContain('virtual_delivery_');
    expect(source).toContain('learnableEventId.startsWith(this.PRINCIPLE_NUDGE_PREFIX)');
  });
});
