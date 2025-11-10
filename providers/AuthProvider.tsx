import { signOutEverywhere } from '@/lib/auth-actions'
import { supabase, UserType } from '@/services/supabase'
import { bindAuthDiagnostics } from '@/utils/authDebug'
import { logAuthEvent, logAuthState } from '@/utils/errToText'
import { router } from 'expo-router'
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { Platform } from 'react-native'
import { createLogger } from '@/lib/utils/logger';

// Re-export UserType for backward compatibility
export type { UserType } from '@/services/supabase'

type PersonaRole = Exclude<UserType, null>;
const DEFAULT_PERSONA: PersonaRole = 'sailor';

// Bind diagnostics once at app boot
bindAuthDiagnostics(supabase)

const logger = createLogger('AuthProvider');
const AUTH_DEBUG_ENABLED = true
const authDebugLog = (...args: Parameters<typeof logger.debug>) => {
  if (!AUTH_DEBUG_ENABLED) {
    return
  }
  logger.debug(...args)
}

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_BASE_URL ||
  process.env.EXPO_PUBLIC_WEB_BASE_URL ||
  ''

const buildApiUrl = (path: string) => {
  if (!API_BASE) {
    return path
  }
  return `${API_BASE.replace(/\/$/, '')}${path}`
}

type AuthState = 'checking' | 'signed_out' | 'ready'

type AuthCtx = {
  state: AuthState
  ready: boolean
  signedIn: boolean
  user: any | null
  loading: boolean
  personaLoading: boolean
  signIn: (identifier: string, password: string) => Promise<void>
  signUp: (email: string, username: string, password: string, persona: PersonaRole) => Promise<any>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  biometricAvailable: boolean
  biometricEnabled: boolean
  userProfile?: any
  userType?: UserType
  clubProfile: any | null
  coachProfile: any | null
  refreshPersonaContext: () => Promise<void>
  updateUserProfile: (updates: any) => Promise<void>
  fetchUserProfile: (userId?: string) => Promise<any>
  isDemoSession: boolean
}

const Ctx = createContext<AuthCtx>({
  state: 'checking',
  ready: false,
  signedIn: false,
  user: null,
  loading: false,
  personaLoading: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  biometricAvailable: false,
  biometricEnabled: false,
  clubProfile: null,
  coachProfile: null,
  refreshPersonaContext: async () => {},
  updateUserProfile: async () => {},
  fetchUserProfile: async (_userId?: string) => null,
  userType: null,
  userProfile: null,
  isDemoSession: false,
})

