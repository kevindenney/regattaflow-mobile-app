/**
 * SailSelectionWizard
 *
 * Interactive sail selection wizard for morning checklist.
 * Shows AI-powered sail recommendations based on conditions,
 * allows user to select sails and add notes for the learning loop.
 */

import { NudgeList } from '@/components/checklist-tools/NudgeBanner';
import { QuickAddSailButton, QuickAddSailForm } from '@/components/checklist-tools/QuickAddSailForm';
import { usePersonalizedNudges } from '@/hooks/useAdaptiveLearning';
import { formatSailDisplayName, getSailConditionColor, useSailInventory } from '@/hooks/useSailInventory';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';
import { SAIL_HINTS, WIND_RANGES, getWindRange, sailRecommendationService } from '@/services/ai/SailRecommendationService';
import type {
  SailRecommendation,
  SailSelectionIntention,
  SailSelectionRecommendations,
} from '@/types/morningChecklist';
import type { SailInventoryItem } from '@/types/raceIntentions';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Sailboat,
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  yellow: '#FFCC00',
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#2C2C2E',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

interface SailSelectionWizardProps extends ChecklistToolProps {
  wind?: {
    direction?: string;
    speedMin?: number;
    speedMax?: number;
    average?: number;
    gusts?: number;
  };
  waveState?: string | null;
  boatClass?: string | null;
  boatClassId?: string | null;
  venueId?: string | null;
  existingIntention?: SailSelectionIntention | null;
}

type SailCategory = 'mainsail' | 'headsail' | 'downwind';

