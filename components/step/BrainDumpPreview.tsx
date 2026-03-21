/**
 * BrainDumpPreview — Rich preview cards for URLs detected in brain dump text.
 * Shows YouTube thumbnails, PDF icons, and article previews.
 */

import React from 'react';
import { View, Text, Image, Pressable, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';
import type { ExtractedUrl } from '@/types/step-detail';

interface BrainDumpPreviewProps {
  urls: ExtractedUrl[];
  onRemove?: (url: string) => void;
}

function getPlatformIcon(platform: ExtractedUrl['platform']): {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
} {
  switch (platform) {
    case 'youtube':
      return { name: 'play-circle', color: '#FF0000' };
    case 'pdf':
      return { name: 'document-text', color: '#E44D26' };
    case 'instagram':
      return { name: 'logo-instagram', color: '#E4405F' };
    case 'tiktok':
      return { name: 'musical-notes', color: '#000000' };
    case 'article':
      return { name: 'newspaper-outline', color: IOS_COLORS.systemBlue };
    default:
      return { name: 'link-outline', color: IOS_COLORS.secondaryLabel };
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function BrainDumpPreview({ urls, onRemove }: BrainDumpPreviewProps) {
  if (urls.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="link" size={14} color={STEP_COLORS.secondaryLabel} />
        <Text style={styles.headerText}>Detected Links</Text>
      </View>
      {urls.map((item) => {
        const icon = getPlatformIcon(item.platform);
        const hasThumb = item.platform === 'youtube' && item.thumbnail_url;

        return (
          <Pressable
            key={item.url}
            style={styles.card}
            onPress={() => Linking.openURL(item.url)}
          >
            {hasThumb ? (
              <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.iconBox, { backgroundColor: `${icon.color}15` }]}>
                <Ionicons name={icon.name} size={20} color={icon.color} />
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title || getDomain(item.url)}
              </Text>
              <Text style={styles.cardDomain} numberOfLines={1}>
                {getDomain(item.url)}
              </Text>
            </View>
            {onRemove && (
              <Pressable onPress={() => onRemove(item.url)} hitSlop={8} style={styles.removeButton}>
                <Ionicons name="close-circle" size={18} color={IOS_COLORS.systemGray3} />
              </Pressable>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: IOS_SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: STEP_COLORS.secondaryLabel,
    letterSpacing: 0.3,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STEP_COLORS.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STEP_COLORS.cardBorder,
    overflow: 'hidden',
    gap: IOS_SPACING.sm,
    paddingRight: IOS_SPACING.sm,
  },
  thumbnail: {
    width: 64,
    height: 48,
    borderTopLeftRadius: 9,
    borderBottomLeftRadius: 9,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: IOS_SPACING.sm,
  },
  cardContent: {
    flex: 1,
    paddingVertical: IOS_SPACING.xs,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: STEP_COLORS.label,
    lineHeight: 18,
  },
  cardDomain: {
    fontSize: 11,
    color: STEP_COLORS.tertiaryLabel,
    marginTop: 1,
  },
  removeButton: {
    padding: 4,
  },
});
