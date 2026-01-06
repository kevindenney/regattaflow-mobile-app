/**
 * RigSetupCard - Position 2 (Full Card Version)
 *
 * Apple Human Interface Guidelines (HIG) compliant design:
 * - iOS system colors
 * - SF Pro typography
 * - Section-based layout (Primary, Tension, Fine Tuning)
 * - Visual tension bars for shroud settings
 * - Tappable settings with AI reasoning drill-down
 * - Clean visual hierarchy without header icons
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  Wrench,
  Bot,
  BookOpen,
  Wind,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Gauge,
  Sailboat,
  Target,
  Check,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { CardContentProps } from '../types';
import { TensionBar } from '@/components/ui/TensionBar';
import { useRacePreparation } from '@/hooks/useRacePreparation';
import { RigIntentionItem } from '@/components/races/intentions/RigIntentionItem';
import type { RigSettingIntention, RigIntentions } from '@/types/raceIntentions';

// =============================================================================
// iOS SYSTEM COLORS (Apple HIG)
// =============================================================================

const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  teal: '#5AC8FA',
  cyan: '#32ADE6',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

/** Parse tension value from text to percentage */
function parseTensionValue(value: string): number | null {
  const lowerValue = value.toLowerCase();
  if (lowerValue.includes('light') || lowerValue.includes('low')) return 25;
  if (lowerValue.includes('moderate') || lowerValue.includes('medium')) return 50;
  if (lowerValue.includes('firm') || lowerValue.includes('high')) return 75;
  if (lowerValue.includes('tight') || lowerValue.includes('max')) return 90;
  const percentMatch = value.match(/(\d+)%/);
  if (percentMatch) return parseInt(percentMatch[1], 10);
  return null;
}

