/**
 * Post Create Route
 *
 * Standalone post creation screen (for deep linking).
 * The primary UX is via the PostComposer modal from the feed.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PostComposer } from '@/components/venue/post/PostComposer';

export default function PostCreateRoute() {
  const { venueId, racingAreaId } = useLocalSearchParams<{
    venueId: string;
    racingAreaId?: string;
  }>();
  const router = useRouter();

  const handleDismiss = useCallback(() => {
    router.back();
  }, [router]);

  const handleSuccess = useCallback(() => {
    router.back();
  }, [router]);

  if (!venueId) return null;

  return (
    <View style={styles.container}>
      <PostComposer
        visible={true}
        venueId={venueId}
        racingAreaId={racingAreaId}
        onDismiss={handleDismiss}
        onSuccess={handleSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
