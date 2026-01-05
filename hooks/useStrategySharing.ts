/**
 * useStrategySharing Hook
 *
 * Manages strategy sharing modal state and handlers.
 * Handles opening the coach selection modal and ensuring race event exists.
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useStrategySharing');

// =============================================================================
// TYPES
// =============================================================================

export interface UseStrategySharingParams {
  /** Currently selected race ID */
  selectedRaceId: string | null;
  /** Sailor profile ID */
  sailorId: string | null;
  /** Selected race data object */
  selectedRaceData: Record<string, unknown> | null;
  /** Function to ensure race_event exists and get its ID */
  ensureRaceEventId: () => Promise<string | null>;
}

export interface UseStrategySharingReturn {
  /** Whether coach selection modal is shown */
  showCoachSelectionModal: boolean;
  /** Whether strategy sharing is in progress */
  sharingStrategy: boolean;
  /** The race event ID for sharing */
  sharingRaceEventId: string | null;
  /** Handler to open strategy sharing modal */
  handleOpenStrategySharing: () => Promise<void>;
  /** Handler to close strategy sharing modal */
  handleCloseStrategySharing: () => void;
  /** Setter for showCoachSelectionModal */
  setShowCoachSelectionModal: React.Dispatch<React.SetStateAction<boolean>>;
  /** Setter for sharingRaceEventId */
  setSharingRaceEventId: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * Hook for managing strategy sharing flow
 */
export function useStrategySharing({
  selectedRaceId,
  sailorId,
  selectedRaceData,
  ensureRaceEventId,
}: UseStrategySharingParams): UseStrategySharingReturn {
  const [showCoachSelectionModal, setShowCoachSelectionModal] = useState(false);
  const [sharingStrategy, setSharingStrategy] = useState(false);
  const [sharingRaceEventId, setSharingRaceEventId] = useState<string | null>(null);

  // Handler to open strategy sharing modal (ensures race_event exists first)
  const handleOpenStrategySharing = useCallback(async () => {
    logger.info('[handleOpenStrategySharing] Called', {
      selectedRaceId,
      sailorId,
      selectedRaceData: !!selectedRaceData,
    });

    if (!selectedRaceId) {
      logger.warn('[handleOpenStrategySharing] No race selected');
      Alert.alert('Error', 'Please select a race first.');
      return;
    }

    if (!sailorId) {
      logger.warn('[handleOpenStrategySharing] No sailor ID');
      Alert.alert('Error', 'Unable to identify your account. Please try refreshing the page.');
      return;
    }

    if (!selectedRaceData) {
      logger.warn('[handleOpenStrategySharing] No race data');
      Alert.alert('Error', 'Race data not loaded. Please try again.');
      return;
    }

    try {
      setSharingStrategy(true);
      logger.info('[handleOpenStrategySharing] Ensuring race_event exists for regatta:', selectedRaceId);

      const raceEventId = await ensureRaceEventId();
      if (!raceEventId) {
        logger.error('[handleOpenStrategySharing] Failed to get race_event_id');
        Alert.alert('Error', 'Unable to prepare race for sharing. Please try again.');
        return;
      }

      logger.info('[handleOpenStrategySharing] Got race_event_id:', raceEventId, {
        sailorId,
        hasSelectedRaceData: !!selectedRaceData,
      });

      setSharingRaceEventId(raceEventId);
      setShowCoachSelectionModal(true);
      logger.info('[handleOpenStrategySharing] Modal should now be visible');
    } catch (error) {
      logger.error('[handleOpenStrategySharing] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to prepare sharing: ${errorMessage}`);
    } finally {
      setSharingStrategy(false);
    }
  }, [selectedRaceId, sailorId, selectedRaceData, ensureRaceEventId]);

  // Handler to close strategy sharing modal
  const handleCloseStrategySharing = useCallback(() => {
    setShowCoachSelectionModal(false);
    setSharingRaceEventId(null);
  }, []);

  return {
    showCoachSelectionModal,
    sharingStrategy,
    sharingRaceEventId,
    handleOpenStrategySharing,
    handleCloseStrategySharing,
    setShowCoachSelectionModal,
    setSharingRaceEventId,
  };
}

export default useStrategySharing;