export function AuthProvider({children}:{children: React.ReactNode}) {
  const [ready, setReady] = useState(false) // Start as not ready until we check session
  const [signedIn, setSignedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [personaLoading, setPersonaLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userType, setUserType] = useState<UserType>(null)
  const [clubProfile, setClubProfile] = useState<any | null>(null)
  const [coachProfile, setCoachProfile] = useState<any | null>(null)
  const [isDemoSession, setIsDemoSession] = useState(false)

  const fetchUserProfile = async (userId?: string) => {
    const uid = userId || user?.id
    authDebugLog('[fetchUserProfile] Called with userId:', uid)
    if (!uid) {
      authDebugLog('[fetchUserProfile] ❌ No userId provided')
      return null
    }

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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .maybeSingle()

      authDebugLog('[fetchUserProfile] Database response:', {
        hasData: !!data,
        hasError: !!error,
        user_type: data?.user_type,
        onboarding_completed: data?.onboarding_completed,
        error: error?.message
      })

      if (error) {
        console.error('[fetchUserProfile] Database error:', error)
        return null
      }

      if (!data) {
        console.warn('[fetchUserProfile] No profile found for user:', uid)
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
      return resolvedProfile
    } catch (error) {
      console.error('[fetchUserProfile] Exception:', error)
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
      setPersonaLoading(false)
      return
    }

    const effectiveUserType =
      userType ?? (userProfile?.club_id ? ('club' as UserType) : null)

    if (!effectiveUserType) {
      authDebugLog('[loadPersonaContext] Early return - no effective user type')
      setClubProfile(null)
      setCoachProfile(null)
      setPersonaLoading(false)
      return
    }

    if (effectiveUserType === 'sailor' && !userProfile?.club_id) {
      authDebugLog('[loadPersonaContext] Early return - sailor without club context')
      setClubProfile(null)
      setCoachProfile(null)
      setPersonaLoading(false)
      return
    }

    setPersonaLoading(true)
    authDebugLog('[loadPersonaContext] Starting to load persona context for:', effectiveUserType)

    const resolveClubWorkspace = async (ensure: boolean) => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      const accessToken = sessionData?.session?.access_token
      if (!accessToken) {
        throw new Error('Missing access token for workspace resolution')
      }

      const url = buildApiUrl(`/api/club/workspace${ensure ? '?ensure=1' : ''}`)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to resolve club workspace')
      }

      return payload
    }

    try {
      if (effectiveUserType === 'club' || userProfile?.club_id) {
        const ensureWorkspace = effectiveUserType === 'club'
        authDebugLog('[loadPersonaContext] Resolving club workspace via API', {
          ensureWorkspace,
          userId: user?.id,
        })

        const workspace = await resolveClubWorkspace(ensureWorkspace)

        authDebugLog('[loadPersonaContext] Workspace response received:', {
          hasClub: !!workspace?.club,
          created: workspace?.created ?? false,
          membershipSource: workspace?.membership?.source ?? null,
          role: workspace?.membership?.role ?? null,
          clubId: workspace?.club?.id ?? null,
        })

        if (workspace?.club) {
          setClubProfile(workspace.club)
          if (workspace.club.id) {
            setUserProfile((prev: any) =>
              prev ? { ...prev, club_id: workspace.club.id } : prev
            )
          }
        } else {
          setClubProfile(null)
        }
      } else {
        setClubProfile(null)
      }

      if (effectiveUserType === 'coach') {
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

        setCoachProfile(data ?? null)
        authDebugLog('[loadPersonaContext] Coach profile set:', !!data)
      } else {
        setCoachProfile(null)
      }
    } catch (error) {
      console.error('[AuthProvider] Failed to load persona context:', error)
      authDebugLog('[loadPersonaContext] Exception caught:', error)
      if (effectiveUserType === 'club' || userProfile?.club_id) {
        setClubProfile(null)
      }
      if (effectiveUserType === 'coach') {
        setCoachProfile(null)
      }
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
          console.warn('[AUTH] getSession error:', sessionError)
        }

        if (!alive) return

        const session = sessionData?.session
        const authUser = session?.user

        authDebugLog('[AUTH] Session check result:', {
          hasSession: !!session,
          hasUser: !!authUser,
          userEmail: authUser?.email
        })

        setSignedIn(!!session)
        setUser(authUser || null)

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
              console.warn('[AUTH] No user_type on profile; consider forcing onboarding for user', authUser.email)
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
        setReady(true)
      } catch (e) {
        console.error('[AUTH] Initialization failed:', e)
        if (alive) setReady(true)
      }
    }

    // Set a watchdog timer as fallback
    const watchdogTimer = setTimeout(() => {
      if (alive && !ready) {
        setReady(true)
      }
    }, 3000)

    initializeAuth()

    return () => {
      alive = false
      clearTimeout(watchdogTimer)
    }
  }, []) // Run once on mount

  useEffect(() => {
    if (!signedIn || !user?.id || isDemoSession) {
      setClubProfile(null)
      setCoachProfile(null)
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

      if (evt === 'SIGNED_OUT' || evt === 'TOKEN_REFRESH_FAILED') {
        const reason =
          evt === 'TOKEN_REFRESH_FAILED'
            ? 'TOKEN_REFRESH_FAILED (invalid/expired session)'
            : 'SIGNED_OUT';
        authDebugLog(`🚪 [AUTH] ===== ${reason} EVENT RECEIVED =====`)
        authDebugLog('🚪 [AUTH] Starting state cleanup...')

        if (evt === 'TOKEN_REFRESH_FAILED') {
          console.error('[AUTH] Token refresh failed. Clearing session and forcing re-authentication.')
          try {
            await supabase.auth.signOut({ scope: 'local' })
            authDebugLog('🚪 [AUTH] Local signOut completed after refresh failure')
          } catch (signOutError) {
            console.warn('[AUTH] Local signOut failed after refresh failure:', signOutError)
          }
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

        authDebugLog('🚪 [AUTH] State cleanup complete. Starting navigation...')
        try {
          if (typeof window !== 'undefined') {
            authDebugLog('🚪 [AUTH] Replacing browser history state...')
            window.history.replaceState(null, '', '/')
          }
        } catch (historyError) {
          console.warn('🚪 [AUTH] History replace error:', historyError)
        }

        authDebugLog('🚪 [AUTH] Navigating to landing page...')
        router.replace('/')
        authDebugLog('🚪 [AUTH] ===== SIGNED_OUT HANDLER COMPLETE =====')
      }

      if (evt === 'SIGNED_IN' && session?.user?.id) {
        authDebugLog('🔔 [AUTH] SIGNED_IN event - fetching profile...')

        // Use loading state instead of toggling ready (prevents infinite loop)
        setLoading(true)
        authDebugLog('🔔 [AUTH] Set loading=true while fetching profile')

        try {
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
  }, [router])

  const identifierToAuthEmail = (value: string) => {
    const normalized = value.trim().toLowerCase()
    if (!normalized) {
      throw new Error('Identifier is required')
    }
    if (normalized.includes('@')) {
      return normalized
    }
    return `${normalized}@users.regattaflow.app`
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
      setIsDemoSession(false)
      if (typeof window !== 'undefined') {
        try {
          window.history.replaceState(null, '', '/')
        } catch (historyError) {
          console.warn('🚪 [AUTH] History replace error for demo sign out:', historyError)
        }
      }
      router.replace('/')
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
      authDebugLog('🚪 [AUTH] Waiting for SIGNED_OUT event to clear loading...')
      // Don't set loading(false) here - let onAuthStateChange SIGNED_OUT handler clear it
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
          onboarding_completed: true,
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

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      authDebugLog('🔍 [LOGIN] Google sign-in button clicked')
      authDebugLog('🔍 [LOGIN] Calling signInWithGoogle()')

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
        // For mobile, we'd need to implement the full OAuth flow
        // For now, let's throw an error to indicate it's not implemented
        throw new Error('Google sign-in not yet implemented for mobile')
      }
    } catch (error) {
      console.error('🔍 [LOGIN] Google sign-in failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithApple = async () => {
    setLoading(true)
    try {
      if (Platform.OS === 'web') {
        // For web, use Supabase's OAuth flow
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'apple'
        })
        if (error) throw error
      } else {
        // For mobile, we'd need to implement the full OAuth flow
        throw new Error('Apple sign-in not yet implemented for mobile')
      }
    } finally {
      setLoading(false)
    }
  }

  const value = useMemo<AuthCtx>(() => {
    // Compute state from ready, signedIn, and userType
    let state: AuthState = 'checking'
    if (!ready) {
      state = 'checking'
    } else if (!signedIn) {
      state = 'signed_out'
    } else {
      state = 'ready'
    }

    return {
      state,
      ready,
      signedIn,
      user,
      loading,
      personaLoading,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithApple,
      biometricAvailable: false,
      biometricEnabled: false,
      userProfile,
      userType,
      clubProfile,
      coachProfile,
      refreshPersonaContext: loadPersonaContext,
      updateUserProfile,
      fetchUserProfile,
      isDemoSession
    }
  }, [ready, signedIn, user, loading, personaLoading, userProfile, userType, clubProfile, coachProfile, loadPersonaContext, isDemoSession])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
