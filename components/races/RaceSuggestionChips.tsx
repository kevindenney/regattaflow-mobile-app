/**
 * RaceSuggestionChips
 *
 * Horizontal scrolling chip strip for race suggestions.
 * Sits between the header and Race Type selector in add-tufte.tsx.
 * Tapping a chip opens a compact bottom sheet with details + "Use" / "Dismiss".
 * Hidden entirely when no suggestions exist.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  Globe,
  MapPin,
  Sailboat,
  Sparkles,
  Users,
  X,
} from 'lucide-react-native';
import type {
  CategorizedSuggestions,
  RaceSuggestion,
  RaceSuggestionType,
} from '@/services/RaceSuggestionService';
import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';

// =============================================================================
// TYPES
// =============================================================================

interface RaceSuggestionChipsProps {
  suggestions: CategorizedSuggestions | null;
  loading: boolean;
  onUseSuggestion: (suggestion: RaceSuggestion) => void;
  onDismissSuggestion: (suggestionId: string) => void;
  onSeeAll?: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_CHIPS = 8;

const CHIP_CONFIG: Record<RaceSuggestionType, { icon: any; color: string; label: string }> = {
  previous_year: { icon: Calendar, color: '#7C3AED', label: 'Last Year' },
  club_event: { icon: Sailboat, color: '#0066CC', label: 'Club' },
  community_race: { icon: Users, color: '#059669', label: 'Community' },
  catalog_match: { icon: Globe, color: '#DC2626', label: 'Catalog' },
  fleet_race: { icon: Sailboat, color: '#10B981', label: 'Fleet' },
  pattern_match: { icon: Sparkles, color: '#8B5CF6', label: 'Pattern' },
  template: { icon: Sparkles, color: '#F59E0B', label: 'Template' },
  similar_sailor: { icon: Users, color: '#64748B', label: 'Similar' },
};

// Priority order for chip display
const TYPE_PRIORITY: RaceSuggestionType[] = [
  'previous_year',
  'club_event',
  'community_race',
  'catalog_match',
  'fleet_race',
  'pattern_match',
  'template',
];

// =============================================================================
// COMPONENT
// =============================================================================

export function RaceSuggestionChips({
  suggestions,
  loading,
  onUseSuggestion,
  onDismissSuggestion,
  onSeeAll,
}: RaceSuggestionChipsProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<RaceSuggestion | null>(null);

  // Flatten and sort suggestions by type priority, then confidence
  const orderedSuggestions = useMemo(() => {
    if (!suggestions || suggestions.total === 0) return [];

    const all: RaceSuggestion[] = [
      ...suggestions.previousYearRaces,
      ...suggestions.clubRaces,
      ...suggestions.communityRaces,
      ...suggestions.catalogMatches,
      ...suggestions.fleetRaces,
      ...suggestions.patterns,
      ...suggestions.templates,
    ];

    // Sort by type priority first, then by confidence within same type
    return all.sort((a, b) => {
      const aPriority = TYPE_PRIORITY.indexOf(a.type) ?? TYPE_PRIORITY.length;
      const bPriority = TYPE_PRIORITY.indexOf(b.type) ?? TYPE_PRIORITY.length;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return b.confidenceScore - a.confidenceScore;
    });
  }, [suggestions]);

  const handleChipPress = useCallback((suggestion: RaceSuggestion) => {
    setSelectedSuggestion(suggestion);
  }, []);

  const handleUse = useCallback(() => {
    if (selectedSuggestion) {
      onUseSuggestion(selectedSuggestion);
      setSelectedSuggestion(null);
    }
  }, [selectedSuggestion, onUseSuggestion]);

  const handleDismiss = useCallback(() => {
    if (selectedSuggestion) {
      onDismissSuggestion(selectedSuggestion.id);
      setSelectedSuggestion(null);
    }
  }, [selectedSuggestion, onDismissSuggestion]);

  // Don't render anything when empty
  if (loading || orderedSuggestions.length === 0) {
    return null;
  }

  const visibleChips = orderedSuggestions.slice(0, MAX_CHIPS);
  const hasOverflow = orderedSuggestions.length > MAX_CHIPS;

  return (
    <>
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {visibleChips.map((suggestion) => {
            const config = CHIP_CONFIG[suggestion.type] || CHIP_CONFIG.template;
            const Icon = config.icon;
            return (
              <Pressable
                key={suggestion.id}
                style={[styles.chip, { borderColor: config.color + '40' }]}
                onPress={() => handleChipPress(suggestion)}
              >
                <Icon size={14} color={config.color} />
                <Text style={styles.chipText} numberOfLines={1}>
                  {suggestion.raceData.raceName}
                </Text>
              </Pressable>
            );
          })}
          {hasOverflow && onSeeAll && (
            <Pressable style={styles.seeAllChip} onPress={onSeeAll}>
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={14} color={IOS_COLORS.blue} />
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* Detail Bottom Sheet */}
      {selectedSuggestion && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedSuggestion(null)}
        >
          <Pressable
            style={styles.sheetOverlay}
            onPress={() => setSelectedSuggestion(null)}
          >
            <Pressable style={styles.sheetContent} onPress={(e) => e.stopPropagation()}>
              <SuggestionDetail
                suggestion={selectedSuggestion}
                onUse={handleUse}
                onDismiss={handleDismiss}
                onClose={() => setSelectedSuggestion(null)}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

