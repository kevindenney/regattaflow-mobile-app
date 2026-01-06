/**
 * RigSetupCard - Position 2
 *
 * Full-card display of rig tuning settings:
 * - Boat class
 * - Condition-based tuning context
 * - Rig settings grid (shrouds, rake, forestay, backstay)
 * - AI-generated indicator and confidence
 * - Tuning guide source
 *
 * This card helps sailors prepare their rig for the conditions.
 */

import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import {
  Wrench,
  Bot,
  BookOpen,
  Wind,
  ChevronRight,
  Settings,
  Gauge,
} from 'lucide-react-native';

import { CardContentProps } from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface RigSetting {
  key: string;
  label: string;
  value: string;
  reasoning?: string;
}

interface RigSetupData {
  boatClassName?: string;
  conditionSummary?: string;
  settings?: RigSetting[];
  isAIGenerated?: boolean;
  confidence?: number;
  guideName?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get a friendly label for a setting key
 */
function getSettingLabel(key: string, fallbackLabel: string): string {
  const labels: Record<string, string> = {
    upper_shrouds: 'Upper Shrouds',
    lower_shrouds: 'Lower Shrouds',
    mast_rake: 'Mast Rake',
    forestay_length: 'Forestay',
    backstay_tension: 'Backstay',
    jib_halyard: 'Jib Halyard',
    main_halyard: 'Main Halyard',
    vang: 'Vang',
    cunningham: 'Cunningham',
    outhaul: 'Outhaul',
  };
  return labels[key] || fallbackLabel;
}

/**
 * Get icon for setting type
 */
function getSettingIcon(key: string): typeof Settings {
  // For now, use Settings for all - can be expanded later
  return Settings;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RigSetupCard({
  race,
  cardType,
  isActive,
  dimensions,
}: CardContentProps) {
  // Extract rig data from race
  const rigData: RigSetupData = (race as any).rigSettings || {};
  const {
    boatClassName,
    conditionSummary,
    settings,
    isAIGenerated,
    confidence,
    guideName,
  } = rigData;

  const hasSettings = settings && settings.length > 0;

  // Priority settings to show prominently
  const priorityKeys = [
    'upper_shrouds',
    'lower_shrouds',
    'mast_rake',
    'forestay_length',
    'backstay_tension',
    'vang',
  ];
  const prioritySettings = settings?.filter((s) =>
    priorityKeys.includes(s.key)
  ) || [];
  const otherSettings = settings?.filter((s) =>
    !priorityKeys.includes(s.key)
  ) || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Wrench size={24} color="#0D9488" />
        </View>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Rig Setup</Text>
            {isAIGenerated && (
              <View style={styles.aiBadge}>
                <Bot size={14} color="#7C3AED" />
                <Text style={styles.aiText}>AI</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>
            {boatClassName || race.boatClass || 'Tuning recommendations'}
          </Text>
        </View>
      </View>

      {hasSettings ? (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Condition Context */}
          {conditionSummary && (
            <View style={styles.conditionCard}>
              <Wind size={18} color="#3B82F6" />
              <View style={styles.conditionContent}>
                <Text style={styles.conditionLabel}>Tuned for</Text>
                <Text style={styles.conditionValue}>{conditionSummary}</Text>
              </View>
            </View>
          )}

          {/* Priority Settings Grid */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Key Settings</Text>
            <View style={styles.settingsGrid}>
              {prioritySettings.map((setting) => (
                <View key={setting.key} style={styles.settingCard}>
                  <Text style={styles.settingLabel}>
                    {getSettingLabel(setting.key, setting.label)}
                  </Text>
                  <Text style={styles.settingValue}>{setting.value}</Text>
                  {setting.reasoning && (
                    <Text style={styles.settingReasoning} numberOfLines={2}>
                      {setting.reasoning}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Other Settings */}
          {otherSettings.length > 0 && (
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Additional Settings</Text>
              <View style={styles.otherSettingsList}>
                {otherSettings.map((setting) => (
                  <View key={setting.key} style={styles.otherSettingRow}>
                    <Text style={styles.otherSettingLabel}>
                      {getSettingLabel(setting.key, setting.label)}
                    </Text>
                    <Text style={styles.otherSettingValue}>{setting.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Source Info */}
          {(guideName || confidence) && (
            <View style={styles.sourceCard}>
              {isAIGenerated ? (
                <Bot size={16} color="#7C3AED" />
              ) : (
                <BookOpen size={16} color="#6B7280" />
              )}
              <View style={styles.sourceContent}>
                <Text style={styles.sourceLabel}>Source</Text>
                <Text style={styles.sourceValue}>
                  {guideName || 'AI Generated'}
                  {confidence && ` • ${Math.round(confidence * 100)}% confidence`}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Gauge size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No Rig Settings</Text>
          <Text style={styles.emptyText}>
            Add a tuning guide for {boatClassName || race.boatClass || 'your boat'} to see
            recommended settings for these conditions
          </Text>
          <View style={styles.emptyAction}>
            <BookOpen size={16} color="#3B82F6" />
            <Text style={styles.emptyActionText}>Add Tuning Guide</Text>
            <ChevronRight size={16} color="#3B82F6" />
          </View>
        </View>
      )}

      {/* Swipe indicator */}
      <View style={styles.swipeHint}>
        <View style={styles.swipeIndicator} />
      </View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },

  // Scroll
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
    gap: 16,
  },

  // Condition Card
  conditionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  conditionContent: {
    flex: 1,
  },
  conditionLabel: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  conditionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginTop: 2,
  },

  // Settings Section
  settingsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  settingCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  settingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  settingReasoning: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Other Settings
  otherSettingsList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  otherSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  otherSettingLabel: {
    fontSize: 14,
    color: '#374151',
  },
  otherSettingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  // Source Card
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  sourceContent: {
    flex: 1,
  },
  sourceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceValue: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // Swipe hint
  swipeHint: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
});

export default RigSetupCard;
