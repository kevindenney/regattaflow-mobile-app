import fs from 'node:fs';
import path from 'node:path';

import {
  canRespondToInviteStatus,
  isInviteDecisionTerminal,
  isValidInviteToken,
  resolveOrgInviteEntry,
} from '../../lib/org-invites/routeFlow';

const appDir = path.resolve(__dirname, '..');

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.join(appDir, relativePath), 'utf8');
}

describe('/org-invite route flow', () => {
  it('routes deep link token to organization-access and preserves invite role params', () => {
    const result = resolveOrgInviteEntry({
      token: 'abc123abc123abc123abc123',
      inviteRole: 'Program Coach',
      inviteRoleKey: 'program_coach',
    });

    expect(result).toEqual({
      kind: 'redirect',
      params: {
        inviteToken: 'abc123abc123abc123abc123',
        inviteRole: 'Program Coach',
        inviteRoleKey: 'program_coach',
      },
    });
  });

  it('keeps user on manual entry when token is missing', () => {
    const result = resolveOrgInviteEntry({});
    expect(result).toEqual({ kind: 'manual', reason: 'missing' });
  });

  it('keeps user on manual entry when deep-link token is malformed', () => {
    const malformed = 'ABC-123-INVALID';
    const result = resolveOrgInviteEntry({ token: malformed });

    expect(result).toEqual({
      kind: 'manual',
      reason: 'malformed',
      malformedToken: malformed.toLowerCase(),
    });
    expect(isValidInviteToken(malformed.toLowerCase())).toBe(false);
  });

  it('models accepted/declined state transitions as terminal and non-respondable', () => {
    expect(canRespondToInviteStatus('draft')).toBe(true);
    expect(canRespondToInviteStatus('sent')).toBe(true);
    expect(canRespondToInviteStatus('opened')).toBe(true);

    expect(canRespondToInviteStatus('accepted')).toBe(false);
    expect(canRespondToInviteStatus('declined')).toBe(false);
    expect(canRespondToInviteStatus('revoked')).toBe(false);
    expect(canRespondToInviteStatus('failed')).toBe(false);

    expect(isInviteDecisionTerminal('accepted')).toBe(true);
    expect(isInviteDecisionTerminal('declined')).toBe(true);
    expect(isInviteDecisionTerminal('opened')).toBe(false);
    expect(isInviteDecisionTerminal('sent')).toBe(false);
  });

  it('wires /org-invite and organization-access screens to shared route-flow helpers', () => {
    const orgInviteSource = readAppFile('org-invite.tsx');
    const orgAccessSource = readAppFile('settings/organization-access.tsx');

    expect(orgInviteSource).toContain('resolveOrgInviteEntry');
    expect(orgInviteSource).toContain('isValidInviteToken');
    expect(orgAccessSource).toContain('canRespondToInviteStatus');
    expect(orgAccessSource).toContain('isInviteDecisionTerminal');
    expect(orgAccessSource).toContain('normalizeInviteToken');
  });
});
