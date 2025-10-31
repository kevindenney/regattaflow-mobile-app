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

type AuthState = 'checking' | 'signed_out' | 'ready'

type AuthCtx = {
  state: AuthState
  ready: boolean
  signedIn: boolean
  user: any | null
  loading: boolean
  personaLoading: boolean
  signIn: (identifier: string, password: string) => Promise<void>
  signUp: (username: string, password: string, persona: PersonaRole) => Promise<any>
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
        ? DEFAULT_PERSONA
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
    if (!user?.id || isDemoSession) {
      setClubProfile(null)
      setCoachProfile(null)
      setPersonaLoading(false)
      return
    }

    if (!userType || userType === 'sailor') {
      setClubProfile(null)
      setCoachProfile(null)
      setPersonaLoading(false)
      return
    }

    setPersonaLoading(true)

    try {
      if (userType === 'club') {
        const { data, error } = await supabase
          .from('club_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        setClubProfile(data ?? null)
      } else {
        setClubProfile(null)
      }

      if (userType === 'coach') {
        const { data, error } = await supabase
          .from('coach_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        setCoachProfile(data ?? null)
      } else {
        setCoachProfile(null)
      }
    } catch (error) {
      console.error('[AuthProvider] Failed to load persona context:', error)
      if (userType === 'club') {
        setClubProfile(null)
      }
      if (userType === 'coach') {
        setCoachProfile(null)
      }
    } finally {
      setPersonaLoading(false)
    }
  }, [user?.id, userType, isDemoSession])

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

      if (evt === 'SIGNED_OUT') {
        authDebugLog('🚪 [AUTH] ===== SIGNED_OUT EVENT RECEIVED =====')
        authDebugLog('🚪 [AUTH] Starting state cleanup...')

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

  const signUp = async (username: string, password: string, persona: PersonaRole) => {
    const displayName = username.trim()
    const personaRole = persona

    if (!displayName) {
      throw new Error('Username is required')
    }
    if (!personaRole) {
      throw new Error('A persona is required')
    }

    const email = identifierToAuthEmail(displayName)
    authDebugLog('🚀 [AUTH] signUp called with:', {
      username: displayName,
      persona: personaRole,
      hasPassword: !!password
    })

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
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
          email,
          full_name: displayName,
          user_type: personaRole,
          onboarding_completed: true,
        }

        const { error: profileError } = await supabase
          .from('users')
          .upsert(profilePayload, { onConflict: 'id' })

        if (profileError) {
          logger.warn('[AUTH] Profile upsert failed during signUp:', profileError)
        } else {
          setUserProfile((prev: any) => ({
            ...(prev ?? {}),
            ...profilePayload
          }))
        }
        setUserType(personaRole)

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
