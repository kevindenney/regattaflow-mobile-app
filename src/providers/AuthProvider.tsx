import {createContext, useContext, useEffect, useMemo, useState} from 'react'
import {router} from 'expo-router'
import {supabase} from '@/src/services/supabase'
import {Platform} from 'react-native'
import {shouldCompleteOnboarding, getDashboardRoute} from '@/src/lib/utils/userTypeRouting'
import {logAuthEvent, logAuthState} from '@/src/utils/errToText'
import {bindAuthDiagnostics} from '@/src/utils/authDebug'
import {signOutEverywhere} from '@/src/lib/auth-actions'

// Bind diagnostics once at app boot
bindAuthDiagnostics(supabase)

export type UserType = 'sailor' | 'coach' | 'club' | null

type AuthCtx = {
  ready: boolean
  signedIn: boolean
  user: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  userProfile?: any
  userType?: UserType
  updateUserProfile: (updates: any) => Promise<void>
  fetchUserProfile: () => Promise<any>
}

const Ctx = createContext<AuthCtx>({
  ready: false,
  signedIn: false,
  user: null,
  loading: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  updateUserProfile: async () => {},
  fetchUserProfile: async () => null,
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

  // Debug environment variables
  console.log('🔧 [AUTH] Environment check READY=TRUE:', {
    hasSupabaseUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    platform: Platform.OS
  })

  const fetchUserProfile = async (userId?: string) => {
    const uid = userId || user?.id
    if (!uid) {
      console.log('🔍 [AUTH] fetchUserProfile: No user ID provided')
      return null
    }

    try {
      console.log('🔍 [AUTH] Fetching user profile for:', uid)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .maybeSingle()

      if (error) {
        console.error('🔴 [AUTH] Failed to fetch user profile:', error)
        return null
      }

      console.log('✅ [AUTH] User profile fetched:', data)
      setUserProfile(data)
      setUserType(data?.user_type as UserType)
      return data
    } catch (error) {
      console.error('🔴 [AUTH] fetchUserProfile error:', error)
      return null
    }
  }

  const updateUserProfile = async (updates: any) => {
    const uid = user?.id
    if (!uid) throw new Error('No user ID available')

    try {
      console.log('🔍 [AUTH] Updating user profile:', updates)

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
        console.log('🔍 [AUTH] Creating new profile')
        const profileData = {
          id: uid,
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
          ...updates
        }
        console.log('🔍 [AUTH] New profile data:', profileData)

        try {
          result = await supabase
            .from('users')
            .insert(profileData)
            .select()
            .single()
        } catch (insertError: any) {
          // If insert fails due to duplicate key (profile was created by trigger), try to fetch existing profile
          if (insertError.code === '23505') {
            console.log('🔄 [AUTH] Profile already exists (created by trigger), fetching it...')
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

      console.log('✅ [AUTH] User profile updated:', result.data)
      setUserProfile(result.data)
      setUserType(result.data?.user_type as UserType)

      return result.data
    } catch (error) {
      console.error('🔴 [AUTH] Failed to update user profile:', error)
      throw error
    }
  }

  // Initial auth state setup with proper session restoration
  useEffect(() => {
    console.log('🔥 [AUTH] useEffect initialization starting...')
    let alive = true

    const initializeAuth = async () => {
      try {
        console.log('[AUTH] Starting initialization...')

        // Get current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.warn('[AUTH] getSession error:', sessionError)
        }

        if (!alive) return

        const session = sessionData?.session
        const user = session?.user

        console.log('[AUTH] Session check result:', {
          hasSession: !!session,
          hasUser: !!user,
          userEmail: user?.email
        })

        // Update auth state based on session
        setSignedIn(!!session)
        setUser(user || null)

        // Fetch user profile if we have a user
        if (user?.id) {
          console.log('[AUTH] Fetching user profile for:', user.id)
          try {
            await fetchUserProfile(user.id)
          } catch (e) {
            console.warn('[AUTH] User profile fetch failed:', e)
          }
        }

        console.log('[AUTH] Initialization complete, setting ready=true')
        setReady(true)
      } catch (e) {
        console.error('[AUTH] Initialization failed:', e)
        if (alive) setReady(true) // Still set ready even if failed
      }
    }

    // Set a watchdog timer as fallback
    const watchdogTimer = setTimeout(() => {
      if (alive && !ready) {
        console.warn('[AUTH] Watchdog: forcing ready=true after 3000ms')
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
      console.log('🔔 [AUTH] ===== AUTH STATE CHANGE EVENT =====')
      console.log('🔔 [AUTH] Event:', evt, 'hasSession:', !!session)
      console.log('🔔 [AUTH] Component alive:', alive)

      // Enhanced diagnostics
      logAuthEvent('auth_state_change', {
        event: evt,
        hasSession: !!session,
        sessionUser: session?.user?.email || 'N/A',
        componentAlive: alive
      })

      if (!alive) {
        console.log('🔔 [AUTH] Component not alive, returning early')
        return
      }

      console.log('🔔 [AUTH] Updating auth state...')
      setSignedIn(!!session)
      setUser(session?.user || null)
      console.log('🔔 [AUTH] Auth state updated:', { signedIn: !!session, hasUser: !!session?.user })

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
        console.log('🚪 [AUTH] ===== SIGNED_OUT EVENT RECEIVED =====')
        console.log('🚪 [AUTH] Starting state cleanup...')

        // Clear all cached auth state
        console.log('🚪 [AUTH] Clearing signedIn state...')
        setSignedIn(false)
        console.log('🚪 [AUTH] Clearing user state...')
        setUser(null)
        console.log('🚪 [AUTH] Clearing userProfile state...')
        setUserProfile(null)
        console.log('🚪 [AUTH] Clearing userType state...')
        setUserType(null)
        console.log('🚪 [AUTH] Clearing loading state...')
        setLoading(false)

        console.log('🚪 [AUTH] State cleanup complete. Starting navigation...')
        try {
          if (typeof window !== 'undefined') {
            console.log('🚪 [AUTH] Replacing browser history state...')
            window.history.replaceState(null, '', '/')
          }
        } catch (historyError) {
          console.warn('🚪 [AUTH] History replace error:', historyError)
        }

        console.log('🚪 [AUTH] Navigating to login page...')
        router.replace('/(auth)/login')
        console.log('🚪 [AUTH] ===== SIGNED_OUT HANDLER COMPLETE =====')
      }

      if (evt === 'SIGNED_IN' && session?.user?.id) {
        console.log('🔔 [AUTH] SIGNED_IN event - starting profile fetch and routing...')

        try {
          // Fetch profile and wait for it to be fully loaded
          console.log('🔔 [AUTH] Fetching profile data for routing decision...')
          const profileData = await fetchUserProfile(session.user.id)
          console.log('🔔 [AUTH] Profile data received:', profileData)

          const needsOnboarding = shouldCompleteOnboarding(profileData)
          console.log('🔔 [AUTH] shouldCompleteOnboarding result:', needsOnboarding)

          if (needsOnboarding) {
            console.log('🔔 [AUTH] Routing to onboarding...')
            router.replace('/(auth)/onboarding')
          } else {
            const dest = getDashboardRoute(profileData?.user_type)
            console.log('🔔 [AUTH] Routing to dashboard:', dest)
            router.replace(dest)
          }
        } catch (e) {
          console.warn('[ROUTE] post-auth error:', e)
          console.log('🔔 [AUTH] Error occurred, routing to onboarding as fallback...')
          router.replace('/(auth)/onboarding')
        } finally {
          // Clear loading after auth processing completes
          setLoading(false)
        }
      }
    })

    return ()=>{ alive=false; sub.subscription.unsubscribe() }
  }, [router])

  const getProfileQuick = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    return data
  }


  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // Don't set loading(false) here - let onAuthStateChange handle it after user/profile are set
    } catch (error) {
      // Only clear loading on error, otherwise let auth state change handle it
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    console.log('🚪 [AUTH] ===== SIGNOUT PROCESS STARTING =====')
    console.log('🚪 [AUTH] Current state before signOut:', {
      signedIn,
      user: !!user,
      userProfile: !!userProfile,
      loading,
      ready
    })

    setLoading(true)
    console.log('🚪 [AUTH] Loading set to true')

    try {
      console.log('🚪 [AUTH] About to call signOutEverywhere()...')
      await signOutEverywhere()
      console.log('🚪 [AUTH] signOutEverywhere() completed successfully')
      console.log('🚪 [AUTH] Waiting for SIGNED_OUT event to clear loading...')
      // Don't set loading(false) here - let onAuthStateChange SIGNED_OUT handler clear it
    } catch (error) {
      console.error('🚪 [AUTH] ERROR in signOut process:', error)
      console.log('🚪 [AUTH] Setting loading=false due to error')
      // Only clear loading on error, otherwise let auth state change handle it
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('🚀 [AUTH] signUp called with:', { email, hasPassword: !!password, fullName })
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

      console.log('✅ [AUTH] Supabase signUp successful:', data)

      // Profile is created automatically by database trigger
      // Check if profile was created and fetch it
      if (data.user?.id) {
        try {
          console.log('🔍 [AUTH] Fetching automatically created profile...')
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
      console.log('🔍 [LOGIN] Google sign-in button clicked')
      console.log('🔍 [LOGIN] Calling signInWithGoogle()')

      if (Platform.OS === 'web') {
        // Dynamic origin configuration - works on any port
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
        const redirectTo = `${currentOrigin}/callback`

        console.log('🔍 [LOGIN] Dynamic OAuth redirect:', redirectTo)

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

  const value = useMemo(() => {
    console.log('🔧 [AUTH] Context value created:', {ready, signedIn, userType})
    console.log('🔧 [AUTH] signOut function available:', typeof signOut)
    return {
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