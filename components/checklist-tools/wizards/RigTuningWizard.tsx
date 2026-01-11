/**
 * RigTuningWizard - Tufte-Inspired Redesign
 *
 * Principles applied:
 * - High data-ink ratio: No decorative elements, icons, or chrome
 * - Small multiples: Side-by-side wind range comparison (Light/Medium/Heavy)
 * - Typography-only: Visual hierarchy through font weight and size
 * - All data visible: No collapse/expand, everything shown at once
 * - Marginalia: Coach feedback inline with settings
 * - Inline sparklines: Wind trend visualization in conditions row
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAllWindRangeSections, type WindRangeData } from '@/hooks/useRaceTuningRecommendation';
import { TinySparkline } from '@/components/shared/charts';
import { Marginalia } from '@/components/ui/Marginalia';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';
import type { RigTuningIntention } from '@/types/morningChecklist';
import type { RaceTuningRecommendation, RaceTuningSetting } from '@/services/RaceTuningService';
import { getSettingLearning, type SettingLearning } from '@/data/rig-setting-learning';

// Tufte Typography System
const TUFTE = {
  // Primary data values
  value: {
    fontSize: 15,
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as const,
    color: '#000000',
  },
  // Labels (setting names)
  label: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#6B7280',
  },
  // Section headers (uppercase, spaced)
  section: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: '#9CA3AF',
  },
  // Conditions text
  conditions: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#374151',
  },
  // Source attribution
  source: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#6B7280',
  },
  // Hairline separator
  hairline: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
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

/**
 * Extract a short summary value for small multiples display
 * Handles Loos gauge readings and turn adjustments properly
 */
function getSummaryValue(setting: RaceTuningSetting): string {
  const value = setting.value;
  const key = setting.key.toLowerCase();

  // Special handling for shroud tension (Loos gauge readings)
  // Pattern: "Loos PT-2M 14 (Std. Petti/BB) ... minus 1 turn"
  if (key.includes('shroud') || key.includes('upper')) {
    // Extract base Loos gauge reading (the number after "PT-xM")
    const loosMatch = value.match(/Loos\s+PT-\d+M?\s+(\d+)/i);
    const baseReading = loosMatch ? loosMatch[1] : null;

    // Extract turn adjustment
    const minusMatch = value.match(/minus\s+(\d+)/i);
    const plusMatch = value.match(/plus\s+(\d+(?:-\d+)?)/i);

    if (baseReading) {
      if (minusMatch) {
        return `${baseReading} -${minusMatch[1]}`;
      } else if (plusMatch) {
        return `${baseReading} +${plusMatch[1]}`;
      }
      return baseReading;
    }
  }

  // Lower shrouds - check for mast bend descriptions
  if (key.includes('lower')) {
    const lower = value.toLowerCase();
    if (lower.includes('leeward') || lower.includes('lee')) {
      const cmMatch = value.match(/(\d+)\s*cm/i);
      return cmMatch ? `Lee ${cmMatch[1]}cm` : 'Leeward';
    }
    if (lower.includes('straight')) return 'Straight';
    if (lower.includes('windward')) {
      const cmMatch = value.match(/(\d+(?:\.\d+)?)/);
      return cmMatch ? `Wdwd +${cmMatch[1]}` : 'Windward';
    }
  }

  // Handle mast rake measurements (e.g., "122.5-123.5 cm")
  if (key.includes('rake')) {
    const rakeMatch = value.match(/(\d+(?:\.\d+)?)\s*(?:-\s*\d+(?:\.\d+)?)?\s*cm/i);
    if (rakeMatch) {
      return `${rakeMatch[1]}cm`;
    }
  }

  // Handle mast ram position
  if (key.includes('ram')) {
    const lower = value.toLowerCase();
    if (lower.includes('neutral')) return 'Neutral';
    const ramMatch = value.match(/(\d+(?:\.\d+)?)\s*cm\s*(forward|aft|fwd)?/i);
    if (ramMatch) {
      const dir = ramMatch[2] ? (ramMatch[2].toLowerCase().startsWith('f') ? 'fwd' : 'aft') : '';
      return `${ramMatch[1]}cm${dir ? ' ' + dir : ''}`;
    }
  }

  // Handle mast position measurements
  if (key.includes('position')) {
    const posMatch = value.match(/(\d+(?:\.\d+)?)\s*cm/);
    if (posMatch) {
      return `${posMatch[1]}cm`;
    }
  }

  // Generic descriptive terms
  if (value.toLowerCase().includes('straight')) return 'Straight';
  if (value.toLowerCase().includes('neutral')) return 'Neutral';
  if (value.toLowerCase().includes('loose') || value.toLowerCase().includes('slack')) return 'Loose';
  if (value.toLowerCase().includes('tight')) return 'Tight';

  // Generic number extraction with unit (skip model numbers like PT-2M)
  const numMatch = value.match(/(?<!PT-)(\d+(?:\.\d+)?)\s*(cm|mm|°)?(?!\s*M)/);
  if (numMatch) {
    return `${numMatch[1]}${numMatch[2] || ''}`;
  }

  // Truncate if too long
  return value.length > 10 ? value.substring(0, 10) + '…' : value;
}

