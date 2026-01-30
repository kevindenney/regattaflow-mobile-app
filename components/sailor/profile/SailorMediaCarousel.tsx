/**
 * SailorMediaCarousel - Strava-style photo gallery carousel
 *
 * Displays a horizontal scrollable carousel of sailor photos at the top of profiles.
 * Supports:
 * - Horizontal paging
 * - Page indicator dots
 * - Full-screen modal on tap
 * - Add Photo button (own profile only)
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { X, Plus, Camera, ImageIcon } from 'lucide-react-native';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import { SailorProfileService, type SailorMedia } from '@/services/SailorProfileService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 200;
const ITEM_WIDTH = SCREEN_WIDTH - IOS_SPACING.lg * 2;

interface SailorMediaCarouselProps {
  userId: string;
  media: SailorMedia[];
  isOwnProfile: boolean;
  onMediaAdded?: () => void;
}

export function SailorMediaCarousel({
  userId,
  media,
  isOwnProfile,
  onMediaAdded,
}: SailorMediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<SailorMedia | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / ITEM_WIDTH);
      if (index !== activeIndex && index >= 0 && index < (media.length + (isOwnProfile ? 1 : 0))) {
        setActiveIndex(index);
      }
    },
    [activeIndex, media.length, isOwnProfile]
  );

  const handleMediaPress = useCallback((item: SailorMedia) => {
    triggerHaptic('selection');
    setSelectedMedia(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedMedia(null);
  }, []);

  const handleAddPhoto = useCallback(async () => {
    triggerHaptic('selection');

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant access to your photo library to add photos.'
      );
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    setIsUploading(true);
    try {
      // In a real implementation, you would upload to storage first
      // For now, we'll just call the service with the local URI
      await SailorProfileService.addMedia(userId, {
        mediaUrl: result.assets[0].uri,
        mediaType: 'image',
      });

      triggerHaptic('success');
      onMediaAdded?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to add photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [userId, onMediaAdded]);

  const renderItem = useCallback(
    ({ item, index }: { item: SailorMedia | 'add'; index: number }) => {
      if (item === 'add') {
        return (
          <Pressable
            style={({ pressed }) => [
              styles.addPhotoCard,
              pressed && styles.itemPressed,
            ]}
            onPress={handleAddPhoto}
            disabled={isUploading}
          >
            <View style={styles.addPhotoContent}>
              <View style={styles.addPhotoIconContainer}>
                <Camera size={32} color={IOS_COLORS.systemBlue} />
              </View>
              <Text style={styles.addPhotoText}>
                {isUploading ? 'Uploading...' : 'Add Photo'}
              </Text>
              <Text style={styles.addPhotoSubtext}>
                Share your sailing moments
              </Text>
            </View>
          </Pressable>
        );
      }

      return (
        <Pressable
          style={({ pressed }) => [
            styles.mediaItem,
            pressed && styles.itemPressed,
          ]}
          onPress={() => handleMediaPress(item)}
        >
          <ExpoImage
            source={{ uri: item.thumbnailUrl || item.mediaUrl }}
            style={styles.mediaImage}
            contentFit="cover"
            transition={200}
          />
          {item.caption && (
            <View style={styles.captionOverlay}>
              <Text style={styles.captionText} numberOfLines={1}>
                {item.caption}
              </Text>
            </View>
          )}
          {item.regattaName && (
            <View style={styles.regattaBadge}>
              <Text style={styles.regattaBadgeText} numberOfLines={1}>
                {item.regattaName}
              </Text>
            </View>
          )}
        </Pressable>
      );
    },
    [handleMediaPress, handleAddPhoto, isUploading]
  );

  // If no media and not own profile, show empty state
  if (media.length === 0 && !isOwnProfile) {
    return (
      <View style={styles.emptyContainer}>
        <ImageIcon size={40} color={IOS_COLORS.tertiaryLabel} />
        <Text style={styles.emptyText}>No photos yet</Text>
      </View>
    );
  }

  // Build data array - add 'add' card at end if own profile
  const dataWithAdd: (SailorMedia | 'add')[] = [
    ...media,
    ...(isOwnProfile ? (['add'] as const) : []),
  ];

  const totalItems = dataWithAdd.length;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={dataWithAdd}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item === 'add' ? 'add-photo' : item.id
        }
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={ITEM_WIDTH + IOS_SPACING.sm}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH + IOS_SPACING.sm,
          offset: (ITEM_WIDTH + IOS_SPACING.sm) * index,
          index,
        })}
      />

      {/* Page Indicator Dots */}
      {totalItems > 1 && (
        <View style={styles.dotsContainer}>
          {dataWithAdd.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Full-screen Modal */}
      <Modal
        visible={!!selectedMedia}
        animationType="fade"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalBackdrop} onPress={handleCloseModal} />

          {selectedMedia && (
            <View style={styles.modalContent}>
              <ExpoImage
                source={{ uri: selectedMedia.mediaUrl }}
                style={styles.modalImage}
                contentFit="contain"
                transition={300}
              />

              {selectedMedia.caption && (
                <Text style={styles.modalCaption}>{selectedMedia.caption}</Text>
              )}

              <Pressable
                style={styles.closeButton}
                onPress={handleCloseModal}
                hitSlop={16}
              >
                <X size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: IOS_SPACING.md,
  },
  listContent: {
    paddingHorizontal: IOS_SPACING.lg,
  },
  mediaItem: {
    width: ITEM_WIDTH,
    height: CAROUSEL_HEIGHT,
    borderRadius: IOS_RADIUS.lg,
    overflow: 'hidden',
    marginRight: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemGray6,
  },
  itemPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  captionText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: '#FFFFFF',
  },
  regattaBadge: {
    position: 'absolute',
    top: IOS_SPACING.sm,
    left: IOS_SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.xs,
    borderRadius: IOS_RADIUS.sm,
  },
  regattaBadgeText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  addPhotoCard: {
    width: ITEM_WIDTH,
    height: CAROUSEL_HEIGHT,
    borderRadius: IOS_RADIUS.lg,
    marginRight: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderWidth: 2,
    borderColor: IOS_COLORS.systemGray5,
    borderStyle: 'dashed',
  },
  addPhotoContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: IOS_SPACING.lg,
  },
  addPhotoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IOS_SPACING.md,
  },
  addPhotoText: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.systemBlue,
    marginBottom: IOS_SPACING.xs,
  },
  addPhotoSubtext: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: IOS_SPACING.md,
    gap: IOS_SPACING.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.systemGray4,
  },
  dotActive: {
    backgroundColor: IOS_COLORS.systemBlue,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.lg,
    marginBottom: IOS_SPACING.md,
  },
  emptyText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: IOS_SPACING.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalCaption: {
    ...IOS_TYPOGRAPHY.body,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: IOS_SPACING.xl,
    position: 'absolute',
    bottom: IOS_SPACING.xl,
  },
  closeButton: {
    position: 'absolute',
    top: IOS_SPACING.xl,
    right: IOS_SPACING.xl,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
