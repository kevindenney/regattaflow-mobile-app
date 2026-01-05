/**
 * Boat Setup Section
 *
 * Displays boat class selection, rig tuning guidance, and sail planner notes.
 * Only shown in the boat setup accordion section of race details.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RigTuningCard } from '@/components/race-detail';
import { RigPlannerCard } from '@/components/races/RigPlannerCard';
import type { RigPreset } from '@/lib/races';

export interface BoatSetupSectionProps {
  /** Whether this is a future race */
  isRaceFuture: boolean;
  /** Selected race ID */
  raceId: string;
  /** Selected boat class ID */
  selectedRaceClassId?: string | null;
  /** Selected boat class name */
  selectedRaceClassName?: string | null;
  /** Callback to set boat class */
  onSetBoatClass: () => void;
  /** Rig presets for the planner */
  rigPresets: RigPreset[];
  /** Currently selected rig band */
  selectedRigBand: string | null;
  /** Callback when rig band is selected */
  onSelectBand: (bandId: string) => void;
  /** Current rig notes */
  rigNotes: string;
  /** Callback when rig notes change */
  onChangeNotes: (notes: string) => void;
  /** AI tuning recommendation */
  selectedRaceTuningRecommendation?: any;
  /** Whether tuning is loading */
  selectedRaceTuningLoading?: boolean;
  /** Callback to refresh tuning recommendation */
  onRefreshTuning?: () => void;
  /** Callback to open chat from rig planner */
  onOpenChat?: () => void;
  /** Whether using generic defaults */
  isGenericDefaults?: boolean;
  /** Callback to add tuning guide */
  onAddTuningGuide?: () => void;
}

/**
 * Boat Setup Section Component
 */
export function BoatSetupSection({
  isRaceFuture,
  raceId,
  selectedRaceClassId,
  selectedRaceClassName,
  onSetBoatClass,
  rigPresets,
  selectedRigBand,
  onSelectBand,
  rigNotes,
  onChangeNotes,
  selectedRaceTuningRecommendation,
  selectedRaceTuningLoading,
  onRefreshTuning,
  onOpenChat,
  isGenericDefaults,
  onAddTuningGuide,
}: BoatSetupSectionProps) {
  return (
    <>
      {/* Class not set warning - only show for future races */}
      {isRaceFuture && !selectedRaceClassId && (
        <View className="flex-row items-start gap-2 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#b45309" style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-xs font-semibold text-amber-700">Class not set yet</Text>
            <Text className="text-xs text-amber-600 mt-1">
              Select a boat class to unlock rig tuning checklists and class-based start sequences.
            </Text>
            <Pressable onPress={onSetBoatClass} className="flex-row items-center gap-1 mt-2">
              <MaterialCommunityIcons name="pencil" size={14} color="#b45309" />
              <Text className="text-xs font-semibold text-amber-700">Set class</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Class set display - show when class is set, allows changing */}
      {isRaceFuture && selectedRaceClassId && selectedRaceClassName && (
        <Pressable
          onPress={onSetBoatClass}
          className="flex-row items-center gap-2 mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <MaterialCommunityIcons name="sail-boat" size={18} color="#1e40af" />
          <View className="flex-1">
            <Text className="text-xs font-semibold text-blue-700">Boat Class</Text>
            <Text className="text-sm font-semibold text-blue-900 mt-0.5">
              {selectedRaceClassName}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <MaterialCommunityIcons name="pencil" size={14} color="#1e40af" />
            <Text className="text-xs font-semibold text-blue-700">Change</Text>
          </View>
        </Pressable>
      )}

      {/* AI Rig Tuning Guidance - only show for future races */}
      {isRaceFuture && (
        <RigTuningCard
          raceId={raceId}
          boatClassName={selectedRaceClassName}
          recommendation={selectedRaceTuningRecommendation}
          loading={selectedRaceTuningLoading}
          onRefresh={selectedRaceClassId ? onRefreshTuning : undefined}
        />
      )}

      {/* User's Rig & Sail Planner Notes - always show */}
      <RigPlannerCard
        presets={rigPresets}
        selectedBand={selectedRigBand}
        onSelectBand={onSelectBand}
        notes={rigNotes}
        onChangeNotes={onChangeNotes}
        onOpenChat={isRaceFuture ? onOpenChat : undefined}
        isGenericDefaults={isGenericDefaults}
        boatClassName={selectedRaceClassName}
        onAddTuningGuide={onAddTuningGuide}
      />
    </>
  );
}

export default BoatSetupSection;
