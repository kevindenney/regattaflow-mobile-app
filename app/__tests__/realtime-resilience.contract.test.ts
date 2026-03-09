import fs from 'fs';
import path from 'path';

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('realtime resilience guardrails', () => {
  it('guards org membership updates against out-of-order payload commits and refreshes on reconnect', () => {
    const source = readSource('providers/OrganizationProvider.tsx');

    expect(source).toContain('membershipRealtimeCommitRef');
    expect(source).toContain('payload.commit_timestamp');
    expect(source).toContain('if (commitTime < knownCommitTime)');
    expect(source).toContain("if (status === 'SUBSCRIBED')");
    expect(source).toContain("if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')");
    expect(source).toContain('void refreshMemberships();');
  });

  it('backfills notifications on reconnect and normalizes realtime notification types', () => {
    const source = readSource('services/NotificationService.ts');

    expect(source).toContain('backfillNotificationsAfterReconnect');
    expect(source).toContain('recentlyDeliveredNotificationIds');
    expect(source).toContain('normalizeNotificationType(');
    expect(source).toContain("if (status === 'SUBSCRIBED')");
  });

  it('orders realtime notifications by createdAt when merging into feed pages', () => {
    const source = readSource('hooks/useNotifications.ts');

    expect(source).toContain('Remove any pre-existing copy of the notification from every page first.');
    expect(source).toContain('const merged = [notification, ...existingNotifications].sort');
    expect(source).toContain('return bTime - aTime;');
  });
});
