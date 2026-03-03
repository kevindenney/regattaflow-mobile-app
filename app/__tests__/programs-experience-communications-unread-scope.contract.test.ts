import fs from 'fs';
import path from 'path';

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('programs experience communications unread scope contract', () => {
  it('uses per-program unread communication counts on institution program cards', () => {
    const source = readAppFile('app/(tabs)/programs-experience.tsx');
    expect(source).toContain('unreadCountByProgram');
    expect(source).toContain('getProgramUnreadCount');
    expect(source).toContain('getProgramUnreadCount(race.id)');
    expect(source).toContain('quickActionCommunicationsTarget');
    expect(source).toContain('quickActionCommunicationsBadgeCount');
    expect(source).toContain('buildProgramCommunicationsHref');
    expect(source).toContain('badge: quickActionCommunicationsBadgeCount');
    expect(source).toContain(": '/communications'");
    expect(source).toContain('Notify group');
    expect(source).toContain('Send update');
    expect(source).toContain('Send recap');
    expect(source).toContain('Post schedule updates');
  });

  it('declares getProgramUnreadCount before quick-action badge memoization to avoid TDZ runtime errors', () => {
    const source = readAppFile('app/(tabs)/programs-experience.tsx');
    const callbackIndex = source.indexOf('const getProgramUnreadCount = useCallback');
    const badgeMemoIndex = source.indexOf('const quickActionCommunicationsBadgeCount = useMemo');
    expect(callbackIndex).toBeGreaterThan(-1);
    expect(badgeMemoIndex).toBeGreaterThan(-1);
    expect(callbackIndex).toBeLessThan(badgeMemoIndex);
  });
});
