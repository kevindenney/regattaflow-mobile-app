import { signOutEverywhere } from '@/lib/auth-actions'
import { nativeGoogleSignIn, nativeAppleSignIn, signOutFromNativeProviders } from '@/lib/auth/nativeOAuth'
import { createLogger } from '@/lib/utils/logger'
import { GuestStorageService } from '@/services/GuestStorageService'
import { supabase, UserType } from '@/services/supabase'
import { bindAuthDiagnostics } from '@/utils/authDebug'
import { logAuthEvent, logAuthState } from '@/utils/errToText'
import { AuthApiError } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { UserCapabilities, DEFAULT_CAPABILITIES, CapabilityType } from '@/types/capabilities'

// Re-export UserType for backward compatibility
export type { UserType } from '@/services/supabase'
// Export capabilities types for consumers
export type { UserCapabilities, CapabilityType } from '@/types/capabilities'

type PersonaRole = Exclude<UserType, null>;
const DEFAULT_PERSONA: PersonaRole = 'sailor';

// Bind diagnostics once at app boot
bindAuthDiagnostics(supabase)

const logger = createLogger('AuthProvider');
const AUTH_DEBUG_ENABLED = false // Set to true for debugging auth issues
const authDebugLog = (...args: Parameters<typeof logger.debug>) => {
  if (!AUTH_DEBUG_ENABLED) {
    return
  }
  logger.debug(...args)
}

// Safe localStorage access - returns null on native platforms where localStorage doesn't exist
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  }
};

const isInvalidRefreshTokenError = (error: unknown): error is AuthApiError => {
  if (!error || typeof (error as any)?.message !== 'string') {
    return false;
  }
  return /refresh token/i.test((error as any).message);
};

// Smart API_BASE detection with local development fallback
const getApiBase = () => {
  const envApiBase =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.EXPO_PUBLIC_BASE_URL ||
    process.env.EXPO_PUBLIC_WEB_BASE_URL ||
    ''

  // If we're on localhost (Expo dev) but env points to production, use local vercel dev server
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1'
    const isProductionApi = envApiBase.includes('vercel.app') || envApiBase.includes('regattaflow.io')
    
    if (isLocalhost && isProductionApi) {
      if (AUTH_DEBUG_ENABLED) {
        logger.debug('🔄 Auto-switching to local vercel dev server (localhost:3000)')
      }
      return 'http://localhost:3000'
    }
  }

  return envApiBase
}

const API_BASE = getApiBase()

// 🔍 DEBUG: Log env vars at module load time
if (AUTH_DEBUG_ENABLED) {
  logger.debug('🔍 ENV DEBUG:', {
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_BASE_URL: process.env.EXPO_PUBLIC_BASE_URL,
    EXPO_PUBLIC_WEB_BASE_URL: process.env.EXPO_PUBLIC_WEB_BASE_URL,
    RESOLVED_API_BASE: API_BASE,
  })
}

const buildApiUrl = (path: string) => {
  const url = !API_BASE ? path : `${API_BASE.replace(/\/$/, '')}${path}`
  if (AUTH_DEBUG_ENABLED) {
    logger.debug('🔍 buildApiUrl:', { path, API_BASE, result: url })
  }
  return url
}

type AuthState = 'checking' | 'signed_out' | 'guest' | 'ready'

type AuthCtx = {
  state: AuthState
  ready: boolean
  signedIn: boolean
  isGuest: boolean
  user: any | null
  loading: boolean
  personaLoading: boolean
  signIn: (identifier: string, password: string) => Promise<void>
  signUp: (email: string, username: string, password: string, persona: PersonaRole) => Promise<any>
  signOut: () => Promise<void>
  signInWithGoogle: (persona?: PersonaRole) => Promise<void>
  signInWithApple: (persona?: PersonaRole) => Promise<void>
  enterGuestMode: () => void
  biometricAvailable: boolean
  biometricEnabled: boolean
  userProfile?: any
  userType?: UserType
  /** User capabilities (coaching, etc.) - additive on top of base user type */
  capabilities: UserCapabilities
  clubProfile: any | null
  coachProfile: any | null
  refreshPersonaContext: () => Promise<void>
  updateUserProfile: (updates: any) => Promise<void>
  fetchUserProfile: (userId?: string) => Promise<any>
  /** Add a capability to the current user (e.g., 'coaching') */
  addCapability: (type: CapabilityType) => Promise<void>
  isDemoSession: boolean
}

const Ctx = createContext<AuthCtx>({
  state: 'checking',
  ready: false,
  signedIn: false,
  isGuest: false,
  user: null,
  loading: false,
  personaLoading: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  enterGuestMode: () => {},
  biometricAvailable: false,
  biometricEnabled: false,
  clubProfile: null,
  coachProfile: null,
  capabilities: DEFAULT_CAPABILITIES,
  refreshPersonaContext: async () => {},
  updateUserProfile: async () => {},
  fetchUserProfile: async (_userId?: string) => null,
  addCapability: async () => {},
  userType: null,
  userProfile: null,
  isDemoSession: false,
})

