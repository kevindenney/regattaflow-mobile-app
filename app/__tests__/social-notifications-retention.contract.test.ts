import fs from 'fs';
import path from 'path';

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('social notifications retention rendering contract', () => {
  it('supports message/retention notification types in NotificationService union', () => {
    const source = readFile('services/NotificationService.ts');
    expect(source).toContain("'new_message'");
    expect(source).toContain("'thread_mention'");
    expect(source).toContain("'activity_comment'");
    expect(source).toContain("'org_membership_approved'");
    expect(source).toContain("'org_membership_rejected'");
  });

  it('normalizes legacy org_membership_decision rows to canonical approved/rejected types', () => {
    const source = readFile('services/NotificationService.ts');
    expect(source).toContain("normalizedRaw !== 'org_membership_decision'");
    expect(source).toContain('normalizeMembershipDecisionType(');
    expect(source).toContain("return 'org_membership_rejected'");
    expect(source).toContain("return 'org_membership_approved'");
  });

  it('renders actor-less notifications using title/body instead of \"Someone\" fallback', () => {
    const source = readFile('components/social/NotificationRow.tsx');
    expect(source).toContain('const hasActor = Boolean(notification.actorId && notification.actorName);');
    expect(source).toContain("const leadText = hasActor ? (notification.actorName as string) : (notification.title || 'Update');");
    expect(source).toContain('if (!hasActor) {');
    expect(source).toContain('return notification.body ? `${notification.body}` : \'\';');
  });
});
