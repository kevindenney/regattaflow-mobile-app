/**
 * Next Race Card Component
 * Displays upcoming race with details, VHF, courses, and starting sequence
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { useRouter } from 'expo-router';

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

export function NextRaceCard() {
  const { user } = useAuth();
  const router = useRouter();

  const [nextRace, setNextRace] = useState<Regatta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [daysUntil, setDaysUntil] = useState<number | null>(null);

  const loadNextRace = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // First get sailor_profile id for this user
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

      // Get sailor's fleet memberships to find relevant races
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

      // Get upcoming races for these fleets
      const { data: races, error } = await supabase
        .from('regattas')
        .select(
          `
          *,
          sailing_venues(name, city),
          yacht_clubs(name)
        `
        )
        .in('class_id', fleetIds)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (races && races.length > 0) {
        const race = races[0];
        setNextRace(race);

        // Calculate days until race
        const raceDate = new Date(race.start_date);
        const today = new Date();
        const diffTime = raceDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysUntil(diffDays);
      } else {
        setNextRace(null);
      }
    } catch (error) {
      console.error('Error loading next race:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNextRace();
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#0077be" />
      </View>
    );
  }

  if (!nextRace) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyTitle}>No Upcoming Races</Text>
        <Text style={styles.emptyText}>
          Join fleets or clubs to see upcoming races
        </Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/regatta/${nextRace.id}`)}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{nextRace.name}</Text>
          {nextRace.sailing_venues && (
            <Text style={styles.venue}>
              📍 {nextRace.sailing_venues.name}
              {nextRace.sailing_venues.city && `, ${nextRace.sailing_venues.city}`}
            </Text>
          )}
          {nextRace.yacht_clubs && (
            <Text style={styles.club}>🏛️ {nextRace.yacht_clubs.name}</Text>
          )}
        </View>

        {daysUntil !== null && (
          <View style={styles.countdown}>
            <Text style={styles.countdownNumber}>{daysUntil}</Text>
            <Text style={styles.countdownLabel}>
              {daysUntil === 1 ? 'day' : 'days'}
            </Text>
          </View>
        )}
      </View>

      {/* Date & Time */}
      <View style={styles.dateSection}>
        <Text style={styles.date}>📅 {formatDate(nextRace.start_date)}</Text>
        <Text style={styles.time}>⏰ First warning: {formatTime(nextRace.start_date)}</Text>
      </View>

      {/* Race Details */}
      <View style={styles.detailsSection}>
        {nextRace.vhf_channel && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📻 VHF Channel:</Text>
            <Text style={styles.detailValue}>{nextRace.vhf_channel}</Text>
          </View>
        )}

        {nextRace.num_races && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🏁 Races Today:</Text>
            <Text style={styles.detailValue}>{nextRace.num_races}</Text>
          </View>
        )}

        {nextRace.starting_sequence && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏱️ Sequence:</Text>
            <Text style={styles.detailValue}>{nextRace.starting_sequence}</Text>
          </View>
        )}

        {nextRace.predicted_courses && nextRace.predicted_courses.length > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🗺️ Predicted Course:</Text>
            <Text style={styles.detailValue}>
              {nextRace.predicted_courses.join(', ')}
            </Text>
          </View>
        )}
      </View>

      {/* Action Hint */}
      <View style={styles.actionHint}>
        <Text style={styles.actionHintText}>Tap to view details →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  venue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  club: {
    fontSize: 14,
    color: '#666',
  },
  countdown: {
    alignItems: 'center',
    backgroundColor: '#0077be',
    borderRadius: 12,
    padding: 12,
    minWidth: 60,
  },
  countdownNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  countdownLabel: {
    fontSize: 12,
    color: '#e3f2fd',
  },
  dateSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    marginBottom: 16,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
  detailsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionHint: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionHintText: {
    fontSize: 14,
    color: '#0077be',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
