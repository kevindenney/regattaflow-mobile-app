/**
 * Preceptor Dashboard Screen
 *
 * Displays pending student competency attempts awaiting preceptor review.
 * Each attempt is rendered as a PreceptorValidationCard where the preceptor
 * can submit their evaluation. On successful submission the card transitions
 * to a confirmed state and the list refreshes.
 */

import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/providers/AuthProvider';
import { useInterest } from '@/providers/InterestProvider';
import { PreceptorValidationCard } from '@/components/competency/PreceptorValidationCard';
import {
  getPendingValidations,
  submitPreceptorValidation,
} from '@/services/competencyService';
import type {
  AttemptWithCompetency,
  PreceptorValidationPayload,
} from '@/types/competency';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PreceptorDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, userProfile } = useAuth();
  const { currentInterest } = useInterest();
  const queryClient = useQueryClient();

  const userId = user?.id as string | undefined;

  // ---- Data fetching ----

  const {
    data: pendingValidations = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<AttemptWithCompetency[]>({
    queryKey: ['pending-validations', userId],
    queryFn: () => getPendingValidations(userId!),
    enabled: !!userId,
  });

  // ---- Handlers ----

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSubmitRating = useCallback(
    async (payload: PreceptorValidationPayload) => {
      if (!userId) return;
      await submitPreceptorValidation(userId, payload);
      // Invalidate the pending validations so the list refreshes
      queryClient.invalidateQueries({ queryKey: ['pending-validations', userId] });
    },
    [userId, queryClient],
  );

  // ---- Render helpers ----

  const renderItem = useCallback(
    ({ item }: { item: AttemptWithCompetency }) => (
      <View style={styles.cardWrapper}>
        <PreceptorValidationCard
          attempt={item}
          competencyTitle={item.competency.title}
          competencyNumber={item.competency.competency_number}
          onSubmitRating={handleSubmitRating}
          accentColor={currentInterest?.accent_color}
        />
      </View>
    ),
    [handleSubmitRating, currentInterest?.accent_color],
  );

  const keyExtractor = useCallback(
    (item: AttemptWithCompetency) => item.id,
    [],
  );

  // ---- Derived values ----

  const preceptorName = userProfile?.full_name ?? 'Preceptor';
  const pendingCount = pendingValidations.length;

  // ---- Empty state ----

  const renderEmptyState = useCallback(() => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="checkmark-circle" size={48} color="#15803D" />
        </View>
        <Text style={styles.emptyTitle}>All caught up!</Text>
        <Text style={styles.emptySubtitle}>
          No pending student validations right now. Check back later.
        </Text>
      </View>
    );
  }, [isLoading]);

  // ---- Header ----

  const renderHeader = useCallback(() => {
    return (
      <View style={styles.headerArea}>
        <Text style={styles.headerName}>{preceptorName}</Text>
        <Text style={styles.headerCount}>
          {isLoading
            ? 'Loading...'
            : `${pendingCount} pending validation${pendingCount !== 1 ? 's' : ''}`}
        </Text>
      </View>
    );
  }, [preceptorName, pendingCount, isLoading]);

  // ---- Loading state ----

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen
          options={{
            title: 'My Students',
            headerBackTitle: 'Back',
          }}
        />
        {renderHeader()}
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0097A7" />
          <Text style={styles.loadingText}>Loading validations...</Text>
        </View>
      </View>
    );
  }

  // ---- Main render ----

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: 'My Students',
          headerBackTitle: 'Back',
        }}
      />

      <FlatList
        data={pendingValidations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          pendingCount === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor="#0097A7"
          />
        }
        showsVerticalScrollIndicator={false}
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

  // Header
  headerArea: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  headerCount: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  cardWrapper: {
    marginBottom: 16,
  },

  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
