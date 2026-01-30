/**
 * PhotoGallerySection - Race photos timeline
 *
 * Shows a gallery of race photos with filtering
 * by race/venue and a lightbox view.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { RacePhoto } from '@/hooks/useReflectProfile';

interface PhotoGallerySectionProps {
  photos: RacePhoto[];
  onPhotoPress?: (photoId: string) => void;
  onAddPhoto?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const THUMBNAIL_SIZE = (screenWidth - 48 - 8) / 3; // 3 columns with gaps

type FilterOption = 'all' | 'races' | 'venues';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getSourceIcon(source: RacePhoto['source']): string {
  const icons: Record<RacePhoto['source'], string> = {
    upload: 'camera',
    race_result: 'trophy',
    shared: 'share',
    club: 'business',
  };
  return icons[source] || 'image';
}

function PhotoThumbnail({
  photo,
  onPress,
}: {
  photo: RacePhoto;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.thumbnail,
        pressed && styles.thumbnailPressed,
      ]}
      onPress={onPress}
    >
      <Image
        source={{ uri: photo.thumbnailUrl || photo.url }}
        style={styles.thumbnailImage}
        resizeMode="cover"
      />
      {photo.regattaName && (
        <View style={styles.thumbnailOverlay}>
          <Text style={styles.thumbnailLabel} numberOfLines={1}>
            {photo.regattaName}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function LightboxModal({
  photos,
  initialIndex,
  visible,
  onClose,
}: {
  photos: RacePhoto[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentPhoto = photos[currentIndex];

  if (!currentPhoto) return null;

  const goNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.lightbox}>
        {/* Close button */}
        <Pressable
          style={({ pressed }) => [
            styles.lightboxClose,
            pressed && styles.lightboxClosePressed,
          ]}
          onPress={onClose}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>

        {/* Image */}
        <View style={styles.lightboxImageContainer}>
          <Image
            source={{ uri: currentPhoto.url }}
            style={styles.lightboxImage}
            resizeMode="contain"
          />
        </View>

        {/* Navigation */}
        {photos.length > 1 && (
          <>
            {currentIndex > 0 && (
              <Pressable
                style={[styles.lightboxNav, styles.lightboxNavPrev]}
                onPress={goPrev}
              >
                <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
              </Pressable>
            )}
            {currentIndex < photos.length - 1 && (
              <Pressable
                style={[styles.lightboxNav, styles.lightboxNavNext]}
                onPress={goNext}
              >
                <Ionicons name="chevron-forward" size={32} color="#FFFFFF" />
              </Pressable>
            )}
          </>
        )}

        {/* Info */}
        <View style={styles.lightboxInfo}>
          {currentPhoto.caption && (
            <Text style={styles.lightboxCaption}>{currentPhoto.caption}</Text>
          )}
          <View style={styles.lightboxMeta}>
            {currentPhoto.regattaName && (
              <Text style={styles.lightboxMetaText}>
                {currentPhoto.regattaName}
              </Text>
            )}
            {currentPhoto.venueName && (
              <Text style={styles.lightboxMetaText}>
                {currentPhoto.venueName}
              </Text>
            )}
            <Text style={styles.lightboxMetaText}>
              {formatDate(currentPhoto.takenAt)}
            </Text>
          </View>
          {/* Counter */}
          <Text style={styles.lightboxCounter}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function FilterChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterChipText,
          isActive && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function PhotoGallerySection({
  photos,
  onPhotoPress,
  onAddPhoto,
}: PhotoGallerySectionProps) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Group photos by month for timeline
  const groupedPhotos = useMemo(() => {
    const filtered =
      filter === 'all'
        ? photos
        : filter === 'races'
        ? photos.filter((p) => p.regattaId)
        : photos.filter((p) => p.venueName);

    const groups: { month: string; photos: RacePhoto[] }[] = [];
    const monthMap = new Map<string, RacePhoto[]>();

    filtered.forEach((photo) => {
      const date = new Date(photo.takenAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, []);
      }
      monthMap.get(monthKey)!.push(photo);
    });

    // Sort by month descending
    const sortedKeys = Array.from(monthMap.keys()).sort((a, b) => b.localeCompare(a));

    sortedKeys.forEach((key) => {
      const [year, month] = key.split('-');
      const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      groups.push({
        month: monthLabel,
        photos: monthMap.get(key)!.sort(
          (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
        ),
      });
    });

    return groups;
  }, [photos, filter]);

  const handlePhotoPress = (photo: RacePhoto) => {
    const allFiltered =
      filter === 'all'
        ? photos
        : filter === 'races'
        ? photos.filter((p) => p.regattaId)
        : photos.filter((p) => p.venueName);
    const index = allFiltered.findIndex((p) => p.id === photo.id);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxVisible(true);
    onPhotoPress?.(photo.id);
  };

  const allFilteredPhotos =
    filter === 'all'
      ? photos
      : filter === 'races'
      ? photos.filter((p) => p.regattaId)
      : photos.filter((p) => p.venueName);

  if (photos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Photo Gallery</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="images-outline"
            size={40}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyText}>No Photos Yet</Text>
          <Text style={styles.emptySubtext}>
            Add photos from your races to build your gallery
          </Text>
          {onAddPhoto && (
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
              onPress={onAddPhoto}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Photos</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Photo Gallery</Text>
          <Text style={styles.photoCount}>{photos.length} photos</Text>
        </View>
        {onAddPhoto && (
          <Pressable
            style={({ pressed }) => [
              styles.addIconButton,
              pressed && styles.addIconButtonPressed,
            ]}
            onPress={onAddPhoto}
          >
            <Ionicons name="add" size={20} color={IOS_COLORS.systemBlue} />
          </Pressable>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <FilterChip
          label="All"
          isActive={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterChip
          label="Races"
          isActive={filter === 'races'}
          onPress={() => setFilter('races')}
        />
        <FilterChip
          label="Venues"
          isActive={filter === 'venues'}
          onPress={() => setFilter('venues')}
        />
      </View>

      {/* Photo Grid by Month */}
      {groupedPhotos.map((group) => (
        <View key={group.month} style={styles.monthGroup}>
          <Text style={styles.monthLabel}>{group.month}</Text>
          <View style={styles.photoGrid}>
            {group.photos.map((photo) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                onPress={() => handlePhotoPress(photo)}
              />
            ))}
          </View>
        </View>
      ))}

      {/* Lightbox */}
      <LightboxModal
        photos={allFilteredPhotos}
        initialIndex={lightboxIndex}
        visible={lightboxVisible}
        onClose={() => setLightboxVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  photoCount: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  addIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconButtonPressed: {
    opacity: 0.7,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.systemGray5,
  },
  filterChipActive: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  monthGroup: {
    marginBottom: 16,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 4,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: IOS_COLORS.systemGray5,
  },
  thumbnailPressed: {
    opacity: 0.7,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  thumbnailLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Lightbox styles
  lightbox: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxClosePressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  lightboxImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  lightboxImage: {
    width: screenWidth,
    height: screenHeight * 0.6,
  },
  lightboxNav: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    marginTop: -25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
  },
  lightboxNavPrev: {
    left: 16,
  },
  lightboxNavNext: {
    right: 16,
  },
  lightboxInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    paddingBottom: 40,
  },
  lightboxCaption: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  lightboxMeta: {
    gap: 4,
  },
  lightboxMetaText: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  lightboxCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default PhotoGallerySection;
