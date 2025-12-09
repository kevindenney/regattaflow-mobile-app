/**
 * Track Import Modal
 * 
 * Modal for importing GPS tracks from various sources:
 * - Velocitek devices (VCC files)
 * - GPX files
 * - Manage2Sail CSV exports
 * - TracTrac events
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { TrackingService } from '@/services/tracking';
import { Track, TrackImportResult, TrackingDeviceType } from '@/services/tracking/types';

// ============================================================================
// Types
// ============================================================================

export interface TrackImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportComplete: (tracks: Track[]) => void;
  raceId?: string;
}

type ImportSource = 'velocitek' | 'gpx' | 'manage2sail' | 'tractrac';

interface ImportSourceOption {
  id: ImportSource;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  fileTypes: string[];
  color: string;
}

// ============================================================================
// Constants
// ============================================================================

const IMPORT_SOURCES: ImportSourceOption[] = [
  {
    id: 'velocitek',
    name: 'Velocitek',
    icon: 'speedometer-outline',
    description: 'Import from SpeedPuck, Shift, or ProStart',
    fileTypes: ['.vcc', '.csv'],
    color: '#3B82F6',
  },
  {
    id: 'gpx',
    name: 'GPX File',
    icon: 'navigate-outline',
    description: 'Universal GPS exchange format',
    fileTypes: ['.gpx'],
    color: '#10B981',
  },
  {
    id: 'manage2sail',
    name: 'Manage2Sail',
    icon: 'boat-outline',
    description: 'Import entries from Manage2Sail CSV',
    fileTypes: ['.csv'],
    color: '#F59E0B',
  },
  {
    id: 'tractrac',
    name: 'TracTrac',
    icon: 'radio-outline',
    description: 'Connect to live TracTrac event',
    fileTypes: [],
    color: '#8B5CF6',
  },
];

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

// ============================================================================
// Component
// ============================================================================

export function TrackImportModal({
  visible,
  onClose,
  onImportComplete,
  raceId,
}: TrackImportModalProps) {
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<TrackImportResult | null>(null);
  const [tracTracEventId, setTracTracEventId] = useState('');

  const trackingService = new TrackingService();

  // Handle file selection
  const handleSelectFile = useCallback(async (source: ImportSourceOption) => {
    setSelectedSource(source.id);
    setError(null);
    setImportResult(null);

    if (source.id === 'tractrac') {
      // TracTrac doesn't use file import
      return;
    }

    try {
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: Platform.select({
          web: source.fileTypes.map(ext => {
            if (ext === '.gpx') return 'application/gpx+xml';
            if (ext === '.csv') return 'text/csv';
            if (ext === '.vcc') return 'application/octet-stream';
            return '*/*';
          }),
          default: '*/*',
        }),
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        setLoading(false);
        setSelectedSource(null);
        return;
      }

      const file = result.assets[0];
      
      // Read file content
      let fileData: ArrayBuffer | string;
      
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        if (file.name.endsWith('.vcc')) {
          fileData = await response.arrayBuffer();
        } else {
          fileData = await response.text();
        }
      } else {
        // React Native - read file
        const response = await fetch(file.uri);
        if (file.name.endsWith('.vcc')) {
          fileData = await response.arrayBuffer();
        } else {
          fileData = await response.text();
        }
      }

      // Parse file
      const parseResult = await trackingService.importFile({
        name: file.name,
        data: fileData,
      });

      setImportResult(parseResult);

      if (!parseResult.success) {
        setError(parseResult.errors?.join('\n') || 'Failed to import file');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to read file');
    } finally {
      setLoading(false);
    }
  }, [trackingService]);

  // Handle TracTrac connection
  const handleTracTracConnect = useCallback(async () => {
    if (!tracTracEventId.trim()) {
      setError('Please enter a TracTrac event ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tracTrac = trackingService.connectLiveTracking({
        eventId: tracTracEventId,
        onStatusChange: (status) => {
          if (status === 'error') {
            setError('Failed to connect to TracTrac');
            setLoading(false);
          } else if (status === 'connected') {
            setLoading(false);
            // Get initial positions as "tracks"
            const positions = trackingService.getLivePositions();
            // For live tracking, we don't have historical tracks
            // Just close and notify parent
            onClose();
          }
        },
      });
    } catch (e: any) {
      setError(e.message || 'Failed to connect to TracTrac');
      setLoading(false);
    }
  }, [tracTracEventId, trackingService, onClose]);

  // Handle import confirmation
  const handleConfirmImport = useCallback(() => {
    if (importResult?.success && importResult.tracks.length > 0) {
      onImportComplete(importResult.tracks);
      onClose();
    }
  }, [importResult, onImportComplete, onClose]);

  // Reset state when closing
  const handleClose = useCallback(() => {
    setSelectedSource(null);
    setLoading(false);
    setError(null);
    setImportResult(null);
    setTracTracEventId('');
    onClose();
  }, [onClose]);

  // Render import result preview
  const renderImportPreview = () => {
    if (!importResult?.success || importResult.tracks.length === 0) return null;

    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Import Preview</Text>
        
        {importResult.tracks.map((track, index) => (
          <View key={track.id} style={styles.trackPreview}>
            <View style={styles.trackIcon}>
              <Ionicons
                name={DEVICE_ICONS[track.deviceType]}
                size={20}
                color="#3B82F6"
              />
            </View>
            <View style={styles.trackInfo}>
              <Text style={styles.trackName}>
                {track.metadata?.name || `Track ${index + 1}`}
              </Text>
              <Text style={styles.trackMeta}>
                {track.points.length} points • {formatDuration(track.endTime - track.startTime)}
              </Text>
            </View>
          </View>
        ))}

        {importResult.warnings && importResult.warnings.length > 0 && (
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={16} color="#F59E0B" />
            <Text style={styles.warningText}>
              {importResult.warnings.join('\n')}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.importButton}
          onPress={handleConfirmImport}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.importButtonText}>
            Import {importResult.tracks.length} Track{importResult.tracks.length > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Import Tracks</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Source Selection */}
            {!selectedSource && !loading && (
              <View style={styles.sourceGrid}>
                {IMPORT_SOURCES.map((source) => (
                  <TouchableOpacity
                    key={source.id}
                    style={styles.sourceCard}
                    onPress={() => handleSelectFile(source)}
                  >
                    <View style={[styles.sourceIcon, { backgroundColor: `${source.color}15` }]}>
                      <Ionicons name={source.icon} size={28} color={source.color} />
                    </View>
                    <Text style={styles.sourceName}>{source.name}</Text>
                    <Text style={styles.sourceDescription}>{source.description}</Text>
                    {source.fileTypes.length > 0 && (
                      <Text style={styles.sourceFileTypes}>
                        {source.fileTypes.join(', ')}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Loading State */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>
                  {selectedSource === 'tractrac' ? 'Connecting...' : 'Processing file...'}
                </Text>
              </View>
            )}

            {/* Error State */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#EF4444" />
                <Text style={styles.errorTitle}>Import Failed</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setError(null);
                    setSelectedSource(null);
                  }}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Import Preview */}
            {!loading && !error && renderImportPreview()}

            {/* TracTrac Event Input */}
            {selectedSource === 'tractrac' && !loading && !error && (
              <View style={styles.tracTracContainer}>
                <Text style={styles.inputLabel}>TracTrac Event ID</Text>
                <View style={styles.inputRow}>
                  <View style={styles.textInput}>
                    <Text style={styles.textInputPlaceholder}>
                      {tracTracEventId || 'Enter event ID...'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={handleTracTracConnect}
                  >
                    <Text style={styles.connectButtonText}>Connect</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>
                  Find the event ID in the TracTrac event URL
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Format duration
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${seconds}s`;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sourceCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  sourceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  sourceDescription: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  sourceFileTypes: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  previewContainer: {
    gap: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  trackPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  trackIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: {
    flex: 1,
    gap: 2,
  },
  trackName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  trackMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    padding: 14,
    gap: 8,
    marginTop: 8,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tracTracContainer: {
    gap: 8,
    padding: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
  },
  textInputPlaceholder: {
    color: '#94A3B8',
    fontSize: 14,
  },
  connectButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default TrackImportModal;

