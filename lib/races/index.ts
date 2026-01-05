/**
 * Race Utilities and Constants
 *
 * Barrel export for race-related utilities.
 */

// Utility functions
export {
  normalizeDirection,
  pickNumeric,
  normalizeCurrentType,
  extractWindSnapshot,
  extractCurrentSnapshot,
  parseGpsTrack,
  parseSplitTimes,
  detectRaceType,
  CARDINAL_TO_DEGREES,
} from './raceDataUtils';

export type {
  TacticalWindSnapshot,
  TacticalCurrentSnapshot,
  GPSPoint,
  DebriefSplitTime,
} from './raceDataUtils';

// Constants
export {
  DOCUMENT_TYPE_OPTIONS,
  normalizeDocumentType,
  ADD_RACE_CARD_DISMISSED_KEY,
  MOCK_GPS_TRACK,
  MOCK_SPLIT_TIMES,
} from './constants';

export type {
  DocumentTypeOption,
  ActiveRaceSummary,
  RaceBriefData,
  RigPreset,
  RegulatoryDigestData,
  RegulatoryAcknowledgements,
  CourseOutlineGroup,
} from './constants';
