import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CoachSelectionModal');

interface CoachProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  experience_years: number;
  certifications: string[];
  specializations: string[];
  hourly_rate: number;
  currency: string;
  is_verified: boolean;
  is_active: boolean;
  rating: number;
  total_sessions: number;
  location_name: string;
  location_region: string;
  languages: string[];
  profile_image_url: string;
}

interface CoachSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCoach: (coachId: string, coachName: string) => void;
  sailorId: string;
}

export function CoachSelectionModal({
  visible,
  onClose,
  onSelectCoach,
  sailorId,
}: CoachSelectionModalProps) {
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [myCoaches, setMyCoaches] = useState<CoachProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCoaches();
    }
  }, [visible, sailorId]);

  const loadCoaches = async () => {
    setLoading(true);
    try {
      // Load all active verified coaches
      const { data: allCoaches, error: coachesError } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('rating', { ascending: false });

      if (coachesError) {
        logger.error('Error loading coaches:', coachesError);
        return;
      }

      logger.info('Loaded coaches:', { count: allCoaches?.length || 0, coaches: allCoaches });

      // Load coaches that this sailor has worked with before
      const { data: sessions, error: sessionsError } = await supabase
        .from('coaching_sessions')
        .select('coach_id')
        .eq('sailor_id', sailorId);

      if (sessionsError) {
        logger.error('Error loading coaching sessions:', sessionsError);
      }

      const myCoachIds = new Set(sessions?.map(s => s.coach_id) || []);
      const myCoachesList = allCoaches?.filter(c => myCoachIds.has(c.id)) || [];
      const otherCoaches = allCoaches?.filter(c => !myCoachIds.has(c.id)) || [];

      setMyCoaches(myCoachesList);
      setCoaches(otherCoaches);
    } catch (error) {
      logger.error('Failed to load coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCoach = (coach: CoachProfile) => {
    onSelectCoach(coach.id, coach.display_name);
    onClose();
  };

  const renderCoachCard = (coach: CoachProfile) => (
    <TouchableOpacity
      key={coach.id}
      style={styles.coachCard}
      onPress={() => handleSelectCoach(coach)}
    >
      <View style={styles.coachHeader}>
        <Image
          source={{ uri: coach.profile_image_url }}
          style={styles.coachAvatar}
        />
        <View style={styles.coachInfo}>
          <View style={styles.coachNameRow}>
            <Text style={styles.coachName}>{coach.display_name}</Text>
            {coach.is_verified && (
              <MaterialCommunityIcons name="check-decagram" size={18} color="#3B82F6" />
            )}
          </View>
          <View style={styles.coachMetaRow}>
            <MaterialCommunityIcons name="star" size={14} color="#FBBF24" />
            <Text style={styles.coachRating}>{coach.rating.toFixed(1)}</Text>
            <Text style={styles.coachSessions}>• {coach.total_sessions} sessions</Text>
          </View>
          <Text style={styles.coachLocation}>
            📍 {coach.location_name} • {coach.experience_years} years exp
          </Text>
        </View>
      </View>

      <Text style={styles.coachBio} numberOfLines={2}>
        {coach.bio}
      </Text>

      <View style={styles.specializationsRow}>
        {coach.specializations.slice(0, 3).map((spec, index) => (
          <View key={index} style={styles.specializationTag}>
            <Text style={styles.specializationText}>{spec}</Text>
          </View>
        ))}
        {coach.specializations.length > 3 && (
          <Text style={styles.moreSpecializations}>
            +{coach.specializations.length - 3} more
          </Text>
        )}
      </View>

      <View style={styles.coachFooter}>
        <Text style={styles.coachRate}>
          ${coach.hourly_rate}/{coach.currency === 'USD' ? 'hr' : 'session'}
        </Text>
        <View style={styles.selectButton}>
          <Text style={styles.selectButtonText}>Share with Coach</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#3B82F6" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select a Coach</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading coaches...</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {myCoaches.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="account-heart" size={20} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>My Coaches</Text>
                </View>
                {myCoaches.map(renderCoachCard)}
              </>
            )}

            {coaches.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="account-group" size={20} color="#64748B" />
                  <Text style={styles.sectionTitle}>All Coaches</Text>
                </View>
                {coaches.map(renderCoachCard)}
              </>
            )}

            {coaches.length === 0 && myCoaches.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-search" size={64} color="#CBD5E1" />
                <Text style={styles.emptyStateText}>No coaches available</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  coachCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coachHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  coachAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  coachInfo: {
    flex: 1,
  },
  coachNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  coachMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  coachRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  coachSessions: {
    fontSize: 13,
    color: '#64748B',
  },
  coachLocation: {
    fontSize: 13,
    color: '#64748B',
  },
  coachBio: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  specializationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  specializationTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specializationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  moreSpecializations: {
    fontSize: 12,
    color: '#64748B',
    paddingVertical: 4,
  },
  coachFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  coachRate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
  },
});
