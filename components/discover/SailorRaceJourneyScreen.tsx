/**
 * SailorRaceJourneyScreen Component
 *
 * Full-screen view of another sailor's race journey:
 * - Pre-race plan: strategy brief, checklist progress, rig/sail selections
 * - On-water: strategy notes, position tracking
 * - Post-race: results, learnings, AI coaching feedback
 *
 * Includes "Use as Template" functionality to copy setup to own races.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { usePublicSailorRaceJourney } from '@/hooks/usePublicSailorRaceJourney';
import { JourneyPhaseSelector, JourneyPhase } from './JourneyPhaseSelector';
import { ReadOnlyJourneyContent } from './ReadOnlyJourneyContent';
import { TemplateActionBar } from './TemplateActionBar';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { TUFTE_BACKGROUND } from '@/components/cards';

interface SailorRaceJourneyScreenProps {
  sailorId: string;
  raceId: string;
}

/**
 * Determine the default phase based on race date
 */
function getDefaultPhase(startDate: string | undefined): JourneyPhase {
  if (!startDate) return 'days_before';

  const raceDate = new Date(startDate);
  const now = new Date();

  // Race end estimate (4 hours after start)
  const raceEndEstimate = new Date(raceDate);
  raceEndEstimate.setHours(raceEndEstimate.getHours() + 4);

  if (raceEndEstimate < now) {
    return 'after_race';
  }

  // Race is today
  const isToday =
    raceDate.getFullYear() === now.getFullYear() &&
    raceDate.getMonth() === now.getMonth() &&
    raceDate.getDate() === now.getDate();

  if (isToday) {
    return 'on_water';
  }

  return 'days_before';
}

/**
 * Format date for display
 */
function formatRaceDate(dateString: string | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SailorRaceJourneyScreen({
  sailorId,
  raceId,
}: SailorRaceJourneyScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Fetch journey data
  const {
    sailorProfile,
    race,
    preparation,
    intentions,
    raceResults,
    checklistSummary,
    isLoading,
    error,
  } = usePublicSailorRaceJourney(sailorId, raceId);

  // Determine default phase based on race date
  const defaultPhase = useMemo(
    () => getDefaultPhase(race?.start_date),
    [race?.start_date]
  );

  const [selectedPhase, setSelectedPhase] = useState<JourneyPhase>(defaultPhase);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/races');
    }
  }, [router]);

  // Format the race date
  const formattedDate = useMemo(
    () => formatRaceDate(race?.start_date),
    [race?.start_date]
  );

  // Get avatar display
  const avatarEmoji = sailorProfile?.avatar_emoji || '⛵';
  const avatarColor = sailorProfile?.avatar_color || IOS_COLORS.systemGray4;

  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
          <Text style={styles.loadingText}>Loading race journey...</Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (error || !sailorProfile || !race) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={28} color={IOS_COLORS.systemBlue} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load</Text>
          <Text style={styles.errorText}>
            {error?.message || 'This race journey could not be loaded.'}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={handleBack}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronLeft size={28} color={IOS_COLORS.systemBlue} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {/* Sailor Avatar & Name */}
          <View style={styles.sailorInfo}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
            </View>
            <View style={styles.sailorText}>
              <Text style={styles.sailorName} numberOfLines={1}>
                {sailorProfile.full_name}
              </Text>
              <Text style={styles.raceDate}>{formattedDate}</Text>
            </View>
          </View>
        </View>

        {/* Placeholder for right side balance */}
        <View style={styles.headerRight} />
      </View>

      {/* Race Name */}
      <View style={styles.raceHeader}>
        <Text style={styles.raceName} numberOfLines={2}>
          {race.name}
        </Text>
        {race.race_series && (
          <Text style={styles.raceSeries}>{race.race_series}</Text>
        )}
      </View>

      {/* Phase Selector */}
      <JourneyPhaseSelector
        selectedPhase={selectedPhase}
        onSelectPhase={setSelectedPhase}
        raceDate={race.start_date}
      />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 80 }, // Space for action bar
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ReadOnlyJourneyContent
          phase={selectedPhase}
          race={race}
          preparation={preparation}
          intentions={intentions}
          raceResults={raceResults}
          checklistSummary={checklistSummary}
          sailorName={sailorProfile.full_name}
        />
      </ScrollView>

      {/* Template Action Bar */}
      <TemplateActionBar
        sailorId={sailorId}
        raceId={raceId}
        race={race}
        preparation={preparation}
        intentions={intentions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 44,
  },
  sailorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  sailorText: {
    alignItems: 'flex-start',
  },
  sailorName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  raceDate: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  raceHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  raceName: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.3,
  },
  raceSeries: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: 10,
  },
  errorButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SailorRaceJourneyScreen;
