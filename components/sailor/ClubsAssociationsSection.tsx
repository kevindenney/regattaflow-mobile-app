/**
 * ClubsAssociationsSection Component
 * Manage yacht clubs and class associations
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CardMenu, CardMenuItem } from '../shared';
import { createLogger } from '@/lib/utils/logger';

interface Club {
  id: string;
  name: string;
  type: 'yacht_club' | 'class_association';
  location?: string;
  memberSince?: string;
}

interface ClubsAssociationsSectionProps {
  sailorId?: string;
  classId?: string | null;
  className?: string | null;
}

const logger = createLogger('ClubsAssociationsSection');
export function ClubsAssociationsSection({ sailorId, classId, className }: ClubsAssociationsSectionProps) {
  // Mock data - this would come from Supabase in a real implementation
  // Base clubs that are always shown (yacht clubs)
  const baseClubs: Club[] = [
    {
      id: '1',
      name: 'Royal Hong Kong Yacht Club',
      type: 'yacht_club',
      location: 'Hong Kong',
      memberSince: '2023',
    },
  ];

  // Class-specific associations based on selected class
  const getClassAssociations = (): Club[] => {
    if (!className) return [];

    // Map of class names to their associations
    const classAssociations: Record<string, Club> = {
      'Dragon': {
        id: 'dragon-assoc',
        name: 'International Dragon Class Association',
        type: 'class_association',
        location: 'Global',
        memberSince: '2022',
      },
      'Swan 47': {
        id: 'swan47-assoc',
        name: 'Swan 47 Class Association',
        type: 'class_association',
        location: 'International',
        memberSince: '2024',
      },
      'Laser': {
        id: 'laser-assoc',
        name: 'International Laser Class Association',
        type: 'class_association',
        location: 'Global',
        memberSince: '2023',
      },
      'J/70': {
        id: 'j70-assoc',
        name: 'J/70 Class Association',
        type: 'class_association',
        location: 'International',
        memberSince: '2024',
      },
      'Optimist': {
        id: 'opti-assoc',
        name: 'International Optimist Dinghy Association',
        type: 'class_association',
        location: 'Global',
        memberSince: '2020',
      },
      '420': {
        id: '420-assoc',
        name: 'International 420 Class Association',
        type: 'class_association',
        location: 'Global',
        memberSince: '2021',
      },
    };

    const association = classAssociations[className];
    return association ? [association] : [];
  };

  const [clubs] = useState<Club[]>([...baseClubs, ...getClassAssociations()]);

  const handleAddClub = () => {
    Alert.alert(
      'Add Club or Association',
      'Search for yacht clubs and class associations to join.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Search',
          onPress: () => {
            // TODO: Navigate to club search/add screen
            alert('Club search feature coming soon!');
          },
        },
      ]
    );
  };

  const handleRemoveClub = (club: Club) => {
    Alert.alert(
      'Remove Club',
      `Are you sure you want to remove ${club.name} from your profile?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // TODO: Remove from Supabase
            alert('Remove club functionality coming soon!');
          },
        },
      ]
    );
  };

  const getClubIcon = (type: string) => {
    return type === 'yacht_club' ? 'boat' : 'trophy';
  };

  const getClubColor = (type: string) => {
    return type === 'yacht_club' ? '#3B82F6' : '#10B981';
  };

  // Recalculate clubs when className changes
  const displayClubs = React.useMemo(() => {
    return [...baseClubs, ...getClassAssociations()];
  }, [className]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconWrap}>
            <Text style={styles.headerIcon}>🏛️</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>
              {className ? `${className} - Clubs & Associations` : 'Clubs & Associations'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Keep memberships and training networks in one place
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={handleAddClub}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={18} color="#7C3AED" />
          <Text style={styles.headerActionText}>Add Club</Text>
        </TouchableOpacity>
      </View>

      {displayClubs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={32} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Clubs or Associations Yet</Text>
          <Text style={styles.emptyText}>
            Add your yacht clubs and class associations
          </Text>
          <TouchableOpacity style={styles.emptyActionButton} onPress={handleAddClub}>
            <Ionicons name="add-circle" size={16} color="#FFFFFF" />
            <Text style={styles.emptyActionText}>Add Club</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.clubsScroll}
        >
          {displayClubs.map((club) => {
            const clubMenuItems: CardMenuItem[] = [
              {
                label: 'View Details',
                icon: 'information-circle-outline',
                onPress: () => logger.debug('View club details:', club.id),
              },
              {
                label: 'View Events',
                icon: 'calendar-outline',
                onPress: () => logger.debug('View club events:', club.id),
              },
              {
                label: 'Member Benefits',
                icon: 'gift-outline',
                onPress: () => logger.debug('View benefits:', club.id),
              },
              {
                label: 'Remove Club',
                icon: 'trash-outline',
                onPress: () => handleRemoveClub(club),
                variant: 'destructive' as const,
              },
            ];

            return (
              <View key={club.id} style={styles.clubCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.clubTypeBadge, { backgroundColor: `${getClubColor(club.type)}15` }]}>
                    <Text style={[styles.clubTypeText, { color: getClubColor(club.type) }]}>
                      {club.type === 'yacht_club' ? 'Club' : 'Assoc'}
                    </Text>
                  </View>
                  <CardMenu items={clubMenuItems} />
                </View>

                <View style={[styles.clubIcon, { backgroundColor: `${getClubColor(club.type)}15` }]}>
                  <Ionicons
                    name={getClubIcon(club.type) as any}
                    size={32}
                    color={getClubColor(club.type)}
                  />
                </View>

                <View style={styles.clubInfo}>
                  <Text style={styles.clubName} numberOfLines={2}>
                    {club.name}
                  </Text>
                  {club.location && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={12} color="#64748B" />
                      <Text style={styles.metaText} numberOfLines={1}>{club.location}</Text>
                    </View>
                  )}
                  {club.memberSince && (
                    <View style={styles.memberBadge}>
                      <Text style={styles.memberText}>Since {club.memberSince}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* Add Club Card */}
          <TouchableOpacity style={styles.addClubCard} onPress={handleAddClub}>
            <Ionicons name="add-circle-outline" size={32} color="#3B82F6" />
            <Text style={styles.addClubText}>Add Club</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAF5FF',
    borderRadius: 20,
    padding: 20,
    marginVertical: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    boxShadow: '0px 4px',
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6D28D9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4C1D95',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#7C3AED',
    marginTop: 2,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  headerActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6D28D9',
  },
  clubsScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  clubCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0px 6px',
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clubIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  clubInfo: {
    gap: 6,
  },
  clubName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    lineHeight: 18,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  memberBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  memberText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  clubTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clubTypeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addClubCard: {
    width: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addClubText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helpText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
  },
});