/**
 * Extract a key metric from setting value for comparison
 */
function getComparisonValue(rec: RaceTuningRecommendation | null, settingKey: string): string {
  if (!rec) return '—';
  const setting = rec.settings.find(s => s.key === settingKey);
  if (!setting) return '—';
  return getSummaryValue(setting);
}

export function RigTuningWizard({
  item,
  raceEventId,
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

  // State - start empty, let useEffect populate from existing intention if available
  const [userNotes, setUserNotes] = useState(existingIntention?.userNotes || '');
  const [plannedSettings, setPlannedSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSetting, setExpandedSetting] = useState<string | null>(null);

  // Get the current recommendation based on wind conditions
  const currentRecommendation = useMemo(() => {
    if (!windRanges.currentRange) return windRanges.medium;
    return windRanges[windRanges.currentRange];
  }, [windRanges]);

  // Initialize planned settings - only populate if we have existing intention data
  // Otherwise leave empty for user to fill in their planned adjustments
  useEffect(() => {
    if (existingIntention?.plannedSettings && Object.keys(existingIntention.plannedSettings).length > 0) {
      // Use existing saved settings
      setPlannedSettings(existingIntention.plannedSettings);
    }
    // Don't auto-populate from guide - let users decide what to note
  }, [existingIntention?.plannedSettings]);

  // Format conditions summary
  const conditionsSummary = useMemo(() => {
    const parts: string[] = [];
    if (wind?.direction) parts.push(wind.direction);
    if (wind?.speedMin && wind?.speedMax) {
      parts.push(`${wind.speedMin}-${wind.speedMax}kt`);
    } else if (averageWind) {
      parts.push(`~${averageWind}kt`);
    }
    return parts.length > 0 ? parts.join(' ') : 'Conditions not set';
  }, [wind, averageWind]);

  // Determine trend text from forecast
  const trendText = useMemo(() => {
    if (!windForecast || windForecast.length < 2) return null;
    const first = windForecast[0];
    const last = windForecast[windForecast.length - 1];
    if (last > first + 2) return 'building';
    if (last < first - 2) return 'easing';
    return 'steady';
  }, [windForecast]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const intention: RigTuningIntention = {
        recommendations: currentRecommendation?.settings || [],
        conditionsSummary,
        userNotes,
        plannedSettings,
        pastPerformanceNote: existingIntention?.pastPerformanceNote,
        savedAt: new Date().toISOString(),
      };
      console.log('Saving rig tuning intention:', intention);
      onComplete();
    } catch (error) {
      console.error('Failed to save rig tuning intention:', error);
    } finally {
      setIsSaving(false);
    }
  }, [currentRecommendation, conditionsSummary, userNotes, plannedSettings, existingIntention, onComplete]);

  // Handle "Learn more" navigation
  const handleLearnMore = useCallback((academyLinks: SettingLearning['academyLinks']) => {
    if (!academyLinks) return;

    // Close the modal first, then navigate after a brief delay
    onCancel();

    // If there's a video URL, open it externally
    if (academyLinks.videoUrl) {
      setTimeout(() => Linking.openURL(academyLinks.videoUrl!), 100);
      return;
    }

    // Navigate to the course page (user can find the interactive lesson from there)
    const route = academyLinks.courseId
      ? `/(tabs)/learn/${academyLinks.courseId}`
      : '/(tabs)/learn';

    // Navigate after modal closes
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  }, [router, onCancel]);

  // Key settings for small multiples display
  const keySettings = ['upper_shrouds', 'lower_shrouds', 'mast_rake', 'mast_ram'];

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rig Tuning</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#6B7280" />
          <Text style={styles.loadingText}>Loading tuning guide...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || (!windRanges.light && !windRanges.medium && !windRanges.heavy)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rig Tuning</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>No Tuning Guide</Text>
          <Text style={styles.errorText}>
            No tuning guide available for {boatClass || 'this boat class'}.
          </Text>
          <TouchableOpacity onPress={() => refresh()} style={styles.retryLink}>
            <Text style={styles.retryLinkText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rig Tuning</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={isSaving}
        >
          <Text style={[styles.doneText, isSaving && styles.doneTextDisabled]}>
            {isSaving ? 'Saving...' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Conditions Row with Sparkline */}
          <View style={styles.conditionsRow}>
            <Text style={styles.conditionsText}>{conditionsSummary}</Text>
            {windForecast && windForecast.length > 1 && (
              <>
                <TinySparkline
                  data={windForecast}
                  width={50}
                  height={14}
                  color="#6B7280"
                  nowIndex={0}
                  showNowDot
                />
                {trendText && (
                  <Text style={styles.trendText}>({trendText})</Text>
                )}
              </>
            )}
          </View>

          {/* Guide Source Attribution */}
          {currentRecommendation && (
            <Text style={styles.sourceText}>
              {currentRecommendation.guideTitle} · {currentRecommendation.sectionTitle}
              {currentRecommendation.guideSource && ` · ${currentRecommendation.guideSource}`}
            </Text>
          )}

          {/* Small Multiples - Wind Range Comparison */}
          <View style={styles.smallMultiplesSection}>
            <View style={styles.smallMultiplesHeader}>
              <View style={[styles.smallMultiplesCol, styles.labelCol]} />
              <View style={[styles.smallMultiplesCol, windRanges.currentRange === 'light' && styles.activeCol]}>
                <Text style={[styles.colHeader, windRanges.currentRange === 'light' && styles.activeHeader]}>
                  LIGHT
                </Text>
                <Text style={styles.colSubHeader}>0-5kt</Text>
              </View>
              <View style={[styles.smallMultiplesCol, windRanges.currentRange === 'medium' && styles.activeCol]}>
                <Text style={[styles.colHeader, windRanges.currentRange === 'medium' && styles.activeHeader]}>
                  MEDIUM
                </Text>
                <Text style={styles.colSubHeader}>6-16kt</Text>
              </View>
              <View style={[styles.smallMultiplesCol, windRanges.currentRange === 'heavy' && styles.activeCol]}>
                <Text style={[styles.colHeader, windRanges.currentRange === 'heavy' && styles.activeHeader]}>
                  HEAVY
                </Text>
                <Text style={styles.colSubHeader}>17+kt</Text>
              </View>
            </View>

            {keySettings.map((settingKey) => {
              const label = settingKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <View key={settingKey} style={[styles.smallMultiplesRow, TUFTE.hairline]}>
                  <View style={[styles.smallMultiplesCol, styles.labelCol]}>
                    <Text style={styles.settingLabel} numberOfLines={1}>{label}</Text>
                  </View>
                  <View style={[styles.smallMultiplesCol, windRanges.currentRange === 'light' && styles.activeCol]}>
                    <Text style={styles.comparisonValue}>
                      {getComparisonValue(windRanges.light, settingKey)}
                    </Text>
                  </View>
                  <View style={[styles.smallMultiplesCol, windRanges.currentRange === 'medium' && styles.activeCol]}>
                    <Text style={styles.comparisonValue}>
                      {getComparisonValue(windRanges.medium, settingKey)}
                    </Text>
                  </View>
                  <View style={[styles.smallMultiplesCol, windRanges.currentRange === 'heavy' && styles.activeCol]}>
                    <Text style={styles.comparisonValue}>
                      {getComparisonValue(windRanges.heavy, settingKey)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Detailed Settings Table */}
          <View style={styles.detailedSection}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.settingCol]}>SETTING</Text>
              <Text style={[styles.tableHeaderText, styles.guideCol]}>GUIDE</Text>
              <Text style={[styles.tableHeaderText, styles.plannedCol]}>PLANNED</Text>
            </View>

            {currentRecommendation?.settings.map((setting, index) => {
              const plannedValue = plannedSettings[setting.key] || '';
              const hasChanged = plannedValue && plannedValue !== setting.value;
              const learning = getSettingLearning(setting.key);
              const isExpanded = expandedSetting === setting.key;

              return (
                <View key={setting.key}>
                  <View style={[styles.settingRow, index > 0 && TUFTE.hairline]}>
                    <Text style={[styles.settingLabel, styles.settingCol]} numberOfLines={1}>
                      {setting.label}
                    </Text>
                    <Text
                      style={[styles.guideValue, styles.guideCol]}
                      numberOfLines={2}
                    >
                      {setting.value}
                    </Text>
                    <TextInput
                      style={[
                        styles.plannedInput,
                        styles.plannedCol,
                        hasChanged && styles.plannedInputModified,
                      ]}
                      value={plannedValue}
                      onChangeText={(text) => setPlannedSettings(prev => ({
                        ...prev,
                        [setting.key]: text,
                      }))}
                      placeholder="—"
                      placeholderTextColor="#D1D5DB"
                    />
                  </View>

                  {/* Learning marginalia - Level 1: Brief explanation */}
                  {learning && (
                    <TouchableOpacity
                      onPress={() => setExpandedSetting(isExpanded ? null : setting.key)}
                      style={styles.learningRow}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.learningConnector}>└─</Text>
                      <Text style={styles.learningBrief} numberOfLines={isExpanded ? undefined : 1}>
                        {learning.brief}
                      </Text>
                      {learning.detailed && (
                        <Text style={styles.learningExpand}>{isExpanded ? '▲' : '▼'}</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Level 2: Expanded deep-dive */}
                  {isExpanded && learning?.detailed && (
                    <View style={styles.learningExpanded}>
                      <Text style={styles.learningEffect}>{learning.detailed.effect}</Text>

                      <Text style={styles.learningSubhead}>When to deviate:</Text>
                      {learning.detailed.whenToDeviate.map((tip, i) => (
                        <Text key={i} style={styles.learningTip}>• {tip}</Text>
                      ))}

                      {learning.detailed.related.length > 0 && (
                        <Text style={styles.learningRelated}>
                          Related: {learning.detailed.related.join(', ')}
                        </Text>
                      )}

                      {learning.academyLinks && (
                        <TouchableOpacity
                          style={styles.learnMoreLink}
                          onPress={() => handleLearnMore(learning.academyLinks)}
                        >
                          <Text style={styles.learnMoreText}>Learn more →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Coach feedback (if any) */}
                  {setting.reasoning && !learning && (
                    <Marginalia
                      author="AI"
                      comment={setting.reasoning}
                      variant="compact"
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Equipment Note (if applicable) */}
          {windRanges.equipmentContext?.boatName && (
            <Text style={styles.equipmentNote}>
              Settings for {windRanges.equipmentContext.boatName}
              {windRanges.equipmentContext.mast?.manufacturer &&
                ` with ${windRanges.equipmentContext.mast.manufacturer} mast`}
            </Text>
          )}

          {/* Equipment-specific notes */}
          {currentRecommendation?.equipmentSpecificNotes?.map((note, i) => (
            <Text key={i} style={styles.equipmentNote}>{note}</Text>
          ))}

          {/* User Notes */}
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Your notes</Text>
            <TextInput
              style={styles.notesInput}
              value={userNotes}
              onChangeText={setUserNotes}
              placeholder="Record your planned approach..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Past performance note */}
          {existingIntention?.pastPerformanceNote && (
            <Marginalia
              author="Past race"
              comment={existingIntention.pastPerformanceNote}
              variant="default"
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  headerButton: {
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 17,
    color: '#6B7280',
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'right',
  },
  doneTextDisabled: {
    color: '#9CA3AF',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryLink: {
    marginTop: 16,
  },
  retryLinkText: {
    fontSize: 15,
    color: '#007AFF',
  },

  // Conditions Row
  conditionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  conditionsText: {
    ...TUFTE.conditions,
  },
  trendText: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Source
  sourceText: {
    ...TUFTE.source,
    marginBottom: 20,
  },

  // Small Multiples
  smallMultiplesSection: {
    marginBottom: 24,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  smallMultiplesHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  smallMultiplesRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  smallMultiplesCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  labelCol: {
    flex: 1.5,
    alignItems: 'flex-start',
  },
  activeCol: {
    backgroundColor: '#F3F4F6',
  },
  colHeader: {
    ...TUFTE.section,
    color: '#9CA3AF',
  },
  activeHeader: {
    color: '#374151',
    fontWeight: '600',
  },
  colSubHeader: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  comparisonValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },

  // Detailed Settings Table
  detailedSection: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderText: {
    ...TUFTE.section,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  settingCol: {
    flex: 1,
    paddingRight: 6,
  },
  guideCol: {
    flex: 1.6,
    paddingRight: 6,
  },
  plannedCol: {
    flex: 1.2,
  },
  settingLabel: {
    ...TUFTE.label,
  },
  guideValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 18,
  },
  plannedInput: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    fontVariant: ['tabular-nums'],
    padding: 0,
    minHeight: 24,
  },
  plannedInputModified: {
    color: '#007AFF',
  },

  // Equipment Note
  equipmentNote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#6B7280',
    marginBottom: 8,
  },

  // Notes Section
  notesSection: {
    marginTop: 16,
  },
  notesLabel: {
    ...TUFTE.label,
    marginBottom: 6,
  },
  notesInput: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    minHeight: 60,
  },

  // Learning Content (Progressive Disclosure)
  learningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 8,
    paddingRight: 8,
    paddingBottom: 8,
    gap: 4,
  },
  learningConnector: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  learningBrief: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    color: '#6B7280',
    lineHeight: 16,
  },
  learningExpand: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  learningExpanded: {
    marginLeft: 24,
    marginRight: 8,
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
  },
  learningEffect: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },
  learningSubhead: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  learningTip: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginLeft: 4,
  },
  learningRelated: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  learnMoreLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  learnMoreText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default RigTuningWizard;
