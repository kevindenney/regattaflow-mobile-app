import fs from 'fs';
import path from 'path';

const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock('../supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { organizationInviteService } = require('../OrganizationInviteService');

describe('OrganizationInviteService security regressions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enforces invitee update policy guard: invitee path can only set status transitions', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20260302193000_org_invite_invitee_status_updates.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const normalized = sql.replace(/\s+/g, ' ').toLowerCase();

    expect(normalized).toContain('and status in (\'opened\', \'accepted\', \'declined\')');
    expect(normalized).toContain('lower(invitee_email) = lower(coalesce(auth.jwt() ->> \'email\', \'\'))');
  });

  it('throws when non-management role is denied by RLS while creating invites', async () => {
    const single = jest.fn().mockResolvedValue({
      data: null,
      error: {
        code: '42501',
        message: 'new row violates row-level security policy for table "organization_invites"',
      },
    });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));

    mockFrom.mockReturnValue({
      insert,
    });

    await expect(
      organizationInviteService.createInvite({
        organization_id: 'org-1',
        role_label: 'Race Committee',
        role_key: 'race_committee',
        invitee_email: 'invitee@example.com',
      })
    ).rejects.toMatchObject({
      code: '42501',
    });
  });

  it('accepts invite via token RPC positive path', async () => {
    const inviteId = 'invite-1';
    const inviteToken = 'tok_123';
    const acceptedInvite = {
      id: inviteId,
      organization_id: 'org-1',
      role_label: 'Race Committee',
      role_key: 'race_committee',
      invite_token: inviteToken,
      status: 'accepted',
    };

    const single = jest.fn().mockResolvedValue({
      data: { invite_token: inviteToken },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));

    mockFrom.mockReturnValue({
      select,
    });
    mockRpc.mockResolvedValue({
      data: acceptedInvite,
      error: null,
    });

    const result = await organizationInviteService.acceptInviteForCurrentUser(inviteId);

    expect(mockFrom).toHaveBeenCalledWith('organization_invites');
    expect(select).toHaveBeenCalledWith('invite_token');
    expect(eq).toHaveBeenCalledWith('id', inviteId);
    expect(mockRpc).toHaveBeenCalledWith('respond_to_organization_invite', {
      p_invite_token: inviteToken,
      p_decision: 'accepted',
    });
    expect(result).toMatchObject({
      id: inviteId,
      status: 'accepted',
    });
  });
});
