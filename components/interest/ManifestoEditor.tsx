/**
 * ManifestoEditor — Freeform vision/philosophy editor with AI-extracted pills.
 * Embedded in the Library screen as a collapsible top section.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { useManifestoAutoSave } from '@/hooks/useManifesto';

interface ManifestoEditorProps {
  interestId: string;
  interestName: string;
}

export function ManifestoEditor({ interestId, interestName }: ManifestoEditorProps) {
  const { manifesto, saveContent } = useManifestoAutoSave(interestId, interestName);
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);

  // Sync text from loaded manifesto
  useEffect(() => {
    if (manifesto?.content && !text) {
      setText(manifesto.content);
      // Auto-expand if content exists
      if (manifesto.content.trim()) setExpanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifesto?.content]);

  const handleTextChange = useCallback(
    (newText: string) => {
      setText(newText);
      saveContent(newText);
    },
    [saveContent],
  );

  const philosophies = manifesto?.philosophies ?? [];
  const roleModels = manifesto?.role_models ?? [];
  const cadence = manifesto?.weekly_cadence ?? {};
  const cadenceEntries = Object.entries(cadence).filter(([, v]) => v != null);
  const hasPills = philosophies.length > 0 || roleModels.length > 0 || cadenceEntries.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable style={styles.header} onPress={() => setExpanded((prev) => !prev)}>
        <Ionicons name="compass" size={18} color={IOS_COLORS.systemPurple} />
        <Text style={styles.headerTitle}>My Vision</Text>
        {manifesto?.content?.trim() && (
          <Ionicons name="checkmark-circle" size={14} color={IOS_COLORS.systemPurple} />
        )}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={IOS_COLORS.secondaryLabel}
          style={{ marginLeft: 'auto' }}
        />
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          {/* Textarea */}
          <TextInput
            style={styles.textArea}
            value={text}
            onChangeText={handleTextChange}
            placeholder={`Describe your goals, philosophy, and approach to ${interestName}.\n\nE.g., "I follow Duffy Gaver's Hero Maker approach. I want to exercise hard every day, lift 4x/week, do cardio daily, and eat clean 6 days a week..."`}
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            multiline
            textAlignVertical="top"
          />

          {/* AI-extracted pills */}
          {hasPills && (
            <View style={styles.pillsContainer}>
              {philosophies.length > 0 && (
                <View style={styles.pillSection}>
                  <Text style={styles.pillSectionLabel}>PHILOSOPHIES</Text>
                  <View style={styles.pillRow}>
                    {philosophies.map((p, i) => (
                      <View key={i} style={[styles.pill, styles.pillPhilosophy]}>
                        <Ionicons name="bulb-outline" size={12} color={IOS_COLORS.systemPurple} />
                        <Text style={styles.pillText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {roleModels.length > 0 && (
                <View style={styles.pillSection}>
                  <Text style={styles.pillSectionLabel}>ROLE MODELS</Text>
                  <View style={styles.pillRow}>
                    {roleModels.map((r, i) => (
                      <View key={i} style={[styles.pill, styles.pillRoleModel]}>
                        <Ionicons name="person-outline" size={12} color={IOS_COLORS.systemOrange} />
                        <Text style={styles.pillText}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {cadenceEntries.length > 0 && (
                <View style={styles.pillSection}>
                  <Text style={styles.pillSectionLabel}>WEEKLY CADENCE</Text>
                  <View style={styles.pillRow}>
                    {cadenceEntries.map(([key, val], i) => (
                      <View key={i} style={[styles.pill, styles.pillCadence]}>
                        <Ionicons name="calendar-outline" size={12} color={IOS_COLORS.systemGreen} />
                        <Text style={styles.pillText}>{key}: {val}x/wk</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(175,82,222,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(175,82,222,0.15)',
    marginBottom: IOS_SPACING.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.sm,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  body: {
    paddingHorizontal: IOS_SPACING.sm,
    paddingBottom: IOS_SPACING.sm,
    gap: IOS_SPACING.sm,
  },
  textArea: {
    fontSize: 14,
    color: IOS_COLORS.label,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray5,
    padding: IOS_SPACING.sm,
    minHeight: 120,
    ...Platform.select({
      web: { outlineStyle: 'none', resize: 'vertical' } as any,
    }),
  },
  pillsContainer: {
    gap: IOS_SPACING.sm,
  },
  pillSection: {
    gap: 4,
  },
  pillSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillPhilosophy: {
    backgroundColor: 'rgba(175,82,222,0.1)',
  },
  pillRoleModel: {
    backgroundColor: 'rgba(255,149,0,0.1)',
  },
  pillCadence: {
    backgroundColor: 'rgba(52,199,89,0.1)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
});
