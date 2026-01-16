/**
 * Historical Phase View Components
 *
 * Shared components for displaying past race data as read-only summaries.
 * Used by DaysBeforeContent, RaceMorningContent, and OnWaterContent
 * when the race has already occurred.
 */

export { HistoricalSummaryCard } from './HistoricalSummaryCard';
export type { HistoricalSummaryCardProps } from './HistoricalSummaryCard';

export { DataStatement } from './DataStatement';
export type { DataStatementProps } from './DataStatement';

export { CompletionMeter } from './CompletionMeter';
export type { CompletionMeterProps, CategoryProgress } from './CompletionMeter';
