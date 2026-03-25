/**
 * Competency Detail Screen
 *
 * Displays the full detail view for a single competency, including
 * the sign-off chain pipeline, attempt history, and faculty reviews.
 * Provides a "Log New Attempt" action that opens the SelfAssessmentFlow modal.
 *
 * Route: /competency-detail?competencyId=...
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Pressable, Platform } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { useInterest } from '@/providers/InterestProvider';
import { useCompetencyDetail } from '@/hooks/useCompetencyDetail';
import { useCompetencyProgress } from '@/hooks/useCompetencyProgress';
import { CompetencyDetail } from '@/components/competency/CompetencyDetail';
import { SelfAssessmentFlow } from '@/components/competency/SelfAssessmentFlow';
import type { LogAttemptPayload } from '@/types/competency';

export default function CompetencyDetailScreen() {
  const { competencyId } = useLocalSearchParams<{ competencyId: string }>();
  const { userProfile } = useAuth();
  const { currentInterest } = useInterest();
  const insets = useSafeAreaInsets();

  const { detail, isLoading, error, refresh } = useCompetencyDetail(competencyId);
  const { logNewAttempt } = useCompetencyProgress();

  const accentColor = currentInterest?.accent_color ?? '#0097A7';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [showAssessment, setShowAssessment] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleLogAttempt = useCallback(() => {
    setShowAssessment(true);
  }, []);

  const handleCloseAssessment = useCallback(() => {
    setShowAssessment(false);
  }, []);

  const handleSubmitAssessment = useCallback(
    async (payload: LogAttemptPayload) => {
      await logNewAttempt(payload);
      refresh();
    },
    [logNewAttempt, refresh],
  );

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen
          options={{
            title: 'Competency',
            headerShown: true,
            headerBackTitle: 'Back',
            ...Platform.select({
              web: {
                headerLeft: () => (
                  <Text
                    style={styles.webBackButton}
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/reflect')}
                  >
                    ← Back
                  </Text>
                ),
              },
            }),
          }}
        />
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (error || !detail) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen
          options={{
            title: 'Competency',
            headerShown: true,
            headerBackTitle: 'Back',
            ...Platform.select({
              web: {
                headerLeft: () => (
                  <Text
                    style={styles.webBackButton}
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/reflect')}
                  >
                    ← Back
                  </Text>
                ),
              },
            }),
          }}
        />
        <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
        <Text style={styles.errorTitle}>Unable to load competency</Text>
        <Text style={styles.errorMessage}>
          {error?.message ?? 'Competency data could not be found.'}
        </Text>
        <Pressable
          style={[styles.retryButton, { backgroundColor: accentColor }]}
          onPress={refresh}
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: detail.competency.title,
          headerShown: true,
          headerBackTitle: 'Back',
          ...Platform.select({
            web: {
              headerLeft: () => (
                <Text
                  style={styles.webBackButton}
                  onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/reflect')}
                >
                  ← Back
                </Text>
              ),
            },
          }),
        }}
      />

      <CompetencyDetail
        detail={detail}
        isCurrentUserPreceptor={false} // TODO: detect from user role
        isCurrentUserFaculty={false} // TODO: detect from user role
        onLogAttempt={handleLogAttempt}
        onValidate={(progressId) => {
          /* TODO: future preceptor validation flow */
        }}
        onReview={(progressId) => {
          /* TODO: future faculty review flow */
        }}
        accentColor={accentColor}
      />

      <SelfAssessmentFlow
        visible={showAssessment}
        competency={detail.competency}
        onSubmit={handleSubmitAssessment}
        onClose={handleCloseAssessment}
        accentColor={accentColor}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  webBackButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    paddingHorizontal: 8,
  },
});
