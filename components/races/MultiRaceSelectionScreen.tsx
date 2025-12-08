/**
 * Multi-Race Selection Screen
 * Shows when AI detects multiple races in a NOR (e.g., race series or calendar)
 * Allows users to select which races to create
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { ArrowLeft, CheckCircle, Circle, Calendar, MapPin, Clock } from 'lucide-react-native';
import type { ExtractedData, MultiRaceExtractedData } from './AIValidationScreen';

interface MultiRaceSelectionScreenProps {
  extractedData: MultiRaceExtractedData;
  onConfirm: (selectedRaces: ExtractedData[]) => void;
  onCancel: () => void;
}

export function MultiRaceSelectionScreen({
  extractedData,
  onConfirm,
  onCancel,
}: MultiRaceSelectionScreenProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(extractedData.races.map((_, index) => index)) // All selected by default
  );

  const toggleRace = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const toggleAll = () => {
    if (selectedIndices.size === extractedData.races.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(extractedData.races.map((_, i) => i)));
    }
  };

  const handleConfirm = () => {
    const selectedRaces = extractedData.races.filter((_, index) =>
      selectedIndices.has(index)
    );
    onConfirm(selectedRaces);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Date TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return null;
    // Convert "HHMMhrs" to "HH:MM"
    const match = timeString.match(/(\d{2})(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
    return timeString;
  };

  // Group races by series
  const groupedRaces = extractedData.races.reduce((acc, race, index) => {
    const seriesName = race.raceSeriesName || 'Individual Races';
    if (!acc[seriesName]) {
      acc[seriesName] = [];
    }
    acc[seriesName].push({ race, index });
    return acc;
  }, {} as Record<string, Array<{ race: ExtractedData; index: number }>>);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Multiple Races Detected!</Text>
          <Text style={styles.headerSubtitle}>
            {extractedData.documentType} • {extractedData.races.length} races found
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 Document Summary</Text>
          <Text style={styles.summaryText}>
            {`This ${extractedData.documentType} contains `}
            <Text style={styles.bold}>{extractedData.races.length} races</Text>
            {' in total.'}
            {extractedData.organizingAuthority && ` Organized by ${extractedData.organizingAuthority}.`}
          </Text>
          <Text style={styles.summaryText}>
            Select the races you want to add to your calendar:
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            onPress={toggleAll}
            style={[styles.quickActionButton, styles.quickActionPrimary]}
          >
            <Text style={styles.quickActionTextPrimary}>
              {selectedIndices.size === extractedData.races.length
                ? 'Deselect All'
                : 'Select All'}
            </Text>
          </TouchableOpacity>
          <View style={styles.selectionCount}>
            <Text style={styles.selectionCountText}>
              {selectedIndices.size} of {extractedData.races.length} selected
            </Text>
          </View>
        </View>

        {/* Race Groups */}
        {Object.entries(groupedRaces).map(([seriesName, races]) => (
          <View key={seriesName} style={styles.seriesGroup}>
            <View style={styles.seriesHeader}>
              <Text style={styles.seriesTitle}>{seriesName}</Text>
              {races.length > 1 && (
                <Text style={styles.seriesCount}>{races.length} races</Text>
              )}
            </View>

            {races.map(({ race, index }) => {
              const isSelected = selectedIndices.has(index);
              const time = formatTime(race.warningSignalTime);

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.raceCard, isSelected && styles.raceCardSelected]}
                  onPress={() => toggleRace(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.raceCardLeft}>
                    <View style={styles.checkbox}>
                      {isSelected ? (
                        <CheckCircle color="#3B82F6" size={24} />
                      ) : (
                        <Circle color="#CBD5E1" size={24} />
                      )}
                    </View>
                    <View style={styles.raceInfo}>
                      <Text style={[styles.raceName, isSelected && styles.raceNameSelected]}>
                        {race.raceName || 'Untitled Race'}
                      </Text>
                      <View style={styles.raceDetails}>
                        <View style={styles.raceDetail}>
                          <Calendar size={14} color="#64748B" />
                          <Text style={styles.raceDetailText}>
                            {formatDate(race.raceDate)}
                          </Text>
                        </View>
                        {time && (
                          <View style={styles.raceDetail}>
                            <Clock size={14} color="#64748B" />
                            <Text style={styles.raceDetailText}>{time}</Text>
                          </View>
                        )}
                        {(race.venue || race.venueVariant) && (
                          <View style={styles.raceDetail}>
                            <MapPin size={14} color="#64748B" />
                            <Text style={styles.raceDetailText}>
                              {race.venueVariant || race.venue}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  {race.confidenceScores?.overall && (
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>
                        {Math.round(race.confidenceScores.overall * 100)}%
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Info Box - Different text based on selection count */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {selectedIndices.size === 1 ? (
              <>
                💡 <Text style={styles.bold}>Single Race:</Text> You'll review and edit the race details before it's added to your calendar.
              </>
            ) : selectedIndices.size > 1 ? (
              <>
                💡 <Text style={styles.bold}>Multiple Races:</Text> All {selectedIndices.size} races will be created with extracted details. You can edit each one individually from your Races tab.
              </>
            ) : (
              <>
                💡 <Text style={styles.bold}>Tip:</Text> Select at least one race to continue.
              </>
            )}
          </Text>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onCancel}
          style={[styles.footerButton, styles.footerButtonCancel]}
        >
          <Text style={styles.footerButtonTextCancel}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={selectedIndices.size === 0}
          style={[
            styles.footerButton,
            styles.footerButtonConfirm,
            selectedIndices.size === 0 && styles.footerButtonDisabled,
          ]}
        >
          <Text style={styles.footerButtonTextConfirm}>
            {selectedIndices.size === 0 
              ? 'Select Races'
              : selectedIndices.size === 1 
                ? 'Review & Add Race'
                : `Add ${selectedIndices.size} Races`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: Platform.OS === 'ios' ? 50 : Platform.OS === 'web' ? 20 : 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0F2FE',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
    // Add padding at bottom for fixed footer + tab bar on web
    paddingBottom: Platform.OS === 'web' ? 180 : 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
    color: '#1E293B',
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  quickActionPrimary: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  quickActionTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectionCount: {
    flex: 1,
    alignItems: 'flex-end',
  },
  selectionCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  seriesGroup: {
    marginBottom: 24,
  },
  seriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seriesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  seriesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  raceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  raceCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  raceCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    marginTop: 2,
  },
  raceInfo: {
    flex: 1,
  },
  raceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  raceNameSelected: {
    color: '#1E40AF',
  },
  raceDetails: {
    gap: 6,
  },
  raceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  raceDetailText: {
    fontSize: 13,
    color: '#64748B',
  },
  confidenceBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: Platform.OS === 'web' ? 24 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexShrink: 0,
    minHeight: 80,
    // Fix footer above tab bar on web
    ...(Platform.OS === 'web' ? {
      position: 'fixed' as const,
      bottom: 70, // Account for tab bar height
      left: 0,
      right: 0,
      zIndex: 100,
    } : {}),
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonCancel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  footerButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  footerButtonConfirm: {
    backgroundColor: '#3B82F6',
  },
  footerButtonDisabled: {
    opacity: 0.5,
  },
  footerButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
