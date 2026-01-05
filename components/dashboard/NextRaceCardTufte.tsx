/**
 * NextRaceCard (Tufte Edition)
 *
 * Redesigned following Edward Tufte's principles:
 * 1. Maximize data-ink ratio (remove decorative elements)
 * 2. High information density (show more data in same space)
 * 3. Integrate text and graphics (sparklines inline with data)
 * 4. Comparative analysis ("compared to what?")
 * 5. Precise, credible data presentation
 * 6. No chartjunk (emojis, gradients, heavy shadows)
 *
 * Now uses TufteTokens from design system for consistent styling.
 */

import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { TufteTokens, createTufteCardStyle } from '@/constants/designSystem';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CompactDataGrid } from '../viz/DataTable';

interface Regatta {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  vhf_channel?: string;
  num_races?: number;
  starting_sequence?: string;
  predicted_courses?: string[];
  sailing_venues?: {
    name: string;
    city?: string;
  };
  yacht_clubs?: {
    name: string;
  };
}

// Mock historical wind data for sparkline (would come from weather service)
const mockWindHistory = [12, 13, 14, 15, 14, 13, 15, 16, 15, 14];
const mockTideHistory = [0.5, 0.8, 1.1, 1.3, 1.4, 1.3, 1.0, 0.7, 0.3, 0.1];

