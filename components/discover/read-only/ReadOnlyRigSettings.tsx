/**
 * ReadOnlyRigSettings Component
 *
 * Displays sailor's rig tuning settings and notes in read-only mode.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RigIntentions } from '@/types/raceIntentions';
import { TuningSettings } from '@/hooks/useRegattaContent';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

interface ReadOnlyRigSettingsProps {
  rigNotes?: string;
  rigPresetId?: string;
  rigIntentions?: RigIntentions;
  tuningSettings?: TuningSettings;
}

/**
 * Format setting key for display
 */
function formatSettingKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Setting row component
 */
function SettingRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string | number;
  status?: 'default' | 'adjusted' | 'monitoring';
}) {
  const statusColor = status === 'adjusted'
    ? IOS_COLORS.systemOrange
    : status === 'monitoring'
    ? IOS_COLORS.systemBlue
    : IOS_COLORS.systemGreen;

  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingValueContainer}>
        <Text style={styles.settingValue}>{String(value)}</Text>
        {status && (
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function ReadOnlyRigSettings({
  rigNotes,
  rigPresetId,
  rigIntentions,
  tuningSettings,
}: ReadOnlyRigSettingsProps) {
  // Filter and format tuning settings
  const settingsEntries = useMemo(() => {
    if (!tuningSettings) return [];

    return Object.entries(tuningSettings)
      .filter(([key, value]) => {
        // Skip empty values
        if (value === null || value === undefined) return false;
        if (typeof value === 'string' && !value.trim()) return false;
        // Skip legacy fields if newer equivalents exist
        if (key === 'shroud_tension' && (tuningSettings.upper_shroud_tension || tuningSettings.lower_shroud_tension)) {
          return false;
        }
        if (key === 'kicker' && tuningSettings.vang) {
          return false;
        }
        return true;
      })
      .map(([key, value]) => ({
        key,
        label: formatSettingKey(key),
        value: String(value),
        status: rigIntentions?.settings?.[key]?.status,
      }));
  }, [tuningSettings, rigIntentions]);

  const hasSettings = settingsEntries.length > 0;
  const hasNotes = Boolean(rigNotes?.trim());
  const hasOverallNotes = Boolean(rigIntentions?.overallNotes?.trim());

  if (!hasSettings && !hasNotes && !hasOverallNotes && !rigPresetId) {
    return (
      <Text style={styles.emptyText}>No rig settings shared</Text>
    );
  }

  return (
    <View style={styles.container}>
      {/* Preset indicator */}
      {rigPresetId && (
        <View style={styles.presetBadge}>
          <Text style={styles.presetText}>Using saved preset</Text>
        </View>
      )}

      {/* Tuning Settings Grid */}
      {hasSettings && (
        <View style={styles.settingsGrid}>
          {settingsEntries.map((entry) => (
            <SettingRow
              key={entry.key}
              label={entry.label}
              value={entry.value}
              status={entry.status}
            />
          ))}
        </View>
      )}

      {/* Rig Notes */}
      {(hasNotes || hasOverallNotes) && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>
            {rigIntentions?.overallNotes || rigNotes}
          </Text>
        </View>
      )}

      {/* Individual Setting Notes */}
      {rigIntentions?.settings && (
        <View style={styles.settingNotesSection}>
          {Object.entries(rigIntentions.settings)
            .filter(([, intention]) => intention.notes?.trim())
            .map(([key, intention]) => (
              <View key={key} style={styles.settingNote}>
                <Text style={styles.settingNoteLabel}>{formatSettingKey(key)}</Text>
                <Text style={styles.settingNoteText}>{intention.notes}</Text>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  presetBadge: {
    backgroundColor: IOS_COLORS.systemGray6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  settingsGrid: {
    gap: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.systemGray5,
  },
  settingLabel: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  notesSection: {
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 10,
    padding: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  settingNotesSection: {
    gap: 10,
  },
  settingNote: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: IOS_COLORS.systemGray4,
  },
  settingNoteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    marginBottom: 2,
  },
  settingNoteText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
});

export default ReadOnlyRigSettings;
