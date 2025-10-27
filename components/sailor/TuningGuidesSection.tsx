/**
 * TuningGuidesSection Component
 * Quick access to tuning guides with popular sources
 */

import { TuningGuide, tuningGuideService } from '@/services/tuningGuideService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TuningGuidesSectionProps {
  classId: string;
  className: string;
  sailorId?: string;
  onUpload?: () => void;
  onViewAll?: () => void;
}

export function TuningGuidesSection({
  classId,
  className,
  sailorId,
  onUpload,
  onViewAll,
}: TuningGuidesSectionProps) {
  const [guides, setGuides] = useState<TuningGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGuides();
  }, [classId]);

  const loadGuides = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tuningGuideService.getGuidesForClass(classId);
      setGuides(data.slice(0, 4)); // Show top 4 guides
    } catch (err) {
      console.error('Error loading tuning guides:', err);
      setError('Failed to load tuning guides');
    } finally {
      setLoading(false);
    }
  };

  const handleGuidePress = async (guide: TuningGuide) => {
    try {
      // Record view (if sailorId is available)
      if (sailorId) {
        await tuningGuideService.recordView(guide.id, sailorId);
      }

      // Open guide - try file URL first, then source URL
      const urlToOpen = guide.fileUrl || guide.sourceUrl;
      
      if (urlToOpen) {
        const canOpen = await Linking.canOpenURL(urlToOpen);
        if (canOpen) {
          await Linking.openURL(urlToOpen);
        } else {
          Alert.alert(
            'Link Not Available',
            `This guide links to ${guide.source}, but the URL may not be accessible. Would you like to visit ${guide.source}'s main website instead?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Visit Website',
                onPress: async () => {
                  const mainUrl = guide.sourceUrl || guide.fileUrl;
                  if (mainUrl) await Linking.openURL(mainUrl);
                },
              },
            ]
          );
        }
      } else {
        Alert.alert(
          'Not Available Yet',
          `This ${guide.source} guide hasn't been uploaded yet. You can search for more guides or upload your own.`,
          [
            { text: 'OK', style: 'cancel' },
            { text: 'Search Guides', onPress: handleAutoScrape },
          ]
        );
      }
    } catch (err) {
      console.error('Error opening guide:', err);
      Alert.alert(
        'Could Not Open Guide',
        `There was a problem opening the guide from ${guide.source}. The link may be broken or require a login.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleAutoScrape = async () => {
    try {
      Alert.alert(
        'Auto-Scrape Tuning Guides',
        `This will search for ${className} tuning guides from popular sources like North Sails and Quantum.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Search',
            onPress: async () => {
              await tuningGuideService.triggerAutoScrape(classId);
              Alert.alert('Success', 'Searching for tuning guides...');
              setTimeout(() => loadGuides(), 2000);
            },
          },
        ]
      );
    } catch (err) {
      console.error('Error auto-scraping:', err);
      Alert.alert('Error', 'Failed to search for tuning guides');
    }
  };

  const getFileIcon = (fileType: string): string => {
    switch (fileType) {
      case 'pdf':
        return 'document-text';
      case 'link':
        return 'link';
      case 'doc':
        return 'document';
      case 'image':
        return 'image';
      default:
        return 'document';
    }
  };

  const headerActionLabel = onUpload ? 'Upload Guide' : 'Auto Search';
  const headerActionIcon = onUpload ? 'cloud-upload-outline' : 'search-outline';
  const headerActionHandler = onUpload || handleAutoScrape;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading tuning guides...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadGuides}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconWrap}>
            <Text style={styles.headerIcon}>📖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Tuning Guides</Text>
            <Text style={styles.headerSubtitle}>
              {className ? `Latest rig notes for ${className}` : 'Latest rig and sail notes'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={headerActionHandler}
          activeOpacity={0.8}
        >
          <Ionicons name={headerActionIcon as any} size={18} color="#3B82F6" />
          <Text style={styles.headerActionText}>{headerActionLabel}</Text>
        </TouchableOpacity>
      </View>

      {guides.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={32} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Tuning Guides Yet</Text>
          <Text style={styles.emptyText}>
            Search for guides or upload your own
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={handleAutoScrape}
            >
              <Ionicons name="search" size={16} color="#FFFFFF" />
              <Text style={styles.emptyActionText}>Search</Text>
            </TouchableOpacity>
            {onUpload && (
              <TouchableOpacity
                style={[styles.emptyActionButton, styles.emptyActionButtonSecondary]}
                onPress={onUpload}
              >
                <Ionicons name="cloud-upload" size={16} color="#3B82F6" />
                <Text style={styles.emptyActionTextSecondary}>Upload</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.guidesScroll}
        >
          {guides.map((guide) => (
            <TouchableOpacity
              key={guide.id}
              style={styles.guideCard}
              onPress={() => handleGuidePress(guide)}
            >
              <View style={styles.guideIcon}>
                <Ionicons
                  name={getFileIcon(guide.fileType) as any}
                  size={32}
                  color="#3B82F6"
                />
              </View>
              <View style={styles.guideInfo}>
                <Text style={styles.guideSource} numberOfLines={1}>
                  {guide.source}
                </Text>
                <Text style={styles.guideTitle} numberOfLines={2}>
                  {guide.title}
                </Text>
                {guide.year && (
                  <Text style={styles.guideYear}>Updated {guide.year}</Text>
                )}
              </View>
              {guide.rating > 0 && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>{guide.rating.toFixed(1)}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Add Guide Card */}
          {onUpload && (
            <TouchableOpacity style={styles.addCard} onPress={onUpload}>
              <Ionicons name="add-circle-outline" size={32} color="#3B82F6" />
              <Text style={styles.addCardText}>Upload Guide</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {guides.length > 0 && (
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => {
            if (onViewAll) {
              onViewAll();
            } else {
              Alert.alert(
                `${className} Tuning Guides`,
                `You have ${guides.length} guide${guides.length > 1 ? 's' : ''} available. A full library view is coming soon!`,
                [{ text: 'OK' }]
              );
            }
          }}
        >
          <Text style={styles.viewAllText}>View All Guides ({guides.length})</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 20,
    padding: 20,
    marginVertical: 12,
    marginHorizontal: 16,
    boxShadow: '0px 4px',
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#C2410C',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#78350F',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#B45309',
    marginTop: 2,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  headerActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C2410C',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#78350F',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  guidesScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  guideCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    boxShadow: '0px 6px',
    elevation: 5,
  },
  guideIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  guideInfo: {
    flex: 1,
    gap: 4,
  },
  guideSource: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    textTransform: 'uppercase',
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    lineHeight: 18,
  },
  guideYear: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  addCard: {
    width: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#78350F',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#92400E',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyActionTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
