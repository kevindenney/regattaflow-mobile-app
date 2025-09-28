import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SessionReview } from '../../types/coach';

interface ReviewDisplayProps {
  reviews: SessionReview[];
  averageRating: number;
  totalReviews: number;
}

interface ReviewStatsProps {
  reviews: SessionReview[];
  averageRating: number;
  totalReviews: number;
}

interface ReviewCardProps {
  review: SessionReview;
  onPress?: () => void;
}

interface FullReviewModalProps {
  review: SessionReview | null;
  visible: boolean;
  onClose: () => void;
}

function ReviewStats({ reviews, averageRating, totalReviews }: ReviewStatsProps) {
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(review => Math.round(review.overall_rating) === rating).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { rating, count, percentage };
  });

  const renderStars = (rating: number, size: 'small' | 'large' = 'small') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      let starStyle = size === 'large' ? styles.starLarge : styles.starSmall;

      if (i <= fullStars) {
        stars.push(
          <Text key={i} style={[starStyle, styles.starFilled]}>★</Text>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Text key={i} style={[starStyle, styles.starHalf]}>★</Text>
        );
      } else {
        stars.push(
          <Text key={i} style={[starStyle, styles.starEmpty]}>★</Text>
        );
      }
    }
    return stars;
  };

  return (
    <View style={styles.statsContainer}>
      {/* Overall Rating */}
      <View style={styles.overallRating}>
        <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
        <View style={styles.starsRow}>
          {renderStars(averageRating, 'large')}
        </View>
        <Text style={styles.reviewCount}>
          {totalReviews} review{totalReviews !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Rating Distribution */}
      <View style={styles.distributionContainer}>
        {ratingDistribution.map(({ rating, count, percentage }) => (
          <View key={rating} style={styles.distributionRow}>
            <Text style={styles.distributionRating}>{rating}</Text>
            <Text style={styles.distributionStar}>★</Text>
            <View style={styles.distributionBar}>
              <View
                style={[styles.distributionFill, { width: `${percentage}%` }]}
              />
            </View>
            <Text style={styles.distributionCount}>{count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReviewCard({ review, onPress }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text
          key={i}
          style={[styles.starSmall, i <= rating ? styles.starFilled : styles.starEmpty]}
        >
          ★
        </Text>
      );
    }
    return stars;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <TouchableOpacity style={styles.reviewCard} onPress={onPress} activeOpacity={0.7}>
      {/* Review Header */}
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View style={styles.reviewerAvatar}>
            <Text style={styles.reviewerInitial}>
              {review.student_name ? review.student_name.charAt(0).toUpperCase() : 'S'}
            </Text>
          </View>
          <View style={styles.reviewerDetails}>
            <Text style={styles.reviewerName}>
              {review.student_name || 'Anonymous Sailor'}
            </Text>
            <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          <View style={styles.starsRow}>
            {renderStars(review.overall_rating)}
          </View>
          <Text style={styles.ratingText}>{review.overall_rating}/5</Text>
        </View>
      </View>

      {/* Review Content */}
      <Text style={styles.reviewText} numberOfLines={3}>
        {truncateText(review.review_text, 150)}
      </Text>

      {/* Session Highlights */}
      {review.session_highlights && (
        <View style={styles.highlightsContainer}>
          <Text style={styles.highlightsLabel}>Highlights:</Text>
          <Text style={styles.highlightsText} numberOfLines={2}>
            {truncateText(review.session_highlights, 100)}
          </Text>
        </View>
      )}

      {/* Recommendation Badge */}
      {review.would_recommend && (
        <View style={styles.recommendBadge}>
          <Text style={styles.recommendText}>Recommends</Text>
        </View>
      )}

      {/* Verified Badge */}
      {review.is_verified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓ Verified</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function FullReviewModal({ review, visible, onClose }: FullReviewModalProps) {
  if (!review) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text
          key={i}
          style={[styles.starLarge, i <= rating ? styles.starFilled : styles.starEmpty]}
        >
          ★
        </Text>
      );
    }
    return stars;
  };

  const ratingCategories = [
    { key: 'overall_rating', label: 'Overall Experience' },
    { key: 'knowledge_rating', label: 'Technical Knowledge' },
    { key: 'communication_rating', label: 'Communication Skills' },
    { key: 'preparation_rating', label: 'Session Preparation' },
    { key: 'value_rating', label: 'Value for Money' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Review Details</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Reviewer Info */}
          <View style={styles.modalReviewerInfo}>
            <View style={styles.reviewerAvatar}>
              <Text style={styles.reviewerInitial}>
                {review.student_name ? review.student_name.charAt(0).toUpperCase() : 'S'}
              </Text>
            </View>
            <View>
              <Text style={styles.modalReviewerName}>
                {review.student_name || 'Anonymous Sailor'}
              </Text>
              <Text style={styles.modalReviewDate}>{formatDate(review.created_at)}</Text>
            </View>
          </View>

          {/* Rating Breakdown */}
          <View style={styles.ratingBreakdown}>
            <Text style={styles.breakdownTitle}>Rating Breakdown</Text>
            {ratingCategories.map(({ key, label }) => {
              const rating = review[key as keyof SessionReview] as number;
              if (!rating) return null;

              return (
                <View key={key} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{label}</Text>
                  <View style={styles.breakdownRating}>
                    {renderStars(rating)}
                    <Text style={styles.breakdownValue}>{rating}/5</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Review Text */}
          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Review</Text>
            <Text style={styles.modalReviewText}>{review.review_text}</Text>
          </View>

          {/* Session Highlights */}
          {review.session_highlights && (
            <View style={styles.reviewSection}>
              <Text style={styles.sectionTitle}>Session Highlights</Text>
              <Text style={styles.modalReviewText}>{review.session_highlights}</Text>
            </View>
          )}

          {/* Areas for Improvement */}
          {review.areas_for_improvement && (
            <View style={styles.reviewSection}>
              <Text style={styles.sectionTitle}>Areas for Improvement</Text>
              <Text style={styles.modalReviewText}>{review.areas_for_improvement}</Text>
            </View>
          )}

          {/* Recommendation */}
          <View style={styles.recommendationSection}>
            <Text style={styles.sectionTitle}>Recommendation</Text>
            <View style={[
              styles.recommendationBadge,
              review.would_recommend ? styles.recommendationPositive : styles.recommendationNegative
            ]}>
              <Text style={styles.recommendationText}>
                {review.would_recommend ? 'Recommends this coach' : 'Does not recommend this coach'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ReviewDisplay({ reviews, averageRating, totalReviews }: ReviewDisplayProps) {
  const [selectedReview, setSelectedReview] = useState<SessionReview | null>(null);
  const [showFullReview, setShowFullReview] = useState(false);

  const handleReviewPress = (review: SessionReview) => {
    setSelectedReview(review);
    setShowFullReview(true);
  };

  const handleCloseModal = () => {
    setShowFullReview(false);
    setSelectedReview(null);
  };

  if (totalReviews === 0) {
    return (
      <View style={styles.noReviewsContainer}>
        <Text style={styles.noReviewsText}>No reviews yet</Text>
        <Text style={styles.noReviewsSubtext}>Be the first to book and review this coach!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Review Statistics */}
      <ReviewStats
        reviews={reviews}
        averageRating={averageRating}
        totalReviews={totalReviews}
      />

      {/* Recent Reviews */}
      <View style={styles.reviewsList}>
        <Text style={styles.reviewsTitle}>Recent Reviews</Text>
        {reviews.slice(0, 3).map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onPress={() => handleReviewPress(review)}
          />
        ))}

        {reviews.length > 3 && (
          <TouchableOpacity style={styles.showMoreButton}>
            <Text style={styles.showMoreText}>
              Show all {totalReviews} reviews
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Full Review Modal */}
      <FullReviewModal
        review={selectedReview}
        visible={showFullReview}
        onClose={handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  noReviewsContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noReviewsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  overallRating: {
    alignItems: 'center',
    marginRight: 32,
  },
  ratingNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
  },
  distributionContainer: {
    flex: 1,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distributionRating: {
    fontSize: 12,
    color: '#666',
    width: 12,
  },
  distributionStar: {
    fontSize: 12,
    color: '#FFD700',
    marginHorizontal: 4,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  distributionFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 12,
    color: '#666',
    width: 20,
    textAlign: 'right',
  },
  starSmall: {
    fontSize: 12,
    marginRight: 1,
  },
  starLarge: {
    fontSize: 16,
    marginRight: 2,
  },
  starFilled: {
    color: '#FFD700',
  },
  starHalf: {
    color: '#FFD700',
    opacity: 0.5,
  },
  starEmpty: {
    color: '#E0E0E0',
  },
  reviewsList: {
    padding: 20,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  reviewText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 8,
  },
  highlightsContainer: {
    marginBottom: 8,
  },
  highlightsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  highlightsText: {
    fontSize: 13,
    color: '#444',
    fontStyle: 'italic',
  },
  recommendBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#00AA33',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 44,
    right: 16,
    backgroundColor: '#0066CC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  showMoreText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    fontSize: 16,
    color: '#0066CC',
    width: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalContent: {
    padding: 20,
  },
  modalReviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalReviewerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalReviewDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  ratingBreakdown: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
  breakdownRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  reviewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  modalReviewText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  recommendationSection: {
    marginBottom: 24,
  },
  recommendationBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  recommendationPositive: {
    backgroundColor: '#E6F3FF',
  },
  recommendationNegative: {
    backgroundColor: '#FFE6E6',
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
});