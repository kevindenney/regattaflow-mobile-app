/**
 * Race Event Validation Screen
 *
 * Shows AI extraction results with approve/edit/manual options
 * Vertical slice: AI Processing → Validation → Visualization
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import RaceEventService from '../../../services/RaceEventService';
import {
  RaceEventWithDetails,
  ExtractionStatus,
  DocumentProcessingJob
} from '../../../types/raceEvents';

export default function ValidateRaceEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [raceEvent, setRaceEvent] = useState<RaceEventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRaceEvent();

    // Poll for processing updates
    const interval = setInterval(() => {
      if (processing) {
        loadRaceEvent();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [id, processing]);

  const loadRaceEvent = async () => {
    if (!id) return;

    try {
      const { data, error } = await RaceEventService.getRaceEvent(id);

      if (error) throw error;
      if (!data) throw new Error('Race event not found');

      setRaceEvent(data);

      // Check if still processing
      if (data.extraction_status === ExtractionStatus.PROCESSING ||
          data.extraction_status === ExtractionStatus.PENDING) {
        setProcessing(true);
      } else {
        setProcessing(false);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading race event:', err);
      setError(err instanceof Error ? err.message : 'Failed to load race event');
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!raceEvent) return;

    try {
      // Update status to completed
      await RaceEventService.updateRaceEvent(raceEvent.id, {
        extraction_status: ExtractionStatus.COMPLETED
      });

      // Navigate to race intelligence dashboard
      router.push(`/race/intelligence/${raceEvent.id}`);
    } catch (err) {
      console.error('Error approving race:', err);
      setError('Failed to approve race');
    }
  };

  const handleEdit = () => {
    if (!raceEvent) return;
    router.push(`/race/edit/${raceEvent.id}`);
  };

  const handleManualMode = () => {
    if (!raceEvent) return;
    router.push(`/race/manual/${raceEvent.id}`);
  };

  if (loading && !raceEvent) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0080ff" />
        <Text style={styles.loadingText}>Loading race event...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadRaceEvent}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!raceEvent) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Race event not found</Text>
      </View>
    );
  }

  // Processing state
  if (processing) {
    return (
      <View style={styles.container}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#0080ff" />
          <Text style={styles.processingTitle}>
            🤖 AI Processing Documents...
          </Text>
          <Text style={styles.processingSubtitle}>
            Extracting race course, marks, and strategy
          </Text>

          {raceEvent.processing_jobs && raceEvent.processing_jobs.length > 0 && (
            <View style={styles.jobsList}>
              {raceEvent.processing_jobs.map((job, index) => (
                <View key={job.id} style={styles.jobItem}>
                  <Text style={styles.jobType}>{job.document_type}</Text>
                  <Text style={styles.jobStatus}>{job.status}</Text>
                  {job.progress_percentage > 0 && (
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${job.progress_percentage}%` }
                        ]}
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  // Extraction results
  const confidencePercent = Math.round((raceEvent.confidence_score || 0) * 100);
  const marksCount = raceEvent.marks?.length || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✓ Course Extracted</Text>
        <Text style={styles.subtitle}>
          Review AI-extracted race course
        </Text>
      </View>

      {/* Confidence Score */}
      <View style={styles.confidenceContainer}>
        <Text style={styles.confidenceLabel}>Extraction Confidence</Text>
        <View style={styles.confidenceBar}>
          <View
            style={[
              styles.confidenceFill,
              {
                width: `${confidencePercent}%`,
                backgroundColor: confidencePercent >= 80 ? '#00cc00' :
                                confidencePercent >= 50 ? '#ffcc00' : '#ff6600'
              }
            ]}
          />
        </View>
        <Text style={styles.confidenceText}>{confidencePercent}% confident</Text>
      </View>

      {/* Extracted Data Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Race Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Race Name:</Text>
          <Text style={styles.detailValue}>{raceEvent.race_name}</Text>
        </View>

        {raceEvent.race_series && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Series:</Text>
            <Text style={styles.detailValue}>{raceEvent.race_series}</Text>
          </View>
        )}

        {raceEvent.boat_class && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Class:</Text>
            <Text style={styles.detailValue}>{raceEvent.boat_class}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Start Time:</Text>
          <Text style={styles.detailValue}>
            {new Date(raceEvent.start_time).toLocaleString()}
          </Text>
        </View>

        {raceEvent.racing_area_name && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Racing Area:</Text>
            <Text style={styles.detailValue}>{raceEvent.racing_area_name}</Text>
          </View>
        )}

        {raceEvent.venue && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Venue:</Text>
            <Text style={styles.detailValue}>
              {raceEvent.venue.name}, {raceEvent.venue.country}
            </Text>
          </View>
        )}
      </View>

      {/* Course Marks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Course Marks ({marksCount})
        </Text>

        {marksCount === 0 ? (
          <View style={styles.noMarksContainer}>
            <Text style={styles.noMarksText}>
              No course marks extracted from documents
            </Text>
            <Text style={styles.noMarksHint}>
              You can add them manually or draw the racing area
            </Text>
          </View>
        ) : (
          <View style={styles.marksList}>
            {raceEvent.marks?.map((mark, index) => {
              const coords = extractCoordinates(mark.position);
              return (
                <View key={mark.id} style={styles.markItem}>
                  <View style={styles.markHeader}>
                    <Text style={styles.markName}>
                      {mark.sequence_number}. {mark.mark_name}
                    </Text>
                    <Text style={styles.markType}>{mark.mark_type}</Text>
                  </View>
                  {coords && (
                    <Text style={styles.markCoords}>
                      {coords.lat.toFixed(6)}°, {coords.lng.toFixed(6)}°
                    </Text>
                  )}
                  {mark.rounding_direction && (
                    <Text style={styles.markRounding}>
                      Round to {mark.rounding_direction}
                    </Text>
                  )}
                  {mark.confidence_score && (
                    <Text style={styles.markConfidence}>
                      Confidence: {Math.round(mark.confidence_score * 100)}%
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Preview Map Placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Course Preview</Text>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>
            📍 3D Map Visualization
          </Text>
          <Text style={styles.mapPlaceholderSubtext}>
            {marksCount} marks • {raceEvent.course_configuration || 'Custom'} course
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Text style={styles.actionsTitle}>Does this look correct?</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleApprove}
        >
          <Text style={styles.primaryButtonText}>
            ✓ Yes, Continue to Strategy
          </Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleEdit}
          >
            <Text style={styles.secondaryButtonText}>
              ✏️ Edit Course
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleManualMode}
          >
            <Text style={styles.secondaryButtonText}>
              🎯 Manual Mode
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Helper to extract coordinates from PostGIS GEOGRAPHY(POINT)
function extractCoordinates(position: any): { lat: number; lng: number } | null {
  if (!position) return null;

  if (typeof position === 'object' && 'lat' in position && 'lng' in position) {
    return { lat: position.lat, lng: position.lng };
  }

  if (typeof position === 'string') {
    const match = position.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      return {
        lng: parseFloat(match[1]),
        lat: parseFloat(match[2])
      };
    }
  }

  if (typeof position === 'object' && position.type === 'Point' && Array.isArray(position.coordinates)) {
    return {
      lng: position.coordinates[0],
      lat: position.coordinates[1]
    };
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  errorText: {
    fontSize: 16,
    color: '#c00',
    textAlign: 'center'
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0080ff',
    borderRadius: 8
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 20,
    textAlign: 'center'
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center'
  },
  jobsList: {
    marginTop: 32,
    width: '100%',
    maxWidth: 400
  },
  jobItem: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8
  },
  jobType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000'
  },
  jobStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  progressBar: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0080ff'
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f0f9ff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  confidenceContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden'
  },
  confidenceFill: {
    height: '100%'
  },
  confidenceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 8
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 120
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontWeight: '500'
  },
  noMarksContainer: {
    padding: 20,
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcc00'
  },
  noMarksText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500'
  },
  noMarksHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  marksList: {
    gap: 12
  },
  markItem: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0080ff'
  },
  markHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  markName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000'
  },
  markType: {
    fontSize: 12,
    color: '#0080ff',
    fontWeight: '500',
    textTransform: 'uppercase'
  },
  markCoords: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  markRounding: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  markConfidence: {
    fontSize: 11,
    color: '#999',
    marginTop: 4
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0080ff',
    borderStyle: 'dashed'
  },
  mapPlaceholderText: {
    fontSize: 18,
    color: '#0080ff',
    fontWeight: '600'
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  actionsContainer: {
    padding: 20
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center'
  },
  primaryButton: {
    padding: 16,
    backgroundColor: '#00cc00',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12
  },
  secondaryButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  secondaryButtonText: {
    color: '#0080ff',
    fontSize: 14,
    fontWeight: '500'
  }
});
