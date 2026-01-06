/**
 * CrewStep Component
 *
 * Step 2 of Watch Schedule Creator: Add crew members and assign to watches.
 * Features:
 * - Manual crew entry
 * - Watch A / Watch B assignment
 * - Duration input
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import {
  Plus,
  X,
  ChevronRight,
  Users,
  Clock,
  Calendar,
} from 'lucide-react-native';

import type { WatchSystem, WatchGroup, CrewMember } from '@/types/watchSchedule';
import { getWatchSystemName } from '@/types/watchSchedule';
import { generateCrewId } from '@/lib/watchSchedule';
import { formatDateTime } from '@/lib/watchSchedule';

// =============================================================================
// iOS SYSTEM COLORS (Apple HIG)
// =============================================================================

const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  cardBackground: '#FFFFFF',
};

// Watch group colors
const WATCH_COLORS = {
  A: { primary: IOS_COLORS.purple, light: '#F3E8FF' },
  B: { primary: IOS_COLORS.blue, light: '#EFF6FF' },
};

// =============================================================================
// TYPES
// =============================================================================

interface CrewStepProps {
  system: WatchSystem;
  crew: CrewMember[];
  onCrewChange: (crew: CrewMember[]) => void;
  estimatedDuration: number;
  onDurationChange: (duration: number) => void;
  raceName: string;
  raceStart?: string;
  onNext: () => void;
  canProceed: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CrewStep({
  system,
  crew,
  onCrewChange,
  estimatedDuration,
  onDurationChange,
  raceName,
  raceStart,
  onNext,
  canProceed,
}: CrewStepProps) {
  const [newCrewName, setNewCrewName] = useState('');
  const [addingToWatch, setAddingToWatch] = useState<WatchGroup | null>(null);

  // Crew filtered by watch
  const watchACrew = crew.filter((c) => c.watch === 'A');
  const watchBCrew = crew.filter((c) => c.watch === 'B');

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleAddCrew = useCallback(
    (watch: WatchGroup) => {
      if (!newCrewName.trim()) {
        setAddingToWatch(watch);
        return;
      }

      const newMember: CrewMember = {
        id: generateCrewId(),
        name: newCrewName.trim(),
        watch,
      };

      onCrewChange([...crew, newMember]);
      setNewCrewName('');
      setAddingToWatch(null);
    },
    [newCrewName, crew, onCrewChange]
  );

  const handleRemoveCrew = useCallback(
    (id: string) => {
      onCrewChange(crew.filter((c) => c.id !== id));
    },
    [crew, onCrewChange]
  );

  const handleMoveToOtherWatch = useCallback(
    (id: string) => {
      onCrewChange(
        crew.map((c) =>
          c.id === id ? { ...c, watch: c.watch === 'A' ? 'B' : 'A' } : c
        )
      );
    },
    [crew, onCrewChange]
  );

  const handleDurationIncrement = useCallback(() => {
    onDurationChange(Math.min(72, estimatedDuration + 1));
  }, [estimatedDuration, onDurationChange]);

  const handleDurationDecrement = useCallback(() => {
    onDurationChange(Math.max(1, estimatedDuration - 1));
  }, [estimatedDuration, onDurationChange]);

  // ==========================================================================
  // RENDER CREW LIST
  // ==========================================================================

  const renderCrewList = (watch: WatchGroup, crewList: CrewMember[]) => {
    const colors = WATCH_COLORS[watch];
    const isAddingToThis = addingToWatch === watch;

    return (
      <View style={styles.watchColumn}>
        {/* Watch header */}
        <View style={[styles.watchHeader, { backgroundColor: colors.light }]}>
          <View style={[styles.watchBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.watchBadgeText}>{watch}</Text>
          </View>
          <Text style={styles.watchTitle}>Watch {watch}</Text>
          <Text style={styles.watchCount}>{crewList.length} crew</Text>
        </View>

        {/* Crew list */}
        <View style={styles.crewList}>
          {crewList.map((member) => (
            <View key={member.id} style={styles.crewItem}>
              <Text style={styles.crewName} numberOfLines={1}>
                {member.name}
              </Text>
              <View style={styles.crewActions}>
                <Pressable
                  style={styles.crewActionButton}
                  onPress={() => handleMoveToOtherWatch(member.id)}
                >
                  <Text style={styles.moveText}>
                    → {watch === 'A' ? 'B' : 'A'}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.crewRemoveButton}
                  onPress={() => handleRemoveCrew(member.id)}
                >
                  <X size={14} color={IOS_COLORS.red} />
                </Pressable>
              </View>
            </View>
          ))}

          {/* Add crew input/button */}
          {isAddingToThis ? (
            <View style={styles.addCrewInputRow}>
              <TextInput
                style={styles.addCrewInput}
                placeholder="Crew name"
                placeholderTextColor={IOS_COLORS.gray2}
                value={newCrewName}
                onChangeText={setNewCrewName}
                autoFocus
                onSubmitEditing={() => handleAddCrew(watch)}
                returnKeyType="done"
              />
              <Pressable
                style={[
                  styles.addCrewConfirmButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => handleAddCrew(watch)}
              >
                <Plus size={18} color="#FFFFFF" />
              </Pressable>
              <Pressable
                style={styles.addCrewCancelButton}
                onPress={() => {
                  setAddingToWatch(null);
                  setNewCrewName('');
                }}
              >
                <X size={18} color={IOS_COLORS.gray} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.addCrewButton}
              onPress={() => setAddingToWatch(watch)}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={[styles.addCrewText, { color: colors.primary }]}>
                Add crew
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Race Info Card */}
        <View style={styles.raceInfoCard}>
          <Text style={styles.raceName} numberOfLines={1}>
            {raceName}
          </Text>
          <View style={styles.raceInfoRow}>
            <View style={styles.raceInfoItem}>
              <Clock size={14} color={IOS_COLORS.gray} />
              <Text style={styles.raceInfoText}>
                {getWatchSystemName(system)}
              </Text>
            </View>
            {raceStart && (
              <View style={styles.raceInfoItem}>
                <Calendar size={14} color={IOS_COLORS.gray} />
                <Text style={styles.raceInfoText}>
                  {formatDateTime(raceStart)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Duration Input */}
        <View style={styles.durationCard}>
          <View style={styles.durationHeader}>
            <Text style={styles.durationLabel}>Estimated Race Duration</Text>
          </View>
          <View style={styles.durationControls}>
            <Pressable
              style={styles.durationButton}
              onPress={handleDurationDecrement}
            >
              <Text style={styles.durationButtonText}>−</Text>
            </Pressable>
            <View style={styles.durationDisplay}>
              <Text style={styles.durationValue}>{estimatedDuration}</Text>
              <Text style={styles.durationUnit}>hours</Text>
            </View>
            <Pressable
              style={styles.durationButton}
              onPress={handleDurationIncrement}
            >
              <Text style={styles.durationButtonText}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Crew Assignment Section */}
        <Text style={styles.sectionTitle}>Assign Crew to Watches</Text>
        <Text style={styles.sectionSubtitle}>
          Each watch needs at least one crew member
        </Text>

        {/* Watch columns */}
        <View style={styles.watchColumns}>
          {renderCrewList('A', watchACrew)}
          {renderCrewList('B', watchBCrew)}
        </View>

        {/* Validation message */}
        {!canProceed && crew.length > 0 && (
          <View style={styles.validationMessage}>
            <Text style={styles.validationText}>
              {watchACrew.length === 0
                ? 'Add at least one crew to Watch A'
                : 'Add at least one crew to Watch B'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer with Generate button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={!canProceed}
        >
          <Text
            style={[styles.nextButtonText, !canProceed && styles.nextButtonTextDisabled]}
          >
            Generate Schedule
          </Text>
          <ChevronRight
            size={20}
            color={canProceed ? '#FFFFFF' : IOS_COLORS.gray2}
          />
        </Pressable>
      </View>
    </View>
  );
}

// =============================================================================
// STYLES (Apple HIG Compliant)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.gray6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Race Info Card
  raceInfoCard: {
    backgroundColor: IOS_COLORS.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  raceName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 8,
  },
  raceInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  raceInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  raceInfoText: {
    fontSize: 13,
    color: IOS_COLORS.gray,
  },

  // Duration Card
  durationCard: {
    backgroundColor: IOS_COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  durationHeader: {
    marginBottom: 12,
  },
  durationLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  durationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  durationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonText: {
    fontSize: 24,
    fontWeight: '500',
    color: IOS_COLORS.purple,
  },
  durationDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  durationValue: {
    fontSize: 36,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -1,
  },
  durationUnit: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    marginBottom: 12,
  },

  // Watch Columns
  watchColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  watchColumn: {
    flex: 1,
    backgroundColor: IOS_COLORS.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  watchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  watchBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  watchTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  watchCount: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },

  // Crew List
  crewList: {
    padding: 12,
    paddingTop: 0,
    gap: 8,
  },
  crewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 8,
  },
  crewName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  crewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  crewActionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  moveText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  crewRemoveButton: {
    padding: 6,
  },

  // Add Crew
  addCrewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: IOS_COLORS.gray4,
  },
  addCrewText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addCrewInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addCrewInput: {
    flex: 1,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: IOS_COLORS.label,
  },
  addCrewConfirmButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCrewCancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.gray6,
  },

  // Validation
  validationMessage: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  validationText: {
    fontSize: 13,
    color: IOS_COLORS.red,
    textAlign: 'center',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: IOS_COLORS.gray6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.purple,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
  },
  nextButtonDisabled: {
    backgroundColor: IOS_COLORS.gray5,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButtonTextDisabled: {
    color: IOS_COLORS.gray2,
  },
});

export default CrewStep;
