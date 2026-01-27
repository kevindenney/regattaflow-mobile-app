/**
 * MapPostMarkers
 *
 * Overlay for VenueHeroMap rendering geo-pinned posts as colored dots.
 * Colors: amber=tip, blue=question, red=safety, gray=other
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, TurboModuleRegistry } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TufteTokens } from '@/constants/designSystem';
import { POST_TYPE_CONFIG } from '@/types/community-feed';
import type { FeedPost, PostType } from '@/types/community-feed';

// Safely import Marker from react-native-maps
let Marker: any = null;
let Callout: any = null;

if (Platform.OS !== 'web') {
  try {
    const nativeModule = TurboModuleRegistry.get('RNMapsAirModule');
    if (nativeModule) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const maps = require('react-native-maps');
      Marker = maps.Marker;
      Callout = maps.Callout;
    }
  } catch {
    // Maps not available
  }
}

interface MapPostMarkersProps {
  posts: FeedPost[];
  onPostPress?: (post: FeedPost) => void;
}

const MARKER_COLORS: Record<PostType, string> = {
  tip: '#D97706',
  question: '#2563EB',
  report: '#059669',
  discussion: '#6B7280',
  safety_alert: '#DC2626',
};

export function MapPostMarkers({ posts, onPostPress }: MapPostMarkersProps) {
  if (!Marker) return null;

  return (
    <>
      {posts.map(post => {
        if (post.location_lat == null || post.location_lng == null) return null;

        const color = MARKER_COLORS[post.post_type] || '#6B7280';
        const config = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.discussion;

        return (
          <Marker
            key={post.id}
            coordinate={{
              latitude: post.location_lat,
              longitude: post.location_lng,
            }}
            tracksViewChanges={false}
            onPress={() => onPostPress?.(post)}
          >
            {/* Custom marker view */}
            <View style={[styles.marker, { backgroundColor: color }]}>
              <Ionicons name={config.icon as any} size={10} color="#FFFFFF" />
            </View>

            {/* Callout popover */}
            {Callout && (
              <Callout tooltip>
                <View style={styles.callout}>
                  <View style={[styles.calloutType, { backgroundColor: config.bgColor }]}>
                    <Text style={[styles.calloutTypeText, { color: config.color }]}>
                      {config.label}
                    </Text>
                  </View>
                  <Text style={styles.calloutTitle} numberOfLines={2}>
                    {post.title}
                  </Text>
                  <View style={styles.calloutMeta}>
                    <Ionicons name="arrow-up-outline" size={10} color="#6B7280" />
                    <Text style={styles.calloutMetaText}>{post.upvotes}</Text>
                    <Ionicons name="chatbubble-outline" size={10} color="#6B7280" />
                    <Text style={styles.calloutMetaText}>{post.comment_count}</Text>
                  </View>
                  {post.location_label && (
                    <Text style={styles.calloutLocation}>{post.location_label}</Text>
                  )}
                </View>
              </Callout>
            )}
          </Marker>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...TufteTokens.shadows.subtle,
    shadowOpacity: 0.3,
  },
  callout: {
    backgroundColor: '#FFFFFF',
    borderRadius: TufteTokens.borderRadius.subtle,
    padding: TufteTokens.spacing.standard,
    minWidth: 160,
    maxWidth: 220,
    gap: 4,
    ...TufteTokens.shadows.subtle,
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  calloutType: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: TufteTokens.borderRadius.minimal,
  },
  calloutTypeText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  calloutTitle: {
    ...TufteTokens.typography.secondary,
    color: '#111827',
    fontWeight: '500',
  },
  calloutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calloutMetaText: {
    ...TufteTokens.typography.micro,
    color: '#6B7280',
  },
  calloutLocation: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
  },
});

export default MapPostMarkers;
