/**
 * Offline Map Controls Component
 *
 * React Native universal component for managing offline map downloads.
 * OnX Maps-style venue package management with download progress and storage tracking.
 *
 * Features:
 * - Browse and download venue packages
 * - Download progress tracking
 * - Storage usage visualization
 * - Package management (delete, update)
 * - Preset selection (Essential/Standard/Premium/Championship)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import {
  VenuePackageService,
  type VenuePackage,
  type PackageDownloadStatus,
  type PackagePreset
} from '@/services/VenuePackageService';
import type { SailingVenue } from '@/types/venues';
import type { DownloadProgress } from '@/services/OfflineTileCacheService';

interface OfflineMapControlsProps {
  /** Available venues */
  venues: SailingVenue[];

  /** Currently selected venue (optional) */
  currentVenue?: SailingVenue;

  /** Optional: Custom style for the container */
  style?: any;

  /** Callback when download starts */
  onDownloadStart?: (venue: SailingVenue) => void;

  /** Callback when download completes */
  onDownloadComplete?: (venue: SailingVenue) => void;
}

export function OfflineMapControls({
  venues,
  currentVenue,
  style,
  onDownloadStart,
  onDownloadComplete
}: OfflineMapControlsProps) {
  const [expanded, setExpanded] = useState(false);
  const [packageService] = useState(() => new VenuePackageService());
  const [downloadedPackages, setDownloadedPackages] = useState<PackageDownloadStatus[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<SailingVenue | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PackagePreset>('standard');
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [storageUsageMB, setStorageUsageMB] = useState(0);

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    await packageService.initialize();
    await refreshDownloadedPackages();
  };

  const refreshDownloadedPackages = async () => {
    const packages = await packageService.getAllPackages();
    setDownloadedPackages(packages);

    // Calculate total storage
    const totalStorage = packages.reduce((sum, pkg) => sum + pkg.sizeOnDiskMB, 0);
    setStorageUsageMB(totalStorage);
  };

  const handleDownloadPackage = async (venue: SailingVenue, preset: PackagePreset) => {
    // Check storage
    const pkg = packageService.createVenuePackage(venue, preset);
    const hasStorage = await packageService.hasEnoughStorage(pkg.estimatedSizeMB);

    if (!hasStorage) {
      Alert.alert(
        'Insufficient Storage',
        `This package requires ${pkg.estimatedSizeMB} MB but you may not have enough space. Continue anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => startDownload(venue, preset) }
        ]
      );
      return;
    }

    startDownload(venue, preset);
  };

  const startDownload = async (venue: SailingVenue, preset: PackagePreset) => {
    setIsDownloading(true);
    setDownloadProgress(null);
    onDownloadStart?.(venue);

    const pkg = packageService.createVenuePackage(venue, preset);

    try {
      await packageService.downloadVenuePackage(pkg, (progress) => {
        setDownloadProgress(progress);
      });

      await refreshDownloadedPackages();
      onDownloadComplete?.(venue);

      Alert.alert(
        'Download Complete',
        `${venue.name} offline maps are now available.`
      );
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert(
        'Download Failed',
        `Failed to download ${venue.name}. Please try again.`
      );
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleDeletePackage = async (venueId: string, venueName: string) => {
    Alert.alert(
      'Delete Offline Maps',
      `Delete offline maps for ${venueName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await packageService.deleteVenuePackage(venueId);
            await refreshDownloadedPackages();
          }
        }
      ]
    );
  };

  const getPresetBadgeColor = (preset: PackagePreset): string => {
    switch (preset) {
      case 'essential': return '#4CAF50';
      case 'standard': return '#2196F3';
      case 'premium': return '#9C27B0';
      case 'championship': return '#FF9800';
    }
  };

  const getPresetLabel = (preset: PackagePreset): string => {
    switch (preset) {
      case 'essential': return 'Essential';
      case 'standard': return 'Standard';
      case 'premium': return 'Premium';
      case 'championship': return 'Championship';
    }
  };

  const formatSize = (mb: number): string => {
    if (mb < 1) return `${Math.round(mb * 1024)} KB`;
    if (mb < 1024) return `${Math.round(mb)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Compact Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>📥</Text>
          <Text style={styles.headerTitle}>Offline Maps</Text>
          <Text style={styles.storageBadge}>{formatSize(storageUsageMB)}</Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '−' : '+'}</Text>
      </TouchableOpacity>

      {/* Expanded Controls */}
      {expanded && (
        <ScrollView style={styles.expandedContent}>
          {/* Storage Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storage</Text>
            <View style={styles.storageBar}>
              <View
                style={[
                  styles.storageBarFill,
                  { width: `${Math.min((storageUsageMB / 500) * 100, 100)}%` }
                ]}
              />
            </View>
            <Text style={styles.storageText}>
              {formatSize(storageUsageMB)} of 500 MB used ({downloadedPackages.length} venues)
            </Text>
          </View>

          {/* Downloaded Packages */}
          {downloadedPackages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Downloaded Venues</Text>
              {downloadedPackages.map(pkg => (
                <View key={pkg.venueId} style={styles.packageCard}>
                  <View style={styles.packageHeader}>
                    <Text style={styles.packageName}>{pkg.venueName}</Text>
                    <TouchableOpacity
                      onPress={() => handleDeletePackage(pkg.venueId, pkg.venueName)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.packageInfo}>
                    <Text style={styles.packageInfoText}>
                      {formatSize(pkg.sizeOnDiskMB)} • {pkg.layers.length} layers
                    </Text>
                    {pkg.downloadedAt && (
                      <Text style={styles.packageInfoText}>
                        Downloaded {new Date(pkg.downloadedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Download Progress */}
          {isDownloading && downloadProgress && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Downloading...</Text>
              <View style={styles.progressCard}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${downloadProgress.percentComplete}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(downloadProgress.percentComplete)}% - {downloadProgress.downloadedTiles} of {downloadProgress.totalTiles} tiles
                </Text>
                {downloadProgress.estimatedTimeRemaining > 0 && (
                  <Text style={styles.progressTimeText}>
                    ~{formatTime(downloadProgress.estimatedTimeRemaining)} remaining
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Available Venues */}
          {!isDownloading && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Download Venue</Text>

              {/* Preset Selector */}
              <View style={styles.presetSelector}>
                {(['essential', 'standard', 'premium', 'championship'] as PackagePreset[]).map(preset => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetButton,
                      selectedPreset === preset && styles.presetButtonActive
                    ]}
                    onPress={() => setSelectedPreset(preset)}
                  >
                    <View style={[styles.presetBadge, { backgroundColor: getPresetBadgeColor(preset) }]}>
                      <Text style={styles.presetBadgeText}>{getPresetLabel(preset)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Venue List */}
              {venues
                .filter(venue => !downloadedPackages.some(pkg => pkg.venueId === venue.id))
                .map(venue => {
                  const pkg = packageService.createVenuePackage(venue, selectedPreset);
                  const recommended = packageService.getRecommendedPreset(venue);

                  return (
                    <View key={venue.id} style={styles.venueCard}>
                      <View style={styles.venueHeader}>
                        <View style={styles.venueInfo}>
                          <Text style={styles.venueName}>{venue.name}</Text>
                          {recommended === selectedPreset && (
                            <Text style={styles.recommendedBadge}>Recommended</Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.downloadButton}
                          onPress={() => handleDownloadPackage(venue, selectedPreset)}
                        >
                          <Text style={styles.downloadButtonText}>Download</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.venueSize}>
                        {formatSize(pkg.estimatedSizeMB)} • {pkg.tileCount.toLocaleString()} tiles
                      </Text>
                      <Text style={styles.venueLayers}>
                        Layers: {pkg.layers.join(', ')}
                      </Text>
                    </View>
                  );
                })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84
      },
      android: {
        elevation: 5
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
      }
    })
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  storageBadge: {
    backgroundColor: '#3E95CD',
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  expandIcon: {
    fontSize: 20,
    color: '#3E95CD',
    fontWeight: 'bold'
  },
  expandedContent: {
    maxHeight: 500,
    padding: 12
  },
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  storageBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4
  },
  storageText: {
    fontSize: 12,
    color: '#666'
  },
  packageCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  packageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f44336'
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  packageInfo: {
    flexDirection: 'row',
    gap: 8
  },
  packageInfoText: {
    fontSize: 11,
    color: '#666'
  },
  progressCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3
  },
  progressText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500'
  },
  progressTimeText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4
  },
  presetSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  presetButton: {
    flex: 1
  },
  presetButtonActive: {
    opacity: 1
  },
  presetBadge: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center'
  },
  presetBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600'
  },
  venueCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  venueInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  venueName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  recommendedBadge: {
    fontSize: 10,
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontWeight: '600'
  },
  downloadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#3E95CD'
  },
  downloadButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  venueSize: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  venueLayers: {
    fontSize: 11,
    color: '#999'
  }
});
