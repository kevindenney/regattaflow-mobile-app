import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import { useRouter } from 'expo-router';
import { CoachProfile as CoachProfileType, CoachService, SessionReview } from '../../types/coach';
import { CoachMarketplaceService } from '@/services/CoachingService';
import BookingFlow from './booking/BookingFlow';

interface CoachProfileProps {
  coachId: string;
}

export default function CoachProfile({ coachId }: CoachProfileProps) {
  const router = useRouter();
  const [coach, setCoach] = useState<CoachProfileType | null>(null);
  const [services, setServices] = useState<CoachService[]>([]);
  const [reviews, setReviews] = useState<SessionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<CoachService | null>(null);
  const [showBookingFlow, setShowBookingFlow] = useState(false);

  useEffect(() => {
    loadCoachProfile();
  }, [coachId]);

  const loadCoachProfile = async () => {
    setLoading(true);
    try {
      const profileData = await CoachMarketplaceService.getCoachProfile(coachId);
      setCoach(profileData.coach);
      setServices(profileData.services);
      setReviews(profileData.reviews);
    } catch (error) {
      console.error('Error loading coach profile:', error);
      showAlert('Error', 'Failed to load coach profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (service: CoachService) => {
    setSelectedService(service);
    setShowBookingFlow(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingFlow(false);
    showAlert('Success', 'Your session has been booked!');
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(0)}`;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!coach) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Coach profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            {coach.profile_photo_url ? (
              <Image source={{ uri: coach.profile_photo_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {coach.first_name.charAt(0)}{coach.last_name.charAt(0)}
              </Text>
            )}
            {coach.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {coach.first_name} {coach.last_name}
            </Text>
            <Text style={styles.location}>{coach.location}</Text>

            <View style={styles.ratingRow}>
              <View style={styles.stars}>{renderStars(Math.round(coach.average_rating))}</View>
              <Text style={styles.ratingText}>
                {coach.average_rating.toFixed(1)} ({coach.total_reviews} reviews)
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{coach.years_coaching}</Text>
            <Text style={styles.statLabel}>Years</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{coach.students_coached}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{coach.total_sessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{coach.response_time_hours}h</Text>
            <Text style={styles.statLabel}>Response</Text>
          </View>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bioText}>{coach.bio}</Text>
      </View>

      {/* Expertise */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expertise</Text>

        <Text style={styles.subsectionTitle}>Boat Classes</Text>
        <View style={styles.chipContainer}>
          {coach.boat_classes.map((boatClass) => (
            <View key={boatClass} style={styles.chip}>
              <Text style={styles.chipText}>{boatClass}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.subsectionTitle}>Specialties</Text>
        <View style={styles.chipContainer}>
          {coach.specialties.map((specialty) => (
            <View key={specialty} style={[styles.chip, styles.chipSecondary]}>
              <Text style={[styles.chipText, styles.chipTextSecondary]}>
                {specialty.replace('-', ' ')}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.subsectionTitle}>Student Levels</Text>
        <View style={styles.chipContainer}>
          {coach.skill_levels.map((level) => (
            <View key={level} style={[styles.chip, styles.chipTertiary]}>
              <Text style={[styles.chipText, styles.chipTextTertiary]}>{level}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services</Text>
        {services.map((service) => (
          <View key={service.id} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.servicePrice}>{formatPrice(service.base_price)}</Text>
            </View>
            <Text style={styles.serviceDescription}>{service.description}</Text>
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceDetailText}>
                ⏱ {service.duration_minutes} minutes
              </Text>
              {service.deliverables.map((deliverable, index) => (
                <Text key={index} style={styles.serviceDetailText}>
                  ✓ {deliverable}
                </Text>
              ))}
            </View>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => handleBookService(service)}
            >
              <Text style={styles.bookButtonText}>Book This Service</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Languages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Languages</Text>
        <View style={styles.chipContainer}>
          {coach.languages.map((language) => (
            <View key={language} style={styles.chip}>
              <Text style={styles.chipText}>{language}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Certifications */}
      {coach.certifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {coach.certifications.map((cert, index) => (
            <View key={index} style={styles.certificationItem}>
              <Text style={styles.certificationText}>• {cert}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Racing Achievements */}
      {coach.racing_achievements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Racing Achievements</Text>
          {coach.racing_achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementItem}>
              <Text style={styles.achievementText}>🏆 {achievement}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          {reviews.slice(0, 5).map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.stars}>
                  {renderStars(review.overall_rating)}
                </View>
                <Text style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </View>
              {review.review_text && (
                <Text style={styles.reviewText}>{review.review_text}</Text>
              )}
              {review.is_verified && (
                <Text style={styles.verifiedReview}>✓ Verified Student</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Booking Flow Modal */}
      {showBookingFlow && selectedService && coach && (
        <BookingFlow
          coach={coach}
          service={selectedService}
          visible={showBookingFlow}
          onClose={() => setShowBookingFlow(false)}
          onSuccess={handleBookingSuccess}
        />
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#F8F8F8',
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00AA33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
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
    fontSize: 16,
    color: '#FFD700',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E6F3FF',
    borderRadius: 16,
    marginBottom: 8,
  },
  chipSecondary: {
    backgroundColor: '#F0F8F0',
  },
  chipTertiary: {
    backgroundColor: '#FFF4E6',
  },
  chipText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  chipTextSecondary: {
    color: '#00AA33',
  },
  chipTextTertiary: {
    color: '#FF8800',
  },
  serviceCard: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceDetails: {
    marginBottom: 16,
  },
  serviceDetailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  bookButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  certificationItem: {
    marginBottom: 8,
  },
  certificationText: {
    fontSize: 16,
    color: '#333',
  },
  achievementItem: {
    marginBottom: 8,
  },
  achievementText: {
    fontSize: 16,
    color: '#333',
  },
  reviewCard: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  verifiedReview: {
    fontSize: 12,
    color: '#00AA33',
    marginTop: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});