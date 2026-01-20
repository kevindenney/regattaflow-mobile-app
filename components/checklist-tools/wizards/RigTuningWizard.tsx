/**
 * RigTuningWizard
 *
 * Modern, card-based interactive rig tuning guide.
 * Matches the design language of `SailSelectionWizard`.
 *
 * Features:
 * - Card-based layout with standard iOS colors
 * - Segmented control for wind ranges (Light/Medium/Heavy)
 * - Clear "Guide" vs "Planned" comparison
 * - Interactive learning marginalia (optional)
 * - Equipment-specific notes
 */

import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Info,
  Sparkles,
  Wind,
  X
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TinySparkline } from '@/components/shared/charts';
import { getSettingLearning } from '@/data/rig-setting-learning';
import { useAllWindRangeSections } from '@/hooks/useRaceTuningRecommendation';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';
import type { RigTuningIntention } from '@/types/morningChecklist';

// iOS System Colors (Consistent with SailSelectionWizard)
const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A', // For dark text
  gray4: '#D1D5DB', // For borders
  gray5: '#F3F4F6', // For light backgrounds
  background: '#F2F2F7', // System background
  secondaryBackground: '#FFFFFF', // Card background
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

interface RigTuningWizardProps extends ChecklistToolProps {
  boatClass?: string | null;
  classId?: string | null;
  wind?: {
    direction?: string;
    speedMin?: number;
    speedMax?: number;
    average?: number;
  };
  waveHeight?: string | null;
  existingIntention?: RigTuningIntention | null;
  windForecast?: number[]; // For sparkline
}

