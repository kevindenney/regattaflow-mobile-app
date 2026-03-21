/**
 * Interest Event Configs — barrel export
 *
 * Each interest provides its own InterestEventConfig that drives
 * event cards, content modules, debrief, AI analysis, and the reflect tab.
 */

export { SAILING_EVENT_CONFIG } from './sailing'
export { NURSING_EVENT_CONFIG } from './nursing'
export { DRAWING_EVENT_CONFIG } from './drawing'
export { DESIGN_EVENT_CONFIG } from './design'
export { FITNESS_EVENT_CONFIG } from './fitness'

import type { InterestEventConfig } from '@/types/interestEventConfig'
import { SAILING_EVENT_CONFIG } from './sailing'
import { NURSING_EVENT_CONFIG } from './nursing'
import { DRAWING_EVENT_CONFIG } from './drawing'
import { DESIGN_EVENT_CONFIG } from './design'
import { FITNESS_EVENT_CONFIG } from './fitness'

/**
 * Lookup map: interest slug → event config.
 * Used by useInterestEventConfig() to resolve the active config.
 */
export const INTEREST_EVENT_CONFIGS: Record<string, InterestEventConfig> = {
  'sail-racing': SAILING_EVENT_CONFIG,
  nursing: NURSING_EVENT_CONFIG,
  drawing: DRAWING_EVENT_CONFIG,
  design: DESIGN_EVENT_CONFIG,
  fitness: FITNESS_EVENT_CONFIG,
  'health-and-fitness': FITNESS_EVENT_CONFIG,
}

/**
 * Get the event config for an interest slug.
 * Falls back to sailing if the slug is not found.
 */
export function getInterestEventConfig(slug: string): InterestEventConfig {
  return INTEREST_EVENT_CONFIGS[slug] ?? SAILING_EVENT_CONFIG
}
