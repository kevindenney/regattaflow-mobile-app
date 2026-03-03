import fs from 'fs';
import path from 'path';

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('communications route contract', () => {
  it('exposes a top-level communications screen', () => {
    const source = readAppFile('app/communications.tsx');
    expect(source).toContain('export default function CommunicationsScreen()');
    expect(source).toContain("programService.listOrganizationCommunicationThreads");
    expect(source).toContain("programService.listUnreadThreadIds");
    expect(source).toContain('listUnreadThreadIds(organizationId, userId, 1000, selectedProgramId)');
    expect(source).toContain("programService.markAllThreadsRead");
    expect(source).toContain('markAllThreadsRead(organizationId, userId, selectedProgramId)');
    expect(source).toContain('selectedProgramId');
    expect(source).toContain('buildClearProgramCommunicationsHref');
    expect(source).toContain('router.push((`/communications/${threadId}`) as any)');
  });

  it('wires coach-home unread thread drill-down to communications unread focus', () => {
    const source = readAppFile('app/(tabs)/clients.tsx');
    expect(source).toContain("router.push('/communications?focus=unread' as any)");
  });

  it('exposes thread detail route with read + reply flow', () => {
    const source = readAppFile('app/communications/[threadId].tsx');
    expect(source).toContain('export default function CommunicationThreadDetailScreen()');
    expect(source).toContain('programService.listThreadMessages');
    expect(source).toContain('programService.createCommunicationMessage');
    expect(source).toContain('programService.markThreadRead');
  });

  it('wires institution program cards to program-scoped communications drill-down', () => {
    const source = readAppFile('app/(tabs)/programs-experience.tsx');
    expect(source).toContain('buildProgramCommunicationsHref');
    expect(source).toContain('programId: race.id');
    expect(source).toContain('programTitle: race.name');
  });
});
