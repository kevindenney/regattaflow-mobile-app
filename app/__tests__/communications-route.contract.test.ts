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
    expect(source).toContain("programService.markAllThreadsRead");
  });

  it('wires coach-home unread thread drill-down to communications unread focus', () => {
    const source = readAppFile('app/(tabs)/clients.tsx');
    expect(source).toContain("router.push('/communications?focus=unread' as any)");
  });
});
