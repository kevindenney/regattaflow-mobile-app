/**
 * MediaLinkInput — Inline form for adding media links with auto-detected platform.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';
import { detectMediaPlatform } from '@/lib/utils/detectPlatform';
import type { MediaLink, MediaLinkPlatform } from '@/types/step-detail';

const PLATFORM_LABELS: Record<MediaLinkPlatform, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  google_photos: 'Google Photos',
  apple_photos: 'Apple Photos',
  other: 'Link',
};

const PLATFORM_ICONS: Record<MediaLinkPlatform, string> = {
  youtube: 'logo-youtube',
  instagram: 'logo-instagram',
  tiktok: 'logo-tiktok',
  google_photos: 'images',
  apple_photos: 'images',
  other: 'link',
};

interface MediaLinkInputProps {
  onAdd: (link: MediaLink) => void;
}

export function MediaLinkInput({ onAdd }: MediaLinkInputProps) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<MediaLinkPlatform>('other');

  const handleUrlChange = useCallback((text: string) => {
    setUrl(text);
    setDetectedPlatform(detectMediaPlatform(text));
  }, []);

  const handleAdd = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) return;

    const link: MediaLink = {
      id: `ml_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      url: trimmed,
      caption: caption.trim() || undefined,
      platform: detectedPlatform,
      added_at: new Date().toISOString(),
    };

    onAdd(link);
    setUrl('');
    setCaption('');
    setDetectedPlatform('other');
  }, [url, caption, detectedPlatform, onAdd]);

  const hasUrl = url.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.urlRow}>
        <TextInput
          style={styles.urlInput}
          value={url}
          onChangeText={handleUrlChange}
          placeholder="Paste a link (YouTube, Instagram, etc.)"
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {hasUrl && detectedPlatform !== 'other' && (
          <View style={styles.platformBadge}>
            <Ionicons
              name={PLATFORM_ICONS[detectedPlatform] as any}
              size={12}
              color={STEP_COLORS.accent}
            />
            <Text style={styles.platformText}>{PLATFORM_LABELS[detectedPlatform]}</Text>
          </View>
        )}
      </View>
      {hasUrl && (
        <View style={styles.captionRow}>
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="Caption (optional)"
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
          />
          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: IOS_SPACING.xs,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
  },
  urlInput: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray4,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 8,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: STEP_COLORS.accentLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  platformText: {
    fontSize: 11,
    fontWeight: '600',
    color: STEP_COLORS.accent,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
  },
  captionInput: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray4,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 8,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: STEP_COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
