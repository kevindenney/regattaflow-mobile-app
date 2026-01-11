/**
 * Race Modals Section
 *
 * Encapsulates all modal components used in the Races screen.
 * Includes document picker, calendar import, post-race interview,
 * strategy sharing, boat class selector, and add race dialogs.
 */

import React from 'react';
import { Modal } from 'react-native';
import { DocumentTypePickerModal } from '@/components/races/DocumentTypePickerModal';
import { CalendarImportFlow } from '@/components/races/CalendarImportFlow';
import { PostRaceInterview } from '@/components/races/PostRaceInterview';
import { StrategySharingModal } from '@/components/coaching/StrategySharingModal';
import { BoatClassSelectorModal } from '@/components/races/BoatClassSelectorModal';
import { createLogger } from '@/lib/utils/logger';
import { detectRaceType } from '@/lib/races';

const logger = createLogger('RaceModalsSection');

export interface RaceModalsSectionProps {
  // Document Type Picker
  documentTypePickerVisible: boolean;
  onDismissDocumentTypePicker: () => void;
  onDocumentTypeSelect: (type: string) => void;
  isUploadingDocument?: boolean;

  // Calendar Import
  showCalendarImport: boolean;
  onCalendarImportClose: () => void;
  onCalendarImportComplete: (count: number) => void;

  // Post-Race Interview
  showPostRaceInterview: boolean;
  completedSessionId: string | null;
  completedRaceName: string;
  completedRaceId: string | null;
  completedSessionGpsPoints: number;
  onPostRaceInterviewClose: () => void;
  onPostRaceInterviewComplete: () => void;

  // Strategy Sharing
  showCoachSelectionModal: boolean;
  sailorId: string | null;
  sharingRaceEventId: string | null;
  selectedRaceData: any;
  selectedRaceEnrichedWeather?: any;
  onStrategySharingClose: () => void;

  // Boat Class Selector
  showBoatClassSelector: boolean;
  selectedRaceId: string | null;
  onBoatClassSelectorClose: () => void;
  onBoatClassSelected: (classId: string, className: string) => void;
}

/**
 * Race Modals Section Component
 */
export function RaceModalsSection({
  // Document Type Picker
  documentTypePickerVisible,
  onDismissDocumentTypePicker,
  onDocumentTypeSelect,
  isUploadingDocument,
  // Calendar Import
  showCalendarImport,
  onCalendarImportClose,
  onCalendarImportComplete,
  // Post-Race Interview
  showPostRaceInterview,
  completedSessionId,
  completedRaceName,
  completedRaceId,
  completedSessionGpsPoints,
  onPostRaceInterviewClose,
  onPostRaceInterviewComplete,
  // Strategy Sharing
  showCoachSelectionModal,
  sailorId,
  sharingRaceEventId,
  selectedRaceData,
  selectedRaceEnrichedWeather,
  onStrategySharingClose,
  // Boat Class Selector
  showBoatClassSelector,
  selectedRaceId,
  onBoatClassSelectorClose,
  onBoatClassSelected,
}: RaceModalsSectionProps) {
  return (
    <>
      <DocumentTypePickerModal
        visible={documentTypePickerVisible}
        onDismiss={onDismissDocumentTypePicker}
        onSelect={onDocumentTypeSelect}
        isUploading={isUploadingDocument}
      />

      {/* Calendar Import Modal */}
      <Modal
        visible={showCalendarImport}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onCalendarImportClose}
      >
        <CalendarImportFlow
          onComplete={(count) => {
            onCalendarImportClose();
            onCalendarImportComplete(count);
          }}
          onCancel={onCalendarImportClose}
        />
      </Modal>

      {/* Post-Race Interview Modal */}
      {completedSessionId && (
        <PostRaceInterview
          visible={showPostRaceInterview}
          sessionId={completedSessionId}
          raceName={completedRaceName}
          raceId={completedRaceId || undefined}
          gpsPointCount={completedSessionGpsPoints}
          onClose={onPostRaceInterviewClose}
          onComplete={onPostRaceInterviewComplete}
        />
      )}

      {/* Strategy Sharing Modal */}
      {sailorId && selectedRaceData && sharingRaceEventId && (
        <StrategySharingModal
          visible={showCoachSelectionModal}
          onClose={onStrategySharingClose}
          onShareComplete={(shareType, recipientName) => {
            logger.info('Strategy shared:', { shareType, recipientName });
          }}
          sailorId={sailorId}
          raceId={sharingRaceEventId}
          raceInfo={{
            id: selectedRaceData.id,
            name: selectedRaceData.name || 'Race',
            date: selectedRaceData.start_date,
            venue: selectedRaceData.metadata?.venue_name,
            boatClass: selectedRaceData.metadata?.class_name,
            raceType: detectRaceType(
              selectedRaceData.name,
              selectedRaceData.metadata?.race_type,
              selectedRaceData.metadata?.total_distance_nm || selectedRaceData.total_distance_nm
            ),
            totalDistanceNm: selectedRaceData.metadata?.total_distance_nm || selectedRaceData.total_distance_nm,
            waypoints: selectedRaceData.route_waypoints || selectedRaceData.metadata?.waypoints,
            startTime: selectedRaceData.start_date?.split('T')[1]?.slice(0, 5) || selectedRaceData.metadata?.start_time,
            warningSignal: selectedRaceData.metadata?.warning_signal || selectedRaceData.warning_signal_time,
            courseName: selectedRaceData.course_name || selectedRaceData.metadata?.course_name,
            courseType: selectedRaceData.course_type || selectedRaceData.metadata?.course_type,
            timeLimitHours: selectedRaceData.time_limit_hours || selectedRaceData.metadata?.time_limit_hours,
            weather: (selectedRaceData.metadata?.wind || selectedRaceEnrichedWeather?.wind) ? {
              windSpeed: selectedRaceEnrichedWeather?.wind?.speedMin || selectedRaceData.metadata?.wind?.speedMin,
              windSpeedMax: selectedRaceEnrichedWeather?.wind?.speedMax || selectedRaceData.metadata?.wind?.speedMax,
              windDirection: selectedRaceEnrichedWeather?.wind?.direction || selectedRaceData.metadata?.wind?.direction,
              tideState: selectedRaceEnrichedWeather?.tide?.state || selectedRaceData.metadata?.tide?.state,
              tideHeight: selectedRaceEnrichedWeather?.tide?.height || selectedRaceData.metadata?.tide?.height,
              currentSpeed: selectedRaceData.metadata?.current?.speed,
              currentDirection: selectedRaceData.metadata?.current?.direction,
              waveHeight: selectedRaceData.metadata?.waves?.height,
              temperature: selectedRaceData.metadata?.weather?.temperature,
            } : undefined,
            rigTuning: selectedRaceData.metadata?.rigTuning ? {
              preset: selectedRaceData.metadata.rigTuning.preset,
              windRange: selectedRaceData.metadata.rigTuning.windRange,
              settings: selectedRaceData.metadata.rigTuning.settings,
              notes: selectedRaceData.metadata.rigTuning.notes,
            } : undefined,
          }}
        />
      )}

      {/* Boat Class Selector Modal */}
      {selectedRaceId && (
        <BoatClassSelectorModal
          visible={showBoatClassSelector}
          onClose={onBoatClassSelectorClose}
          raceId={selectedRaceId}
          currentClassId={
            selectedRaceData?.class_id ||
            selectedRaceData?.metadata?.class_id ||
            null
          }
          onClassSelected={onBoatClassSelected}
        />
      )}
    </>
  );
}

export default RaceModalsSection;
