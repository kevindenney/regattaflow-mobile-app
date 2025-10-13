import { signOutEverywhere } from '@/src/lib/auth-actions'
import { supabase, UserType } from '@/src/services/supabase'
import { bindAuthDiagnostics } from '@/src/utils/authDebug'
import { logAuthEvent, logAuthState } from '@/src/utils/errToText'
import { router } from 'expo-router'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'

// Re-export UserType for backward compatibility
export type { UserType } from '@/src/services/supabase'

// Bind diagnostics once at app boot
bindAuthDiagnostics(supabase)

const AUTH_DEBUG_ENABLED = true
const authDebugLog = (...args: Parameters<typeof console.log>) => {
  if (!AUTH_DEBUG_ENABLED) {
    return
  }
  console.log(...args)
}

type AuthState = 'checking' | 'signed_out' | 'needs_role' | 'ready'

type AuthCtx = {
  state: AuthState
  ready: boolean
  signedIn: boolean
  user: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<any>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  biometricAvailable: boolean
  biometricEnabled: boolean
  userProfile?: any
  userType?: UserType
  updateUserProfile: (updates: any) => Promise<void>
  fetchUserProfile: (userId?: string) => Promise<any>
}

const Ctx = createContext<AuthCtx>({
  state: 'checking',
  ready: false,
  signedIn: false,
  user: null,
  loading: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  biometricAvailable: false,
  biometricEnabled: false,
  updateUserProfile: async () => {},
  fetchUserProfile: async (_userId?: string) => null,
  userType: null,
  userProfile: null,
})

export function AuthProvider({children}:{children: React.ReactNode}) {
  const [ready, setReady] = useState(false) // Start as not ready until we check session
  const [signedIn, setSignedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userType, setUserType] = useState<UserType>(null)

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
        console.error('[fetchUserProfile] ❌ Database error:', error)
        return null
      }

      if (!data) {
        console.warn('[fetchUserProfile] ⚠️ No profile found for user:', uid)
        return null
      }

      authDebugLog('[fetchUserProfile] ✅ Setting userProfile and userType')
      setUserProfile(data)
      setUserType(data?.user_type as UserType)
      return data
    } catch (error) {
      console.error('[fetchUserProfile] ❌ Exception:', error)
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
              authDebugLog('[AUTH] ✅ userType set to:', profile.user_type)
            } else {
              setUserType(null)
              console.warn('[AUTH] ⚠️ No user_type on profile; consider forcing onboarding for user', authUser.email)
            }
          } catch (e) {
            console.error('[AUTH] ❌ User profile fetch failed:', e)
            setUserType(null)
          }
        } else {
          setUserType(null)
          authDebugLog('[AUTH] ❌ No authUser.id')
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

  const signIn = async (email: string, password: string) => {
    console.log('🔐 [AUTH] signIn called with email:', email)
    console.log('🔐 [AUTH] Supabase instance:', !!supabase)
    console.log('🔐 [AUTH] Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL)

    setLoading(true)
    try {
      console.log('🔐 [AUTH] Calling supabase.auth.signInWithPassword...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      console.log('🔐 [AUTH] signInWithPassword response:', {
        hasData: !!data,
        hasError: !!error,
        errorMessage: error?.message
      })

      if (error) throw error

      console.log('🔐 [AUTH] Sign in successful, profile will be fetched by auth state change listener')

      // Set user and signedIn state - profile fetch will happen in onAuthStateChange
      if (data.user?.id) {
        console.log('🔐 [AUTH] User authenticated:', data.user.id)
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

  const signUp = async (email: string, password: string, fullName?: string) => {
    authDebugLog('🚀 [AUTH] signUp called with:', { email, hasPassword: !!password, fullName })
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
            name: fullName || ''
          },
          emailRedirectTo: Platform.OS === 'web'
            ? `${window.location.origin}/callback`
            : undefined
        }
      })

      if (error) {
        console.error('❌ [AUTH] Supabase signUp error:', error)
        throw error
      }

      authDebugLog('✅ [AUTH] Supabase signUp successful:', data)

      // Profile is created automatically by database trigger
      // Check if profile was created and fetch it
      if (data.user?.id) {
        try {
          authDebugLog('🔍 [AUTH] Fetching automatically created profile...')
          await fetchUserProfile(data.user.id)
        } catch (profileError) {
          console.warn('⚠️ [AUTH] Could not fetch profile immediately after signup:', profileError)
          // This is not critical - profile fetch can happen later
        }
      }

      return data
    } catch (error) {
      console.error('❌ [AUTH] signUp failed:', error)
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
    } else if (!userType) {
      state = 'needs_role'
    } else {
      state = 'ready'
    }

    return {
      state,
      ready,
      signedIn,
      user,
      loading,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithApple,
      biometricAvailable: false,
      biometricEnabled: false,
      userProfile,
      userType,
      updateUserProfile,
      fetchUserProfile
    }
  }, [ready, signedIn, user, loading, userProfile, userType])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
