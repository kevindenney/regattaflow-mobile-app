/**
 * Faculty Dashboard
 *
 * Screen for clinical faculty to review and approve student competencies.
 * Shows all progress records awaiting faculty review (status: validated)
 * and allows faculty to approve, request more practice, or require remediation.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { useInterest } from '@/providers/InterestProvider';
import {
  getPendingFacultyReviews,
  submitFacultyReview,
} from '@/services/competencyService';
import type { FacultyDecision } from '@/types/competency';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReviewItem {
  id: string;
  user_id: string;
  competency_id: string;
  status: string;
  validated_by: string | null;
  validated_at: string | null;
  competency: { title: string; competency_number: number; category: string };
  user_name?: string;
}

interface FacultyReviewCardProps {
  item: ReviewItem;
  onSubmitReview: (
    progressId: string,
    decision: FacultyDecision,
    notes?: string,
  ) => Promise<void>;
  accentColor: string;
}

// ---------------------------------------------------------------------------
// Decision button config
// ---------------------------------------------------------------------------

const DECISION_CONFIG: Record<
  FacultyDecision,
  { label: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  approved: { label: 'Approve', bg: '#15803D', icon: 'checkmark-circle' },
  needs_more_practice: {
    label: 'Needs More Practice',
    bg: '#B45309',
    icon: 'refresh-circle',
  },
  remediation_required: {
    label: 'Remediation Required',
    bg: '#DC2626',
    icon: 'alert-circle',
  },
};

// ---------------------------------------------------------------------------
// Category badge color
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'Assessment Skills': { bg: '#E0F2FE', text: '#0369A1' },
  'Medication Administration': { bg: '#FEF3C7', text: '#B45309' },
  'Clinical Procedures': { bg: '#EDE9FE', text: '#7C3AED' },
  'Patient Care': { bg: '#DCFCE7', text: '#15803D' },
  'Critical Thinking': { bg: '#FEE2E2', text: '#DC2626' },
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? { bg: '#F3F4F6', text: '#6B7280' };
}

// ---------------------------------------------------------------------------
// Date formatting helper
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// FacultyReviewCard
// ---------------------------------------------------------------------------

function FacultyReviewCard({
  item,
  onSubmitReview,
  accentColor,
}: FacultyReviewCardProps) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState<FacultyDecision | null>(null);
  const [submitted, setSubmitted] = useState<FacultyDecision | null>(null);

  const handleDecision = useCallback(
    async (decision: FacultyDecision) => {
      try {
        setSubmitting(decision);
        await onSubmitReview(item.id, decision, notes.trim() || undefined);
        setSubmitted(decision);
      } catch {
        // Error is handled upstream via mutation
      } finally {
        setSubmitting(null);
      }
    },
    [item.id, notes, onSubmitReview],
  );

  // After submission, transform card to show the result
  if (submitted) {
    const config = DECISION_CONFIG[submitted];
    return (
      <View style={[styles.card, styles.cardSubmitted]}>
        <View style={styles.submittedContent}>
          <View style={[styles.submittedIconCircle, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={28} color="#FFFFFF" />
          </View>
          <View style={styles.submittedTextWrap}>
            <Text style={styles.submittedLabel}>{config.label}</Text>
            <Text style={styles.submittedCompetency}>
              #{item.competency.competency_number} {item.competency.title}
            </Text>
            {item.user_name ? (
              <Text style={styles.submittedStudent}>{item.user_name}</Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  const catColor = getCategoryColor(item.competency.category);

  return (
    <View style={styles.card}>
      {/* Top row: number badge + title */}
      <View style={styles.cardTopRow}>
        <View style={[styles.numberBadge, { backgroundColor: accentColor }]}>
          <Text style={styles.numberBadgeText}>
            {item.competency.competency_number}
          </Text>
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.competency.title}
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
            <Text style={[styles.categoryBadgeText, { color: catColor.text }]}>
              {item.competency.category}
            </Text>
          </View>
        </View>
      </View>

      {/* Student name */}
      {item.user_name ? (
        <View style={styles.studentRow}>
          <Ionicons name="person-outline" size={14} color="#6B7280" />
          <Text style={styles.studentName}>{item.user_name}</Text>
        </View>
      ) : null}

      {/* Validated by line */}
      <View style={styles.validatedRow}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#15803D" />
        <Text style={styles.validatedText}>
          Validated by: {item.validated_by ?? 'Preceptor'} on{' '}
          {formatDate(item.validated_at)}
        </Text>
      </View>

      {/* Notes input */}
      <TouchableOpacity
        style={styles.notesToggle}
        onPress={() => setNotesExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={notesExpanded ? 'chevron-up-outline' : 'create-outline'}
          size={16}
          color="#6B7280"
        />
        <Text style={styles.notesToggleText}>
          {notesExpanded ? 'Hide Notes' : 'Add Notes (Optional)'}
        </Text>
      </TouchableOpacity>

      {notesExpanded && (
        <TextInput
          style={styles.notesInput}
          placeholder="Add review notes..."
          placeholderTextColor="#9CA3AF"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      )}

      {/* Decision buttons */}
      <View style={styles.decisionRow}>
        {(
          ['approved', 'needs_more_practice', 'remediation_required'] as FacultyDecision[]
        ).map((decision) => {
          const config = DECISION_CONFIG[decision];
          const isLoading = submitting === decision;
          const isDisabled = submitting !== null;

          return (
            <TouchableOpacity
              key={decision}
              style={[
                styles.decisionButton,
                { backgroundColor: config.bg },
                isDisabled && styles.decisionButtonDisabled,
              ]}
              onPress={() => handleDecision(decision)}
              disabled={isDisabled}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name={config.icon} size={18} color="#FFFFFF" />
              )}
              <Text style={styles.decisionButtonText} numberOfLines={1}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function FacultyDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { currentInterest } = useInterest();
  const queryClient = useQueryClient();

  const userId = session?.user?.id;
  const interestId = currentInterest?.id;
  const accentColor = currentInterest?.accent_color ?? '#0369A1';
  const interestName = currentInterest?.name ?? 'Clinical';

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const {
    data: reviews,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['faculty-reviews', interestId],
    queryFn: () => getPendingFacultyReviews(interestId!),
    enabled: !!interestId,
  });

  // -----------------------------------------------------------------------
  // Mutation
  // -----------------------------------------------------------------------

  const mutation = useMutation({
    mutationFn: async ({
      progressId,
      decision,
      notes,
    }: {
      progressId: string;
      decision: FacultyDecision;
      notes?: string;
    }) => {
      if (!userId) throw new Error('Not authenticated');
      await submitFacultyReview(userId, {
        progress_id: progressId,
        decision,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-reviews', interestId] });
    },
  });

  const handleSubmitReview = useCallback(
    async (progressId: string, decision: FacultyDecision, notes?: string) => {
      await mutation.mutateAsync({ progressId, decision, notes });
    },
    [mutation],
  );

  // -----------------------------------------------------------------------
  // Derived stats
  // -----------------------------------------------------------------------

  const pendingCount = reviews?.length ?? 0;

  // Count how many were validated today (based on validated_at)
  const today = new Date().toISOString().slice(0, 10);
  const validatedToday =
    reviews?.filter((r) => r.validated_at?.startsWith(today)).length ?? 0;

  // Unique students active
  const studentsActive = reviews
    ? new Set(reviews.map((r) => r.user_id)).size
    : 0;

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item }: { item: ReviewItem }) => (
      <FacultyReviewCard
        item={item}
        onSubmitReview={handleSubmitReview}
        accentColor={accentColor}
      />
    ),
    [handleSubmitReview, accentColor],
  );

  const keyExtractor = useCallback((item: ReviewItem) => item.id, []);

  const ListHeaderComponent = useCallback(
    () => (
      <View style={styles.headerContainer}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Clinical Faculty Dashboard</Text>
          <Text style={styles.screenSubtitle}>{interestName}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderTopColor: accentColor }]}>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending Reviews</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#15803D' }]}>
            <Text style={styles.statNumber}>{validatedToday}</Text>
            <Text style={styles.statLabel}>Validated Today</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#7C3AED' }]}>
            <Text style={styles.statNumber}>{studentsActive}</Text>
            <Text style={styles.statLabel}>Students Active</Text>
          </View>
        </View>

        {/* Section heading */}
        {pendingCount > 0 && (
          <Text style={styles.sectionHeading}>
            Pending Reviews ({pendingCount})
          </Text>
        )}
      </View>
    ),
    [interestName, accentColor, pendingCount, validatedToday, studentsActive],
  );

  const ListEmptyComponent = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="trophy-outline" size={64} color={accentColor} />
        <Text style={styles.emptyTitle}>All Reviews Complete!</Text>
        <Text style={styles.emptySubtitle}>
          No competencies are currently awaiting faculty review. Check back later
          or pull to refresh.
        </Text>
      </View>
    );
  }, [isLoading, accentColor]);

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </View>
    );
  }

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={(reviews ?? []) as ReviewItem[]}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={accentColor}
            colors={[accentColor]}
          />
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 20,
  },

  // ----- Header -----
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleSection: {
    marginBottom: 20,
  },
  screenTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 28,
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },

  // ----- Stats Row -----
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontFamily: 'DMSans-Bold',
    fontSize: 24,
    color: '#1F2937',
  },
  statLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },

  // ----- Section heading -----
  sectionHeading: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 17,
    color: '#374151',
    marginBottom: 12,
  },

  // ----- Card -----
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardSubmitted: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowOpacity: 0.03,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberBadgeText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  cardTitleWrap: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    letterSpacing: 0.2,
  },

  // ----- Student row -----
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingLeft: 48,
  },
  studentName: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    color: '#374151',
  },

  // ----- Validated row -----
  validatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingLeft: 48,
  },
  validatedText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#6B7280',
  },

  // ----- Notes -----
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 4,
  },
  notesToggleText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: '#6B7280',
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#1F2937',
    minHeight: 72,
    marginBottom: 12,
  },

  // ----- Decision buttons -----
  decisionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  decisionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  decisionButtonDisabled: {
    opacity: 0.5,
  },
  decisionButtonText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
    flexShrink: 1,
  },

  // ----- Submitted card -----
  submittedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  submittedIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submittedTextWrap: {
    flex: 1,
  },
  submittedLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: '#1F2937',
  },
  submittedCompetency: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  submittedStudent: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },

  // ----- Empty state -----
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 20,
    color: '#1F2937',
    marginTop: 8,
  },
  emptySubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
