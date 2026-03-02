import React from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import {
  isValidInviteToken,
  resolveOrgInviteEntry,
} from '@/lib/org-invites/routeFlow';

export default function OrgInviteEntryScreen() {
  const params = useLocalSearchParams<{
    token?: string;
    inviteToken?: string;
    inviteRole?: string;
    inviteRoleKey?: string;
  }>();
  const resolution = React.useMemo(() => resolveOrgInviteEntry(params), [params]);
  const inviteRole = String(
    Array.isArray(params.inviteRole) ? params.inviteRole[0] || '' : params.inviteRole || ''
  ).trim();
  const inviteRoleKey = String(
    Array.isArray(params.inviteRoleKey) ? params.inviteRoleKey[0] || '' : params.inviteRoleKey || ''
  ).trim();
  const malformedAlertShownRef = React.useRef<string | null>(null);

  const [manualToken, setManualToken] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (resolution.kind !== 'manual' || resolution.reason !== 'malformed') {
      malformedAlertShownRef.current = null;
      return;
    }

    const malformedToken = resolution.malformedToken || '';
    if (!malformedToken || malformedAlertShownRef.current === malformedToken) {
      return;
    }
    malformedAlertShownRef.current = malformedToken;
    Alert.alert(
      'Invalid Invite Token',
      'This invite token format is invalid. Paste a valid 24-character token to continue.'
    );
  }, [resolution]);

  if (resolution.kind === 'redirect') {
    return (
      <Redirect
        href={{
          pathname: '/settings/organization-access',
          params: resolution.params,
        }}
      />
    );
  }

  const handleContinue = async () => {
    const nextToken = String(manualToken || '').trim().toLowerCase();
    if (!nextToken) {
      Alert.alert('Enter Invite Token', 'Paste the invite token to continue.');
      return;
    }
    if (!isValidInviteToken(nextToken)) {
      Alert.alert(
        'Invalid Invite Token',
        'Invite tokens must be 24 lowercase letters or numbers.'
      );
      return;
    }

    setSubmitting(true);
    router.replace({
      pathname: '/settings/organization-access',
      params: {
        inviteToken: nextToken,
        ...(inviteRole ? { inviteRole } : {}),
        ...(inviteRoleKey ? { inviteRoleKey } : {}),
      },
    });
    setSubmitting(false);
  };

  return (
    <View className="flex-1 bg-gray-50 px-4 pt-16">
      <View className="bg-white rounded-2xl p-4 border border-gray-200">
        <Text className="text-xl font-semibold text-gray-800">Organization Invite</Text>
        <Text className="text-sm text-gray-500 mt-2">
          Paste the invite token from your email or message to continue.
        </Text>
        <TextInput
          value={manualToken}
          onChangeText={setManualToken}
          placeholder="Paste invite token"
          autoCapitalize="none"
          autoCorrect={false}
          className="mt-3 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 bg-white"
        />
        <Pressable
          onPress={() => void handleContinue()}
          disabled={submitting}
          className={`mt-3 px-3 py-2 rounded-xl border ${
            submitting ? 'border-gray-200 bg-gray-100' : 'border-blue-200 bg-blue-50'
          }`}
        >
          {submitting ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#9CA3AF" />
              <Text className="text-gray-500 text-sm font-medium ml-2">Opening invite...</Text>
            </View>
          ) : (
            <Text className="text-blue-700 text-sm font-medium">Open Invite</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