/** Simplify value for display - extract key measurement */
function simplifyValue(value: string): string {
  // Remove verbose phrases
  let simplified = value
    .replace(/approximately\s*/gi, '')
    .replace(/about\s*/gi, '')
    .replace(/roughly\s*/gi, '')
    .replace(/adjust\s*to\s*achieve\s*/gi, '')
    .replace(/tighten\s*to\s*induce\s*/gi, '')
    .replace(/tension\s*to\s*achieve\s*/gi, '')
    .replace(/set\s*to\s*/gi, '');

  // Extract feet measurement
  const feetMatch = simplified.match(/([\d.-]+(?:\s*-\s*[\d.]+)?)\s*(?:feet|ft|')/i);
  if (feetMatch) return `${feetMatch[1].replace(/\s/g, '')}'`;

  // Extract degree measurement
  const degreeMatch = simplified.match(/([\d.-]+(?:\s*-\s*[\d.]+)?)\s*(?:degrees?|°)/i);
  if (degreeMatch) return `${degreeMatch[1].replace(/\s/g, '')}°`;

  // Extract inch measurement
  const inchMatch = simplified.match(/([\d.-]+(?:\s*-\s*[\d.]+)?)\s*(?:inches?|in|")/i);
  if (inchMatch) return `${inchMatch[1].replace(/\s/g, '')}"`;

  // Extract mm measurement
  const mmMatch = simplified.match(/([\d.-]+(?:\s*-\s*[\d.]+)?)\s*mm/i);
  if (mmMatch) return `${mmMatch[1]}mm`;

  // Capitalize relative terms
  const lowerSimplified = simplified.toLowerCase().trim();
  if (lowerSimplified.startsWith('light')) return 'Light';
  if (lowerSimplified.startsWith('moderate')) return 'Moderate';
  if (lowerSimplified.startsWith('firm') || lowerSimplified.startsWith('high')) return 'Firm';
  if (lowerSimplified.startsWith('tight') || lowerSimplified.startsWith('max')) return 'Max';
  if (lowerSimplified.startsWith('medium')) return 'Medium';
  if (lowerSimplified.startsWith('low')) return 'Low';

  simplified = simplified.trim();
  if (simplified.length <= 20) return simplified;
  return simplified.slice(0, 18) + '...';
}

/** Get friendly label for a setting key */
function getSettingLabel(key: string, fallbackLabel: string): string {
  const labels: Record<string, string> = {
    upper_shrouds: 'Uppers',
    lower_shrouds: 'Lowers',
    mast_rake: 'Mast Rake',
    forestay_length: 'Forestay',
    forestay: 'Forestay',
    forestay_tension: 'Forestay',
    backstay_tension: 'Backstay',
    backstay: 'Backstay',
    jib_halyard: 'Jib Halyard',
    main_halyard: 'Main Halyard',
    vang: 'Vang',
    cunningham: 'Cunningham',
    outhaul: 'Outhaul',
    prebend: 'Prebend',
    shrouds: 'Shrouds',
  };
  return labels[key] || fallbackLabel;
}

/** Check if setting is a tension setting */
function isTensionSetting(key: string): boolean {
  return ['upper_shrouds', 'lower_shrouds', 'backstay_tension', 'backstay', 'vang'].includes(key);
}

/** Categorize settings into sections */
function categorizeSettings(settings: RigSetting[]) {
  const primary: RigSetting[] = [];
  const tension: RigSetting[] = [];
  const fineTuning: RigSetting[] = [];

  const primaryKeys = ['mast_rake', 'forestay_length', 'forestay', 'forestay_tension', 'prebend'];
  const tensionKeys = ['upper_shrouds', 'lower_shrouds', 'backstay_tension', 'backstay', 'shrouds'];
  const fineTuningKeys = ['vang', 'cunningham', 'outhaul', 'jib_halyard', 'main_halyard'];

  settings.forEach((s) => {
    if (primaryKeys.includes(s.key)) primary.push(s);
    else if (tensionKeys.includes(s.key)) tension.push(s);
    else if (fineTuningKeys.includes(s.key)) fineTuning.push(s);
    else primary.push(s);
  });

  return { primary, tension, fineTuning };
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

/** Expandable setting card with drill-down */
function ExpandableSetting({
  setting,
  showTensionBar,
}: {
  setting: RigSetting;
  showTensionBar: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const tensionValue = showTensionBar ? parseTensionValue(setting.value) : null;

  const handlePress = useCallback(() => {
    if (setting.reasoning) {
      LayoutAnimation.configureNext({
        duration: 250,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
      setIsExpanded((prev) => !prev);
    }
  }, [setting.reasoning]);

  return (
    <Pressable
      style={[
        styles.settingCard,
        setting.reasoning && styles.settingCardTappable,
        isExpanded && styles.settingCardExpanded,
      ]}
      onPress={handlePress}
      disabled={!setting.reasoning}
    >
      <View style={styles.settingHeader}>
        <Text style={styles.settingLabel}>
          {getSettingLabel(setting.key, setting.label)}
        </Text>
        {setting.reasoning && (
          isExpanded ? (
            <ChevronUp size={16} color="#94A3B8" />
          ) : (
            <ChevronDown size={16} color="#94A3B8" />
          )
        )}
      </View>

      {tensionValue !== null ? (
        <View style={styles.tensionContainer}>
          <TensionBar value={tensionValue} size="medium" />
        </View>
      ) : (
        <Text style={styles.settingValue} numberOfLines={isExpanded ? undefined : 2}>
          {simplifyValue(setting.value)}
        </Text>
      )}

      {isExpanded && setting.reasoning && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={styles.reasoningContainer}
        >
          <View style={styles.reasoningDivider} />
          <Text style={styles.reasoningText}>{setting.reasoning}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RigSetupCard({
  race,
  cardType,
  isActive,
  isExpanded,
  onToggleExpand,
  dimensions,
}: CardContentProps) {
  // Intentions section state
  const [intentionsExpanded, setIntentionsExpanded] = useState(false);

  // Hook for race preparation data (includes rig intentions)
  const { intentions, updateRigIntentions, isSaving } = useRacePreparation({
    raceEventId: race.id,
    autoSave: true,
    debounceMs: 1000,
  });

  // Get current rig intentions
  const rigIntentions = intentions.rigIntentions;

  // Handle updating a single setting's intention
  const handleSettingIntentionChange = useCallback(
    (settingKey: string, intention: RigSettingIntention) => {
      const updatedSettings = {
        ...(rigIntentions?.settings || {}),
        [settingKey]: intention,
      };
      updateRigIntentions({
        settings: updatedSettings,
        overallNotes: rigIntentions?.overallNotes,
      });
    },
    [rigIntentions, updateRigIntentions]
  );

  // Toggle intentions section
  const toggleIntentionsSection = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIntentionsExpanded((prev) => !prev);
  }, []);

  // Count how many settings have intentions set
  const intentionsSetCount = Object.keys(rigIntentions?.settings || {}).filter(
    (key) => rigIntentions?.settings[key]?.status && rigIntentions?.settings[key]?.status !== 'default'
  ).length;

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
  const categorized = settings ? categorizeSettings(settings) : { primary: [], tension: [], fineTuning: [] };

  // Get top 2 settings for collapsed view
  const topSettings = settings?.slice(0, 2) || [];

  // ==========================================================================
  // COLLAPSED VIEW (Apple HIG Design)
  // ==========================================================================
  if (!isExpanded) {
    return (
      <View style={styles.container}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>RIG SETUP</Text>
          {isAIGenerated && (
            <View style={styles.aiBadge}>
              <Bot size={12} color={IOS_COLORS.purple} />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          )}
        </View>

        {/* Boat Class */}
        {(boatClassName || race.boatClass) && (
          <View style={styles.boatClassRow}>
            <Sailboat size={16} color={IOS_COLORS.teal} />
            <Text style={styles.boatClassName}>
              {boatClassName || race.boatClass}
            </Text>
          </View>
        )}

        {hasSettings ? (
          <View style={styles.collapsedContent}>
            {/* Key Settings Preview */}
            <View style={styles.settingsPreviewRow}>
              {topSettings.map((setting) => (
                <View key={setting.key} style={styles.settingPreviewCard}>
                  <Text style={styles.settingPreviewLabel}>
                    {getSettingLabel(setting.key, setting.label)}
                  </Text>
                  <Text style={styles.settingPreviewValue}>
                    {simplifyValue(setting.value)}
                  </Text>
                </View>
              ))}
            </View>

            {/* More settings indicator */}
            {settings && settings.length > 2 && (
              <View style={styles.moreIndicatorRow}>
                <Text style={styles.moreIndicatorText}>
                  +{settings.length - 2} more settings
                </Text>
                <ChevronDown size={14} color={IOS_COLORS.gray} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Gauge size={36} color={IOS_COLORS.gray3} />
            <Text style={styles.emptyTitle}>No Tuning Data</Text>
            <Text style={styles.emptySubtitle}>Add a tuning guide for your boat</Text>
          </View>
        )}

        {/* Swipe indicator */}
        <View style={styles.swipeHintBottom}>
          <View style={styles.swipeIndicator} />
        </View>
      </View>
    );
  }

  // ==========================================================================
  // EXPANDED VIEW (Apple HIG Design)
  // ==========================================================================
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>RIG SETUP</Text>
        {isAIGenerated && (
          <View style={styles.aiBadge}>
            <Bot size={12} color={IOS_COLORS.purple} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        )}
      </View>

      {/* Boat Class */}
      {(boatClassName || race.boatClass) && (
        <View style={styles.boatClassRow}>
          <Sailboat size={16} color={IOS_COLORS.teal} />
          <Text style={styles.boatClassName}>
            {boatClassName || race.boatClass}
          </Text>
        </View>
      )}

      {hasSettings ? (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {/* Condition Context Banner */}
          {conditionSummary && (
            <View style={styles.conditionBanner}>
              <Wind size={18} color={IOS_COLORS.blue} />
              <View style={styles.conditionBannerContent}>
                <Text style={styles.conditionBannerLabel}>Tuned for</Text>
                <Text style={styles.conditionBannerValue}>{conditionSummary}</Text>
              </View>
            </View>
          )}

          {/* Primary Settings Section */}
          {categorized.primary.length > 0 && (
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Primary Settings</Text>
              <View style={styles.settingsGrid}>
                {categorized.primary.map((setting) => (
                  <ExpandableSetting
                    key={setting.key}
                    setting={setting}
                    showTensionBar={false}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Tension Settings Section */}
          {categorized.tension.length > 0 && (
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Tension Settings</Text>
              <View style={styles.settingsGrid}>
                {categorized.tension.map((setting) => (
                  <ExpandableSetting
                    key={setting.key}
                    setting={setting}
                    showTensionBar={isTensionSetting(setting.key)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Fine Tuning Section */}
          {categorized.fineTuning.length > 0 && (
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Fine Tuning</Text>
              <View style={styles.settingsGrid}>
                {categorized.fineTuning.map((setting) => (
                  <ExpandableSetting
                    key={setting.key}
                    setting={setting}
                    showTensionBar={isTensionSetting(setting.key)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Source Attribution */}
          {(guideName || confidence) && (
            <View style={styles.sourceCard}>
              {isAIGenerated ? (
                <Bot size={16} color={IOS_COLORS.purple} />
              ) : (
                <BookOpen size={16} color={IOS_COLORS.gray} />
              )}
              <View style={styles.sourceCardContent}>
                <Text style={styles.sourceCardLabel}>Source</Text>
                <Text style={styles.sourceCardValue}>
                  {guideName || 'AI Generated'}
                  {confidence && ` · ${Math.round(confidence * 100)}%`}
                </Text>
              </View>
            </View>
          )}

          {/* Your Intentions Section */}
          <View style={styles.intentionsSection}>
            <Pressable onPress={toggleIntentionsSection} style={styles.intentionsHeader}>
              <View style={styles.intentionsHeaderLeft}>
                <Target size={16} color={IOS_COLORS.blue} />
                <Text style={styles.intentionsHeaderText}>Your Intentions</Text>
                {intentionsSetCount > 0 && (
                  <View style={styles.intentionsSetBadge}>
                    <Check size={10} color={IOS_COLORS.green} />
                    <Text style={styles.intentionsSetBadgeText}>
                      {intentionsSetCount} adjusted
                    </Text>
                  </View>
                )}
                {intentionsSetCount === 0 && !intentionsExpanded && (
                  <View style={styles.intentionsAddBadge}>
                    <Text style={styles.intentionsAddBadgeText}>Set intentions</Text>
                  </View>
                )}
              </View>
              {intentionsExpanded ? (
                <ChevronUp size={18} color={IOS_COLORS.gray} />
              ) : (
                <ChevronDown size={18} color={IOS_COLORS.gray} />
              )}
            </Pressable>

            {intentionsExpanded && (
              <View style={styles.intentionsContent}>
                <Text style={styles.intentionsHint}>
                  Mark each setting as Default (use recommended), Adjusted (custom value), or Watch (monitor during race)
                </Text>
                <View style={styles.intentionsList}>
                  {settings?.map((setting) => (
                    <RigIntentionItem
                      key={setting.key}
                      settingKey={setting.key}
                      label={getSettingLabel(setting.key, setting.label)}
                      recommendedValue={simplifyValue(setting.value)}
                      intention={rigIntentions?.settings?.[setting.key]}
                      onChange={(intention) => handleSettingIntentionChange(setting.key, intention)}
                    />
                  ))}
                </View>
                {isSaving && (
                  <Text style={styles.savingText}>Saving...</Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Gauge size={48} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyTitle}>No Rig Settings</Text>
          <Text style={styles.emptySubtitle}>
            Add a tuning guide for {boatClassName || race.boatClass || 'your boat'} to see
            recommended settings
          </Text>
          <View style={styles.emptyAction}>
            <BookOpen size={16} color={IOS_COLORS.blue} />
            <Text style={styles.emptyActionText}>Add Tuning Guide</Text>
            <ChevronRight size={16} color={IOS_COLORS.blue} />
          </View>
        </View>
      )}

      {/* Swipe indicator */}
      <View style={styles.swipeHintBottom}>
        <View style={styles.swipeIndicator} />
      </View>
    </View>
  );
}

// =============================================================================
// STYLES (Apple HIG Compliant)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 0.8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: IOS_COLORS.purple,
  },

  // Boat Class Row
  boatClassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  boatClassName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Scroll
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
    gap: 16,
  },

  // Condition Banner
  conditionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F1FF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  conditionBannerContent: {
    flex: 1,
  },
  conditionBannerLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  conditionBannerValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    marginTop: 2,
  },

  // Settings Sections
  settingsSection: {
    gap: 10,
  },
  settingsSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // Setting cards
  settingCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  settingCardTappable: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  settingCardExpanded: {
    width: '100%',
    backgroundColor: IOS_COLORS.gray5,
    borderColor: IOS_COLORS.gray4,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  settingValue: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.5,
  },
  tensionContainer: {
    marginTop: 4,
  },

  // Reasoning drill-down
  reasoningContainer: {
    marginTop: 4,
  },
  reasoningDivider: {
    height: 1,
    backgroundColor: IOS_COLORS.gray4,
    marginBottom: 10,
  },
  reasoningText: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },

  // Source Card
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  sourceCardContent: {
    flex: 1,
  },
  sourceCardLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sourceCardValue: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },

  // Collapsed Content
  collapsedContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  settingsPreviewRow: {
    flexDirection: 'row',
    gap: 10,
  },
  settingPreviewCard: {
    flex: 1,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  settingPreviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  settingPreviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.teal,
    letterSpacing: -0.5,
  },
  moreIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  moreIndicatorText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // Intentions Section
  intentionsSection: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  intentionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  intentionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  intentionsHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  intentionsSetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8FAE9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  intentionsSetBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  intentionsAddBadge: {
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  intentionsAddBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  intentionsContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
  },
  intentionsHint: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    marginTop: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  intentionsList: {
    gap: 10,
  },
  savingText: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.gray2,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 4,
    marginBottom: 20,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },

  // Swipe indicator
  swipeHintBottom: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeIndicator: {
    width: 36,
    height: 4,
    backgroundColor: IOS_COLORS.gray4,
    borderRadius: 2,
  },
});

export default RigSetupCard;