export function SailSelectionWizard({
  item,
  raceEventId,
  boatId,
  onComplete,
  onCancel,
  wind,
  waveState,
  boatClass,
  boatClassId,
  venueId,
  existingIntention,
}: SailSelectionWizardProps) {
  const router = useRouter();

  // Fetch sail inventory
  const {
    sails: sailInventory,
    allSails,
    isLoading: isLoadingSails,
    error: sailError,
    hasSails,
    refresh: refreshSails,
  } = useSailInventory({
    boatId: boatId || null,
    enabled: !!boatId,
  });

  // Fetch personalized nudges for sail selection
  const {
    conditionsInsights: sailNudges,
    checklistAdditions,
    isLoading: isLoadingNudges,
    recordDelivery,
  } = usePersonalizedNudges(raceEventId || '', {
    venueId: venueId || undefined,
    boatClassId: boatClassId || undefined,
    forecast: wind?.average ? {
      windSpeed: wind.average,
      windDirection: 0, // Direction not critical for sail selection
    } : undefined,
  });

  // Filter nudges relevant to sail selection (equipment issues, weather adaptation)
  const relevantNudges = useMemo(() => {
    const allNudges = [...(sailNudges || []), ...(checklistAdditions || [])];
    return allNudges.filter(
      (n) =>
        n.category === 'equipment_issue' ||
        n.category === 'weather_adaptation' ||
        n.category === 'successful_strategy'
    );
  }, [sailNudges, checklistAdditions]);

  // State
  const [recommendations, setRecommendations] = useState<SailSelectionRecommendations | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [selectedSails, setSelectedSails] = useState<{
    mainsailId?: string;
    headsailId?: string;
    downwindId?: string;
  }>(existingIntention?.selectedSails || {});
  const [userNotes, setUserNotes] = useState(existingIntention?.userNotes || '');
  const [expandedCategory, setExpandedCategory] = useState<SailCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showQuickAddSail, setShowQuickAddSail] = useState(false);

  // Fetch recommendations when sails are loaded
  useEffect(() => {
    if (!hasSails || isLoadingSails) return;

    const fetchRecommendations = async () => {
      setIsLoadingRecommendations(true);
      try {
        const recs = await sailRecommendationService.getRecommendations({
          sails: sailInventory,
          wind: wind || {},
          waveState: waveState || undefined,
          boatClass: boatClass || undefined,
        });
        setRecommendations(recs);

        // Pre-select recommended sails if no existing selection
        if (!existingIntention?.selectedSails) {
          setSelectedSails({
            mainsailId: recs.mainsail?.sailId,
            headsailId: recs.headsail?.sailId,
            downwindId: recs.downwind?.sailId,
          });
        }
      } catch (error) {
        console.error('Failed to get sail recommendations:', error);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [hasSails, isLoadingSails, sailInventory, wind, waveState, boatClass, existingIntention]);

  // Format conditions summary
  const conditionsSummary = useMemo(() => {
    const parts: string[] = [];
    if (wind?.direction) parts.push(wind.direction);
    if (wind?.speedMin && wind?.speedMax) {
      parts.push(`${wind.speedMin}-${wind.speedMax} kt`);
    } else if (wind?.average) {
      parts.push(`~${wind.average} kt`);
    }
    if (waveState) parts.push(waveState);
    return parts.length > 0 ? parts.join(', ') : 'Conditions not available';
  }, [wind, waveState]);

  // Get sail by ID
  const getSailById = useCallback(
    (id: string | undefined): SailInventoryItem | undefined => {
      if (!id) return undefined;
      return allSails.find((s) => s.id === id);
    },
    [allSails]
  );

  // Handle sail selection
  const handleSelectSail = useCallback((category: SailCategory, sailId: string) => {
    setSelectedSails((prev) => ({
      ...prev,
      [`${category}Id`]: sailId,
    }));
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Build intention data
      const intention: SailSelectionIntention = {
        recommendations: recommendations || {
          combinationReasoning: '',
          conditionsSummary,
          generatedAt: new Date().toISOString(),
        },
        selectedSails,
        userNotes,
        savedAt: new Date().toISOString(),
      };

      // TODO: Persist intention to sailor_race_preparation via service
      onComplete();
    } catch (error) {
      console.error('Failed to save sail selection intention:', error);
    } finally {
      setIsSaving(false);
    }
  }, [recommendations, conditionsSummary, selectedSails, userNotes, onComplete]);

  // Handle learn more - navigate to Equipment & Rigging module in Race Preparation Mastery course
  const handleLearnMore = useCallback(() => {
    onCancel(); // Close modal first
    setTimeout(() => {
      router.push({
        pathname: '/(tabs)/learn/race-preparation-mastery',
        params: {
          moduleId: 'module-13-3', // Equipment & Rigging module
        },
      });
    }, 150);
  }, [router, onCancel]);

  // Render a sail option
  const renderSailOption = (
    sail: SailInventoryItem,
    category: SailCategory,
    isRecommended: boolean
  ) => {
    const isSelected =
      selectedSails[`${category}Id` as keyof typeof selectedSails] === sail.id;
    const conditionColor = getSailConditionColor(sail.conditionRating);

    return (
      <Pressable
        key={sail.id}
        style={[styles.sailOption, isSelected && styles.sailOptionSelected]}
        onPress={() => handleSelectSail(category, sail.id)}
      >
        <View style={styles.sailOptionLeft}>
          <CircleDot
            size={20}
            color={isSelected ? IOS_COLORS.blue : IOS_COLORS.gray3}
            fill={isSelected ? IOS_COLORS.blue : 'transparent'}
          />
          <View style={styles.sailOptionInfo}>
            <Text style={[styles.sailOptionName, isSelected && styles.sailOptionNameSelected]}>
              {formatSailDisplayName(sail)}
            </Text>
            {sail.conditionRating && (
              <View style={styles.sailConditionRow}>
                <View
                  style={[styles.sailConditionDot, { backgroundColor: conditionColor }]}
                />
                <Text style={styles.sailConditionText}>
                  {sail.conditionRating}% condition
                </Text>
              </View>
            )}
          </View>
        </View>
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Sparkles size={12} color={IOS_COLORS.purple} />
            <Text style={styles.recommendedBadgeText}>Recommended</Text>
          </View>
        )}
      </Pressable>
    );
  };

  // Render a category section
  const renderCategorySection = (
    category: SailCategory,
    label: string,
    sails: SailInventoryItem[],
    recommendation?: SailRecommendation
  ) => {
    const isExpanded = expandedCategory === category;
    const selectedId = selectedSails[`${category}Id` as keyof typeof selectedSails];
    const selectedSail = getSailById(selectedId);

    if (sails.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <Pressable
          style={styles.categoryHeader}
          onPress={() => setExpandedCategory(isExpanded ? null : category)}
        >
          <View style={styles.categoryHeaderLeft}>
            <Sailboat size={18} color={IOS_COLORS.label} />
            <Text style={styles.categoryTitle}>{label}</Text>
          </View>
          <View style={styles.categoryHeaderRight}>
            {selectedSail && (
              <Text style={styles.selectedSailName}>
                {formatSailDisplayName(selectedSail)}
              </Text>
            )}
            {isExpanded ? (
              <ChevronUp size={18} color={IOS_COLORS.gray} />
            ) : (
              <ChevronDown size={18} color={IOS_COLORS.gray} />
            )}
          </View>
        </Pressable>

        {isExpanded && (
          <View style={styles.categoryContent}>
            {/* Recommendation info */}
            {recommendation && (
              <View style={styles.recommendationInfo}>
                <Sparkles size={14} color={IOS_COLORS.purple} />
                <Text style={styles.recommendationText}>
                  {recommendation.reasoning}
                </Text>
              </View>
            )}

            {/* Sail options */}
            <View style={styles.sailOptions}>
              {sails.map((sail) =>
                renderSailOption(
                  sail,
                  category,
                  sail.id === recommendation?.sailId
                )
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Handle quick-add sail success
  const handleQuickAddSuccess = useCallback(async () => {
    setShowQuickAddSail(false);
    await refreshSails();
  }, [refreshSails]);

  // Calculate wind range for generic recommendations
  const windAvg = useMemo(() => {
    if (wind?.average) return wind.average;
    if (wind?.speedMin && wind?.speedMax) return (wind.speedMin + wind.speedMax) / 2;
    return wind?.speedMin || wind?.speedMax || 10;
  }, [wind]);

  const windRange = useMemo(() => getWindRange(windAvg), [windAvg]);

  // Handle navigation to boat management
  const handleManageBoatSails = useCallback(() => {
    if (boatId) {
      router.push(`/(tabs)/boat/${boatId}?tab=sails`);
      onCancel();
    }
  }, [boatId, router, onCancel]);

  const handleSelectBoat = useCallback(() => {
    router.push('/(tabs)/boat');
    onCancel();
  }, [router, onCancel]);

  // Render loading state
  if (isLoadingSails || (isLoadingRecommendations && !recommendations)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onCancel}>
            <X size={24} color={IOS_COLORS.gray} />
          </Pressable>
          <Text style={styles.headerTitle}>Sail Selection</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
          <Text style={styles.loadingText}>Loading sails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error/no sails state
  if (sailError || !hasSails) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onCancel}>
            <X size={24} color={IOS_COLORS.gray} />
          </Pressable>
          <Text style={styles.headerTitle}>Sail Selection</Text>
          <View style={styles.headerRight} />
        </View>
        <ScrollView contentContainerStyle={styles.errorScrollContent}>
          <View style={styles.errorContainer}>
            <AlertTriangle size={48} color={IOS_COLORS.orange} />
            <Text style={styles.errorTitle}>No Sails Found</Text>
            <Text style={styles.errorDescription}>
              {sailError || 'Add sails to your boat inventory to get recommendations.'}
            </Text>

            {/* Navigation buttons */}
            {boatId ? (
              <Pressable style={styles.linkButton} onPress={handleManageBoatSails}>
                <Sailboat size={18} color="#FFFFFF" />
                <Text style={styles.linkButtonText}>Manage Boat Sails</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.linkButton} onPress={handleSelectBoat}>
                <Sailboat size={18} color="#FFFFFF" />
                <Text style={styles.linkButtonText}>Select a Boat</Text>
              </Pressable>
            )}

            {/* Show quick-add button or form (only if boat is selected) */}
            {boatId && !showQuickAddSail && (
              <View style={styles.quickAddButtonContainer}>
                <QuickAddSailButton onPress={() => setShowQuickAddSail(true)} />
              </View>
            )}

            {boatId && showQuickAddSail && (
              <QuickAddSailForm
                boatId={boatId}
                onSuccess={handleQuickAddSuccess}
                onCancel={() => setShowQuickAddSail(false)}
              />
            )}

            {/* Generic sail recommendations based on conditions */}
            {wind && (
              <View style={styles.genericRecommendationsCard}>
                <View style={styles.genericRecommendationsHeader}>
                  <Sparkles size={16} color={IOS_COLORS.purple} />
                  <Text style={styles.genericRecommendationsTitle}>
                    Suggested for {WIND_RANGES[windRange].label}
                  </Text>
                </View>

                <View style={styles.sailHint}>
                  <Text style={styles.sailHintCategory}>Mainsail</Text>
                  <Text style={styles.sailHintText}>{SAIL_HINTS.mainsail[windRange]}</Text>
                </View>

                <View style={styles.sailHint}>
                  <Text style={styles.sailHintCategory}>Headsail</Text>
                  <Text style={styles.sailHintText}>{SAIL_HINTS.jib[windRange]}</Text>
                </View>

                <View style={styles.sailHint}>
                  <Text style={styles.sailHintCategory}>Downwind</Text>
                  <Text style={styles.sailHintText}>{SAIL_HINTS.spinnaker[windRange]}</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Combine jibs and genoas for headsail section
  const headsails = [...sailInventory.jibs, ...sailInventory.genoas];
  const downwindSails = [...sailInventory.spinnakers, ...sailInventory.codeZeros];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={onCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={IOS_COLORS.gray} />
          </Pressable>
          <Text style={styles.headerTitle}>Sail Selection</Text>
          <View style={styles.headerRight}>
            <Pressable style={styles.learnIconButton} onPress={handleLearnMore}>
              <BookOpen size={20} color={IOS_COLORS.purple} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentInner}
          keyboardShouldPersistTaps="handled"
        >
          {/* Conditions */}
          <View style={styles.conditionsCard}>
            <View style={styles.conditionsHeader}>
              <Wind size={20} color={IOS_COLORS.blue} />
              <Text style={styles.conditionsTitle}>Conditions</Text>
            </View>
            <Text style={styles.conditionsText}>{conditionsSummary}</Text>
          </View>

          {/* Combination Reasoning */}
          {recommendations?.combinationReasoning && (
            <View style={styles.reasoningCard}>
              <Sparkles size={16} color={IOS_COLORS.purple} />
              <Text style={styles.reasoningText}>
                {recommendations.combinationReasoning}
              </Text>
            </View>
          )}

          {/* Personalized Nudges from Past Races */}
          {relevantNudges.length > 0 && (
            <NudgeList
              nudges={relevantNudges}
              title="From Your Past Sail Choices"
              channel="checklist"
              maxVisible={3}
              isLoading={isLoadingNudges}
              onRecordDelivery={recordDelivery}
            />
          )}

          {/* Sail Categories */}
          <View style={styles.categoriesContainer}>
            {renderCategorySection(
              'mainsail',
              'Mainsail',
              sailInventory.mainsails,
              recommendations?.mainsail
            )}
            {renderCategorySection(
              'headsail',
              'Headsail',
              headsails,
              recommendations?.headsail
            )}
            {renderCategorySection(
              'downwind',
              'Downwind',
              downwindSails,
              recommendations?.downwind
            )}
          </View>

          {/* User Notes */}
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Your Notes</Text>
            <Text style={styles.notesSubLabel}>
              Record your reasoning or planned changes
            </Text>
            <TextInput
              style={styles.notesInput}
              value={userNotes}
              onChangeText={setUserNotes}
              placeholder="e.g., Going bigger jib than suggested due to light patches expected..."
              placeholderTextColor={IOS_COLORS.tertiaryLabel}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Tip */}
          <View style={styles.tipCard}>
            <Sparkles size={16} color={IOS_COLORS.purple} />
            <Text style={styles.tipText}>
              After the race, review how your sail choices performed. Your
              feedback improves future recommendations.
            </Text>
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
    alignItems: 'flex-end',
  },
  learnIconButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 20,
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
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorScrollContent: {
    flexGrow: 1,
  },
  quickAddButtonContainer: {
    marginTop: 24,
    width: '100%',
    paddingHorizontal: 20,
  },
  // Navigation links for empty state
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.blue,
    marginTop: 16,
    gap: 8,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Generic sail recommendations for empty state
  genericRecommendationsCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    width: '100%',
  },
  genericRecommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  genericRecommendationsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  sailHint: {
    marginBottom: 10,
  },
  sailHintCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  sailHintText: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
    lineHeight: 18,
  },
  // Conditions
  conditionsCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    letterSpacing: 0.5,
  },
  conditionsText: {
    fontSize: 17,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  // Reasoning
  reasoningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: `${IOS_COLORS.purple}08`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  reasoningText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },
  // Categories
  categoriesContainer: {
    gap: 8,
    marginBottom: 20,
  },
  categorySection: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  categoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedSailName: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  categoryContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  recommendationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  sailOptions: {
    gap: 8,
  },
  sailOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.background,
  },
  sailOptionSelected: {
    backgroundColor: `${IOS_COLORS.blue}10`,
    borderWidth: 1,
    borderColor: IOS_COLORS.blue,
  },
  sailOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sailOptionInfo: {
    flex: 1,
  },
  sailOptionName: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  sailOptionNameSelected: {
    color: IOS_COLORS.blue,
    fontWeight: '600',
  },
  sailConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sailConditionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sailConditionText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: `${IOS_COLORS.purple}15`,
    borderRadius: 6,
  },
  recommendedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.purple,
  },
  // Notes
  notesSection: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  notesSubLabel: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: IOS_COLORS.label,
    minHeight: 80,
    lineHeight: 22,
  },
  // Tip
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: `${IOS_COLORS.purple}08`,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  // Bottom Action
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.green,
    gap: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: IOS_COLORS.gray,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SailSelectionWizard;
