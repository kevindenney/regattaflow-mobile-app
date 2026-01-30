/**
 * RaceJournalSection - Personal race notes and reflections
 *
 * Shows a timeline of race journal entries with notes,
 * conditions, tuning settings, and key learnings.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { RaceJournalEntry, JournalMood } from '@/hooks/useReflectProfile';

interface RaceJournalSectionProps {
  entries: RaceJournalEntry[];
  onEntryPress?: (entryId: string) => void;
  onAddEntry?: () => void;
}

function getMoodIcon(mood: JournalMood): string {
  const icons: Record<JournalMood, string> = {
    great: 'happy',
    good: 'happy-outline',
    neutral: 'ellipse-outline',
    challenging: 'sad-outline',
    difficult: 'sad',
  };
  return icons[mood] || 'ellipse-outline';
}

function getMoodColor(mood: JournalMood): string {
  const colors: Record<JournalMood, string> = {
    great: IOS_COLORS.systemGreen,
    good: IOS_COLORS.systemBlue,
    neutral: IOS_COLORS.systemGray,
    challenging: IOS_COLORS.systemOrange,
    difficult: IOS_COLORS.systemRed,
  };
  return colors[mood] || IOS_COLORS.systemGray;
}

function getMoodLabel(mood: JournalMood): string {
  const labels: Record<JournalMood, string> = {
    great: 'Great',
    good: 'Good',
    neutral: 'Neutral',
    challenging: 'Challenging',
    difficult: 'Difficult',
  };
  return labels[mood] || 'Neutral';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function JournalCard({
  entry,
  onPress,
}: {
  entry: RaceJournalEntry;
  onPress: () => void;
}) {
  const moodColor = getMoodColor(entry.mood);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.journalCard,
        pressed && styles.journalCardPressed,
      ]}
      onPress={onPress}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.raceInfo}>
          <Text style={styles.raceName} numberOfLines={1}>
            {entry.regattaName}
          </Text>
          <Text style={styles.raceDate}>{formatDate(entry.raceDate)}</Text>
        </View>
        <View style={styles.headerRight}>
          {entry.position && entry.fleetSize && (
            <View style={styles.positionBadge}>
              <Text style={styles.positionText}>
                {getOrdinal(entry.position)}
              </Text>
              <Text style={styles.fleetText}>/{entry.fleetSize}</Text>
            </View>
          )}
          <View style={[styles.moodBadge, { backgroundColor: moodColor + '20' }]}>
            <Ionicons
              name={getMoodIcon(entry.mood) as any}
              size={14}
              color={moodColor}
            />
          </View>
        </View>
      </View>

      {/* Preview of notes */}
      {entry.postRaceNotes && (
        <Text style={styles.notesPreview} numberOfLines={2}>
          {entry.postRaceNotes}
        </Text>
      )}

      {/* What worked / to improve preview */}
      <View style={styles.previewTags}>
        {entry.whatWorked && entry.whatWorked.length > 0 && (
          <View style={styles.previewTag}>
            <Ionicons
              name="checkmark-circle"
              size={12}
              color={IOS_COLORS.systemGreen}
            />
            <Text style={styles.previewTagText}>
              {entry.whatWorked.length} worked
            </Text>
          </View>
        )}
        {entry.whatToImprove && entry.whatToImprove.length > 0 && (
          <View style={styles.previewTag}>
            <Ionicons
              name="arrow-up-circle"
              size={12}
              color={IOS_COLORS.systemOrange}
            />
            <Text style={styles.previewTagText}>
              {entry.whatToImprove.length} to improve
            </Text>
          </View>
        )}
        {entry.conditions && (
          <View style={styles.previewTag}>
            <Ionicons
              name="cloudy"
              size={12}
              color={IOS_COLORS.secondaryLabel}
            />
            <Text style={styles.previewTagText}>
              {entry.conditions.windSpeed}kts
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.tapToView}>Tap to view details</Text>
        <Ionicons
          name="chevron-forward"
          size={14}
          color={IOS_COLORS.tertiaryLabel}
        />
      </View>
    </Pressable>
  );
}

