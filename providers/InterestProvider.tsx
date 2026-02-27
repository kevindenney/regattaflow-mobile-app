/**
 * InterestProvider
 *
 * Provides multi-interest context for the BetterAt platform.
 * Wraps inside AuthProvider and manages which "interest" (e.g. sail-racing,
 * nursing, drawing, fitness) is currently active for the user.
 *
 * Resolution order for current interest:
 *   1. AsyncStorage cache (fast startup)
 *   2. user_preferences.preferred_interest_id (authenticated users)
 *   3. null — InterestSelectionGate shows onboarding modal
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/providers/AuthProvider'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Interest {
  id: string
  slug: string
  name: string
  description: string | null
  parent_id: string | null
  type: 'official' | 'org' | 'user_proposed' | 'private'
  status: 'active' | 'pending' | 'archived'
  visibility: 'public' | 'org_only' | 'private'
  accent_color: string
  icon_name: string | null
  hero_tagline: string | null
  pricing_text: string | null
  web_app_url: string | null
  created_at: string
}

interface InterestContextValue {
  /** The currently-active interest, or null while loading */
  currentInterest: Interest | null
  /** All interests available to this user (public + org interests they belong to) */
  userInterests: Interest[]
  /** True while the initial interest data is being resolved */
  loading: boolean
  /** Switch the active interest by slug. Persists to AsyncStorage and (if signed in) user_preferences. */
  switchInterest: (slug: string) => Promise<void>
  /** Force re-fetch interests from Supabase */
  refreshInterests: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ASYNC_STORAGE_KEY = 'betterat_preferred_interest'
const INTERESTS_QUERY_KEY = ['interests', 'all']

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const InterestContext = createContext<InterestContextValue>({
  currentInterest: null,
  userInterests: [],
  loading: true,
  switchInterest: async () => {},
  refreshInterests: async () => {},
})

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function InterestProvider({ children }: PropsWithChildren) {
  const { user, signedIn, isGuest } = useAuth()
  const queryClient = useQueryClient()

  // The slug that we have resolved as the "active" interest.
  // null means we haven't resolved yet.
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [resolving, setResolving] = useState(true)

  // Track whether we already ran the initial resolution so we don't re-run
  // every time `user` reference changes.
  const resolvedOnceRef = useRef(false)

  // ---------- Fetch all available interests via react-query ----------

  const EMPTY_INTERESTS: Interest[] = useMemo(() => [], [])

  const {
    data: rawInterests,
    isLoading: interestsLoading,
    refetch: refetchInterests,
  } = useQuery<Interest[]>({
    queryKey: INTERESTS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interests')
        .select(
          'id, slug, name, description, parent_id, type, status, visibility, accent_color, icon_name, hero_tagline, pricing_text, web_app_url, created_at',
        )
        .eq('status', 'active')
        .in('visibility', ['public'])
        .order('name')

      if (error) {
        throw error
      }

      return (data ?? []) as Interest[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Stable reference: avoid creating a new [] on every render when data is undefined
  const interests = rawInterests ?? EMPTY_INTERESTS

  // ---------- Resolve which interest should be active on mount ----------

  useEffect(() => {
    // Don't resolve until interests have loaded at least once.
    if (interestsLoading || interests.length === 0) return
    // Only resolve once (or when sign-in state meaningfully changes).
    if (resolvedOnceRef.current) return

    let cancelled = false

    const resolve = async () => {
      setResolving(true)

      try {
        // 1. Fast path — check AsyncStorage
        const cachedSlug = await AsyncStorage.getItem(ASYNC_STORAGE_KEY)

        if (cachedSlug && interests.some((i) => i.slug === cachedSlug)) {
          if (!cancelled) setActiveSlug(cachedSlug)
        }

        // 2. If signed in, check DB for authoritative preference
        if (signedIn && user?.id) {
          const { data: prefs } = await supabase
            .from('user_preferences')
            .select('preferred_interest_id')
            .eq('user_id', user.id)
            .single()

          if (!cancelled && prefs?.preferred_interest_id) {
            const matched = interests.find(
              (i) => i.id === prefs.preferred_interest_id,
            )
            if (matched) {
              setActiveSlug(matched.slug)
              // Sync AsyncStorage with DB truth
              await AsyncStorage.setItem(ASYNC_STORAGE_KEY, matched.slug)
            }
          }
        }

        // 3. If still nothing resolved, leave activeSlug as null.
        //    The InterestSelectionGate in _layout.tsx will show the onboarding
        //    modal so the user can pick their interest.
      } catch {
        // On any failure, leave as-is — the gate will prompt the user.
      } finally {
        if (!cancelled) {
          resolvedOnceRef.current = true
          setResolving(false)
        }
      }
    }

    resolve()

    return () => {
      cancelled = true
    }
  }, [interestsLoading, interests, signedIn, user?.id])

  // Re-resolve when the user signs in / out
  useEffect(() => {
    // Reset so the main effect can re-run
    resolvedOnceRef.current = false
  }, [signedIn, user?.id])

  // ---------- Derived current interest ----------

  const currentInterest = useMemo(() => {
    if (!activeSlug) return null
    return interests.find((i) => i.slug === activeSlug) ?? null
  }, [activeSlug, interests])

  // ---------- switchInterest ----------

  const switchInterest = useCallback(
    async (slug: string) => {
      const target = interests.find((i) => i.slug === slug)
      if (!target) {
        throw new Error(`Interest with slug "${slug}" not found`)
      }

      // Optimistic local update
      setActiveSlug(slug)

      // Persist to AsyncStorage (works for guests too)
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, slug)

      // Persist to DB if the user is authenticated
      if (signedIn && user?.id) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert(
            {
              user_id: user.id,
              preferred_interest_id: target.id,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          )

        if (error) {
          // Non-fatal — the local state is already updated
          console.warn('[InterestProvider] Failed to persist interest to DB:', error.message)
        }
      }
    },
    [interests, signedIn, user?.id],
  )

  // ---------- refreshInterests ----------

  const refreshInterests = useCallback(async () => {
    await refetchInterests()
  }, [refetchInterests])

  // ---------- Loading state ----------

  const loading = interestsLoading || resolving

  // ---------- Context value (memoised) ----------

  const value = useMemo<InterestContextValue>(
    () => ({
      currentInterest,
      userInterests: interests,
      loading,
      switchInterest,
      refreshInterests,
    }),
    [currentInterest, interests, loading, switchInterest, refreshInterests],
  )

  return (
    <InterestContext.Provider value={value}>
      {children}
    </InterestContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useInterest(): InterestContextValue {
  const ctx = useContext(InterestContext)
  if (ctx === undefined) {
    throw new Error('useInterest must be used within an <InterestProvider>')
  }
  return ctx
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { InterestContext }
export default InterestProvider
