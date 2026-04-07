/**
 * ManageSharesModal — lists active shares on a playbook and lets the owner
 * revoke any of them. Revoke flips `invite_status='revoked'`; RLS immediately
 * cuts off the invitee's read access.
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import {
  usePlaybookShares,
  useRevokePlaybookShare,
} from '@/hooks/usePlaybook';
import { showConfirm } from '@/lib/utils/crossPlatformAlert';
import type { PlaybookShareRecord } from '@/types/playbook';

interface ManageSharesModalProps {
  visible: boolean;
  playbookId: string | undefined;
  onClose: () => void;
}

function shareLabel(share: PlaybookShareRecord): string {
  return (
    share.shared_with_email ||
    (share.shared_with_user_id
      ? share.shared_with_user_id.slice(0, 8)
      : 'Invited collaborator')
  );
}

export function ManageSharesModal({
  visible,
  playbookId,
  onClose,
}: ManageSharesModalProps) {
  const { data: shares = [], isLoading } = usePlaybookShares(playbookId);
  const revoke = useRevokePlaybookShare();

  const handleRevoke = (share: PlaybookShareRecord) => {
    if (!playbookId) return;
    showConfirm(
      'Revoke access',
      `Remove ${shareLabel(share)}'s read-only access to this Playbook?`,
      () => {
        revoke.mutate({ shareId: share.id, playbookId });
      },
      { destructive: true },
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 60 }} />
          <Text style={styles.headerTitle}>Manage shares</Text>
          <Pressable onPress={onClose} style={{ width: 60, alignItems: 'flex-end' }}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={IOS_COLORS.systemBlue} />
          </View>
        ) : shares.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons
              name="people-outline"
              size={36}
              color={IOS_COLORS.tertiaryLabel}
            />
            <Text style={styles.emptyText}>Nobody has access yet.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {shares.map((share) => (
              <View key={share.id} style={styles.row}>
                <View style={styles.avatar}>
                  <Ionicons
                    name="person"
                    size={16}
                    color={IOS_COLORS.secondaryLabel}
                  />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {shareLabel(share)}
                  </Text>
                  <Text style={styles.meta}>
                    View-only ·{' '}
                    {share.invite_status === 'accepted' ? 'Accepted' : 'Pending'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleRevoke(share)}
                  disabled={revoke.isPending}
                  hitSlop={8}
                >
                  <Text style={styles.revokeText}>Revoke</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.systemGray4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.sm,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  list: {
    padding: IOS_SPACING.md,
    gap: IOS_SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.md,
    padding: IOS_SPACING.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: IOS_COLORS.systemGray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  meta: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  revokeText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.systemRed,
  },
});
