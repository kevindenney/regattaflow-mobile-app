import fs from 'fs';
import path from 'path';

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('coach home unread scope contract', () => {
  it('uses assigned-program scoped unread count aggregation', () => {
    const source = readFile('hooks/useCoachHomeData.ts');
    expect(source).toContain('programService.getUnreadThreadCountsByProgram');
    expect(source).toContain('resolveCoachUnreadThreadCount(unreadThreadCountsByProgram, assignedProgramIds)');
  });

  it('marks threads seen per assigned program with org-wide fallback', () => {
    const source = readFile('hooks/useCoachHomeData.ts');
    expect(source).toContain('programService.listAssignedProgramIdsForStaff');
    expect(source).toContain('if (scopedProgramIds.length === 0)');
    expect(source).toContain('programService.markAllThreadsRead(organizationId, userId);');
    expect(source).toContain('programService.markAllThreadsRead(organizationId, userId, programId)');
  });
});
