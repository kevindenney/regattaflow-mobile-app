/**
 * Self Check-In Page
 * Public page for competitors to check in via QR code
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, Stack } from 'expo-router';
import {
  Check,
  Sailboat,
  AlertTriangle,
  MapPin,
  Clock,
} from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { checkInService } from '@/services/CheckInService';
import { useAuth } from '@/providers/AuthProvider';

interface RaceInfo {
  regatta_id: string;
  race_number: number;
  regatta_name: string;
  check_in_closes_at: string | null;
  self_check_in_enabled: boolean;
}

interface EntryInfo {
  id: string;
  sail_number: string;
  boat_name?: string;
  skipper_name?: string;
  status: string;
  checked_in: boolean;
}

export default function SelfCheckIn() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user, isAuthenticated } = useAuth();

  // State
  const [race, setRace] = useState<RaceInfo | null>(null);
  const [entries, setEntries] = useState<EntryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Load race info
  useEffect(() => {
    if (token) {
      loadRaceInfo();
    }
  }, [token]);

  // Try to get location
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          // Location not available, continue without it
        }
      );
    }
  }, []);

  const loadRaceInfo = async () => {
    try {
      // Find race by token
      const { data: raceData, error: raceError } = await supabase
        .from('regatta_races')
        .select(`
          regatta_id,
          race_number,
          check_in_closes_at,
          self_check_in_enabled,
          regattas (name)
        `)
        .eq('check_in_qr_token', token)
        .single();

      if (raceError || !raceData) {
        setError('Invalid or expired check-in code');
        setLoading(false);
        return;
      }

      if (!raceData.self_check_in_enabled) {
        setError('Self check-in is not enabled for this race');
        setLoading(false);
        return;
      }

      setRace({
        regatta_id: raceData.regatta_id,
        race_number: raceData.race_number,
        regatta_name: (raceData.regattas as any)?.name || 'Regatta',
        check_in_closes_at: raceData.check_in_closes_at,
        self_check_in_enabled: raceData.self_check_in_enabled,
      });

      // If user is logged in, get their entries
      if (user) {
        const { data: entryData } = await supabase
          .from('race_entries')
          .select(`
            id,
            sail_number,
            boat_name,
            skipper_name,
            race_check_ins!inner (status)
          `)
          .eq('regatta_id', raceData.regatta_id)
          .eq('sailor_id', user.id)
          .eq('race_check_ins.race_number', raceData.race_number);

        if (entryData && entryData.length > 0) {
          setEntries(entryData.map((e: any) => ({
            id: e.id,
            sail_number: e.sail_number,
            boat_name: e.boat_name,
            skipper_name: e.skipper_name,
            status: e.race_check_ins?.[0]?.status || 'pending',
            checked_in: ['checked_in', 'late'].includes(e.race_check_ins?.[0]?.status),
          })));
        }
      }
    } catch (err) {
      console.error('Error loading race:', err);
      setError('Failed to load check-in information');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (entryId: string) => {
    setChecking(true);
    try {
      await checkInService.selfCheckIn(token!, entryId, location || undefined);
      setSuccess(true);
      
      // Update local state
      setEntries(prev => prev.map(e => 
        e.id === entryId ? { ...e, checked_in: true, status: 'checked_in' } : e
      ));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to check in');
    } finally {
      setChecking(false);
    }
  };

  // Check if deadline passed
  const deadlinePassed = race?.check_in_closes_at && 
    new Date() > new Date(race.check_in_closes_at);

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <Sailboat size={48} color="#0EA5E9" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Check-In Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <Sailboat size={48} color="#0EA5E9" />
          <Text style={styles.title}>Race Check-In</Text>
          <Text style={styles.subtitle}>{race?.regatta_name}</Text>
          <Text style={styles.raceNumber}>Race {race?.race_number}</Text>
          
          <View style={styles.loginPrompt}>
            <Text style={styles.loginText}>
              Please log in to check in for this race
            </Text>
            {/* Add login button/link here */}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Sailboat size={48} color="#0EA5E9" />
          <Text style={styles.title}>Race Check-In</Text>
          <Text style={styles.subtitle}>{race?.regatta_name}</Text>
          <Text style={styles.raceNumber}>Race {race?.race_number}</Text>
        </View>

        {/* Deadline Warning */}
        {race?.check_in_closes_at && (
          <View style={[
            styles.deadlineBox,
            deadlinePassed && styles.deadlineBoxExpired,
          ]}>
            <Clock size={18} color={deadlinePassed ? '#DC2626' : '#059669'} />
            <Text style={[
              styles.deadlineText,
              deadlinePassed && styles.deadlineTextExpired,
            ]}>
              {deadlinePassed 
                ? 'Check-in deadline has passed'
                : `Check-in closes at ${new Date(race.check_in_closes_at).toLocaleTimeString()}`}
            </Text>
          </View>
        )}

        {/* Location indicator */}
        {location && (
          <View style={styles.locationBox}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.locationText}>Location captured</Text>
          </View>
        )}

        {/* Entries */}
        {entries.length > 0 ? (
          <View style={styles.entriesSection}>
            <Text style={styles.sectionTitle}>Your Entries</Text>
            {entries.map(entry => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryInfo}>
                  <Text style={styles.sailNumber}>{entry.sail_number}</Text>
                  <Text style={styles.boatName}>
                    {entry.boat_name || entry.skipper_name || '—'}
                  </Text>
                </View>
                
                {entry.checked_in ? (
                  <View style={styles.checkedInBadge}>
                    <Check size={18} color="#FFFFFF" />
                    <Text style={styles.checkedInText}>Checked In</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.checkInButton,
                      (checking || deadlinePassed) && styles.checkInButtonDisabled,
                    ]}
                    onPress={() => handleCheckIn(entry.id)}
                    disabled={checking || deadlinePassed}
                  >
                    <Check size={18} color="#FFFFFF" />
                    <Text style={styles.checkInButtonText}>
                      {checking ? 'Checking in...' : 'Check In'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noEntries}>
            <AlertTriangle size={32} color="#F59E0B" />
            <Text style={styles.noEntriesTitle}>No Entries Found</Text>
            <Text style={styles.noEntriesText}>
              You don't have any entries registered for this regatta.
            </Text>
          </View>
        )}

        {/* Success message */}
        {success && (
          <View style={styles.successBox}>
            <Check size={24} color="#059669" />
            <Text style={styles.successText}>
              Successfully checked in! Have a great race!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  raceNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0EA5E9',
    marginTop: 4,
  },
  deadlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  deadlineBoxExpired: {
    backgroundColor: '#FEE2E2',
  },
  deadlineText: {
    fontSize: 14,
    color: '#059669',
  },
  deadlineTextExpired: {
    color: '#DC2626',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  entriesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryInfo: {},
  sailNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  boatName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  checkedInText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  checkInButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  checkInButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noEntries: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  noEntriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginTop: 12,
  },
  noEntriesText: {
    fontSize: 14,
    color: '#A16207',
    marginTop: 8,
    textAlign: 'center',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
  },
  loginPrompt: {
    marginTop: 32,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

