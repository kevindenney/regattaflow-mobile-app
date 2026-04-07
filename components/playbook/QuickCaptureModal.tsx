/**
 * QuickCaptureModal — minimal URL capture sheet triggered from the Playbook
 * toolbar's "+" button. Drops an item into `playbook_inbox_items` with
 * `status='pending'`; ingest runs from the Raw Inbox sidebar card.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { useAddInboxItem } from '@/hooks/usePlaybook';
import { showAlert } from '@/lib/utils/crossPlatformAlert';

interface QuickCaptureModalProps {
  visible: boolean;
  playbookId: string | undefined;
  onClose: () => void;
}

export function QuickCaptureModal({
  visible,
  playbookId,
  onClose,
}: QuickCaptureModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const addInbox = useAddInboxItem();

  const handleSubmit = async () => {
    const trimmedUrl = url.trim();
    if (!playbookId) return;
    if (!trimmedUrl) {
      showAlert('URL required', 'Paste a link before capturing.');
      return;
    }
    try {
      await addInbox.mutateAsync({
        playbook_id: playbookId,
        kind: 'url',
        source_url: trimmedUrl,
        title: title.trim() || trimmedUrl,
      });
      setUrl('');
      setTitle('');
      onClose();
    } catch (err) {
      showAlert(
        'Capture failed',
        err instanceof Error ? err.message : 'Could not save item',
      );
    }
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
          <Pressable onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Quick capture</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={addInbox.isPending || !url.trim()}
            style={styles.headerBtn}
          >
            {addInbox.isPending ? (
              <ActivityIndicator color={IOS_COLORS.systemBlue} />
            ) : (
              <Text
                style={[
                  styles.saveText,
                  (!url.trim() || !playbookId) && styles.saveTextDisabled,
                ]}
              >
                Save
              </Text>
            )}
          </Pressable>
        </View>
        <View style={styles.body}>
          <View style={styles.hero}>
            <Ionicons name="link" size={28} color={IOS_COLORS.systemBlue} />
            <Text style={styles.heroTitle}>Drop a link into your inbox</Text>
            <Text style={styles.heroSubtitle}>
              Save it now, run “Ingest now” from the sidebar when you're ready
              to let the AI read it.
            </Text>
          </View>
          <Text style={styles.label}>URL</Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://…"
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            autoFocus
          />
          <Text style={styles.label}>Title (optional)</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. North Sails downwind article"
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            style={styles.input}
          />
        </View>
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
  headerBtn: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  cancelText: {
    fontSize: 17,
    color: IOS_COLORS.systemBlue,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
    textAlign: 'right',
  },
  saveTextDisabled: {
    color: IOS_COLORS.tertiaryLabel,
  },
  body: {
    padding: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
  },
  hero: {
    alignItems: 'center',
    gap: IOS_SPACING.xs,
    paddingVertical: IOS_SPACING.lg,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  heroSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: IOS_COLORS.secondaryLabel,
    maxWidth: 320,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.sm,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.md,
    fontSize: 15,
    color: IOS_COLORS.label,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.systemGray4,
  },
});