function JournalDetailModal({
  entry,
  visible,
  onClose,
}: {
  entry: RaceJournalEntry | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!entry) return null;

  const moodColor = getMoodColor(entry.mood);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleContainer}>
            <Text style={styles.modalTitle}>{entry.regattaName}</Text>
            <Text style={styles.modalDate}>{formatDate(entry.raceDate)}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={IOS_COLORS.label} />
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Result & Mood */}
          <View style={styles.resultMoodRow}>
            {entry.position && entry.fleetSize && (
              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>Result</Text>
                <Text style={styles.resultValue}>
                  {getOrdinal(entry.position)} of {entry.fleetSize}
                </Text>
              </View>
            )}
            <View style={styles.moodBox}>
              <Text style={styles.resultLabel}>Mood</Text>
              <View style={styles.moodDisplay}>
                <Ionicons
                  name={getMoodIcon(entry.mood) as any}
                  size={20}
                  color={moodColor}
                />
                <Text style={[styles.moodText, { color: moodColor }]}>
                  {getMoodLabel(entry.mood)}
                </Text>
              </View>
            </View>
          </View>

          {/* Conditions */}
          {entry.conditions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Conditions</Text>
              <View style={styles.conditionsGrid}>
                {entry.conditions.windSpeed && (
                  <View style={styles.conditionItem}>
                    <Ionicons
                      name="speedometer"
                      size={16}
                      color={IOS_COLORS.systemBlue}
                    />
                    <Text style={styles.conditionValue}>
                      {entry.conditions.windSpeed} kts
                    </Text>
                    <Text style={styles.conditionLabel}>Wind</Text>
                  </View>
                )}
                {entry.conditions.windDirection && (
                  <View style={styles.conditionItem}>
                    <Ionicons
                      name="compass"
                      size={16}
                      color={IOS_COLORS.systemBlue}
                    />
                    <Text style={styles.conditionValue}>
                      {entry.conditions.windDirection}
                    </Text>
                    <Text style={styles.conditionLabel}>Direction</Text>
                  </View>
                )}
                {entry.conditions.waveHeight && (
                  <View style={styles.conditionItem}>
                    <Ionicons
                      name="water"
                      size={16}
                      color={IOS_COLORS.systemBlue}
                    />
                    <Text style={styles.conditionValue}>
                      {entry.conditions.waveHeight}m
                    </Text>
                    <Text style={styles.conditionLabel}>Waves</Text>
                  </View>
                )}
                {entry.conditions.current && (
                  <View style={styles.conditionItem}>
                    <Ionicons
                      name="git-branch"
                      size={16}
                      color={IOS_COLORS.systemBlue}
                    />
                    <Text style={styles.conditionValue}>
                      {entry.conditions.current}
                    </Text>
                    <Text style={styles.conditionLabel}>Current</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Pre-race notes */}
          {entry.preRaceNotes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pre-Race Notes</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{entry.preRaceNotes}</Text>
              </View>
            </View>
          )}

          {/* Post-race notes */}
          {entry.postRaceNotes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Post-Race Reflection</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{entry.postRaceNotes}</Text>
              </View>
            </View>
          )}

          {/* What Worked */}
          {entry.whatWorked && entry.whatWorked.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What Worked</Text>
              {entry.whatWorked.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.listBullet, { backgroundColor: IOS_COLORS.systemGreen + '20' }]}>
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={IOS_COLORS.systemGreen}
                    />
                  </View>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* What to Improve */}
          {entry.whatToImprove && entry.whatToImprove.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Areas to Improve</Text>
              {entry.whatToImprove.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.listBullet, { backgroundColor: IOS_COLORS.systemOrange + '20' }]}>
                    <Ionicons
                      name="arrow-up"
                      size={12}
                      color={IOS_COLORS.systemOrange}
                    />
                  </View>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Key Moments */}
          {entry.keyMoments && entry.keyMoments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Moments</Text>
              {entry.keyMoments.map((moment, index) => (
                <View key={index} style={styles.momentItem}>
                  <Text style={styles.momentNumber}>{index + 1}</Text>
                  <Text style={styles.momentText}>{moment}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tuning Settings */}
          {entry.tuningSettings && Object.keys(entry.tuningSettings).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tuning Settings</Text>
              <View style={styles.tuningGrid}>
                {Object.entries(entry.tuningSettings).map(([key, value]) => (
                  <View key={key} style={styles.tuningItem}>
                    <Text style={styles.tuningLabel}>{key}</Text>
                    <Text style={styles.tuningValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export function RaceJournalSection({
  entries,
  onEntryPress,
  onAddEntry,
}: RaceJournalSectionProps) {
  const [selectedEntry, setSelectedEntry] = useState<RaceJournalEntry | null>(null);

  // Sort by date descending
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.raceDate).getTime() - new Date(a.raceDate).getTime()
  );

  const handleEntryPress = (entry: RaceJournalEntry) => {
    setSelectedEntry(entry);
    onEntryPress?.(entry.id);
  };

  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Race Journal</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="book-outline"
            size={40}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyText}>No Journal Entries</Text>
          <Text style={styles.emptySubtext}>
            Record your thoughts, conditions, and learnings after each race
          </Text>
          {onAddEntry && (
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
              onPress={onAddEntry}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Entry</Text>
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
          <Text style={styles.sectionTitle}>Race Journal</Text>
          <Text style={styles.entryCount}>{entries.length} entries</Text>
        </View>
        {onAddEntry && (
          <Pressable
            style={({ pressed }) => [
              styles.addIconButton,
              pressed && styles.addIconButtonPressed,
            ]}
            onPress={onAddEntry}
          >
            <Ionicons name="add" size={20} color={IOS_COLORS.systemBlue} />
          </Pressable>
        )}
      </View>

      {/* Entries List */}
      <View style={styles.entriesList}>
        {sortedEntries.map((entry) => (
          <JournalCard
            key={entry.id}
            entry={entry}
            onPress={() => handleEntryPress(entry)}
          />
        ))}
      </View>

      {/* Detail Modal */}
      <JournalDetailModal
        entry={selectedEntry}
        visible={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
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
  entryCount: {
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
  entriesList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  journalCard: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 14,
    ...IOS_SHADOWS.sm,
  },
  journalCardPressed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  raceInfo: {
    flex: 1,
    marginRight: 12,
  },
  raceName: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  raceDate: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: IOS_COLORS.systemYellow + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  positionText: {
    fontSize: 14,
    fontWeight: '700',
    color: IOS_COLORS.systemYellow,
  },
  fleetText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  moodBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesPreview: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 10,
    lineHeight: 20,
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.systemBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  tapToView: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 20,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  modalTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  modalDate: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  resultMoodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  resultBox: {
    flex: 1,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  moodBox: {
    flex: 1,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moodText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  conditionItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  conditionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 4,
  },
  conditionLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 14,
  },
  notesText: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.label,
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  listBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.label,
    lineHeight: 22,
  },
  momentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  momentNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: IOS_COLORS.systemBlue,
    width: 20,
  },
  momentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  tuningGrid: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tuningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  tuningLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  tuningValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  bottomPadding: {
    height: 40,
  },
});

export default RaceJournalSection;
