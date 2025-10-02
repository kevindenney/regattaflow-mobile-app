import { signOutEverywhere } from '@/src/lib/auth-actions'
import { getDashboardRoute, shouldCompleteOnboarding } from '@/src/lib/utils/userTypeRouting'
import { supabase } from '@/src/services/supabase'
import { bindAuthDiagnostics } from '@/src/utils/authDebug'
import { logAuthEvent, logAuthState } from '@/src/utils/errToText'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'

// Bind diagnostics once at app boot
bindAuthDiagnostics(supabase)

export type UserType = 'sailor' | 'coach' | 'club' | null

const AUTH_DEBUG_ENABLED = false
const authDebugLog = (...args: Parameters<typeof console.log>) => {
  if (!AUTH_DEBUG_ENABLED) {
    return
  }
  console.log(...args)
}

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

  const cacheKey = (uid: string) => `regattaflow.userType.${uid}`

  const hydrateUserTypeFromCache = async (uid: string | undefined | null) => {
    if (!uid) return null
    try {
      const cached = await AsyncStorage.getItem(cacheKey(uid))
      if (cached) {
        setUserType(cached as UserType)
        return cached
      }
    } catch (error) {
      // Silent fail on cache read
    }
    return null
  }

  const storeUserTypeCache = async (uid: string | undefined | null, type: UserType) => {
    if (!uid || !type) return
    try {
      await AsyncStorage.setItem(cacheKey(uid), type)
    } catch (error) {
      // Silent fail on cache write
    }
  }

  const fetchUserProfile = async (userId?: string) => {
    const uid = userId || user?.id
    if (!uid) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .maybeSingle()

      if (error) {
        console.error('Failed to fetch user profile:', error)
        return null
      }

      setUserProfile(data)
      setUserType(data?.user_type as UserType)
      storeUserTypeCache(uid, data?.user_type as UserType)
      return data
    } catch (error) {
      console.error('fetchUserProfile error:', error)
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
          // Hydrate userType quickly from metadata or cache while profile loads
          const metadataType = authUser.user_metadata?.user_type as UserType | undefined
          if (metadataType) {
            authDebugLog('[AUTH] Hydrating userType from user metadata:', metadataType)
            setUserType(metadataType)
            storeUserTypeCache(authUser.id, metadataType)
          } else {
            hydrateUserTypeFromCache(authUser.id)
          }
        }

        if (authUser?.id) {
          authDebugLog('[AUTH] Fetching user profile for:', authUser.id)
          try {
            const profile = await fetchUserProfile(authUser.id)
            if (profile?.user_type) {
              setUserType(profile.user_type as UserType)
              storeUserTypeCache(authUser.id, profile.user_type as UserType)
            } else {
              const cachedType = await hydrateUserTypeFromCache(authUser.id)
              setUserType((cachedType as UserType) ?? null)
              if (!cachedType) {
                console.warn('[AUTH] No user_type on profile; consider forcing onboarding for user', authUser.email)
              }
            }
          } catch (e) {
            console.warn('[AUTH] User profile fetch failed:', e)
            const cachedType = await hydrateUserTypeFromCache(authUser.id)
            setUserType((cachedType as UserType) ?? null)
          }
        } else {
          setUserType(null)
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

        authDebugLog('🚪 [AUTH] Navigating to login page...')
        router.replace('/(auth)/login')
        authDebugLog('🚪 [AUTH] ===== SIGNED_OUT HANDLER COMPLETE =====')
      }

      if (evt === 'SIGNED_IN' && session?.user?.id) {
        authDebugLog('🔔 [AUTH] SIGNED_IN event - starting profile fetch and routing...')

        const metadataType = session.user.user_metadata?.user_type as UserType | undefined
        if (metadataType) {
          setUserType(metadataType)
          storeUserTypeCache(session.user.id, metadataType)
        } else {
          hydrateUserTypeFromCache(session.user.id)
        }

        try {
          // Fetch profile and wait for it to be fully loaded
          authDebugLog('🔔 [AUTH] Fetching profile data for routing decision...')
          const profileData = await fetchUserProfile(session.user.id)
          authDebugLog('🔔 [AUTH] Profile data received:', profileData)
          if (profileData?.user_type) {
            setUserType(profileData.user_type as UserType)
          }

          const needsOnboarding = shouldCompleteOnboarding(profileData)
          authDebugLog('🔔 [AUTH] shouldCompleteOnboarding result:', needsOnboarding)

          if (needsOnboarding) {
            authDebugLog('🔔 [AUTH] Routing to onboarding...')
            router.replace('/(auth)/onboarding')
          } else {
            const dest = getDashboardRoute(profileData?.user_type)
            authDebugLog('🔔 [AUTH] Routing to dashboard:', dest)
            router.replace(dest)
          }
        } catch (e) {
          console.warn('[ROUTE] post-auth error:', e)
          authDebugLog('🔔 [AUTH] Error occurred, routing to onboarding as fallback...')
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
            window.history.replaceState(null, '', '/(auth)/login')
          } catch (historyError) {
            console.warn('🚪 [AUTH] History replace failed in fallback:', historyError)
          }
        }
        router.replace('/(auth)/login')
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
          window.history.replaceState(null, '', '/(auth)/login')
        } catch (historyError) {
          console.warn('🚪 [AUTH] History replace failed after error:', historyError)
        }
      }
      router.replace('/(auth)/login')
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

  const value = useMemo(() => ({
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
    }), [ready, signedIn, user, loading, userProfile, userType])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
