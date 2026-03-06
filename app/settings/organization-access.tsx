import React from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspaceDomain } from '@/hooks/useWorkspaceDomain';
import { useOrganization } from '@/providers/OrganizationProvider';
import {
  OrganizationInviteRecord,
  organizationInviteService,
} from '@/services/OrganizationInviteService';
import {
  InviteRolePreset,
  organizationInviteRolePresetService,
} from '@/services/OrganizationInviteRolePresetService';
import {
  canRespondToInviteStatus,
  isInviteDecisionTerminal,
  isValidInviteToken,
  normalizeInviteToken,
} from '@/lib/org-invites/routeFlow';

function formatOrgType(value?: string | null) {
  if (!value) return 'Organization';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function OrganizationAccessSettingsScreen() {
  const params = useLocalSearchParams<{
    inviteToken?: string;
    inviteRole?: string;
    inviteRoleKey?: string;
    inviteName?: string;
    inviteEmail?: string;
    participantId?: string;
    programId?: string;
    sessionId?: string;
    autoInvite?: string;
  }>();
  const {
    organizationProviderActive,
    loading,
    ready,
    providerMountedAt,
    membershipLoadAttempt,
    membershipLoadError,
    membershipLoadDebug,
    membershipLoadErrorPayload,
    memberships,
    activeOrganizationId,
    activeMembership,
    activeOrganization,
    setActiveOrganizationId,
    refreshMemberships,
    canManageActiveOrganization,
    defaultContentVisibility,
    updateDefaultContentVisibility,
  } = useOrganization();
  const { user, signedIn } = useAuth();
  const { activeDomain } = useWorkspaceDomain();
  const [savingVisibility, setSavingVisibility] = React.useState(false);
  const [inviteHistoryLoading, setInviteHistoryLoading] = React.useState(false);
  const [inviteHistory, setInviteHistory] = React.useState<OrganizationInviteRecord[]>([]);
  const [resolvedTokenInvite, setResolvedTokenInvite] = React.useState<OrganizationInviteRecord | null>(null);
  const [tokenActionLoading, setTokenActionLoading] = React.useState(false);
  const [tokenLookupLoading, setTokenLookupLoading] = React.useState(false);
  const [tokenLookupInput, setTokenLookupInput] = React.useState('');
  const [inviteRoleOptions, setInviteRoleOptions] = React.useState<InviteRolePreset[]>([]);
  const [showDebugInfo, setShowDebugInfo] = React.useState(false);
  const showDevDebugPanel = __DEV__ || process.env.NODE_ENV !== 'production';
  const autoInviteHandledRef = React.useRef(false);
  const invalidParamAlertShownRef = React.useRef<string | null>(null);
  const displayMemberships = React.useMemo(() => {
    const byIdentity = new Map<string, (typeof memberships)[number]>();
    for (const membership of memberships) {
      if (!membership.organization_id) continue;

      const org = membership.organization;
      const slug = (org?.slug || '').trim().toLowerCase();
      const type = (org?.organization_type || '').trim().toLowerCase();
      const name = (org?.name || '').trim().toLowerCase();
      const key = slug || `${type}|${name}` || membership.organization_id;

      if (!byIdentity.has(key)) {
        byIdentity.set(key, membership);
      }
    }
    return Array.from(byIdentity.values());
  }, [memberships]);

  React.useEffect(() => {
    if (!showDevDebugPanel) return;
    const snapshot = {
      organizationProviderActive,
      loading,
      ready,
      providerMountedAt,
      membershipLoadAttempt,
      membershipLoadError,
      hasDebugPayload: Boolean(membershipLoadDebug),
    };
    console.log('[organization-access] context snapshot', JSON.stringify(snapshot));
  }, [
    showDevDebugPanel,
    organizationProviderActive,
    loading,
    ready,
    providerMountedAt,
    membershipLoadAttempt,
    membershipLoadError,
    membershipLoadDebug,
  ]);

  const handleChangeVisibility = async (next: 'public' | 'org_members') => {
    if (next === defaultContentVisibility || savingVisibility) return;
    setSavingVisibility(true);
    try {
      await updateDefaultContentVisibility(next);
    } catch (error) {
      Alert.alert('Unable to update visibility', 'Please try again in a moment.');
    } finally {
      setSavingVisibility(false);
    }
  };

  const loadInviteHistory = React.useCallback(async () => {
    if (!activeOrganization?.id) return;
    try {
      setInviteHistoryLoading(true);
      const rows = await organizationInviteService.listOrganizationInvites(activeOrganization.id, 25);
      setInviteHistory(rows);
    } catch (error) {
      console.error('[organization-access] Failed to load invite history:', error);
    } finally {
      setInviteHistoryLoading(false);
    }
  }, [activeOrganization?.id]);

  React.useEffect(() => {
    void loadInviteHistory();
  }, [loadInviteHistory]);

  const resolveInviteToken = React.useCallback(
    async (token: string, markOpened: boolean) => {
      const normalized = String(token || '').trim();
      if (!normalized) return null;

      try {
        setTokenLookupLoading(true);
        const invite = markOpened
          ? await organizationInviteService.markInviteOpenedByToken(normalized)
          : await organizationInviteService.getInviteByToken(normalized);
        setResolvedTokenInvite(invite);
        return invite;
      } catch (error) {
        console.error('[organization-access] Failed to resolve invite token:', error);
        setResolvedTokenInvite(null);
        Alert.alert('Invite Not Found', 'This invite token is invalid or no longer active.');
        return null;
      } finally {
        setTokenLookupLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    const token = normalizeInviteToken(params.inviteToken);
    setTokenLookupInput(token);
    if (!token) return;
    if (!isValidInviteToken(token)) {
      if (invalidParamAlertShownRef.current !== token) {
        invalidParamAlertShownRef.current = token;
        Alert.alert(
          'Invalid Invite Token',
          'This invite token format is invalid. Paste a valid 24-character token to continue.'
        );
      }
      return;
    }
    invalidParamAlertShownRef.current = null;
    void resolveInviteToken(token, true);
  }, [params.inviteToken, resolveInviteToken]);

  const canRespondToTokenInvite = React.useMemo(() => {
    if (!signedIn || !resolvedTokenInvite?.invitee_email || !user?.email) return false;
    return (
      String(resolvedTokenInvite.invitee_email).trim().toLowerCase() ===
      String(user.email).trim().toLowerCase()
    );
  }, [resolvedTokenInvite?.invitee_email, signedIn, user?.email]);

  const handleTokenInviteResponse = React.useCallback(
    async (status: 'accepted' | 'declined') => {
      if (!resolvedTokenInvite?.id) return;
      if (!canRespondToTokenInvite) {
        Alert.alert(
          'Invite Email Mismatch',
          'Sign in with the invited email address to respond to this invite.'
        );
        return;
      }

      try {
        setTokenActionLoading(true);
        const token = String(resolvedTokenInvite.invite_token || '').trim();
        if (!token) {
          Alert.alert('Invite Token Missing', 'This invite cannot be responded to because its token is missing.');
          return;
        }
        const next = status === 'accepted'
          ? await organizationInviteService.acceptInviteByTokenForCurrentUser(token)
          : await organizationInviteService.declineInviteByTokenForCurrentUser(token);
        setResolvedTokenInvite(next);
        if (activeOrganization?.id === next.organization_id) {
          void loadInviteHistory();
        }
        if (status === 'accepted') {
          await refreshMemberships();
          Alert.alert('Invite Accepted', 'Your organization access has been activated.');
        }
      } catch (error) {
        console.error('[organization-access] Failed to update token invite status:', error);
        Alert.alert('Unable to update invite', 'Please try again in a moment.');
      } finally {
        setTokenActionLoading(false);
      }
    },
    [activeOrganization?.id, canRespondToTokenInvite, loadInviteHistory, refreshMemberships, resolvedTokenInvite]
  );

  const handleLookupInviteToken = React.useCallback(async () => {
    const token = normalizeInviteToken(tokenLookupInput);
    if (!token) {
      Alert.alert('Enter Invite Token', 'Paste the invite token to continue.');
      return;
    }
    if (!isValidInviteToken(token)) {
      Alert.alert('Invalid Invite Token', 'Invite tokens must be 24 lowercase letters or numbers.');
      return;
    }

    router.replace({
      pathname: '/settings/organization-access',
      params: { inviteToken: token },
    });
    await resolveInviteToken(token, true);
  }, [resolveInviteToken, tokenLookupInput]);

  const loadRoleOptions = React.useCallback(async () => {
    const domain = activeDomain || 'generic';
    try {
      const presets = await organizationInviteRolePresetService.listPresets(domain);
      setInviteRoleOptions(presets);
    } catch (error) {
      console.error('[organization-access] Failed to load role presets:', error);
      setInviteRoleOptions([]);
    }
  }, [activeDomain]);

  React.useEffect(() => {
    void loadRoleOptions();
  }, [loadRoleOptions]);

  const handleInviteByRole = React.useCallback(
    async (
      role: string,
      person?: { name?: string; email?: string; participantId?: string; programId?: string; sessionId?: string },
      roleKey?: string
    ) => {
      const rolePayload = organizationInviteRolePresetService.resolveRolePayload(
        inviteRoleOptions,
        role,
        roleKey
      );
      const resolvedRole = rolePayload.roleLabel;
      const resolvedRoleKey = rolePayload.roleKey;
      const orgName = activeOrganization?.name || 'our organization';
      const subject = `Invitation to join ${orgName} as ${resolvedRole}`;
      const greetingTarget = person?.name?.trim() || person?.email?.trim() || '';
      const greeting = greetingTarget ? `Hi ${greetingTarget},\n\n` : `Hi,\n\n`;
      const emailHint = person?.email?.trim()
        ? `Preferred invitation email: ${person.email.trim()}\n\n`
        : '';
      let inviteToken: string | null = null;

      if (activeOrganization?.id && canManageActiveOrganization) {
        try {
          const created = await organizationInviteService.createInvite({
            organization_id: activeOrganization.id,
            role_label: resolvedRole,
            role_key: resolvedRoleKey,
            invitee_name: person?.name?.trim() || null,
            invitee_email: person?.email?.trim() || null,
            participant_id: person?.participantId || null,
            program_id: person?.programId || null,
            session_id: person?.sessionId || null,
            status: 'sent',
            channel: 'email',
            metadata: {
              source: 'organization_access',
              auto_invite: params.autoInvite === '1',
              active_domain: activeDomain,
              role_key: resolvedRoleKey,
              role_label: resolvedRole,
            },
          });
          inviteToken = created.invite_token || null;
          void loadInviteHistory();
        } catch (error) {
          console.error('[organization-access] Failed to record invite:', error);
        }
      }

      const webBase =
        typeof window !== 'undefined' && window.location?.origin
          ? window.location.origin
          : '';
      const inviteLink = inviteToken
        ? (webBase
          ? `${webBase}/settings/organization-access?inviteToken=${encodeURIComponent(inviteToken)}&inviteRole=${encodeURIComponent(resolvedRole)}&inviteRoleKey=${encodeURIComponent(resolvedRoleKey)}`
          : `regattaflow://org-invite?token=${encodeURIComponent(inviteToken)}&inviteRole=${encodeURIComponent(resolvedRole)}&inviteRoleKey=${encodeURIComponent(resolvedRoleKey)}`)
        : null;
      const tokenSection = inviteToken
        ? `Invite token: ${inviteToken}\n${inviteLink ? `Invite link: ${inviteLink}\n` : ''}\n`
        : '';

      const body =
        greeting +
        `You are invited to join ${orgName} on BetterAt as a ${resolvedRole}.\n\n` +
        emailHint +
        tokenSection +
        `Please reply to this email to confirm onboarding and access details.\n\n` +
        `Thanks.`;

      const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      try {
        await Linking.openURL(mailto);
      } catch (error) {
        Alert.alert('Unable to open email app', 'Please configure an email app and try again.');
      }
    },
    [
      activeDomain,
      activeOrganization?.id,
      activeOrganization?.name,
      canManageActiveOrganization,
      inviteRoleOptions,
      loadInviteHistory,
      params.autoInvite,
    ]
  );

  React.useEffect(() => {
    if (autoInviteHandledRef.current) return;
    if (params.autoInvite !== '1') return;
    if (!canManageActiveOrganization) return;
    if (!params.inviteRole) return;
    autoInviteHandledRef.current = true;
    void handleInviteByRole(String(params.inviteRole), {
      name: params.inviteName ? String(params.inviteName) : undefined,
      email: params.inviteEmail ? String(params.inviteEmail) : undefined,
      participantId: params.participantId ? String(params.participantId) : undefined,
      programId: params.programId ? String(params.programId) : undefined,
      sessionId: params.sessionId ? String(params.sessionId) : undefined,
    }, params.inviteRoleKey ? String(params.inviteRoleKey) : undefined);
  }, [
    canManageActiveOrganization,
    handleInviteByRole,
    params.autoInvite,
    params.inviteEmail,
    params.inviteName,
    params.participantId,
    params.programId,
    params.sessionId,
    params.inviteRoleKey,
    params.inviteRole,
  ]);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}>
            <ArrowLeft size={24} color="#1F2937" />
          </Pressable>
          <View className="ml-4">
            <Text className="text-xl font-bold text-gray-800">Organization Access</Text>
            <Text className="text-sm text-gray-500 mt-0.5">Workspace, role, and content visibility</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Have an Invite Token?</Text>
          <Text className="text-sm text-gray-500 mt-2">
            Open a link or paste your token here to review and respond to your invite.
          </Text>
          <TextInput
            value={tokenLookupInput}
            onChangeText={setTokenLookupInput}
            placeholder="Paste invite token"
            autoCapitalize="none"
            autoCorrect={false}
            className="mt-3 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 bg-white"
          />
          <Pressable
            onPress={() => void handleLookupInviteToken()}
            disabled={tokenLookupLoading}
            className={`mt-3 px-3 py-2 rounded-xl border ${
              tokenLookupLoading ? 'border-gray-200 bg-gray-100' : 'border-blue-200 bg-blue-50'
            }`}
          >
            <Text className={tokenLookupLoading ? 'text-gray-400 text-sm font-medium' : 'text-blue-700 text-sm font-medium'}>
              {tokenLookupLoading ? 'Checking token...' : 'Check Invite Token'}
            </Text>
          </Pressable>
        </View>

        {showDevDebugPanel ? (
          <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dev Diagnostics</Text>
              <Pressable
                onPress={() => setShowDebugInfo((prev) => !prev)}
                className="px-3 py-2 rounded-xl border border-gray-300 bg-gray-50"
              >
                <Text className="text-xs font-medium text-gray-700">
                  {showDebugInfo ? 'Hide debug' : 'Show debug'}
                </Text>
              </Pressable>
            </View>
            {showDebugInfo ? (
              <>
                <Text className="text-xs text-gray-600 mt-3">loading: {String(loading)}</Text>
                <Text className="text-xs text-gray-600 mt-1">ready: {String(ready)}</Text>
                <Text className="text-xs text-gray-600 mt-1">organizationProviderActive: {String(organizationProviderActive)}</Text>
                <Text className="text-xs text-gray-600 mt-1">providerMountedAt: {providerMountedAt || 'null'}</Text>
                <Text className="text-xs text-gray-600 mt-1">membershipLoadAttempt: {membershipLoadAttempt}</Text>
                <Text className="text-xs text-gray-600 mt-1">
                  membershipLoadError: {membershipLoadError || 'null'}
                </Text>
                <ScrollView className="mt-2 max-h-48 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <Text className="text-xs text-gray-700">
                    {JSON.stringify(membershipLoadDebug, null, 2)}
                  </Text>
                </ScrollView>
                <Pressable
                  onPress={() => void refreshMemberships()}
                  className="mt-3 self-start px-3 py-2 rounded-xl border border-gray-300 bg-gray-50"
                >
                  <Text className="text-xs font-medium text-gray-700">Retry</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}

        {resolvedTokenInvite ? (
          <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invite Link</Text>
            <Text className="text-base font-semibold text-gray-800 mt-2">
              {resolvedTokenInvite.role_label || 'Organization Invite'}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Status: {resolvedTokenInvite.status}
            </Text>
            {resolvedTokenInvite.invitee_email ? (
              <Text className="text-xs text-gray-500 mt-1">Invited email: {resolvedTokenInvite.invitee_email}</Text>
            ) : null}
            {resolvedTokenInvite.invite_token ? (
              <Text className="text-xs text-gray-500 mt-1">Token: {resolvedTokenInvite.invite_token}</Text>
            ) : null}

            {!signedIn ? (
              <Text className="text-xs text-amber-700 mt-3">
                Sign in with the invited email to accept or decline this invite.
              </Text>
            ) : !canRespondToTokenInvite ? (
              <Text className="text-xs text-amber-700 mt-3">
                You are signed in as {user?.email || 'another account'}. Sign in with the invited email to respond.
              </Text>
            ) : canRespondToInviteStatus(resolvedTokenInvite.status) ? (
              <View className="mt-3 flex-row">
                <Pressable
                  onPress={() => void handleTokenInviteResponse('accepted')}
                  disabled={tokenActionLoading}
                  className={`px-3 py-2 rounded-xl border mr-2 ${
                    tokenActionLoading ? 'border-gray-200 bg-gray-100' : 'border-emerald-200 bg-emerald-50'
                  }`}
                >
                  <Text className={tokenActionLoading ? 'text-gray-400 text-sm font-medium' : 'text-emerald-700 text-sm font-medium'}>
                    Accept
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleTokenInviteResponse('declined')}
                  disabled={tokenActionLoading}
                  className={`px-3 py-2 rounded-xl border ${
                    tokenActionLoading ? 'border-gray-200 bg-gray-100' : 'border-rose-200 bg-rose-50'
                  }`}
                >
                  <Text className={tokenActionLoading ? 'text-gray-400 text-sm font-medium' : 'text-rose-700 text-sm font-medium'}>
                    Decline
                  </Text>
                </Pressable>
              </View>
            ) : isInviteDecisionTerminal(resolvedTokenInvite.status) ? (
              <Text className="text-xs text-gray-500 mt-3">
                This invite has already been {String(resolvedTokenInvite.status).toLowerCase()}.
              </Text>
            ) : null}
          </View>
        ) : null}

        {!ready || loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="text-gray-500 mt-3">Loading organization memberships...</Text>
          </View>
        ) : membershipLoadError ? (
          <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-rose-200">
            <Text className="text-base font-semibold text-rose-700">Could not load organizations</Text>
            <Text className="text-sm text-rose-700 mt-2">{membershipLoadError}</Text>
            <Pressable
              onPress={() => void refreshMemberships()}
              className="mt-3 self-start px-3 py-2 rounded-xl border border-rose-200 bg-rose-50"
            >
              <Text className="text-sm font-medium text-rose-700">Retry</Text>
            </Pressable>
            {showDevDebugPanel && showDebugInfo && membershipLoadErrorPayload ? (
              <View className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <Text className="text-xs text-gray-700">
                  {JSON.stringify(membershipLoadErrorPayload, null, 2)}
                </Text>
              </View>
            ) : null}
          </View>
        ) : displayMemberships.length === 0 ? (
          <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="text-base font-semibold text-gray-800">No organization memberships yet</Text>
            <Text className="text-sm text-gray-500 mt-2">
              You can still use BetterAt personally. Join a club or institution to unlock organization workspaces.
            </Text>
          </View>
        ) : (
          <>
            <View className="mx-4 mt-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <Text className="px-4 pt-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Active Workspace
              </Text>
              {displayMemberships.map((membership) => {
                const isActive = activeOrganizationId === membership.organization_id;
                const org = membership.organization;
                return (
                  <Pressable
                    key={membership.id}
                    onPress={() => {
                      if (!isActive) {
                        void setActiveOrganizationId(membership.organization_id);
                      }
                    }}
                    className="px-4 py-3 border-t border-gray-100 flex-row items-center"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-gray-900 font-medium">{org?.name || 'Unnamed Organization'}</Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {formatOrgType(org?.organization_type)} • Role: {membership.role} • Status: {membership.status}
                      </Text>
                    </View>
                    {isActive ? (
                      <CheckCircle2 size={20} color="#2563EB" />
                    ) : (
                      <Circle size={20} color="#9CA3AF" />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Access</Text>
              <Text className="text-base font-semibold text-gray-800 mt-2">
                {activeOrganization?.name || 'No active organization'}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                {activeMembership
                  ? `${formatOrgType(activeOrganization?.organization_type)} • ${activeMembership.role} • ${activeMembership.is_verified ? 'Verified member' : 'Not verified'}`
                  : 'Select an organization workspace above.'}
              </Text>
            </View>

            <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invite People</Text>
              <Text className="text-sm text-gray-500 mt-2">
                Invite the clinical educators and support staff who guide experiential learning.
              </Text>

              {(params.inviteRole || params.inviteName || params.inviteEmail) && (
                <View className="mt-3 p-3 rounded-xl border border-blue-200 bg-blue-50">
                  <Text className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Prefilled Invite</Text>
                  <Text className="text-sm text-blue-800 mt-1">
                    Role: {params.inviteRole ? String(params.inviteRole) : resolvedTokenInvite?.role_label || 'Not set'}
                  </Text>
                  {(params.inviteName || resolvedTokenInvite?.invitee_name) ? (
                    <Text className="text-xs text-blue-700 mt-1">
                      Name: {params.inviteName ? String(params.inviteName) : String(resolvedTokenInvite?.invitee_name || '')}
                    </Text>
                  ) : null}
                  {(params.inviteEmail || resolvedTokenInvite?.invitee_email) ? (
                    <Text className="text-xs text-blue-700 mt-1">
                      Email: {params.inviteEmail ? String(params.inviteEmail) : String(resolvedTokenInvite?.invitee_email || '')}
                    </Text>
                  ) : null}
                  {resolvedTokenInvite?.invite_token ? (
                    <Text className="text-xs text-blue-700 mt-1">Token: {resolvedTokenInvite.invite_token}</Text>
                  ) : null}
                  {resolvedTokenInvite?.status ? (
                    <Text className="text-xs text-blue-700 mt-1">Status: {resolvedTokenInvite.status}</Text>
                  ) : null}
                  <Pressable
                    onPress={() =>
                      void handleInviteByRole(
                        String(params.inviteRole || resolvedTokenInvite?.role_label || 'Team Member'),
                        {
                          name: params.inviteName ? String(params.inviteName) : (resolvedTokenInvite?.invitee_name || undefined),
                          email: params.inviteEmail ? String(params.inviteEmail) : (resolvedTokenInvite?.invitee_email || undefined),
                          participantId: params.participantId
                            ? String(params.participantId)
                            : (resolvedTokenInvite?.participant_id || undefined),
                          programId: params.programId
                            ? String(params.programId)
                            : (resolvedTokenInvite?.program_id || undefined),
                          sessionId: params.sessionId
                            ? String(params.sessionId)
                            : (resolvedTokenInvite?.session_id || undefined),
                        },
                        params.inviteRoleKey
                          ? String(params.inviteRoleKey)
                          : (resolvedTokenInvite?.role_key || undefined)
                      )
                    }
                    disabled={!canManageActiveOrganization}
                    className={`mt-3 px-3 py-2 rounded-xl border ${
                      canManageActiveOrganization ? 'border-blue-300 bg-white' : 'border-gray-200 bg-gray-100'
                    }`}
                  >
                    <Text className={canManageActiveOrganization ? 'text-blue-700 text-sm font-medium' : 'text-gray-400 text-sm font-medium'}>
                      Send this invite
                    </Text>
                  </Pressable>
                </View>
              )}

              <View className="mt-3 flex-row flex-wrap">
                {inviteRoleOptions.map((option) => (
                  <Pressable
                    key={option.key}
                    onPress={() => void handleInviteByRole(option.role, undefined, option.key)}
                    disabled={!canManageActiveOrganization}
                    className={`mr-2 mb-2 px-3 py-2 rounded-xl border ${
                      canManageActiveOrganization ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-100'
                    }`}
                  >
                    <Text className={canManageActiveOrganization ? 'text-blue-700 text-sm font-medium' : 'text-gray-400 text-sm font-medium'}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {!canManageActiveOrganization && (
                <Text className="text-xs text-amber-700 mt-2">
                  You need an admin/manager role in this workspace to send invites.
                </Text>
              )}
            </View>

            <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Invite Activity</Text>
                <Pressable
                  onPress={() => void loadInviteHistory()}
                  className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50"
                >
                  <Text className="text-xs font-medium text-blue-700">Refresh</Text>
                </Pressable>
              </View>

              {inviteHistoryLoading ? (
                <View className="mt-3 flex-row items-center">
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text className="text-xs text-gray-500 ml-2">Loading invite history...</Text>
                </View>
              ) : inviteHistory.length === 0 ? (
                <Text className="text-sm text-gray-500 mt-3">No invite records yet.</Text>
              ) : (
                <View className="mt-3">
                  {inviteHistory.slice(0, 10).map((row) => (
                    <View key={row.id} className="py-2 border-b border-gray-100">
                      <Text className="text-sm text-gray-900 font-medium">
                        {row.role_label}
                        {row.invitee_name ? ` • ${row.invitee_name}` : ''}
                        {row.invitee_email ? ` • ${row.invitee_email}` : ''}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        Status: {row.status} • Sent: {row.sent_at ? new Date(row.sent_at).toLocaleString() : 'n/a'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Default Content Visibility</Text>
              <Text className="text-sm text-gray-500 mt-2">
                Set whether new organization content should default to public or members-only.
              </Text>

              <Pressable
                className="mt-3 px-3 py-3 rounded-xl border border-gray-200 flex-row items-start"
                onPress={() => void handleChangeVisibility('public')}
                disabled={!canManageActiveOrganization || savingVisibility}
              >
                <View className="mr-3 mt-0.5">
                  {defaultContentVisibility === 'public' ? (
                    <CheckCircle2 size={18} color="#2563EB" />
                  ) : (
                    <Circle size={18} color="#9CA3AF" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Public by default</Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Anyone can view published content from this organization.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                className="mt-2 px-3 py-3 rounded-xl border border-gray-200 flex-row items-start"
                onPress={() => void handleChangeVisibility('org_members')}
                disabled={!canManageActiveOrganization || savingVisibility}
              >
                <View className="mr-3 mt-0.5">
                  {defaultContentVisibility === 'org_members' ? (
                    <CheckCircle2 size={18} color="#2563EB" />
                  ) : (
                    <Circle size={18} color="#9CA3AF" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Members-only by default</Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Only active members can view published content from this organization.
                  </Text>
                </View>
              </Pressable>

              {!canManageActiveOrganization && (
                <Text className="text-xs text-amber-700 mt-3">
                  You need an admin/manager role in this workspace to change visibility defaults.
                </Text>
              )}

              {savingVisibility && (
                <View className="flex-row items-center mt-3">
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text className="text-xs text-gray-500 ml-2">Saving visibility setting...</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