export function RigTuningWizard({
  item,
  regattaId,
  boatId,
  onComplete,
  onCancel,
  boatClass,
  classId,
  wind,
  waveHeight,
  existingIntention,
  windForecast,
}: RigTuningWizardProps) {
  const router = useRouter();

  // Calculate average wind
  const averageWind = useMemo(() => {
    if (wind?.average) return wind.average;
    if (wind?.speedMin && wind?.speedMax) {
      return (wind.speedMin + wind.speedMax) / 2;
    }
    return wind?.speedMin || wind?.speedMax || null;
  }, [wind]);

  // Fetch all wind range sections
  const {
    data: windRanges,
    loading,
    error,
    refresh,
  } = useAllWindRangeSections({
    classId: classId || undefined,
    className: boatClass || undefined,
    boatId: boatId || undefined,
    averageWindSpeed: averageWind,
    enabled: true,
  });

  // State
  const [userNotes, setUserNotes] = useState(existingIntention?.userNotes || '');
  const [plannedSettings, setPlannedSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSetting, setExpandedSetting] = useState<string | null>(null);

  // UI State for selected wind range tab
  const [selectedRange, setSelectedRange] = useState<'light' | 'medium' | 'heavy'>('medium');

  // Initialize selected range properly when data loads
  useEffect(() => {
    if (windRanges.currentRange) {
      setSelectedRange(windRanges.currentRange);
    }
  }, [windRanges.currentRange]);

  // Get current recommendation to display based on selected tab
  const displayedRecommendation = useMemo(() => {
    return windRanges[selectedRange];
  }, [windRanges, selectedRange]);

  // Initialize planned settings
  useEffect(() => {
    if (existingIntention?.plannedSettings && Object.keys(existingIntention.plannedSettings).length > 0) {
      setPlannedSettings(existingIntention.plannedSettings);
    }
  }, [existingIntention?.plannedSettings]);

  // Format conditions summary
  const conditionsSummary = useMemo(() => {
    const parts: string[] = [];
    if (wind?.direction) parts.push(wind.direction);
    if (wind?.speedMin && wind?.speedMax) {
      parts.push(`${wind.speedMin}-${wind.speedMax} kt`);
    } else if (averageWind) {
      parts.push(`~${averageWind} kt`);
    }
    if (waveHeight) parts.push(waveHeight);
    return parts.length > 0 ? parts.join(', ') : 'Conditions not set';
  }, [wind, averageWind, waveHeight]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const intention: RigTuningIntention = {
        recommendations: displayedRecommendation?.settings || [],
        conditionsSummary,
        userNotes,
        plannedSettings,
        savedAt: new Date().toISOString(),
      };
      // TODO: Persist intention to sailor_race_preparation
      onComplete();
    } catch (error) {
      console.error('Failed to save rig tuning intention:', error);
    } finally {
      setIsSaving(false);
    }
  }, [displayedRecommendation, conditionsSummary, userNotes, plannedSettings, onComplete]);

  // Helper to render wind range tab
  const renderTab = (range: 'light' | 'medium' | 'heavy', label: string, sublabel: string) => {
    const isSelected = selectedRange === range;
    const isSuggested = windRanges.currentRange === range;

    return (
      <Pressable
        style={[
          styles.tab,
          isSelected && styles.tabSelected,
          isSuggested && !isSelected && styles.tabSuggested,
        ]}
        onPress={() => setSelectedRange(range)}
      >
        <Text style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}>
          {label}
        </Text>
        <Text style={[styles.tabSublabel, isSelected && styles.tabSublabelSelected]}>
          {sublabel}
        </Text>
        {isSuggested && (
          <View style={styles.suggestedBadge}>
            <Sparkles size={10} color={isSelected ? '#FFFFFF' : IOS_COLORS.purple} />
            <Text style={[styles.suggestedText, isSelected && { color: '#FFFFFF' }]}>
              Current
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onCancel}>
            <X size={24} color={IOS_COLORS.gray} />
          </Pressable>
          <Text style={styles.headerTitle}>Rig Tuning</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
          <Text style={styles.loadingText}>Loading tuning guide...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || (!windRanges.light && !windRanges.medium && !windRanges.heavy)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onCancel}>
            <X size={24} color={IOS_COLORS.gray} />
          </Pressable>
          <Text style={styles.headerTitle}>Rig Tuning</Text>
          <View style={styles.headerRight} />
        </View>
        <ScrollView contentContainerStyle={styles.errorScrollContent}>
          <View style={styles.errorContainer}>
            <AlertTriangle size={48} color={IOS_COLORS.orange} />
            <Text style={styles.errorTitle}>No Tuning Guide Found</Text>
            <Text style={styles.errorDescription}>
              We couldn't find a tuning guide for {boatClass || 'this boat class'}.
            </Text>
            <Pressable style={styles.retryButton} onPress={() => refresh()}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onCancel}>
            <X size={24} color={IOS_COLORS.gray} />
          </Pressable>
          <Text style={styles.headerTitle}>Rig Tuning</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentInner}
          keyboardShouldPersistTaps="handled"
        >
          {/* Conditions Summary */}
          <View style={styles.conditionsCard}>
            <View style={styles.conditionsHeader}>
              <Wind size={20} color={IOS_COLORS.blue} />
              <Text style={styles.conditionsTitle}>Conditions</Text>
            </View>
            <Text style={styles.conditionsText}>{conditionsSummary}</Text>

            {/* Sparkline for trend */}
            {windForecast && windForecast.length > 1 && (
              <View style={styles.sparklineContainer}>
                <TinySparkline
                  data={windForecast}
                  width={100}
                  height={20}
                  color={IOS_COLORS.blue}
                  nowIndex={0}
                  showNowDot
                />
                <Text style={styles.sparklineLabel}>Next 3h</Text>
              </View>
            )}
          </View>

          {/* Guide Info */}
          {displayedRecommendation && (
            <View style={styles.guideInfoContainer}>
              <Text style={styles.guideSource}>
                {displayedRecommendation.guideTitle}
              </Text>
              {windRanges.equipmentContext?.boatName && (
                <Text style={styles.equipmentContext}>
                  • {windRanges.equipmentContext.boatName}
                </Text>
              )}
            </View>
          )}

          {/* Wind Range Tabs */}
          <View style={styles.tabsContainer}>
            {renderTab('light', 'Light', '0-5kt')}
            {renderTab('medium', 'Medium', '6-16kt')}
            {renderTab('heavy', 'Heavy', '17+kt')}
          </View>

          {/* Content for Selected Range */}
          {displayedRecommendation ? (
            <View style={styles.settingsContainer}>
              {/* List Header */}
              <View style={styles.listHeader}>
                <Text style={[styles.listHeaderLabel, { flex: 2 }]}>SETTING</Text>
                <Text style={[styles.listHeaderLabel, { flex: 1.5, textAlign: 'right' }]}>GUIDE</Text>
                <Text style={[styles.listHeaderLabel, { flex: 1.2, textAlign: 'right' }]}>PLAN</Text>
              </View>

              {displayedRecommendation.settings.map((setting, index) => {
                const plannedValue = plannedSettings[setting.key] || '';
                const isExpanded = expandedSetting === setting.key;
                const learning = getSettingLearning(setting.key);

                return (
                  <View key={setting.key} style={styles.settingCard}>
                    <Pressable
                      style={styles.settingMainRow}
                      onPress={() => setExpandedSetting(isExpanded ? null : setting.key)}
                    >
                      {/* Label & Icon */}
                      <View style={styles.settingLabelContainer}>
                        <Text style={styles.settingName}>{setting.label}</Text>
                        {learning && (
                          <Info size={14} color={IOS_COLORS.blue} style={{ marginTop: 2 }} />
                        )}
                      </View>

                      {/* Guide Value */}
                      <View style={styles.guideValueContainer}>
                        <Text style={styles.guideValueText}>{setting.value}</Text>
                      </View>

                      {/* Planned Input */}
                      <TextInput
                        style={[
                          styles.plannedInput,
                          plannedValue && plannedValue !== setting.value && styles.plannedInputModified
                        ]}
                        value={plannedValue}
                        onChangeText={(text) => setPlannedSettings(prev => ({
                          ...prev,
                          [setting.key]: text
                        }))}
                        placeholder="-"
                        placeholderTextColor={IOS_COLORS.gray4}
                        textAlign="right"
                        keyboardType={setting.value.match(/^\d/) ? 'numeric' : 'default'}
                      />
                    </Pressable>

                    {/* Expanded Detail View */}
                    {isExpanded && (learning || setting.reasoning) && (
                      <View style={styles.expandedDetail}>
                        {learning && (
                          <>
                            <Text style={styles.learningEffect}>{learning.detailed?.effect || learning.brief}</Text>

                            {learning.detailed?.whenToDeviate && (
                              <View style={styles.deviateContainer}>
                                <Text style={styles.deviateTitle}>When to adjust:</Text>
                                {learning.detailed.whenToDeviate.map((tip, i) => (
                                  <Text key={i} style={styles.deviateTip}>• {tip}</Text>
                                ))}
                              </View>
                            )}
                          </>
                        )}
                        {!learning && setting.reasoning && (
                          <Text style={styles.aiReasoning}>{setting.reasoning}</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No guide data for this wind range.</Text>
            </View>
          )}

          {/* Equipment Specific Notes */}
          {displayedRecommendation?.equipmentSpecificNotes && displayedRecommendation.equipmentSpecificNotes.length > 0 && (
            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <Gauge size={16} color={IOS_COLORS.orange} />
                <Text style={styles.notesTitle}>Equipment Notes</Text>
              </View>
              {displayedRecommendation.equipmentSpecificNotes.map((note, i) => (
                <Text key={i} style={styles.noteText}>• {note}</Text>
              ))}
            </View>
          )}

          {/* User Notes */}
          <View style={styles.userNotesSection}>
            <Text style={styles.userNotesLabel}>Your Notes</Text>
            <TextInput
              style={styles.userNotesInput}
              value={userNotes}
              onChangeText={setUserNotes}
              placeholder="Add personal adjustments or observations..."
              placeholderTextColor={IOS_COLORS.gray}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomAction}>
          <Pressable
            style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle2 size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Save & Complete</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 40,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 16,
    paddingBottom: 40,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: IOS_COLORS.secondaryLabel,
  },

  // Error
  errorScrollContent: {
    flexGrow: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  errorDescription: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Conditions
  conditionsCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  conditionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  conditionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
  },
  conditionsText: {
    fontSize: 17,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  sparklineContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sparklineLabel: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },

  // Guide Info
  guideInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  guideSource: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
  },
  equipmentContext: {
    fontSize: 13,
    color: IOS_COLORS.gray,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.secondaryBackground,
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabSelected: {
    backgroundColor: IOS_COLORS.blue,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tabSuggested: {
    backgroundColor: `${IOS_COLORS.purple}15`, // Light purple bg
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  tabLabelSelected: {
    color: '#FFFFFF',
  },
  tabSublabel: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  tabSublabelSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  suggestedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: IOS_COLORS.secondaryBackground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.purple}30`,
    gap: 2,
  },
  suggestedText: {
    fontSize: 9,
    fontWeight: '600',
    color: IOS_COLORS.purple,
  },

  // Settings List
  settingsContainer: {
    gap: 8,
    marginBottom: 24,
  },
  listHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  listHeaderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
  },
  settingCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 48,
  },
  settingLabelContainer: {
    flex: 2,
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingName: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  guideValueContainer: {
    flex: 1.5,
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  guideValueText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  plannedInput: {
    flex: 1.2,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  plannedInputModified: {
    color: IOS_COLORS.blue,
    backgroundColor: `${IOS_COLORS.blue}15`,
  },

  // Expanded Detail
  expandedDetail: {
    padding: 12,
    paddingTop: 0,
    backgroundColor: IOS_COLORS.secondaryBackground,
  },
  learningEffect: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  deviateContainer: {
    marginTop: 4,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
  },
  deviateTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 4,
  },
  deviateTip: {
    fontSize: 12,
    color: IOS_COLORS.gray2,
    lineHeight: 18,
  },
  aiReasoning: {
    fontSize: 13,
    color: IOS_COLORS.purple,
    fontStyle: 'italic',
  },

  // Empty State
  emptyStateContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: IOS_COLORS.gray,
  },

  // Notes
  notesCard: {
    backgroundColor: `${IOS_COLORS.orange}10`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.orange,
  },
  noteText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 4,
    lineHeight: 18,
  },

  // User Notes
  userNotesSection: {
    marginBottom: 24,
  },
  userNotesLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 8,
    marginLeft: 4,
  },
  userNotesInput: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: IOS_COLORS.label,
    minHeight: 80,
  },

  // Bottom Action
  bottomAction: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 16,
    backgroundColor: IOS_COLORS.background,
  },
  primaryButton: {
    backgroundColor: IOS_COLORS.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: IOS_COLORS.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
