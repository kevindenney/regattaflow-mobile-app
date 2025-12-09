/**
 * Sailwave Integration Module
 *
 * Provides import/export functionality for Sailwave .BLW files,
 * the industry standard format for regatta scoring in Europe.
 *
 * @example
 * ```typescript
 * import { sailwaveService } from '@/services/sailwave';
 *
 * // Import a BLW file
 * const result = await sailwaveService.importFromFile(file, {
 *   userId: user.id,
 *   clubId: club.id,
 * });
 *
 * // Export to BLW
 * const exportResult = await sailwaveService.exportBLW(regattaId);
 * ```
 */

// Parser
export { BLWParser, blwParser } from './BLWParser';
export type {
  SailwaveData,
  SeriesConfig,
  EventConfig,
  ScoringConfig,
  Competitor,
  Race,
  RaceResult,
  BLWSection,
  SailwaveStatusCode,
} from './BLWParser';
export { SAILWAVE_STATUS_CODES } from './BLWParser';

// Generator
export { BLWGenerator, blwGenerator } from './BLWGenerator';

// Service
export { SailwaveService, sailwaveService } from './SailwaveService';
export type { ImportOptions, ImportResult, ExportOptions, ExportResult } from './SailwaveService';

