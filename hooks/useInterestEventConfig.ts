/**
 * useInterestEventConfig
 *
 * Returns the InterestEventConfig for the currently active interest.
 * All event card UI, content modules, debrief questions, AI analysis
 * sections, and reflect tab config are driven by this hook.
 */

import { useMemo } from 'react'
import { useInterest } from '@/providers/InterestProvider'
import { getInterestEventConfig } from '@/configs'
import type { InterestEventConfig } from '@/types/interestEventConfig'

/**
 * Returns the event config for the current interest.
 * Memoized so it only re-computes when the interest changes.
 */
export function useInterestEventConfig(): InterestEventConfig {
  const { currentInterest } = useInterest()
  const slug = currentInterest?.slug ?? 'sail-racing'

  return useMemo(() => getInterestEventConfig(slug), [slug])
}
