/**
 * SuggestionsSection — Container for suggestion tiles below race card content
 *
 * Shows a section header "Suggestions from Crew" with count badge,
 * renders SuggestionTiles in a TileGrid, and handles the detail sheet.
 * Only renders when there are pending suggestions.
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IOS_COLORS, IOS_TYPOGRAPHY, IOS_SPACING } from '@/lib/design-tokens-ios';
import { TileGrid } from '@/components/cards/content/TileGrid';
import { SuggestionTile } from './SuggestionTile';
import { SuggestionDetailSheet } from './SuggestionDetailSheet';
import { useFollowerSuggestions } from '@/hooks/useFollowerSuggestions';
import type { FollowerSuggestion } from '@/services/FollowerSuggestionService';

interface SuggestionsSectionProps {
  raceId: string;
}

export function SuggestionsSection({ raceId }: SuggestionsSectionProps) {
  const {
    suggestions,
    count,
    isLoading,
    acceptSuggestion,
    dismissSuggestion,
    isAccepting,
    isDismissing,
  } = useFollowerSuggestions(raceId);

  const [selectedSuggestion, setSelectedSuggestion] = useState<FollowerSuggestion | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleTilePress = useCallback((suggestion: FollowerSuggestion) => {
    setSelectedSuggestion(suggestion);
    setSheetOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    setSelectedSuggestion(null);
  }, []);

  const handleAccept = useCallback(
    async (suggestionId: string) => {
      await acceptSuggestion(suggestionId);
    },
    [acceptSuggestion]
  );

  const handleDismiss = useCallback(
    async (suggestionId: string) => {
      await dismissSuggestion(suggestionId);
    },
    [dismissSuggestion]
  );

  // Don't render if no pending suggestions or still loading
  if (isLoading || count === 0) return null;

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Suggestions from Crew</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      </View>

      {/* Tile grid */}
      <TileGrid>
        {suggestions.map((suggestion) => (
          <SuggestionTile
            key={suggestion.id}
            suggestion={suggestion}
            onPress={handleTilePress}
          />
        ))}
      </TileGrid>

      {/* Detail sheet */}
      <SuggestionDetailSheet
        suggestion={selectedSuggestion}
        isOpen={sheetOpen}
        onClose={handleCloseSheet}
        onAccept={handleAccept}
        onDismiss={handleDismiss}
        isAccepting={isAccepting}
        isDismissing={isDismissing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: IOS_SPACING.lg,
    paddingHorizontal: IOS_SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: IOS_SPACING.sm,
  },
  headerText: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  countBadge: {
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SuggestionsSection;
