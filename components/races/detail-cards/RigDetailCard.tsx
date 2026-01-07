/**
 * Rig Detail Card - Apple Design System Redesign
 *
 * Collapsed: 2 hero metrics in pill containers + dot pagination
 * Expanded: Section-based layout with tappable settings for AI reasoning drill-down
 *
 * Design principles:
 * - Weather app inspired large numbers in pills
 * - Visual tension bars for shroud settings
 * - Tap any setting to reveal AI reasoning
 */

import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { CARD_EXPAND_DURATION, CARD_COLLAPSE_DURATION } from '@/constants/navigationAnimations';
import { IOS_COLORS } from '@/components/cards/constants';
import { TensionBar } from '@/components/ui/TensionBar';
import { colors } from '@/constants/Colors';
import type { RigIntentions, RigSettingIntention, RigIntentionStatus } from '@/types/raceIntentions';

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

interface RigDetailCardProps {
  raceId: string;
  boatClassName?: string;
  conditionSummary?: string;
  settings?: RigSetting[];
  isAIGenerated?: boolean;
  confidence?: number;
  guideName?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  onRefresh?: () => void;
  // User intentions props
  rigIntentions?: RigIntentions;
  onRigIntentionsChange?: (intentions: RigIntentions) => void;
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
  // Try to extract percentage
  const percentMatch = value.match(/(\d+)%/);
  if (percentMatch) return parseInt(percentMatch[1], 10);
  return null;
}

/** Simplify value for display - extract key measurement */
function simplifyValue(value: string): string {
  // Remove "Approximately", "Adjust to achieve", etc.
  let simplified = value
    .replace(/approximately\s*/gi, '')
    .replace(/about\s*/gi, '')
    .replace(/roughly\s*/gi, '')
    .replace(/adjust\s*to\s*achieve\s*/gi, '')
    .replace(/tighten\s*to\s*induce\s*/gi, '')
    .replace(/tension\s*to\s*achieve\s*/gi, '')
    .replace(/set\s*to\s*/gi, '');

  // Extract feet measurement (e.g., "24-25 feet" -> "24-25'")
  const feetMatch = simplified.match(/([\d.-]+(?:\s*-\s*[\d.]+)?)\s*(?:feet|ft|')/i);
  if (feetMatch) return `${feetMatch[1].replace(/\s/g, '')}'`;

  // Extract degree measurement (e.g., "5-7 degrees" -> "5-7°")
  const degreeMatch = simplified.match(/([\d.-]+(?:\s*-\s*[\d.]+)?)\s*(?:degrees?|°)/i);
  if (degreeMatch) return `${degreeMatch[1].replace(/\s/g, '')}°`;

  // Extract inch measurement (e.g., "1-2 inches" -> "1-2"")
  const inchMatch = simplified.match(/([\d.-]+(?:\s*-\s*[\d.]+)?)\s*(?:inches?|in|")/i);
  if (inchMatch) return `${inchMatch[1].replace(/\s/g, '')}"`;

  // Extract mm measurement
  const mmMatch = simplified.match(/([\d.-]+(?:\s*-\s*[\d.]+)?)\s*mm/i);
  if (mmMatch) return `${mmMatch[1]}mm`;

  // Extract percentage
  const percentMatch = simplified.match(/([\d.-]+(?:\s*-\s*[\d.]+)?)\s*%/);
  if (percentMatch) return `${percentMatch[1]}%`;

  // Extract any number range at the start
  const numberMatch = simplified.match(/^([\d.-]+(?:\s*-\s*[\d.]+)?)/);
  if (numberMatch && simplified.length > 20) return numberMatch[1];

  // Capitalize relative terms
  const lowerSimplified = simplified.toLowerCase().trim();
  if (lowerSimplified.startsWith('light')) return 'Light';
  if (lowerSimplified.startsWith('moderate')) return 'Moderate';
  if (lowerSimplified.startsWith('firm') || lowerSimplified.startsWith('high')) return 'Firm';
  if (lowerSimplified.startsWith('tight') || lowerSimplified.startsWith('max')) return 'Max';
  if (lowerSimplified.startsWith('medium') || lowerSimplified.startsWith('med')) return 'Medium';
  if (lowerSimplified.startsWith('low')) return 'Low';

  // If it's already short, return as-is (trimmed)
  simplified = simplified.trim();
  if (simplified.length <= 20) return simplified;

  // Truncate long values
  return simplified.slice(0, 18) + '...';
}

/** Get friendly label */
function getSettingLabel(key: string, fallback: string): string {
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
  return labels[key] || fallback;
}

/** Check if setting is a tension setting */
function isTensionSetting(key: string): boolean {
  return ['upper_shrouds', 'lower_shrouds', 'backstay_tension', 'backstay', 'vang'].includes(key);
}

/** Categorize settings */
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
    else primary.push(s); // Default to primary
  });

  return { primary, tension, fineTuning };
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

/** Dot pagination indicator */
function DotPagination({ total, visible }: { total: number; visible: number }) {
  return (
    <View style={styles.dotContainer}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < visible ? styles.dotFilled : styles.dotEmpty,
          ]}
        />
      ))}
    </View>
  );
}

