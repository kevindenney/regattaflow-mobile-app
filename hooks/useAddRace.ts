/**
 * useAddRace Hook
 *
 * Manages add race dialog state and handlers for creating new races.
 * Supports multiple race types (fleet, distance, match, team).
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { RaceEventService } from '@/services/RaceEventService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useAddRace');

// =============================================================================
// TYPES
// =============================================================================

export interface QuickAddRaceData {
  name: string;
  dateTime: string;
}

export interface RaceFormData {
  name: string;
  date: string;
  time: string;
  raceType: 'fleet' | 'distance' | 'match' | 'team';
  location?: string;
  vhfChannel?: string;
  notes?: string;
  fleet?: {
    courseType?: string;
    numberOfLaps?: string;
    expectedFleetSize?: string;
    boatClass?: string;
  };
  distance?: {
    totalDistanceNm?: string;
    timeLimitHours?: string;
    startFinishSameLocation?: boolean;
    routeDescription?: string;
  };
  match?: {
    opponentName?: string;
    matchRound?: string;
    totalRounds?: string;
    seriesFormat?: string;
    hasUmpire?: boolean;
  };
  team?: {
    yourTeamName?: string;
    opponentTeamName?: string;
    heatNumber?: string;
    teamSize?: string;
    teamMembers?: string;
  };
}

export interface UseAddRaceParams {
  /** Function to refresh races after creating */
  refetchRaces?: () => void;
}

export interface UseAddRaceReturn {
  /** Whether add race sheet is shown */
  showAddRaceSheet: boolean;
  /** Whether a race is currently being added */
  isAddingRace: boolean;
  /** Whether the family button form is expanded */
  familyButtonExpanded: boolean;
  /** Handler to show add race sheet */
  handleShowAddRaceSheet: () => void;
  /** Handler to close add race sheet */
  handleCloseAddRaceSheet: () => void;
  /** Handler to navigate to full add race page */
  handleAddRaceNavigation: () => void;
  /** Handler for quick add race form */
  handleQuickAddRaceSubmit: (data: QuickAddRaceData) => Promise<void>;
  /** Handler for full add race dialog with race type support */
  handleAddRaceDialogSave: (formData: RaceFormData) => Promise<void>;
  /** Setter for showAddRaceSheet */
  setShowAddRaceSheet: React.Dispatch<React.SetStateAction<boolean>>;
  /** Setter for familyButtonExpanded */
  setFamilyButtonExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Hook for managing add race flow
 */
export function useAddRace({
  refetchRaces,
}: UseAddRaceParams): UseAddRaceReturn {
  const router = useRouter();

  const [showAddRaceSheet, setShowAddRaceSheet] = useState(false);
  const [isAddingRace, setIsAddingRace] = useState(false);
  const [familyButtonExpanded, setFamilyButtonExpanded] = useState(false);

  // Handler to show add race sheet
  const handleShowAddRaceSheet = useCallback(() => {
    setShowAddRaceSheet(true);
  }, []);

  // Handler to close add race sheet
  const handleCloseAddRaceSheet = useCallback(() => {
    setShowAddRaceSheet(false);
  }, []);

  // Handler to navigate to full add race page
  const handleAddRaceNavigation = useCallback(() => {
    router.push('/(tabs)/race/add');
  }, [router]);

  // Handler for quick add race form (simple name + date/time)
  const handleQuickAddRaceSubmit = useCallback(async (data: QuickAddRaceData) => {
    setIsAddingRace(true);
    try {
      const { data: newRace, error } = await RaceEventService.createRaceEvent({
        race_name: data.name,
        start_time: data.dateTime,
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to create race');
        return;
      }

      // Success - close sheet and refresh
      setShowAddRaceSheet(false);
      refetchRaces?.();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create race');
    } finally {
      setIsAddingRace(false);
    }
  }, [refetchRaces]);

  // Handler for full add race dialog with race type support
  const handleAddRaceDialogSave = useCallback(async (formData: RaceFormData) => {
    setIsAddingRace(true);
    try {
      // Build start_time from date and time
      const startTime = `${formData.date}T${formData.time}:00`;

      // Prepare type-specific data
      const createParams: Parameters<typeof RaceEventService.createRaceEvent>[0] = {
        race_name: formData.name,
        start_time: startTime,
        race_type: formData.raceType,
        location: formData.location,
        vhf_channel: formData.vhfChannel,
        notes: formData.notes,
      };

      // Add type-specific fields
      if (formData.raceType === 'fleet' && formData.fleet) {
        createParams.course_type = formData.fleet.courseType;
        createParams.number_of_laps = formData.fleet.numberOfLaps ? parseInt(formData.fleet.numberOfLaps) : undefined;
        createParams.expected_fleet_size = formData.fleet.expectedFleetSize ? parseInt(formData.fleet.expectedFleetSize) : undefined;
        createParams.boat_class = formData.fleet.boatClass;
      } else if (formData.raceType === 'distance' && formData.distance) {
        createParams.total_distance_nm = formData.distance.totalDistanceNm ? parseFloat(formData.distance.totalDistanceNm) : undefined;
        createParams.time_limit_hours = formData.distance.timeLimitHours ? parseFloat(formData.distance.timeLimitHours) : undefined;
        createParams.start_finish_same_location = formData.distance.startFinishSameLocation;
        createParams.route_description = formData.distance.routeDescription;
      } else if (formData.raceType === 'match' && formData.match) {
        createParams.opponent_name = formData.match.opponentName;
        createParams.match_round = formData.match.matchRound ? parseInt(formData.match.matchRound) : undefined;
        createParams.total_rounds = formData.match.totalRounds ? parseInt(formData.match.totalRounds) : undefined;
        createParams.series_format = formData.match.seriesFormat;
        createParams.has_umpire = formData.match.hasUmpire;
      } else if (formData.raceType === 'team' && formData.team) {
        createParams.your_team_name = formData.team.yourTeamName;
        createParams.opponent_team_name = formData.team.opponentTeamName;
        createParams.heat_number = formData.team.heatNumber ? parseInt(formData.team.heatNumber) : undefined;
        createParams.team_size = formData.team.teamSize ? parseInt(formData.team.teamSize) : undefined;
        // Parse team members from string format
        if (formData.team.teamMembers) {
          const members = formData.team.teamMembers.split(',').map(m => {
            const parts = m.trim().match(/^(.+?)(?:\s*#(\d+))?$/);
            return {
              name: parts?.[1]?.trim() || m.trim(),
              sailNumber: parts?.[2] || '',
            };
          });
          createParams.team_members = members;
        }
      }

      const { data: newRace, error } = await RaceEventService.createRaceEvent(createParams);

      if (error) {
        Alert.alert('Error', error.message || 'Failed to create race');
        return;
      }

      // Success - close dialog and refresh
      setShowAddRaceSheet(false);
      refetchRaces?.();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create race');
    } finally {
      setIsAddingRace(false);
    }
  }, [refetchRaces]);

  return {
    showAddRaceSheet,
    isAddingRace,
    familyButtonExpanded,
    handleShowAddRaceSheet,
    handleCloseAddRaceSheet,
    handleAddRaceNavigation,
    handleQuickAddRaceSubmit,
    handleAddRaceDialogSave,
    setShowAddRaceSheet,
    setFamilyButtonExpanded,
  };
}

export default useAddRace;
