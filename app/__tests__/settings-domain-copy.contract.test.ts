import fs from 'fs';
import path from 'path';

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('settings domain-aware copy contracts', () => {
  it('keeps organization-access workspace copy domain-neutral', () => {
    const source = readAppFile('app/settings/organization-access.tsx');
    expect(source).toContain('Workspace, role, and content visibility');
    expect(source).toContain('Join a club or institution to unlock organization workspaces.');
    expect(source).not.toContain('Race management');
    expect(source).not.toContain('Regatta');
  });

  it('uses domain-aware notification labels for sailing vs institution contexts', () => {
    const source = readAppFile('app/settings/notifications.tsx');
    expect(source).toContain("header={isSailingCopy ? 'RACING & WEATHER' : 'EVENT UPDATES'}");
    expect(source).toContain("title={isSailingCopy ? 'Race Reminders' : isClubPersona ? 'Event Reminders' : 'Session Reminders'}");
    expect(source).toContain("title={isSailingCopy ? 'Race Results' : isClubPersona ? 'Event Outcome Updates' : 'Outcome Summaries'}");
    expect(source).toContain("title={isSailingCopy ? 'Weather Alerts' : isClubPersona ? 'Operational Alerts' : 'Context Alerts'}");
  });
});