/** Status options for rig intentions */
const INTENTION_STATUS_OPTIONS: Array<{
  value: RigIntentionStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  { value: 'default', label: 'Default', icon: 'checkmark-circle', color: colors.success.default },
  { value: 'adjusted', label: 'Adjusted', icon: 'construct', color: colors.warning.default },
  { value: 'monitoring', label: 'Watch', icon: 'eye', color: colors.primary.default },
];

/** Expandable setting card with drill-down and intention controls */
function ExpandableSetting({
  setting,
  showTensionBar,
  intention,
  onIntentionChange,
}: {
  setting: RigSetting;
  showTensionBar: boolean;
  intention?: RigSettingIntention;
  onIntentionChange?: (intention: RigSettingIntention) => void;
}) {
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const tensionValue = showTensionBar ? parseTensionValue(setting.value) : null;
  const currentStatus = intention?.status || 'default';
  const currentOption = INTENTION_STATUS_OPTIONS.find((o) => o.value === currentStatus) || INTENTION_STATUS_OPTIONS[0];

  const handlePress = useCallback(() => {
    // Always expand if we have intentions support OR reasoning
    if (setting.reasoning || onIntentionChange) {
      LayoutAnimation.configureNext({
        duration: 250,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
      setIsDetailExpanded((prev) => !prev);
    }
  }, [setting.reasoning, onIntentionChange]);

  const handleStatusChange = useCallback((status: RigIntentionStatus) => {
    if (onIntentionChange) {
      onIntentionChange({
        ...intention,
        status,
      });
    }
  }, [intention, onIntentionChange]);

  return (
    <Pressable
      style={[
        styles.settingCard,
        (setting.reasoning || onIntentionChange) && styles.settingCardTappable,
        isDetailExpanded && styles.settingCardExpanded,
      ]}
      onPress={handlePress}
      disabled={!setting.reasoning && !onIntentionChange}
    >
      <View style={styles.settingHeader}>
        <Text style={styles.settingLabel}>
          {getSettingLabel(setting.key, setting.label)}
        </Text>
        <View style={styles.settingHeaderRight}>
          {/* Intention badge when collapsed */}
          {!isDetailExpanded && onIntentionChange && currentStatus !== 'default' && (
            <View style={[styles.intentionBadge, { backgroundColor: currentOption.color + '20' }]}>
              <Ionicons name={currentOption.icon} size={10} color={currentOption.color} />
            </View>
          )}
          {(setting.reasoning || onIntentionChange) && (
            <MaterialCommunityIcons
              name={isDetailExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={IOS_COLORS.gray}
            />
          )}
        </View>
      </View>

      {tensionValue !== null ? (
        <View style={styles.tensionContainer}>
          <TensionBar value={tensionValue} size="medium" />
        </View>
      ) : (
        <Text style={styles.settingValue} numberOfLines={isDetailExpanded ? undefined : 2}>
          {simplifyValue(setting.value)}
        </Text>
      )}

      {isDetailExpanded && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={styles.reasoningContainer}
        >
          <View style={styles.reasoningDivider} />

          {/* AI Reasoning */}
          {setting.reasoning && (
            <Text style={styles.reasoningText}>{setting.reasoning}</Text>
          )}

          {/* Intention Controls */}
          {onIntentionChange && (
            <View style={styles.intentionSection}>
              <Text style={styles.intentionLabel}>Your Plan</Text>
              <View style={styles.intentionStatusSelector}>
                {INTENTION_STATUS_OPTIONS.map((option) => {
                  const isSelected = currentStatus === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.intentionStatusOption,
                        isSelected && {
                          backgroundColor: option.color + '20',
                          borderColor: option.color,
                        },
                      ]}
                      onPress={() => handleStatusChange(option.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={option.icon}
                        size={14}
                        color={isSelected ? option.color : colors.text.tertiary}
                      />
                      <Text
                        style={[
                          styles.intentionStatusText,
                          isSelected && { color: option.color, fontWeight: '600' },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RigDetailCard({
  raceId,
  boatClassName,
  conditionSummary,
  settings,
  isAIGenerated,
  confidence,
  guideName,
  isExpanded = false,
  onToggle,
  onPress,
  onRefresh,
  rigIntentions,
  onRigIntentionsChange,
}: RigDetailCardProps) {
  const hasSettings = settings && settings.length > 0;
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  // Handler for individual rig setting intention changes
  const handleSettingIntentionChange = useCallback(
    (settingKey: string, intention: RigSettingIntention) => {
      if (!onRigIntentionsChange) return;

      const newIntentions: RigIntentions = {
        ...rigIntentions,
        [settingKey]: intention,
      };
      onRigIntentionsChange(newIntentions);
    },
    [rigIntentions, onRigIntentionsChange]
  );

  // Update rotation when isExpanded changes
  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 1 : 0, {
      duration: isExpanded ? CARD_EXPAND_DURATION : CARD_COLLAPSE_DURATION,
    });
  }, [isExpanded, rotation]);

  // Animated chevron rotation (0 -> 180 for Apple style)
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
  }));

  const handlePress = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: isExpanded ? CARD_COLLAPSE_DURATION : CARD_EXPAND_DURATION,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });

    if (onToggle) {
      onToggle();
    } else if (onPress) {
      onPress();
    }
  }, [isExpanded, onToggle, onPress]);

  // Hero settings for collapsed view (first 2 priority)
  const heroSettings = settings?.filter((s) =>
    ['mast_rake', 'forestay_length', 'forestay', 'prebend', 'upper_shrouds'].includes(s.key)
  ).slice(0, 2);

  // Categorized settings for expanded view
  const categorized = settings ? categorizeSettings(settings) : { primary: [], tension: [], fineTuning: [] };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header - Tufte typography-only */}
      <View style={styles.tufteHeader}>
        <Text style={styles.tufteHeaderTitle}>
          RIG SETUP{isAIGenerated ? ' · AI' : ''}
        </Text>
        <Text style={styles.tufteHeaderSubtitle}>
          {boatClassName || 'Tuning settings'}
          {conditionSummary && ` · ${conditionSummary}`}
        </Text>
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons name="chevron-down" size={20} color={IOS_COLORS.gray} />
        </Animated.View>
      </View>

      {/* Content */}
      {hasSettings ? (
        <>
          {/* Collapsed: Tufte flat typography */}
          {!isExpanded && (
            <View style={styles.tufteCollapsedContent}>
              <Text style={styles.tufteCollapsedData}>
                {heroSettings?.map((setting) =>
                  `${getSettingLabel(setting.key, setting.label)} ${simplifyValue(setting.value)}`
                ).join(' · ')}
              </Text>
              {settings && settings.length > 2 && (
                <Text style={styles.tufteMoreSettings}>
                  +{settings.length - 2} more settings
                </Text>
              )}
            </View>
          )}

          {/* Expanded: Full sectioned content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {/* Primary Settings Section */}
              {categorized.primary.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Primary Settings</Text>
                  <View style={styles.settingsGrid}>
                    {categorized.primary.map((setting) => (
                      <ExpandableSetting
                        key={setting.key}
                        setting={setting}
                        showTensionBar={false}
                        intention={rigIntentions?.[setting.key]}
                        onIntentionChange={
                          onRigIntentionsChange
                            ? (intention) => handleSettingIntentionChange(setting.key, intention)
                            : undefined
                        }
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Tension Settings Section */}
              {categorized.tension.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tension Settings</Text>
                  <View style={styles.settingsGrid}>
                    {categorized.tension.map((setting) => (
                      <ExpandableSetting
                        key={setting.key}
                        setting={setting}
                        showTensionBar={isTensionSetting(setting.key)}
                        intention={rigIntentions?.[setting.key]}
                        onIntentionChange={
                          onRigIntentionsChange
                            ? (intention) => handleSettingIntentionChange(setting.key, intention)
                            : undefined
                        }
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Fine Tuning Section */}
              {categorized.fineTuning.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Fine Tuning</Text>
                  <View style={styles.settingsGrid}>
                    {categorized.fineTuning.map((setting) => (
                      <ExpandableSetting
                        key={setting.key}
                        setting={setting}
                        showTensionBar={isTensionSetting(setting.key)}
                        intention={rigIntentions?.[setting.key]}
                        onIntentionChange={
                          onRigIntentionsChange
                            ? (intention) => handleSettingIntentionChange(setting.key, intention)
                            : undefined
                        }
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Source Attribution */}
              {guideName && (
                <View style={styles.sourceRow}>
                  <MaterialCommunityIcons
                    name={isAIGenerated ? 'robot-outline' : 'file-document-outline'}
                    size={14}
                    color={isAIGenerated ? IOS_COLORS.purple : IOS_COLORS.secondaryLabel}
                  />
                  <Text style={styles.sourceText}>
                    {guideName}
                    {confidence && ` · ${Math.round(confidence * 100)}%`}
                  </Text>
                </View>
              )}
            </View>
          )}
        </>
      ) : (
        /* Empty state */
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name="book-cog-outline" size={32} color={IOS_COLORS.gray3} />
          <Text style={styles.emptyTitle}>No Tuning Data</Text>
          <Text style={styles.emptySubtext}>
            Add a tuning guide for {boatClassName || 'your class'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${IOS_COLORS.teal}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  conditionInline: {
    color: IOS_COLORS.blue,
    fontWeight: '500',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${IOS_COLORS.purple}15`,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  aiText: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.purple,
  },

  // Collapsed content - Hero metrics
  collapsedContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 12,
  },
  heroContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  heroPill: {
    flex: 1,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  heroValue: {
    fontSize: 24,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.5,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },

  // Dot pagination
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotFilled: {
    backgroundColor: IOS_COLORS.teal,
  },
  dotEmpty: {
    backgroundColor: IOS_COLORS.gray5,
  },

  // Expanded content
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 16,
  },

  // Condition banner
  conditionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${IOS_COLORS.blue}15`,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  conditionBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
    flex: 1,
  },

  // Sections
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // Setting cards
  settingCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  settingCardTappable: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  settingCardExpanded: {
    flexBasis: '100%',
    backgroundColor: IOS_COLORS.tertiarySystemBackground,
    borderColor: IOS_COLORS.gray5,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingValue: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  tensionContainer: {
    marginTop: 4,
  },
  intentionBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Reasoning drill-down
  reasoningContainer: {
    marginTop: 4,
  },
  reasoningDivider: {
    height: 1,
    backgroundColor: IOS_COLORS.gray5,
    marginBottom: 10,
  },
  reasoningText: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },

  // Intention section
  intentionSection: {
    marginTop: 12,
    gap: 8,
  },
  intentionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  intentionStatusSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  intentionStatusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  intentionStatusText: {
    fontSize: 11,
    color: colors.text.secondary,
  },

  // Source
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  sourceText: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },

  // Empty state
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },

  // ==========================================================================
  // TUFTE STYLES - Typography-only, flat design
  // ==========================================================================
  tufteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tufteHeaderTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tufteHeaderSubtitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  tufteCollapsedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    gap: 4,
  },
  tufteCollapsedData: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  tufteMoreSettings: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },
});