// =============================================================================
// DETAIL SHEET
// =============================================================================

function SuggestionDetail({
  suggestion,
  onUse,
  onDismiss,
  onClose,
}: {
  suggestion: RaceSuggestion;
  onUse: () => void;
  onDismiss: () => void;
  onClose: () => void;
}) {
  const config = CHIP_CONFIG[suggestion.type] || CHIP_CONFIG.template;
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.detailContainer}>
      {/* Handle */}
      <View style={styles.sheetHandle} />

      {/* Header */}
      <View style={styles.detailHeader}>
        <View style={[styles.typeBadge, { backgroundColor: config.color + '15' }]}>
          <Text style={[styles.typeBadgeText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12}>
          <X size={20} color="#999" />
        </Pressable>
      </View>

      {/* Title */}
      <Text style={styles.detailTitle}>{suggestion.raceData.raceName}</Text>

      {/* Details */}
      <View style={styles.detailRows}>
        {suggestion.raceData.startDate && (
          <View style={styles.detailRow}>
            <Calendar size={15} color="#666" />
            <Text style={styles.detailRowText}>
              {formatDate(suggestion.raceData.startDate)}
            </Text>
          </View>
        )}
        {(suggestion.raceData.venue || suggestion.raceData.location) && (
          <View style={styles.detailRow}>
            <MapPin size={15} color="#666" />
            <Text style={styles.detailRowText}>
              {suggestion.raceData.venue || suggestion.raceData.location}
            </Text>
          </View>
        )}
        {suggestion.raceData.boatClass && (
          <View style={styles.detailRow}>
            <Sailboat size={15} color="#666" />
            <Text style={styles.detailRowText}>
              {suggestion.raceData.boatClass}
            </Text>
          </View>
        )}
      </View>

      {/* Reason */}
      <View style={styles.reasonBanner}>
        <Sparkles size={14} color={IOS_COLORS.blue} />
        <Text style={styles.reasonText}>{suggestion.reason}</Text>
      </View>

      {/* Update Guidance (for previous_year type) */}
      {suggestion.updateGuidance && (
        <View style={styles.guidanceBanner}>
          <AlertTriangle size={14} color="#B8860B" />
          <View style={styles.guidanceContent}>
            <Text style={styles.guidanceMessage}>
              {suggestion.updateGuidance.message}
            </Text>
            <Text style={styles.guidanceFields}>
              Check: {suggestion.updateGuidance.fieldsToReview.join(', ')}
            </Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.detailActions}>
        <Pressable style={styles.useButton} onPress={onUse}>
          <Text style={styles.useButtonText}>Use</Text>
        </Pressable>
        <Pressable style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissButtonText}>Dismiss</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 200,
  },
  chipText: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '500',
    flexShrink: 1,
  },
  seeAllChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: IOS_COLORS.blue + '30',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },

  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheetContent: {
    backgroundColor: TUFTE_BACKGROUND,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },

  // Detail
  detailContainer: {
    padding: 20,
    paddingTop: 0,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  detailRows: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailRowText: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  reasonBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 14,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 20,
  },
  guidanceBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  guidanceContent: {
    flex: 1,
  },
  guidanceMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  guidanceFields: {
    fontSize: 13,
    color: '#B45309',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  useButton: {
    flex: 1,
    backgroundColor: IOS_COLORS.blue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  useButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
});
