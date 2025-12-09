/**
 * Tracks Card Component
 * 
 * Displays imported GPS tracks in a race detail view.
 * Shows track statistics and allows viewing/removing tracks.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Track, TrackingDeviceType } from '@/services/tracking/types';
import { TrackingService } from '@/services/tracking';

// ============================================================================
// Types
// ============================================================================

export interface TracksCardProps {
  tracks: Track[];
  onRemoveTrack?: (trackId: string) => void;
  onViewTrack?: (track: Track) => void;
  onImportMore?: () => void;
  onAnalyze?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEVICE_LABELS: Record<TrackingDeviceType, string> = {
  velocitek_speedpuck: 'SpeedPuck',
  velocitek_shift: 'Shift',
  velocitek_prostart: 'ProStart',
  velocitek_rtk_puck: 'RTK Puck',
  tractrac: 'TracTrac',
  tacktracker: 'TackTracker',
  estela: 'eStela',
  kwindoo: 'KWINDOO',
  smartphone_gps: 'Smartphone',
  ais: 'AIS',
  generic_gpx: 'GPX',
  unknown: 'Unknown',
};

const DEVICE_ICONS: Record<TrackingDeviceType, keyof typeof Ionicons.glyphMap> = {
  velocitek_speedpuck: 'speedometer',
  velocitek_shift: 'compass',
  velocitek_prostart: 'flag',
  velocitek_rtk_puck: 'locate',
  tractrac: 'radio',
  tacktracker: 'analytics',
  estela: 'phone-portrait',
  kwindoo: 'phone-portrait',
  smartphone_gps: 'phone-portrait',
  ais: 'boat',
  generic_gpx: 'navigate',
  unknown: 'help-circle',
};

const TRACK_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
];

// ============================================================================
// Component
// ============================================================================

export function TracksCard({
  tracks,
  onRemoveTrack,
  onViewTrack,
  onImportMore,
  onAnalyze,
}: TracksCardProps) {
  const trackingService = new TrackingService();

  if (tracks.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="map-marker-path" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.title}>GPS Tracks</Text>
        </View>

        <View style={styles.emptyState}>
          <Ionicons name="navigate-outline" size={40} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Tracks Imported</Text>
          <Text style={styles.emptyDescription}>
            Import GPS tracks from Velocitek, GPX files, or connect to live tracking.
          </Text>
          {onImportMore && (
            <TouchableOpacity style={styles.importButton} onPress={onImportMore}>
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.importButtonText}>Import Track</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="map-marker-path" size={20} color="#3B82F6" />
        </View>
        <Text style={styles.title}>GPS Tracks</Text>
        <View style={styles.trackCount}>
          <Text style={styles.trackCountText}>{tracks.length}</Text>
        </View>
      </View>

      {/* Tracks List */}
      <ScrollView
        style={styles.tracksList}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tracksListContent}
      >
        {tracks.map((track, index) => {
          const stats = trackingService.calculateStats(track);
          const color = TRACK_COLORS[index % TRACK_COLORS.length];
          
          return (
            <TouchableOpacity
              key={track.id}
              style={styles.trackItem}
              onPress={() => onViewTrack?.(track)}
              activeOpacity={0.7}
            >
              {/* Color Bar */}
              <View style={[styles.trackColorBar, { backgroundColor: color }]} />

              {/* Track Info */}
              <View style={styles.trackContent}>
                <View style={styles.trackHeader}>
                  <Ionicons
                    name={DEVICE_ICONS[track.deviceType]}
                    size={16}
                    color="#64748B"
                  />
                  <Text style={styles.trackDevice}>
                    {DEVICE_LABELS[track.deviceType]}
                  </Text>
                </View>

                <Text style={styles.trackName} numberOfLines={1}>
                  {track.metadata?.name || `Track ${index + 1}`}
                </Text>

                {/* Stats */}
                <View style={styles.trackStats}>
                  <View style={styles.stat}>
                    <Ionicons name="speedometer-outline" size={12} color="#94A3B8" />
                    <Text style={styles.statValue}>
                      {stats.maxSpeed.toFixed(1)} kn max
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="navigate-outline" size={12} color="#94A3B8" />
                    <Text style={styles.statValue}>
                      {stats.distance.toFixed(1)} nm
                    </Text>
                  </View>
                </View>

                <Text style={styles.trackDuration}>
                  {formatDuration(stats.duration)}
                </Text>
              </View>

              {/* Remove Button */}
              {onRemoveTrack && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => onRemoveTrack(track.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Add More Button */}
        {onImportMore && (
          <TouchableOpacity style={styles.addMoreCard} onPress={onImportMore}>
            <Ionicons name="add" size={24} color="#94A3B8" />
            <Text style={styles.addMoreText}>Add Track</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Analyze Button */}
      {tracks.length > 0 && onAnalyze && (
        <TouchableOpacity style={styles.analyzeButton} onPress={onAnalyze}>
          <Ionicons name="analytics-outline" size={18} color="#3B82F6" />
          <Text style={styles.analyzeButtonText}>Analyze Performance</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Format duration
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  trackCount: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trackCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 12,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tracksList: {
    marginHorizontal: -16,
  },
  tracksListContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  trackItem: {
    width: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    overflow: 'hidden',
  },
  trackColorBar: {
    height: 4,
  },
  trackContent: {
    padding: 12,
    gap: 6,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackDevice: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  trackName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  trackStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 11,
    color: '#64748B',
  },
  trackDuration: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  addMoreCard: {
    width: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 24,
  },
  addMoreText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 16,
    gap: 6,
  },
  analyzeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});

export default TracksCard;


