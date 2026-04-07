/**
 * QuickCapture — sidebar card with File / Link / Voice buttons that drop raw
 * items into `playbook_inbox_items` with `status='pending'`. The AI does NOT
 * run until the user taps "Ingest now" in RawInboxCard (Phase 7).
 *
 * A "+ New resource" shortcut links directly into the existing add-resource
 * flow for users who want to skip the inbox step entirely.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { useAddInboxItem } from '@/hooks/usePlaybook';
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import type { InboxItemKind } from '@/types/playbook';

interface QuickCaptureProps {
  playbookId: string | undefined;
}

type CaptureKind = Extract<InboxItemKind, 'file' | 'url' | 'voice'>;

type CaptureButton = {
  kind: CaptureKind;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const BUTTONS: CaptureButton[] = [
  { kind: 'file', label: 'File', icon: 'document-outline' },
  { kind: 'url', label: 'Link', icon: 'link-outline' },
  { kind: 'voice', label: 'Voice', icon: 'mic-outline' },
];

export function QuickCapture({ playbookId }: QuickCaptureProps) {
  const addInbox = useAddInboxItem();
  const [urlDraft, setUrlDraft] = useState('');
  const [urlMode, setUrlMode] = useState(false);

  const disabled = !playbookId || addInbox.isPending;

  const handlePress = (kind: CaptureKind) => {
    if (!playbookId) return;
    if (kind === 'url') {
      setUrlMode(true);
      return;
    }
    if (kind === 'file') {
      showAlert(
        'File upload',
        'File picker + storage upload ships with Phase 7 ingest pipeline.',
      );
      return;
    }
    if (kind === 'voice') {
      showAlert(
        'Voice capture',
        'Voice recording + transcription ships in Phase 7+.',
      );
      return;
    }
  };

  const handleSaveUrl = async () => {
    const trimmed = urlDraft.trim();
    if (!trimmed || !playbookId) return;
    try {
      await addInbox.mutateAsync({
        playbook_id: playbookId,
        kind: 'url',
        source_url: trimmed,
        title: trimmed,
      });
      setUrlDraft('');
      setUrlMode(false);
    } catch (err) {
      showAlert('Could not save link', (err as Error).message);
    }
  };

  const handleNewResource = () => {
    showAlert(
      'New resource',
      'Direct add-to-resources opens the Resources tab in Phase 5.',
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="add-circle-outline" size={16} color={IOS_COLORS.systemGreen} />
        <Text style={styles.title}>Quick capture</Text>
      </View>
      <Text style={styles.caption}>
        Drop anything into your Raw Inbox. Process it later.
      </Text>
      <View style={styles.row}>
        {BUTTONS.map((btn) => (
          <Pressable
            key={btn.kind}
            onPress={() => handlePress(btn.kind)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.button,
              disabled && styles.buttonDisabled,
              pressed && !disabled && styles.buttonPressed,
            ]}
          >
            <Ionicons name={btn.icon} size={18} color={IOS_COLORS.systemBlue} />
            <Text style={styles.buttonLabel}>{btn.label}</Text>
          </Pressable>
        ))}
      </View>
      {urlMode ? (
        <View style={styles.urlRow}>
          <TextInput
            value={urlDraft}
            onChangeText={setUrlDraft}
            placeholder="https://…"
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.urlInput}
          />
          <Pressable
            onPress={handleSaveUrl}
            disabled={disabled || urlDraft.trim().length === 0}
            style={({ pressed }) => [
              styles.urlSave,
              (disabled || urlDraft.trim().length === 0) && styles.urlSaveDisabled,
              pressed && styles.urlSavePressed,
            ]}
          >
            <Text style={styles.urlSaveText}>Save</Text>
          </Pressable>
        </View>
      ) : null}
      <Pressable
        onPress={handleNewResource}
        style={({ pressed }) => [
          styles.newResourceRow,
          pressed && styles.newResourcePressed,
        ]}
      >
        <Ionicons name="add" size={16} color={IOS_COLORS.systemBlue} />
        <Text style={styles.newResourceText}>New resource</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 14,
    padding: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  caption: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    gap: IOS_SPACING.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: IOS_SPACING.md,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  urlRow: {
    flexDirection: 'row',
    gap: IOS_SPACING.sm,
    alignItems: 'center',
  },
  urlInput: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderRadius: 8,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    ...Platform.select({
      web: { outlineWidth: 0 } as Record<string, unknown>,
      default: {},
    }),
  },
  urlSave: {
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.systemBlue,
  },
  urlSaveDisabled: {
    opacity: 0.4,
  },
  urlSavePressed: {
    opacity: 0.8,
  },
  urlSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  newResourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  newResourcePressed: {
    opacity: 0.6,
  },
  newResourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
});
