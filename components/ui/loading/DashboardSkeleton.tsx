/**
 * DashboardSkeleton - Apple/Tufte-inspired loading state
 *
 * Design principles:
 * - No spinner, no "Loading..." text - shapes communicate state implicitly
 * - Light, warm background matching actual races screen
 * - Skeleton previews the actual RaceCard layout
 * - Subtle shimmer animation (2-3 second cycle)
 * - Content-first: user sees what's coming, not that they're waiting
 */
import React from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { Skeleton } from '../skeleton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Match races screen layout calculations
const HEADER_HEIGHT = 100;
const TAB_BAR_HEIGHT = 80;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - TAB_BAR_HEIGHT;
const HERO_ZONE_HEIGHT = Math.floor(AVAILABLE_HEIGHT * 0.72);
const CARD_HEIGHT = HERO_ZONE_HEIGHT - 50;
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 375);

export const DashboardSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header skeleton - venue context */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Venue indicator */}
          <View style={styles.venueRow}>
            <Skeleton style={styles.venueIcon} speed={2} />
            <Skeleton style={styles.venueText} speed={2} />
          </View>
          {/* Utility icons */}
          <View style={styles.utilityRow}>
            <Skeleton style={styles.utilityIcon} speed={2} />
          </View>
        </View>
      </View>

      {/* Race count hint */}
      <View style={styles.countRow}>
        <Skeleton style={styles.countText} speed={2} />
        <Skeleton style={styles.addButton} speed={2} />
      </View>

      {/* Season header - compact */}
      <View style={styles.seasonHeader}>
        <Skeleton style={styles.seasonName} speed={2} />
        <View style={styles.seasonDot} />
        <Skeleton style={styles.seasonPosition} speed={2} />
      </View>

      {/* Hero zone - skeleton race cards */}
      <View style={styles.heroZone}>
        {/* Primary race card skeleton - centered */}
        <View style={styles.cardContainer}>
          <RaceCardSkeleton />
        </View>
      </View>

      {/* Detail zone - collapsible sections */}
      <View style={styles.detailZone}>
        <View style={styles.sectionHeader}>
          <Skeleton style={styles.sectionChevron} speed={2} />
          <Skeleton style={styles.sectionTitle} speed={2} />
        </View>
        <View style={styles.sectionHeader}>
          <Skeleton style={styles.sectionChevron} speed={2} />
          <Skeleton style={styles.sectionTitle} speed={2} />
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton that mirrors actual RaceCard structure
 */
const RaceCardSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Accent line at top */}
      <View style={styles.accentLine} />

      {/* Top badges - fleet, course, count */}
      <View style={styles.topBadges}>
        <Skeleton style={styles.badge} speed={2} />
        <Skeleton style={styles.badge} speed={2} />
      </View>

      {/* Header zone - countdown + details */}
      <View style={styles.headerZone}>
        {/* Countdown box */}
        <Skeleton style={styles.countdownBox} speed={2} />

        {/* Race details */}
        <View style={styles.headerDetails}>
          <Skeleton style={styles.raceName} speed={2} />
          <Skeleton style={styles.raceName2} speed={2} />
          <View style={styles.metaRow}>
            <Skeleton style={styles.metaIcon} speed={2} />
            <Skeleton style={styles.metaText} speed={2} />
          </View>
          <View style={styles.startTimeRow}>
            <Skeleton style={styles.startLabel} speed={2} />
            <Skeleton style={styles.startValue} speed={2} />
          </View>
        </View>
      </View>

      {/* Conditions row - wind, tide, VHF chips */}
      <View style={styles.conditionsRow}>
        <Skeleton style={styles.conditionChip} speed={2} />
        <Skeleton style={styles.conditionChip} speed={2} />
        <Skeleton style={styles.conditionChipSmall} speed={2} />
      </View>

      {/* Timer section */}
      <View style={styles.timerSection}>
        <Skeleton style={styles.timerButton} speed={2} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBEBED', // Matches races screen
  },

  // Header
  header: {
    paddingTop: 56,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EBEBED',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  venueIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D1D5DB',
  },
  venueText: {
    width: 120,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  utilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  utilityIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D1D5DB',
  },

  // Race count row
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  countText: {
    width: 140,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  addButton: {
    width: 48,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },

  // Hero zone
  heroZone: {
    height: HERO_ZONE_HEIGHT - 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },

  // Card skeleton
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    paddingTop: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 6px 16px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  // Top badges
  topBadges: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    width: 52,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },

  // Header zone
  headerZone: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  countdownBox: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  headerDetails: {
    flex: 1,
    paddingRight: 60,
    gap: 6,
  },
  raceName: {
    width: '100%',
    height: 22,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  raceName2: {
    width: '70%',
    height: 22,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaIcon: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#D1D5DB',
  },
  metaText: {
    width: 140,
    height: 11,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  startTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  startLabel: {
    width: 80,
    height: 11,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  startValue: {
    width: 50,
    height: 13,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },

  // Conditions row
  conditionsRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F5F5F7', // Apple's warm gray
    borderRadius: 14,
    padding: 10,
  },
  conditionChip: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  conditionChipSmall: {
    width: 80,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },

  // Timer section
  timerSection: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timerButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },

  // Season header (compact)
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
  },
  seasonName: {
    width: 90,
    height: 13,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  seasonDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9CA3AF',
  },
  seasonPosition: {
    width: 80,
    height: 13,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },

  // Detail zone - collapsible sections
  detailZone: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  sectionChevron: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  sectionTitle: {
    width: 140,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
});