export function NextRaceCardTufte() {
  const { user } = useAuth();
  const router = useRouter();

  const [nextRace, setNextRace] = useState<Regatta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeUntil, setTimeUntil] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  const loadNextRace = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: sailorProfile } = await supabase
        .from('sailor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!sailorProfile) {
        setNextRace(null);
        setIsLoading(false);
        return;
      }

      const { data: fleetMembers } = await supabase
        .from('fleet_members')
        .select('fleet_id')
        .eq('sailor_id', sailorProfile.id)
        .eq('status', 'active');

      if (!fleetMembers || fleetMembers.length === 0) {
        setNextRace(null);
        setIsLoading(false);
        return;
      }

      const fleetIds = fleetMembers.map((fm) => fm.fleet_id);

      const { data: races, error } = await supabase
        .from('regattas')
        .select(`
          *,
          sailing_venues(name, city),
          yacht_clubs(name)
        `)
        .in('class_id', fleetIds)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (races && races.length > 0) {
        setNextRace(races[0]);
        calculateTimeUntil(races[0].start_date);
      } else {
        setNextRace(null);
      }
    } catch (error) {
      console.error('Error loading next race:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTimeUntil = (dateString: string) => {
    const raceDate = new Date(dateString);
    const now = new Date();
    const diffMs = raceDate.getTime() - now.getTime();

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    setTimeUntil({ days, hours, minutes });
  };

  useEffect(() => {
    loadNextRace();
    const interval = setInterval(() => {
      if (nextRace) calculateTimeUntil(nextRace.start_date);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user, nextRace]);

  if (isLoading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#0284C7" />
      </View>
    );
  }

  if (!nextRace) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>No upcoming races</Text>
        <Text style={styles.emptySubtext}>Join fleets to see scheduled races</Text>
      </View>
    );
  }

  const formatPreciseDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPreciseTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  // Prepare data grid items (Tufte-style compact presentation)
  const gridItems = [
    { label: 'Wind', value: '14.2', unit: 'kts NE', trend: 'up' as const, sparkline: mockWindHistory },
    { label: 'Tide', value: '+0.8', unit: 'm rising', sparkline: mockTideHistory },
    { label: 'Starts', value: nextRace.num_races || '-', unit: 'races' },
    { label: 'VHF', value: nextRace.vhf_channel || '-', unit: 'ch' },
    { label: 'Sequence', value: nextRace.starting_sequence || '-', unit: 'min' },
    { label: 'Course', value: nextRace.predicted_courses?.[0] || 'TBD', unit: '' },
  ];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/regatta/${nextRace.id}`)}
      activeOpacity={0.8}
    >
      {/* Minimal header - just data */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{nextRace.name}</Text>
          <Text style={styles.venue}>
            {nextRace.sailing_venues?.name}
            {nextRace.sailing_venues?.city && `, ${nextRace.sailing_venues.city}`}
            {nextRace.yacht_clubs && ` • ${nextRace.yacht_clubs.name}`}
          </Text>
        </View>

        {/* Precise countdown - no decoration */}
        {timeUntil && (
          <View style={styles.countdown}>
            <Text style={styles.countdownValue}>
              {timeUntil.days > 0 && `${timeUntil.days}d `}
              {timeUntil.hours}h {timeUntil.minutes}m
            </Text>
            <Text style={styles.countdownLabel}>until start</Text>
          </View>
        )}
      </View>

      {/* Precise timing - Tufte prefers precision over approximation */}
      <View style={styles.timingRow}>
        <View style={styles.timingItem}>
          <Text style={styles.timingLabel}>Date</Text>
          <Text style={styles.timingValue}>{formatPreciseDate(nextRace.start_date)}</Text>
        </View>
        <View style={styles.timingItem}>
          <Text style={styles.timingLabel}>First Warning</Text>
          <Text style={styles.timingValue}>{formatPreciseTime(nextRace.start_date)}</Text>
        </View>
        <View style={styles.timingItem}>
          <Text style={styles.timingLabel}>Updated</Text>
          <Text style={styles.timingValue}>2m ago</Text>
        </View>
      </View>

      {/* High-density data grid (Tufte-style: maximize information per square inch) */}
      <CompactDataGrid items={gridItems} columns={3} showTrends={true} />

      {/* Comparative context - "compared to what?" */}
      <View style={styles.contextRow}>
        <Text style={styles.contextText}>
          Wind: +2.3 kts vs. historical avg • Tide: favorable window 13:00-15:30
        </Text>
      </View>

      {/* Minimal action hint */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap for detailed race analysis →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Using TufteTokens for consistent Tufte styling
  card: {
    ...createTufteCardStyle('medium'),
    marginHorizontal: 16,
    marginVertical: 8,
    // Override with web-specific shadow
    ...Platform.select({
      web: TufteTokens.shadows.subtleWeb,
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: TufteTokens.spacing.standard,
    paddingBottom: TufteTokens.spacing.standard,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.color,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...TufteTokens.typography.primary,
    fontSize: 18, // Slightly larger for card title
    marginBottom: TufteTokens.spacing.tight,
  },
  venue: {
    ...TufteTokens.typography.tertiary,
  },
  countdown: {
    alignItems: 'flex-end',
  },
  countdownValue: {
    fontSize: 20,
    fontWeight: '700',
    color: TufteTokens.typography.primary.color,
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: {
    ...TufteTokens.typography.micro,
  },
  timingRow: {
    flexDirection: 'row',
    marginBottom: TufteTokens.spacing.section,
    gap: TufteTokens.spacing.section,
  },
  timingItem: {
    flex: 1,
  },
  timingLabel: {
    ...TufteTokens.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  timingValue: {
    ...TufteTokens.typography.secondary,
    fontVariant: ['tabular-nums'],
  },
  contextRow: {
    marginTop: TufteTokens.spacing.standard,
    paddingTop: TufteTokens.spacing.standard,
    borderTopWidth: TufteTokens.borders.hairline,
    borderTopColor: TufteTokens.borders.color,
  },
  contextText: {
    ...TufteTokens.typography.tertiary,
    lineHeight: 16,
  },
  footer: {
    marginTop: TufteTokens.spacing.standard,
    paddingTop: TufteTokens.spacing.standard,
    borderTopWidth: TufteTokens.borders.hairline,
    borderTopColor: TufteTokens.borders.color,
    alignItems: 'center',
  },
  footerText: {
    ...TufteTokens.typography.secondary,
    color: '#111827', // Dark for action text
  },
  emptyText: {
    ...TufteTokens.typography.secondary,
    textAlign: 'center',
    marginBottom: TufteTokens.spacing.tight,
  },
  emptySubtext: {
    ...TufteTokens.typography.tertiary,
    textAlign: 'center',
  },
});
