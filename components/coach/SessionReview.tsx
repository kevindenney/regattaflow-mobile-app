import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CoachingSession, CoachProfile, SessionReview } from '../../types/coach';
import { CoachMarketplaceService } from '../../services/CoachService';

interface SessionReviewProps {
  session: CoachingSession;
  coach: CoachProfile;
  visible: boolean;
  onClose: () => void;
  onReviewSubmitted: (review: SessionReview) => void;
}

interface ReviewFormData {
  overall_rating: number;
  knowledge_rating: number;
  communication_rating: number;
  preparation_rating: number;
  value_rating: number;
  review_text: string;
  would_recommend: boolean;
  session_highlights: string;
  areas_for_improvement: string;
}

export default function SessionReview({
  session,
  coach,
  visible,
  onClose,
  onReviewSubmitted,
}: SessionReviewProps) {
  const [reviewData, setReviewData] = useState<ReviewFormData>({
    overall_rating: 0,
    knowledge_rating: 0,
    communication_rating: 0,
    preparation_rating: 0,
    value_rating: 0,
    review_text: '',
    would_recommend: true,
    session_highlights: '',
    areas_for_improvement: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const ratingCategories = [
    { key: 'overall_rating', label: 'Overall Experience', required: true },
    { key: 'knowledge_rating', label: 'Technical Knowledge', required: true },
    { key: 'communication_rating', label: 'Communication Skills', required: true },
    { key: 'preparation_rating', label: 'Session Preparation', required: false },
    { key: 'value_rating', label: 'Value for Money', required: false },
  ] as const;

  const handleRatingChange = (category: keyof ReviewFormData, rating: number) => {
    setReviewData(prev => ({ ...prev, [category]: rating }));
  };

  const renderStarRating = (
    category: keyof ReviewFormData,
    label: string,
    required: boolean = false
  ) => {
    const currentRating = reviewData[category] as number;

    return (
      <View style={styles.ratingSection}>
        <Text style={styles.ratingLabel}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handleRatingChange(category, star)}
              style={styles.starButton}
            >
              <Text
                style={[
                  styles.star,
                  star <= currentRating ? styles.starFilled : styles.starEmpty,
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.ratingValue}>
            {currentRating > 0 ? `${currentRating}/5` : 'Not rated'}
          </Text>
        </View>
      </View>
    );
  };

  const validateForm = (): boolean => {
    // Check required ratings
    const requiredRatings = ratingCategories.filter(cat => cat.required);
    for (const category of requiredRatings) {
      if (reviewData[category.key] === 0) {
        Alert.alert('Missing Rating', `Please provide a rating for ${category.label}`);
        return false;
      }
    }

    // Check review text
    if (!reviewData.review_text.trim()) {
      Alert.alert('Missing Review', 'Please write a review describing your experience');
      return false;
    }

    if (reviewData.review_text.trim().length < 20) {
      Alert.alert('Review Too Short', 'Please provide a more detailed review (at least 20 characters)');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const review: Partial<SessionReview> = {
        session_id: session.id,
        student_id: session.student_id,
        coach_id: session.coach_id,
        overall_rating: reviewData.overall_rating,
        knowledge_rating: reviewData.knowledge_rating,
        communication_rating: reviewData.communication_rating,
        preparation_rating: reviewData.preparation_rating || null,
        value_rating: reviewData.value_rating || null,
        review_text: reviewData.review_text.trim(),
        would_recommend: reviewData.would_recommend,
        session_highlights: reviewData.session_highlights.trim() || null,
        areas_for_improvement: reviewData.areas_for_improvement.trim() || null,
        is_verified: true, // Since they completed the session
        status: 'published',
      };

      const createdReview = await CoachMarketplaceService.createReview(review);

      Alert.alert(
        'Review Submitted',
        'Thank you for your feedback! Your review helps other sailors find great coaches.',
        [
          {
            text: 'OK',
            onPress: () => {
              onReviewSubmitted(createdReview);
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={submitting}>
            <Text style={[styles.closeButton, submitting && styles.disabledText]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write Review</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator size="small" color="#0066CC" />
            ) : (
              <Text style={styles.submitButton}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Session Info */}
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>{session.title}</Text>
            <Text style={styles.coachName}>
              with {coach.first_name} {coach.last_name}
            </Text>
            <Text style={styles.sessionDate}>{formatDateTime(session.scheduled_start)}</Text>
          </View>

          {/* Rating Categories */}
          <View style={styles.ratingsSection}>
            <Text style={styles.sectionTitle}>Rate Your Experience</Text>
            {ratingCategories.map((category) =>
              renderStarRating(category.key, category.label, category.required)
            )}
          </View>

          {/* Written Review */}
          <View style={styles.textSection}>
            <Text style={styles.textLabel}>
              Describe your experience <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              value={reviewData.review_text}
              onChangeText={(text) => setReviewData(prev => ({ ...prev, review_text: text }))}
              placeholder="Share details about your coaching session, what you learned, and how it helped improve your sailing..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>
              {reviewData.review_text.length}/1000 characters
            </Text>
          </View>

          {/* Session Highlights */}
          <View style={styles.textSection}>
            <Text style={styles.textLabel}>Session Highlights</Text>
            <TextInput
              style={styles.textInput}
              value={reviewData.session_highlights}
              onChangeText={(text) => setReviewData(prev => ({ ...prev, session_highlights: text }))}
              placeholder="What were the best parts of this session?"
              maxLength={200}
            />
          </View>

          {/* Areas for Improvement */}
          <View style={styles.textSection}>
            <Text style={styles.textLabel}>Areas for Improvement (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={reviewData.areas_for_improvement}
              onChangeText={(text) => setReviewData(prev => ({ ...prev, areas_for_improvement: text }))}
              placeholder="Any suggestions for the coach to improve future sessions?"
              maxLength={200}
            />
          </View>

          {/* Recommendation */}
          <View style={styles.recommendationSection}>
            <Text style={styles.textLabel}>Would you recommend this coach?</Text>
            <View style={styles.recommendationButtons}>
              <TouchableOpacity
                style={[
                  styles.recommendationButton,
                  reviewData.would_recommend && styles.recommendationButtonActive,
                ]}
                onPress={() => setReviewData(prev => ({ ...prev, would_recommend: true }))}
              >
                <Text
                  style={[
                    styles.recommendationButtonText,
                    reviewData.would_recommend && styles.recommendationButtonTextActive,
                  ]}
                >
                  Yes, I recommend
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.recommendationButton,
                  !reviewData.would_recommend && styles.recommendationButtonActive,
                ]}
                onPress={() => setReviewData(prev => ({ ...prev, would_recommend: false }))}
              >
                <Text
                  style={[
                    styles.recommendationButtonText,
                    !reviewData.would_recommend && styles.recommendationButtonTextActive,
                  ]}
                >
                  No, I don't recommend
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Review Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Review Guidelines</Text>
            <Text style={styles.guidelinesText}>
              • Be honest and constructive in your feedback{'\n'}
              • Focus on the coaching experience and session content{'\n'}
              • Avoid personal attacks or inappropriate language{'\n'}
              • Your review will be public and help other sailors{'\n'}
              • Reviews cannot be edited after submission
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
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
    color: '#666',
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  submitButton: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  disabledText: {
    opacity: 0.5,
  },
  content: {
    padding: 20,
  },
  sessionInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  coachName: {
    fontSize: 16,
    color: '#0066CC',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
  },
  ratingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B35',
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    marginRight: 4,
  },
  star: {
    fontSize: 28,
  },
  starFilled: {
    color: '#FFD700',
  },
  starEmpty: {
    color: '#E0E0E0',
  },
  ratingValue: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  textSection: {
    marginBottom: 24,
  },
  textLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 8,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  recommendationSection: {
    marginBottom: 32,
  },
  recommendationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  recommendationButtonActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  recommendationButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  recommendationButtonTextActive: {
    color: '#FFFFFF',
  },
  guidelines: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});