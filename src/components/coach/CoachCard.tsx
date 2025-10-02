import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { CoachSearchResult } from '../../types/coach';

interface CoachCardProps {
  coach: CoachSearchResult;
  onPress: () => void;
  onBookPress: () => void;
}

export default function CoachCard({ coach, onPress, onBookPress }: CoachCardProps) {
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(0)}`;
  };

  const getLowestPrice = () => {
    if (!coach.services.length) return null;
    const minPrice = Math.min(...coach.services.map(s => s.base_price));
    return formatPrice(minPrice);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={[styles.star, { opacity: i <= rating ? 1 : 0.3 }]}>
          ★
        </Text>
      );
    }
    return stars;
  };

  const formatAvailability = (nextAvailable?: string) => {
    if (!nextAvailable) return 'Contact for availability';

    const date = new Date(nextAvailable);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Available today';
    if (diffDays === 1) return 'Available tomorrow';
    if (diffDays <= 7) return `Available in ${diffDays} days`;
    return 'Contact for availability';
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.95}
      {...(Platform.OS === 'web' && {
        onMouseEnter: (e: any) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
        },
        onMouseLeave: (e: any) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        },
      })}
    >
      <View style={styles.cardContent}>
        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              {coach.profile_photo_url ? (
                <Image source={{ uri: coach.profile_photo_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {coach.first_name.charAt(0)}{coach.last_name.charAt(0)}
                </Text>
              )}
            </View>

            <View style={styles.basicInfo}>
              <Text style={styles.name}>
                {coach.first_name} {coach.last_name}
              </Text>
              <Text style={styles.location}>{coach.location}</Text>

              {/* Rating */}
              <View style={styles.ratingRow}>
                <View style={styles.stars}>
                  {renderStars(Math.round(coach.average_rating))}
                </View>
                <Text style={styles.ratingText}>
                  {coach.average_rating.toFixed(1)} ({coach.total_reviews})
                </Text>
              </View>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>{getLowestPrice()}</Text>
            <Text style={styles.priceUnit}>per hour</Text>
          </View>
        </View>

        {/* Experience */}
        <View style={styles.experienceRow}>
          <View style={styles.experienceItem}>
            <Text style={styles.experienceNumber}>{coach.years_coaching}</Text>
            <Text style={styles.experienceLabel}>years</Text>
          </View>
          <View style={styles.experienceItem}>
            <Text style={styles.experienceNumber}>{coach.students_coached}</Text>
            <Text style={styles.experienceLabel}>students</Text>
          </View>
          <View style={styles.experienceItem}>
            <Text style={styles.experienceNumber}>{coach.total_sessions}</Text>
            <Text style={styles.experienceLabel}>sessions</Text>
          </View>
        </View>

        {/* Specialties */}
        <View style={styles.specialtiesSection}>
          <View style={styles.specialtyChips}>
            {coach.boat_classes.slice(0, 3).map((boatClass) => (
              <View key={boatClass} style={styles.specialtyChip}>
                <Text style={styles.specialtyChipText}>{boatClass}</Text>
              </View>
            ))}
            {coach.boat_classes.length > 3 && (
              <View style={styles.specialtyChip}>
                <Text style={styles.specialtyChipText}>+{coach.boat_classes.length - 3}</Text>
              </View>
            )}
          </View>

          <View style={styles.specialtyChips}>
            {coach.specialties.slice(0, 2).map((specialty) => (
              <View key={specialty} style={[styles.specialtyChip, styles.specialtyChipSecondary]}>
                <Text style={[styles.specialtyChipText, styles.specialtyChipTextSecondary]}>
                  {specialty.replace('-', ' ')}
                </Text>
              </View>
            ))}
            {coach.specialties.length > 2 && (
              <View style={[styles.specialtyChip, styles.specialtyChipSecondary]}>
                <Text style={[styles.specialtyChipText, styles.specialtyChipTextSecondary]}>
                  +{coach.specialties.length - 2}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio Preview */}
        {coach.bio && (
          <Text style={styles.bioPreview} numberOfLines={2}>
            {coach.bio}
          </Text>
        )}

        {/* Footer Row */}
        <View style={styles.footer}>
          <View style={styles.availabilitySection}>
            <Text style={styles.availabilityText}>
              {formatAvailability(coach.next_available)}
            </Text>
            {coach.match_score && coach.match_score > 0.7 && (
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>Great Match</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={(e) => {
              e.stopPropagation();
              onPress(); // Navigate to profile instead of booking directly
            }}
          >
            <Text style={styles.bookButtonText}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    boxShadow: '0px 2px',
    elevation: 3,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific CSS properties
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      cursor: 'pointer',
    }),
  } as any,
  cardContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  basicInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 14,
    color: '#FFD700',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  priceUnit: {
    fontSize: 12,
    color: '#666',
  },
  experienceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
  },
  experienceItem: {
    alignItems: 'center',
  },
  experienceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  experienceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  specialtiesSection: {
    marginBottom: 16,
    gap: 8,
  },
  specialtyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialtyChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E6F3FF',
    borderRadius: 12,
  },
  specialtyChipSecondary: {
    backgroundColor: '#F0F8F0',
  },
  specialtyChipText: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  specialtyChipTextSecondary: {
    color: '#00AA33',
  },
  bioPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilitySection: {
    flex: 1,
    marginRight: 16,
  },
  availabilityText: {
    fontSize: 14,
    color: '#00AA33',
    fontWeight: '500',
    marginBottom: 4,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#00FF88',
    borderRadius: 8,
  },
  matchBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bookButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0066CC',
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});