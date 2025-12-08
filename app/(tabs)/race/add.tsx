/**
 * Add Race Screen - Uses ComprehensiveRaceEntry (same as Edit Race)
 * Consolidated interface for adding new races with full AI extraction and validation
 * 
 * PROTECTED: Requires authentication to access
 */

import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { ComprehensiveRaceEntry } from '@/components/races';
import { useAuth } from '@/providers/AuthProvider';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('AddRaceScreen');

export default function AddRaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId?: string; courseName?: string }>();
  const { user, ready, signedIn } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (ready && !signedIn) {
      logger.debug('[AddRaceScreen] User not authenticated, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [ready, signedIn, router]);

  logger.debug('[AddRaceScreen] Rendered with params:', {
    courseId: params?.courseId,
    courseName: params?.courseName,
    signedIn,
    ready,
  });

  // Show loading while checking auth
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Don't render if not signed in (will redirect)
  if (!signedIn) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </View>
    );
  }

  const handleSubmit = (raceId: string) => {
    logger.debug('[AddRaceScreen] Race created:', raceId);
    // Navigate to race detail
    router.push(`/(tabs)/race/scrollable/${raceId}` as any);
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/races');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ComprehensiveRaceEntry
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialCourseId={params?.courseId as string | undefined}
        initialCourseName={params?.courseName as string | undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
});
