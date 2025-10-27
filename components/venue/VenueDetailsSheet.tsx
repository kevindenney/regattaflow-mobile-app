/**
 * VenueDetailsSheet Component
 * Apple Maps-style bottom sheet for venue information
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { useRouter } from 'expo-router';
import { useSavedVenues } from '@/hooks/useSavedVenues';
import { INFO_ICONS, VENUE_ICONS, getCountryFlag as getFlag } from '@/constants/sailing-icons';

interface Venue {
  id: string;
  name: string;
  country: string;
  region: string;
  venue_type: string;
  coordinates_lat: number;
  coordinates_lng: number;
}

interface VenueDetailsSheetProps {
  venue: Venue | null;
  onClose: () => void;
}

export function VenueDetailsSheet({ venue, onClose }: VenueDetailsSheetProps) {
  const router = useRouter();
  const { isVenueSaved, saveVenue, unsaveVenue } = useSavedVenues();
  const [slideAnim] = useState(new Animated.Value(400));
  const [stats, setStats] = useState({
    clubs: 0,
    upcomingRaces: 0,
    services: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isSaved = venue ? isVenueSaved(venue.id) : false;

  // Animate sheet in/out
  useEffect(() => {
    if (venue) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 10,
      }).start();
      fetchVenueStats();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [venue]);

  const fetchVenueStats = async () => {
    if (!venue) return;

    setLoading(true);
    try {
      const [clubsRes, racesRes, servicesRes] = await Promise.all([
        supabase
          .from('yacht_clubs')
          .select('id', { count: 'exact', head: true })
          .eq('venue_id', venue.id),
        supabase
          .from('club_race_calendar')
          .select('id', { count: 'exact', head: true })
          .eq('venue_id', venue.id)
          .gte('start_date', new Date().toISOString().split('T')[0]),
        supabase
          .from('club_services')
          .select('id', { count: 'exact', head: true })
          .eq('venue_id', venue.id),
      ]);

      setStats({
        clubs: clubsRes.count || 0,
        upcomingRaces: racesRes.count || 0,
        services: servicesRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching venue stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVenueTypeIcon = (type: string) => {
    return VENUE_ICONS[type as keyof typeof VENUE_ICONS] || VENUE_ICONS.default;
  };

  const handleToggleSave = async () => {
    if (!venue) return;

    console.log('🔖 VenueDetailsSheet: Toggling save for venue:', venue.id, 'Currently saved:', isSaved);
    setIsSaving(true);
    try {
      if (isSaved) {
        console.log('🔖 VenueDetailsSheet: Unsaving venue...');
        await unsaveVenue(venue.id);
        console.log('✅ VenueDetailsSheet: Venue unsaved successfully');
      } else {
        console.log('🔖 VenueDetailsSheet: Saving venue...');
        await saveVenue(venue.id);
        console.log('✅ VenueDetailsSheet: Venue saved successfully');
      }
    } catch (error) {
      console.error('❌ VenueDetailsSheet: Error toggling venue save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!venue) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Drag Handle */}
      <View style={styles.dragHandle} />

      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.venueIconCompact}>
          <ThemedText style={styles.venueIconText}>
            {getVenueTypeIcon(venue.venue_type)}
          </ThemedText>
        </View>
        <View style={styles.headerInfo}>
          <ThemedText style={styles.venueName}>{venue.name}</ThemedText>
          <View style={styles.venueMetaRow}>
            <ThemedText style={styles.countryFlag}>{getFlag(venue.country)}</ThemedText>
            <ThemedText style={styles.venueCountry}>{venue.country}</ThemedText>
            <ThemedText style={styles.venueSeparator}>•</ThemedText>
            <ThemedText style={styles.venueType}>{venue.venue_type}</ThemedText>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, isSaved && styles.saveButtonActive]}
          onPress={handleToggleSave}
          disabled={isSaving}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? '#007AFF' : '#666'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Compact Info Grid */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <ThemedText style={styles.infoIcon}>⚓</ThemedText>
          <ThemedText style={styles.infoValue}>{stats.clubs}</ThemedText>
          <ThemedText style={styles.infoLabel}>Clubs</ThemedText>
        </View>
        <View style={styles.infoItem}>
          <ThemedText style={styles.infoIcon}>🏁</ThemedText>
          <ThemedText style={styles.infoValue}>{stats.upcomingRaces}</ThemedText>
          <ThemedText style={styles.infoLabel}>Races</ThemedText>
        </View>
        <View style={styles.infoItem}>
          <ThemedText style={styles.infoIcon}>🔧</ThemedText>
          <ThemedText style={styles.infoValue}>{stats.services}</ThemedText>
          <ThemedText style={styles.infoLabel}>Services</ThemedText>
        </View>
        <View style={styles.infoItem}>
          <ThemedText style={styles.infoIcon}>📍</ThemedText>
          <ThemedText style={styles.infoValue}>
            {venue.coordinates_lat.toFixed(2)}°N
          </ThemedText>
          <ThemedText style={styles.infoLabel}>
            {venue.coordinates_lng.toFixed(2)}°E
          </ThemedText>
        </View>
      </View>

      {/* Compact Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButtonCompact}>
          <Ionicons name="navigate" size={18} color="#007AFF" />
          <ThemedText style={styles.actionButtonTextCompact}>Directions</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonCompact}>
          <Ionicons name="calendar" size={18} color="#007AFF" />
          <ThemedText style={styles.actionButtonTextCompact}>Races</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonCompact}>
          <Ionicons name="information-circle" size={18} color="#007AFF" />
          <ThemedText style={styles.actionButtonTextCompact}>Details</ThemedText>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 200,
    paddingBottom: 20,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(20px)',
        }
      : {
          elevation: 10,
        }),
  },

  // Drag Handle
  dragHandle: {
    width: 36,
    height: 3,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 10,
  },

  // Compact Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  venueIconCompact: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  venueIconText: {
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countryFlag: {
    fontSize: 12,
  },
  venueCountry: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  venueSeparator: {
    fontSize: 10,
    color: '#999',
  },
  venueType: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  saveButton: {
    padding: 6,
    marginRight: 4,
  },
  saveButtonActive: {
    backgroundColor: '#007AFF10',
    borderRadius: 8,
  },
  closeButton: {
    padding: 6,
  },

  // Compact Info Grid
  infoGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  infoLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Compact Action Buttons
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  actionButtonCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionButtonTextCompact: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
});
