import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import FacilitiesList from './FacilitiesList';
import EventsList from './EventsList';

interface YachtClub {
  id: string;
  name: string;
  location: string;
  country: string;
  photo_url?: string;
  description?: string;
  facilities?: string[];
  member_since?: string;
  membership_type?: string;
  member_number?: string;
}

interface ClubDetailProps {
  club: YachtClub;
  onBack: () => void;
}

interface ClubEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  description?: string;
}

export default function ClubDetail({ club, onBack }: ClubDetailProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingEvents();
  }, [club.id]);

  const fetchUpcomingEvents = async () => {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from('club_events')
        .select('*')
        .eq('club_id', club.id)
        .gte('event_date', new Date().toISOString())
        .lte('event_date', thirtyDaysFromNow.toISOString())
        .order('event_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'Access to club facilities',
    'Participate in club races',
    'Social events and gatherings',
    'Member discounts',
    'Boat storage (if applicable)',
    'Guest privileges',
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {club.photo_url && (
          <Image
            source={{ uri: club.photo_url }}
            style={styles.clubPhoto}
            resizeMode="cover"
          />
        )}

        <View style={styles.section}>
          <Text style={styles.clubName}>{club.name}</Text>
          <Text style={styles.location}>
            {club.location}, {club.country}
          </Text>
        </View>

        {club.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{club.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Membership</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Member Since</Text>
            <Text style={styles.value}>
              {club.member_since
                ? new Date(club.member_since).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })
                : 'N/A'}
            </Text>
          </View>
          {club.membership_type && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Type</Text>
              <Text style={styles.value}>{club.membership_type}</Text>
            </View>
          )}
          {club.member_number && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Member Number</Text>
              <Text style={styles.value}>{club.member_number}</Text>
            </View>
          )}
        </View>

        {club.facilities && club.facilities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Facilities</Text>
            <FacilitiesList facilities={club.facilities} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Benefits</Text>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <Text style={styles.sectionSubtitle}>Next 30 days</Text>
          </View>
          {loading ? (
            <Text style={styles.loadingText}>Loading events...</Text>
          ) : (
            <EventsList events={events} />
          )}
        </View>

        <TouchableOpacity style={styles.calendarButton}>
          <Text style={styles.calendarButtonText}>View Full Racing Calendar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 16,
    color: '#2196F3',
  },
  content: {
    flex: 1,
  },
  clubPhoto: {
    width: '100%',
    height: 200,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  clubName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  location: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkmark: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 12,
    width: 20,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  calendarButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  calendarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