export function AuthProvider({children}:{children: React.ReactNode}) {
  const [ready, setReady] = useState(false) // Start as not ready until we check session
  const [signedIn, setSignedIn] = useState(false)
  const [isGuest, setIsGuest] = useState(false) // Guest mode for freemium experience
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [personaLoading, setPersonaLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userType, setUserType] = useState<UserType>(null)
  const [clubProfile, setClubProfile] = useState<any | null>(null)
  const [coachProfile, setCoachProfile] = useState<any | null>(null)
  const [capabilities, setCapabilities] = useState<UserCapabilities>(DEFAULT_CAPABILITIES)
  const [isDemoSession, setIsDemoSession] = useState(false)

  // Ref to prevent duplicate profile fetches during race conditions
  const profileFetchInProgress = useRef<string | null>(null)

  // Ref to track if initial auth check is in progress (prevents onAuthStateChange from racing with initializeAuth)
  const initialAuthInProgress = useRef(true)

  const clearInvalidSession = useCallback(async (context: string, error?: unknown) => {
    authDebugLog(`[AUTH] Clearing invalid session (${context})`, {
      message: (error as any)?.message,
    })
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (signOutError) {
      console.warn(`[AUTH] Failed to sign out after invalid session (${context}):`, signOutError)
    }
    setSignedIn(false)
    setUser(null)
    setUserProfile(null)
    setUserType(null)
    setLoading(false)
    setPersonaLoading(false)
    setClubProfile(null)
    setCoachProfile(null)
    setCapabilities(DEFAULT_CAPABILITIES)
  }, [])

  const fetchUserProfile = async (userId?: string) => {
    const uid = userId || user?.id
    authDebugLog('[fetchUserProfile] Called with userId:', uid)
    if (!uid) {
      authDebugLog('[fetchUserProfile] ❌ No userId provided')
      return null
    }

    // Prevent duplicate fetches during race conditions (e.g., initializeAuth + onAuthStateChange)
    if (profileFetchInProgress.current === uid) {
      authDebugLog('[fetchUserProfile] Skipping duplicate fetch for:', uid)
      return null
    }
    profileFetchInProgress.current = uid

    const inferUserType = async (): Promise<PersonaRole> => {
      // 1. Check coach profile
      const { data: coachProfile, error: coachError } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();

      if (coachProfile && !coachError) {
        authDebugLog('[fetchUserProfile] Inferred coach persona from coach_profiles');
        return 'coach';
      }

      if (coachError && coachError.code !== 'PGRST116') {
        authDebugLog('[fetchUserProfile] coach_profiles lookup error:', coachError.message);
      }

      // 2. Check club profile ownership
      const { data: clubProfile, error: clubError } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();

      if (clubProfile && !clubError) {
        authDebugLog('[fetchUserProfile] Inferred club persona from club_profiles');
        return 'club';
      }

      if (clubError && clubError.code !== 'PGRST116') {
        authDebugLog('[fetchUserProfile] club_profiles lookup error:', clubError.message);
      }

      authDebugLog('[fetchUserProfile] Falling back to default persona');
      return DEFAULT_PERSONA;
    };

    try {
      authDebugLog('[fetchUserProfile] Querying database for user:', uid)

      // Add timeout to prevent hanging forever on network issues
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .maybeSingle()

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout after 5 seconds')), 5000)
      )

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

      authDebugLog('[fetchUserProfile] Database response:', {
        hasData: !!data,
        hasError: !!error,
        user_type: data?.user_type,
        onboarding_completed: data?.onboarding_completed,
        error: error?.message
      })

      if (error) {
        return null
      }

      if (!data) {
        return null
      }

      let resolvedProfile = data
      const userTypeWasMissing = !data?.user_type

      let resolvedUserType: PersonaRole = userTypeWasMissing
        ? await inferUserType()
        : (data.user_type as PersonaRole)

      if (userTypeWasMissing) {
        authDebugLog('[fetchUserProfile] No user_type found, defaulting to', resolvedUserType)
        try {
          await supabase
            .from('users')
            .update({
              user_type: resolvedUserType,
              onboarding_completed: true,
            })
            .eq('id', uid)
        } catch (updateError) {
          console.warn('[fetchUserProfile] Failed to persist default user_type:', updateError)
        }

        resolvedProfile = {
          ...data,
          user_type: resolvedUserType,
          onboarding_completed: true,
        }
      }

      authDebugLog('[fetchUserProfile] Setting userProfile and userType')
      setUserProfile(resolvedProfile)
      setUserType(resolvedUserType as UserType)
      profileFetchInProgress.current = null
      return resolvedProfile
    } catch (error) {
      // On timeout or error, default to 'sailor' so user can still use the app
      const isTimeout = error instanceof Error && error.message.includes('timeout')
      if (isTimeout) {
        setUserType('sailor' as UserType)
        setUserProfile({ id: uid, user_type: 'sailor' })
        profileFetchInProgress.current = null
        return { id: uid, user_type: 'sailor' }
      }

      profileFetchInProgress.current = null
      return null
    }
  }

  const updateUserProfile = async (updates: any) => {
    const uid = user?.id
    if (!uid) throw new Error('No user ID available')

    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .maybeSingle()

      let result
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('users')
          .update(updates)
          .eq('id', uid)
          .select()
          .single()
      } else {
        // Create new profile - include email and full_name from auth user
        const profileData = {
          id: uid,
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
          ...updates
        }

        try {
          result = await supabase
            .from('users')
            .insert(profileData)
            .select()
            .single()
        } catch (insertError: any) {
          // If insert fails due to duplicate key (profile was created by trigger), try to fetch existing profile
          if (insertError.code === '23505') {
            const { data: triggerProfile, error: fetchError } = await supabase
              .from('users')
              .select('*')
              .eq('id', uid)
              .single()

            if (fetchError) throw fetchError

            // Now update the existing profile with the provided updates
            result = await supabase
              .from('users')
              .update(updates)
              .eq('id', uid)
              .select()
              .single()
          } else {
            throw insertError
          }
        }
      }

      if (result.error) throw result.error

      setUserProfile(result.data)
      setUserType(result.data?.user_type as UserType)

      return result.data
    } catch (error) {
      console.error('Failed to update user profile:', error)
      throw error
    }
  }

  const loadPersonaContext = useCallback(async () => {
    authDebugLog('[loadPersonaContext] Called with:', {
      userId: user?.id,
      userType,
      isDemoSession,
      clubId: userProfile?.club_id ?? null
    })

    if (!user?.id || isDemoSession) {
      authDebugLog('[loadPersonaContext] Early return - no user or demo session')
      setClubProfile(null)
      setCoachProfile(null)
      setCapabilities(DEFAULT_CAPABILITIES)
      setPersonaLoading(false)
      return
    }

    setPersonaLoading(true)
    authDebugLog('[loadPersonaContext] Starting to load persona context')

    // Direct Supabase query for club profile - no external API needed
    const resolveClubWorkspaceDirect = async () => {
      authDebugLog('[loadPersonaContext] Resolving club workspace directly from Supabase')

      // First check if user has a club membership
      const { data: membership, error: membershipError } = await supabase
        .from('club_members')
        .select(`
          *,
          club:clubs(*)
        `)
        .eq('user_id', user!.id)
        .maybeSingle()

      if (membershipError && membershipError.code !== 'PGRST116') {
        authDebugLog('[loadPersonaContext] Club membership query error:', membershipError)
        throw membershipError
      }

      if (membership?.club) {
        authDebugLog('[loadPersonaContext] Found club via membership:', membership.club.name)
        return { club: membership.club, membership }
      }

      // Check if user owns a club directly
      const { data: ownedClub, error: ownedError } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user!.id)
        .maybeSingle()

      if (ownedError && ownedError.code !== 'PGRST116') {
        authDebugLog('[loadPersonaContext] Owned club query error:', ownedError)
        throw ownedError
      }

      if (ownedClub) {
        authDebugLog('[loadPersonaContext] Found owned club:', ownedClub.name)
        return { club: ownedClub, membership: { role: 'owner' } }
      }

      authDebugLog('[loadPersonaContext] No club found for user')
      return null
    }

    try {
      // 1. Load user capabilities from user_capabilities table
      authDebugLog('[loadPersonaContext] Loading user capabilities...')
      const { data: capabilityRecords, error: capError } = await supabase
        .from('user_capabilities')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (capError && capError.code !== 'PGRST116') {
        authDebugLog('[loadPersonaContext] Capabilities query error:', capError.message)
      }

      const hasCoachingCapability = capabilityRecords?.some(
        (c: any) => c.capability_type === 'coaching'
      ) ?? false

      authDebugLog('[loadPersonaContext] Capabilities loaded:', {
        hasCoaching: hasCoachingCapability,
        count: capabilityRecords?.length ?? 0
      })

      // 2. Load coach profile if user has coaching capability OR user_type is 'coach' (backward compat)
      const shouldLoadCoachProfile = hasCoachingCapability || userType === 'coach'
      let loadedCoachProfile = null

      if (shouldLoadCoachProfile) {
        authDebugLog('[loadPersonaContext] Loading coach profile with user.id:', user.id)

        const { data, error } = await supabase
          .from('coach_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        authDebugLog('[loadPersonaContext] Coach profile query result:', {
          hasData: !!data,
          error: error?.message
        })

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        loadedCoachProfile = data ?? null
        setCoachProfile(loadedCoachProfile)
        authDebugLog('[loadPersonaContext] Coach profile set:', !!data)
      } else {
        setCoachProfile(null)
      }

      // 3. Update capabilities state with loaded data
      setCapabilities({
        hasCoaching: hasCoachingCapability || userType === 'coach', // Include legacy coach users
        coachingProfile: loadedCoachProfile,
        rawCapabilities: capabilityRecords ?? [],
      })

      // 4. Load club context if applicable
      const effectiveUserType =
        userType ?? (userProfile?.club_id ? ('club' as UserType) : null)

      if (effectiveUserType === 'club' || userProfile?.club_id) {
        authDebugLog('[loadPersonaContext] Loading club profile for user:', user?.id)

        const workspace = await resolveClubWorkspaceDirect()

        authDebugLog('[loadPersonaContext] Workspace result:', {
          hasClub: !!workspace?.club,
          clubId: workspace?.club?.id ?? null,
          role: workspace?.membership?.role ?? null,
        })

        if (workspace?.club) {
          setClubProfile(workspace.club)
          if (workspace.club.id) {
            setUserProfile((prev: any) =>
              prev ? { ...prev, club_id: workspace.club.id } : prev
            )
          }
        } else {
          // Club user without a club yet - that's fine, they'll create one in onboarding
          setClubProfile(null)
        }
      } else {
        setClubProfile(null)
      }
    } catch (error) {
      console.error('[AuthProvider] Failed to load persona context:', error)
      authDebugLog('[loadPersonaContext] Exception caught:', error)
      setClubProfile(null)
      setCoachProfile(null)
      setCapabilities(DEFAULT_CAPABILITIES)
    } finally {
      setPersonaLoading(false)
      authDebugLog('[loadPersonaContext] Completed, personaLoading set to false')
    }
  }, [user?.id, userType, isDemoSession, userProfile?.club_id])

  // Initial auth state setup with proper session restoration
  useEffect(() => {
    authDebugLog('🔥 [AUTH] useEffect initialization starting...')
    let alive = true

    const initializeAuth = async () => {
      try {
        authDebugLog('[AUTH] Starting initialization...')

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          authDebugLog('[AUTH] getSession error:', sessionError)
          if (isInvalidRefreshTokenError(sessionError)) {
            console.error('[AUTH] Invalid refresh token detected - clearing session and redirecting to login')
            await clearInvalidSession('getSession', sessionError)
            setReady(true)
            // Redirect to login page
            try {
              router.replace('/(auth)/login')
            } catch (navError) {
              // Fallback: reload to clear bad state
              if (typeof window !== 'undefined') {
                window.location.href = '/'
              }
            }
            return
          }
        }

        if (!alive) {
          return
        }

        const session = sessionData?.session
        const authUser = session?.user

        authDebugLog('[AUTH] Session check result:', {
          hasSession: !!session,
          hasUser: !!authUser,
          userEmail: authUser?.email
        })

        setSignedIn(!!session)
        setUser(authUser || null)

        // If no session, check if user has guest data (freemium mode)
        if (!session) {
          const hasGuestRace = await GuestStorageService.hasGuestRace()
          if (hasGuestRace) {
            authDebugLog('[AUTH] Guest race found, entering guest mode')
            setIsGuest(true)
          }
        }

        if (authUser?.id) {
          authDebugLog('[AUTH] Fetching user profile for:', authUser.id)
          try {
            const profile = await fetchUserProfile(authUser.id)
            authDebugLog('[AUTH] Profile fetch result:', {
              hasProfile: !!profile,
              user_type: profile?.user_type,
              onboarding_completed: profile?.onboarding_completed,
              email: profile?.email
            })
            if (profile?.user_type) {
              setUserType(profile.user_type as UserType)
              authDebugLog('[AUTH] userType set to:', profile.user_type)
            } else {
              setUserType(null)
            }
          } catch (e) {
            console.error('[AUTH] User profile fetch failed:', e)
            setUserType(null)
          }
        } else {
          setUserType(null)
          authDebugLog('[AUTH] No authUser.id')
        }

        authDebugLog('[AUTH] Initialization complete, setting ready=true')
        initialAuthInProgress.current = false
        setReady(true)
      } catch (e) {
        console.error('[AUTH] Initialization failed:', e)
        initialAuthInProgress.current = false
        if (alive) setReady(true)
      }
    }

    // Set a watchdog timer as fallback
    const watchdogTimer = setTimeout(() => {
      if (alive && !ready) {
        initialAuthInProgress.current = false
        setReady(true)
      }
    }, 3000)

    initializeAuth()

    return () => {
      alive = false
      clearTimeout(watchdogTimer)
    }
  }, [clearInvalidSession]) // Run once on mount

  useEffect(() => {
    if (!signedIn || !user?.id || isDemoSession) {
      setClubProfile(null)
      setCoachProfile(null)
      setCapabilities(DEFAULT_CAPABILITIES)
      setPersonaLoading(false)
      return
    }

    loadPersonaContext()
  }, [loadPersonaContext, signedIn, user?.id, userType, isDemoSession])

  // Auth state change listener - depends on router for navigation
  useEffect(()=>{
    let alive = true

    const {data:sub} = supabase.auth.onAuthStateChange(async (evt, session)=>{
      authDebugLog('🔔 [AUTH] ===== AUTH STATE CHANGE EVENT =====')
      authDebugLog('🔔 [AUTH] Event:', evt, 'hasSession:', !!session)
      authDebugLog('🔔 [AUTH] Component alive:', alive)

      // Enhanced diagnostics
      logAuthEvent('auth_state_change', {
        event: evt,
        hasSession: !!session,
        sessionUser: session?.user?.email || 'N/A',
        componentAlive: alive
      })

      if (!alive) {
        authDebugLog('🔔 [AUTH] Component not alive, returning early')
        return
      }

      authDebugLog('🔔 [AUTH] Updating auth state...')
      setSignedIn(!!session)
      setUser(session?.user || null)
      if (session?.user) {
        setIsDemoSession(false)
        setIsGuest(false) // Clear guest mode when user signs in
      }
      authDebugLog('🔔 [AUTH] Auth state updated:', { signedIn: !!session, hasUser: !!session?.user })

      // Log updated state
      logAuthState('after_state_update', {
        ready: true, // We're in auth listener so ready should be true
        signedIn: !!session,
        user: session?.user,
        userProfile: userProfile,
        userType: userType,
        loading: false
      })

      // Note: TOKEN_REFRESH_FAILED may not be in Supabase's type union but we handle it defensively
      if (evt === 'SIGNED_OUT' || (evt as string) === 'TOKEN_REFRESH_FAILED') {
        const reason =
          (evt as string) === 'TOKEN_REFRESH_FAILED'
            ? 'TOKEN_REFRESH_FAILED (invalid/expired session)'
            : 'SIGNED_OUT';
        authDebugLog(`🚪 [AUTH] ===== ${reason} EVENT RECEIVED =====`)
        authDebugLog('🚪 [AUTH] Starting state cleanup...')

        if ((evt as string) === 'TOKEN_REFRESH_FAILED') {
          console.error('[AUTH] Token refresh failed. Clearing session and forcing re-authentication.')
          await clearInvalidSession('auth_state_change:refresh_failed')
        }

        // Clear all cached auth state
        authDebugLog('🚪 [AUTH] Clearing signedIn state...')
        setSignedIn(false)
        authDebugLog('🚪 [AUTH] Clearing user state...')
        setUser(null)
        authDebugLog('🚪 [AUTH] Clearing userProfile state...')
        setUserProfile(null)
        authDebugLog('🚪 [AUTH] Clearing userType state...')
        setUserType(null)
        authDebugLog('🚪 [AUTH] Clearing loading state...')
        setLoading(false)
        setPersonaLoading(false)
        setClubProfile(null)
        setCoachProfile(null)
        setCapabilities(DEFAULT_CAPABILITIES)

        authDebugLog('🚪 [AUTH] State cleanup complete. Starting navigation...')
        
        // Immediately redirect to landing page to prevent any route protection from redirecting to login
        authDebugLog('🚪 [AUTH] Navigating to landing page...')
        try {
          if (typeof window !== 'undefined') {
            authDebugLog('🚪 [AUTH] Replacing browser history state...')
            window.history.replaceState(null, '', '/')
          }
          // Use replace to ensure we go to landing page, not login
          router.replace('/')
        } catch (historyError) {
          console.warn('🚪 [AUTH] History replace error:', historyError)
          // Fallback: force navigation to landing page
          try {
            router.replace('/')
          } catch (navError) {
            console.warn('🚪 [AUTH] Navigation fallback failed:', navError)
          }
        }
        authDebugLog('🚪 [AUTH] ===== SIGNED_OUT HANDLER COMPLETE =====')
      }

      if (evt === 'SIGNED_IN' && session?.user?.id) {
        authDebugLog('🔔 [AUTH] SIGNED_IN event - fetching profile...')

        // Skip profile fetch if initial auth is still in progress - initializeAuth will handle it
        if (initialAuthInProgress.current) {
          authDebugLog('🔔 [AUTH] ⏭️ Skipping profile fetch - initial auth in progress')
          return
        }

        // Use loading state instead of toggling ready (prevents infinite loop)
        setLoading(true)
        authDebugLog('🔔 [AUTH] Set loading=true while fetching profile')

        try {
          // Check for guest race data to migrate
          try {
            const hasGuestRace = await GuestStorageService.hasGuestRace()
            if (hasGuestRace) {
              authDebugLog('🔔 [AUTH] Found guest race data, migrating to account...')
              const newRaceId = await GuestStorageService.migrateToAccount(session.user.id)
              if (newRaceId) {
                authDebugLog('🔔 [AUTH] Successfully migrated guest race:', newRaceId)
                await GuestStorageService.clearGuestData()
              }
            }
          } catch (migrationError) {
            console.warn('[AUTH] Guest data migration failed, continuing anyway:', migrationError)
          }

          // Check for pending race data (saved when guest tried to add 2nd race before signup)
          try {
            const pendingRace = await GuestStorageService.getPendingRace()
            if (pendingRace) {
              authDebugLog('🔔 [AUTH] Found pending race data, migrating to account...')
              const newPendingRaceId = await GuestStorageService.migratePendingRaceToAccount(session.user.id)
              if (newPendingRaceId) {
                authDebugLog('🔔 [AUTH] Successfully migrated pending race:', newPendingRaceId)
              }
            }
          } catch (pendingMigrationError) {
            console.warn('[AUTH] Pending race migration failed, continuing anyway:', pendingMigrationError)
          }

          // Fetch profile and update state - let gates handle routing
          authDebugLog('🔔 [AUTH] Fetching profile data...')
          const profileData = await fetchUserProfile(session.user.id)
          authDebugLog('🔔 [AUTH] Profile data received:', profileData)
          if (profileData?.user_type) {
            setUserType(profileData.user_type as UserType)
            authDebugLog('🔔 [AUTH] ✅ userType set')
          } else {
            authDebugLog('🔔 [AUTH] ⚠️ No user_type on profile')
          }
          authDebugLog('🔔 [AUTH] State updated - gates will handle routing')
        } catch (e) {
          console.warn('[AUTH] Profile fetch error:', e)
          setUserType(null)
        } finally {
          setLoading(false)
          authDebugLog('🔔 [AUTH] Profile fetch complete, loading=false')
        }
      }
    })

    return ()=>{ alive=false; sub.subscription.unsubscribe() }
  }, [router, clearInvalidSession])

  const identifierToAuthEmail = (value: string) => {
    const normalized = value.trim().toLowerCase()
    if (!normalized) {
      throw new Error('Identifier is required')
    }
    if (normalized.includes('@')) {
      return normalized
    }
    return `${normalized}@users.regattaflow.io`
  }

  const signIn = async (identifier: string, password: string) => {
    const email = identifierToAuthEmail(identifier)
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Set user and signedIn state - profile fetch will happen in onAuthStateChange
      if (data.user?.id) {
        setUser(data.user)
        setSignedIn(true)
        // Don't fetch profile here - let onAuthStateChange handle it to avoid duplication
      }

      // Don't set loading(false) here - let onAuthStateChange handle it after user/profile are set
    } catch (error: any) {
      console.error('🔐 [AUTH] signIn error:', error)
      setLoading(false)
      throw error
    }
    // Note: Don't set loading(false) in finally - let onAuthStateChange handle it
  }

  const signOut = async () => {
    authDebugLog('🚪 [AUTH] ===== SIGNOUT PROCESS STARTING =====')
    authDebugLog('🚪 [AUTH] Current state before signOut:', {
      signedIn,
      user: !!user,
      userProfile: !!userProfile,
      loading,
      ready
    })

    // CRITICAL: Navigate to landing page IMMEDIATELY before clearing auth state
    // This prevents route protection from redirecting to login
    authDebugLog('🚪 [AUTH] Navigating to landing page immediately...')
    try {
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/')
      }
      router.replace('/')
    } catch (navError) {
      console.warn('🚪 [AUTH] Initial navigation error:', navError)
    }

    if (isDemoSession) {
      authDebugLog('🚪 [AUTH] Demo session detected, performing local sign out.')
      setSignedIn(false)
      setUser(null)
      setUserProfile(null)
      setUserType(null)
      setPersonaLoading(false)
      setLoading(false)
      setClubProfile(null)
      setCoachProfile(null)
      setCapabilities(DEFAULT_CAPABILITIES)
      setIsDemoSession(false)
      return
    }

    setLoading(true)
    authDebugLog('🚪 [AUTH] Loading set to true')

    let fallbackTriggered = false

    const fallbackTimer = setTimeout(() => {
      if (!fallbackTriggered) {
        console.warn('🚪 [AUTH] Fallback signOut triggered (timeout)')
        fallbackTriggered = true
        setSignedIn(false)
        setUser(null)
        setUserProfile(null)
        setUserType(null)
        setLoading(false)
        setPersonaLoading(false)
        setClubProfile(null)
        setCoachProfile(null)
        setCapabilities(DEFAULT_CAPABILITIES)
        if (typeof window !== 'undefined') {
          try {
            window.history.replaceState(null, '', '/')
          } catch (historyError) {
            console.warn('🚪 [AUTH] History replace failed in fallback:', historyError)
          }
        }
        router.replace('/')
      }
    }, 4000)

    try {
      authDebugLog('🚪 [AUTH] About to call signOutEverywhere()...')
      await signOutEverywhere()
      authDebugLog('🚪 [AUTH] signOutEverywhere() completed successfully')

      // Sign out from native OAuth providers (Google, etc.)
      if (Platform.OS !== 'web') {
        await signOutFromNativeProviders()
        authDebugLog('🚪 [AUTH] Native OAuth providers signed out')
      }

      // Clear state immediately - don't wait for SIGNED_OUT event
      // (Event may not fire if network is down but local storage was cleared)
      authDebugLog('🚪 [AUTH] Clearing auth state immediately after local cleanup...')
      setSignedIn(false)
      setUser(null)
      setUserProfile(null)
      setUserType(null)
      setLoading(false)
      setPersonaLoading(false)
      setClubProfile(null)
      setCoachProfile(null)
      setCapabilities(DEFAULT_CAPABILITIES)
      clearTimeout(fallbackTimer)
      authDebugLog('🚪 [AUTH] Auth state cleared successfully')
    } catch (error) {
      console.error('🚪 [AUTH] ERROR in signOut process:', error)
      authDebugLog('🚪 [AUTH] Manual cleanup due to error')
      setSignedIn(false)
      setUser(null)
      setUserProfile(null)
      setUserType(null)
      setLoading(false)
      setPersonaLoading(false)
      setClubProfile(null)
      setCoachProfile(null)
      setCapabilities(DEFAULT_CAPABILITIES)
      if (typeof window !== 'undefined') {
        try {
          window.history.replaceState(null, '', '/')
        } catch (historyError) {
          console.warn('🚪 [AUTH] History replace failed after error:', historyError)
        }
      }
      router.replace('/')
      clearTimeout(fallbackTimer)
      throw error
    } finally {
      clearTimeout(fallbackTimer)
    }
  }

  const signUp = async (email: string, username: string, password: string, persona: PersonaRole) => {
    const trimmedEmail = email.trim()
    const displayName = username.trim()
    const personaRole = persona

    // Validate inputs
    if (!trimmedEmail) {
      throw new Error('Email is required')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error('Invalid email address')
    }

    if (!displayName) {
      throw new Error('Username is required')
    }

    if (displayName.length < 3) {
      throw new Error('Username must be at least 3 characters long')
    }

    if (!personaRole) {
      throw new Error('A persona is required')
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    authDebugLog('🚀 [AUTH] signUp called with:', {
      email: trimmedEmail,
      username: displayName,
      persona: personaRole,
      hasPassword: !!password
    })

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            username: displayName,
            persona: personaRole,
            full_name: displayName,
            name: displayName
          },
          emailRedirectTo: Platform.OS === 'web'
            ? `${window.location.origin}/callback`
            : undefined
        }
      })

      if (error) {
        throw error
      }

      authDebugLog('✅ [AUTH] Supabase signUp successful:', data)

      if (data.user?.id) {
        const profilePayload = {
          id: data.user.id,
          email: trimmedEmail,
          full_name: displayName,
          user_type: personaRole,
          onboarding_completed: personaRole === 'sailor', // Sailors skip onboarding
        }

        authDebugLog('[AUTH] Upserting user profile:', profilePayload)

        const { error: profileError } = await supabase
          .from('users')
          .upsert(profilePayload, { onConflict: 'id' })

        if (profileError) {
          console.error('[AUTH] ❌ Profile upsert failed during signUp:', profileError)
          logger.warn('[AUTH] Profile upsert failed during signUp:', profileError)
        } else {
          authDebugLog('[AUTH] ✅ Profile upsert successful')
          setUserProfile((prev: any) => ({
            ...(prev ?? {}),
            ...profilePayload
          }))
        }
        setUserType(personaRole)
        authDebugLog('[AUTH] userType set to:', personaRole)

        try {
          authDebugLog('🔍 [AUTH] Refreshing profile after signUp...')
          await fetchUserProfile(data.user.id)
        } catch (profileError) {
          logger.warn('[AUTH] Profile fetch after signUp failed:', profileError)
        }
      }

      return data
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async (persona?: PersonaRole) => {
    setLoading(true)
    try {
      authDebugLog('🔍 [LOGIN] Google sign-in button clicked')
      authDebugLog('🔍 [LOGIN] Calling signInWithGoogle() with persona:', persona)

      // Store the selected persona in localStorage before OAuth redirect (web only)
      if (persona && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem('oauth_pending_persona', persona)
        authDebugLog('🔍 [LOGIN] Stored pending persona in localStorage:', persona)
      }

      if (Platform.OS === 'web') {
        // Dynamic origin configuration - works on any port
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
        const redirectTo = `${currentOrigin}/callback`

        authDebugLog('🔍 [LOGIN] Dynamic OAuth redirect:', redirectTo)

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo
          }
        })
        if (error) throw error
      } else {
        // Native mobile: Store persona in AsyncStorage, then use native OAuth
        if (persona) {
          await AsyncStorage.setItem('oauth_pending_persona', persona)
          authDebugLog('🔍 [LOGIN] Stored pending persona in AsyncStorage:', persona)
        }

        authDebugLog('🔍 [LOGIN] Starting native Google sign-in')
        const result = await nativeGoogleSignIn()
        authDebugLog('🔍 [LOGIN] Native Google sign-in successful:', result?.user?.id)

        // Handle profile creation for new users with persona
        if (result?.user?.id && persona) {
          await handleNativeOAuthProfile(result.user, persona)
        }

        // Clear stored persona after successful sign-in
        await AsyncStorage.removeItem('oauth_pending_persona')
      }
    } catch (error) {
      console.error('🔍 [LOGIN] Google sign-in failed:', error)
      // Clear the stored persona on error
      if (Platform.OS === 'web') {
        safeLocalStorage.removeItem('oauth_pending_persona')
      } else {
        await AsyncStorage.removeItem('oauth_pending_persona')
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Helper to handle profile creation after native OAuth sign-in
  const handleNativeOAuthProfile = async (user: any, persona: PersonaRole) => {
    try {
      authDebugLog('🔍 [LOGIN] Checking/creating profile for OAuth user:', user.id)

      // Check if profile already has a user_type set
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id, user_type')
        .eq('id', user.id)
        .maybeSingle()

      if (existingProfile?.user_type) {
        authDebugLog('🔍 [LOGIN] Existing profile found with user_type:', existingProfile.user_type)
        return // Profile already set up, nothing to do
      }

      // Create/update profile with the selected persona
      const profilePayload = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        user_type: persona,
        onboarding_completed: persona === 'sailor',
      }

      authDebugLog('🔍 [LOGIN] Upserting OAuth profile:', profilePayload)
      const { error: upsertError } = await supabase
        .from('users')
        .upsert(profilePayload, { onConflict: 'id' })

      if (upsertError) {
        console.error('🔍 [LOGIN] Profile upsert failed:', upsertError)
      } else {
        authDebugLog('🔍 [LOGIN] Profile upsert successful')
        setUserProfile((prev: any) => ({ ...(prev ?? {}), ...profilePayload }))
        setUserType(persona)

        // For new sailors, create sample data
        if (persona === 'sailor') {
          try {
            const { createSailorSampleData } = await import('@/services/onboarding/SailorSampleDataService')
            await createSailorSampleData({
              userId: user.id,
              userName: profilePayload.full_name || 'Sailor',
            })
            authDebugLog('🔍 [LOGIN] Sample data created for new sailor')
          } catch (sampleError) {
            console.warn('🔍 [LOGIN] Sample data creation failed:', sampleError)
          }
        }
      }
    } catch (error) {
      console.error('🔍 [LOGIN] handleNativeOAuthProfile error:', error)
    }
  }

  const signInWithApple = async (persona?: PersonaRole) => {
    setLoading(true)
    try {
      authDebugLog('🔍 [LOGIN] Apple sign-in button clicked')
      authDebugLog('🔍 [LOGIN] Calling signInWithApple() with persona:', persona)

      // Store the selected persona in localStorage before OAuth redirect (web only)
      if (persona && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem('oauth_pending_persona', persona)
        authDebugLog('🔍 [LOGIN] Stored pending persona in localStorage:', persona)
      }

      if (Platform.OS === 'web') {
        // Dynamic origin configuration - works on any port
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
        const redirectTo = `${currentOrigin}/callback`

        // For web, use Supabase's OAuth flow
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo
          }
        })
        if (error) throw error
      } else {
        // Native mobile (iOS only): Use native Apple Sign-In
        if (persona) {
          await AsyncStorage.setItem('oauth_pending_persona', persona)
          authDebugLog('🔍 [LOGIN] Stored pending persona in AsyncStorage:', persona)
        }

        authDebugLog('🔍 [LOGIN] Starting native Apple sign-in')
        const result = await nativeAppleSignIn()
        authDebugLog('🔍 [LOGIN] Native Apple sign-in successful:', result?.user?.id)

        // Handle profile creation for new users with persona
        if (result?.user?.id && persona) {
          await handleNativeOAuthProfile(result.user, persona)
        }

        // Clear stored persona after successful sign-in
        await AsyncStorage.removeItem('oauth_pending_persona')
      }
    } catch (error) {
      console.error('🔍 [LOGIN] Apple sign-in failed:', error)
      // Clear the stored persona on error
      if (Platform.OS === 'web') {
        safeLocalStorage.removeItem('oauth_pending_persona')
      } else {
        await AsyncStorage.removeItem('oauth_pending_persona')
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Add a capability to the current user (e.g., 'coaching')
   * Creates the capability record and reloads persona context
   */
  const addCapability = useCallback(async (capabilityType: CapabilityType) => {
    if (!user?.id) {
      throw new Error('No user logged in')
    }

    authDebugLog('[AUTH] Adding capability:', capabilityType)

    try {
      // Insert the capability record
      const { data, error } = await supabase
        .from('user_capabilities')
        .insert({
          user_id: user.id,
          capability_type: capabilityType,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        // Handle duplicate (user already has this capability)
        if (error.code === '23505') {
          authDebugLog('[AUTH] User already has capability:', capabilityType)
          // Reactivate if it was deactivated
          const { error: updateError } = await supabase
            .from('user_capabilities')
            .update({ is_active: true, deactivated_at: null })
            .eq('user_id', user.id)
            .eq('capability_type', capabilityType)

          if (updateError) {
            throw updateError
          }
        } else {
          throw error
        }
      }

      authDebugLog('[AUTH] Capability added successfully:', data)

      // Reload persona context to pick up the new capability
      await loadPersonaContext()

    } catch (error) {
      console.error('[AUTH] Failed to add capability:', error)
      throw error
    }
  }, [user?.id, loadPersonaContext])

  /**
   * Enter guest mode for freemium experience
   * Called when user chooses to continue without signing up
   */
  const enterGuestMode = useCallback(() => {
    authDebugLog('[AUTH] Entering guest mode')
    setIsGuest(true)
    // Navigate to races tab
    router.replace('/(tabs)/races')
  }, [])

  const value = useMemo<AuthCtx>(() => {
    // Compute state from ready, signedIn, isGuest, and userType
    let state: AuthState = 'checking'
    if (!ready) {
      state = 'checking'
    } else if (signedIn) {
      state = 'ready'
    } else if (isGuest) {
      state = 'guest'
    } else {
      state = 'signed_out'
    }

    return {
      state,
      ready,
      signedIn,
      isGuest,
      user,
      loading,
      personaLoading,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithApple,
      enterGuestMode,
      biometricAvailable: false,
      biometricEnabled: false,
      userProfile,
      userType,
      capabilities,
      clubProfile,
      coachProfile,
      refreshPersonaContext: loadPersonaContext,
      updateUserProfile,
      fetchUserProfile,
      addCapability,
      isDemoSession
    }
  }, [ready, signedIn, isGuest, user, loading, personaLoading, userProfile, userType, capabilities, clubProfile, coachProfile, loadPersonaContext, isDemoSession, enterGuestMode, addCapability])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
