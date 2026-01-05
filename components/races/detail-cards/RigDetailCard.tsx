/**
 * Rig Detail Card
 * Compact view of rig tuning settings for the detail zone
 */

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RigSetting {
  key: string;
  label: string;
  value: string;
  reasoning?: string;
}

interface RigDetailCardProps {
  raceId: string;
  boatClassName?: string;
  conditionSummary?: string;
  settings?: RigSetting[];
  isAIGenerated?: boolean;
  confidence?: number;
  guideName?: string;
  onPress?: () => void;
  onRefresh?: () => void;
}

export function RigDetailCard({
  raceId,
  boatClassName,
  conditionSummary,
  settings,
  isAIGenerated,
  confidence,
  guideName,
  onPress,
  onRefresh,
}: RigDetailCardProps) {
  const hasSettings = settings && settings.length > 0;

  // Show priority settings: uppers, lowers, rake
  const prioritySettings = settings?.filter((s) =>
    ['upper_shrouds', 'lower_shrouds', 'mast_rake', 'forestay_length', 'backstay_tension'].includes(s.key)
  ).slice(0, 4);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="wrench" size={18} color="#0D9488" />
        </View>
        <Text style={styles.headerTitle}>Rig Settings</Text>
        {isAIGenerated && (
          <View style={styles.aiBadge}>
            <MaterialCommunityIcons name="robot-outline" size={12} color="#7C3AED" />
          </View>
        )}
        <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
      </View>

      <View style={styles.content}>
        {hasSettings ? (
          <>
            {/* Condition Context */}
            {conditionSummary && (
              <View style={styles.conditionBadge}>
                <MaterialCommunityIcons name="weather-windy" size={12} color="#3B82F6" />
                <Text style={styles.conditionText}>{conditionSummary}</Text>
              </View>
            )}

            {/* Settings Grid */}
            <View style={styles.settingsGrid}>
              {prioritySettings?.map((setting) => (
                <View key={setting.key} style={styles.settingCell}>
                  <Text style={styles.settingLabel}>{setting.label}</Text>
                  <Text style={styles.settingValue}>{setting.value}</Text>
                </View>
              ))}
            </View>

            {/* Source Info */}
            {guideName && (
              <View style={styles.sourceRow}>
                <MaterialCommunityIcons
                  name={isAIGenerated ? 'robot-outline' : 'file-document-outline'}
                  size={12}
                  color={isAIGenerated ? '#7C3AED' : '#64748B'}
                />
                <Text style={styles.sourceText}>
                  {guideName}
                  {confidence && ` • ${Math.round(confidence * 100)}%`}
                </Text>
              </View>
            )}

            {/* More settings indicator */}
            {settings && settings.length > 4 && (
              <Text style={styles.moreText}>+{settings.length - 4} more settings</Text>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="book-cog-outline" size={24} color="#CBD5E1" />
            <Text style={styles.emptyText}>No tuning data</Text>
            <Text style={styles.emptySubtext}>
              Add a tuning guide for {boatClassName || 'your class'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  aiBadge: {
    backgroundColor: '#F3E8FF',
    padding: 4,
    borderRadius: 10,
  },
  content: {
    gap: 10,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingCell: {
    flexBasis: '47%',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  settingLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  sourceText: {
    fontSize: 11,
    color: '#64748B',
  },
  moreText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
