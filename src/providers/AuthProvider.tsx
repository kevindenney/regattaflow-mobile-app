import {createContext, useContext, useEffect, useMemo, useState} from 'react'
import {router} from 'expo-router'
import {supabase} from '@/src/services/supabase'
import {dumpSbStorage, logSession} from '@/src/utils/authDebug'
import {getDashboardRoute, shouldCompleteOnboarding} from '@/src/lib/utils/userTypeRouting'
import {Platform} from 'react-native'

export type UserType = 'sailor' | 'coach' | 'club' | null

type AuthCtx = {
  ready: boolean
  signedIn: boolean
  user: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  userProfile?: any
  userType?: UserType
  updateUserProfile: (updates: any) => Promise<void>
  fetchUserProfile: () => Promise<void>
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
  fetchUserProfile: async () => {},
  userType: null,
  userProfile: null,
})

export function AuthProvider({children}:{children: React.ReactNode}) {
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userType, setUserType] = useState<UserType>(null)

  // Debug environment variables
  console.log('🔧 [AUTH] Environment check:', {
    hasSupabaseUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    platform: Platform.OS
  })

  const fetchUserProfile = async (userId?: string) => {
    const uid = userId || user?.id
    if (!uid) {
      console.log('🔍 [AUTH] fetchUserProfile: No user ID provided')
      return
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
        return
      }

      console.log('✅ [AUTH] User profile fetched:', data)
      setUserProfile(data)
      setUserType(data?.user_type as UserType)
    } catch (error) {
      console.error('🔴 [AUTH] fetchUserProfile error:', error)
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
        console.log('🔍 [AUTH] Creating new profile for OAuth user')
        const profileData = {
          id: uid,
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
          ...updates
        }
        console.log('🔍 [AUTH] New profile data:', profileData)

        result = await supabase
          .from('users')
          .insert(profileData)
          .select()
          .single()
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

  // Initial auth state setup - runs once
  useEffect(()=>{
    let alive = true
    ;(async ()=>{
      try {
        console.log('🔧 [AUTH] Starting initialization...')

        try {
          dumpSbStorage()
        } catch (e) {
          console.warn('🔧 [AUTH] Storage dump failed:', e)
        }

        try {
          await logSession(supabase, 'INITIAL_SESSION')
        } catch (e) {
          console.warn('🔧 [AUTH] Log session failed:', e)
        }

        const {data} = await supabase.auth.getSession()
        if (!alive) return
        console.log('🔧 [AUTH] Session retrieved:', !!data?.session)
        setSignedIn(!!data?.session)
        setUser(data?.session?.user || null)
        if (data?.session?.user?.id) {
          console.log('🔧 [AUTH] Fetching user profile...')
          try {
            await fetchUserProfile(data.session.user.id)
          } catch (e) {
            console.warn('🔧 [AUTH] User profile fetch failed:', e)
          }
        }
        console.log('🔧 [AUTH] Initialization complete, setting ready=true')
        setReady(true)
      } catch (error) {
        console.error('🔴 [AUTH] Initialization failed, but setting ready=true anyway:', error)
        // Set ready=true even on error so the app can show the landing page
        setReady(true)
      }
    })()

    return ()=>{ alive=false }
  }, []) // Run once on mount

  // Auth state change listener - depends on router for navigation
  useEffect(()=>{
    let alive = true

    const {data:sub} = supabase.auth.onAuthStateChange(async (evt, session)=>{
      console.log('🔔 auth evt:', evt, 'hasSession:', !!session)
      if (!alive) return

      setSignedIn(!!session)
      setUser(session?.user || null)

      if (evt === 'SIGNED_OUT') {
        setUserProfile(null)
        setUserType(null)
        try { window.history.replaceState(null, '', '/') } catch {}
        router.replace('/(auth)/login')
      }

      if (evt === 'SIGNED_IN' && session?.user?.id) {
        await fetchUserProfile(session.user.id)
        // Route after profile fetch
        try {
          const profileData = await getProfileQuick(session.user.id)
          if (shouldCompleteOnboarding(profileData)) {
            router.replace('/(auth)/onboarding')
          } else {
            const dest = getDashboardRoute(profileData?.user_type)
            router.replace(dest)
          }
        } catch (e) {
          console.warn('[ROUTE] post-auth error:', e)
          router.replace('/(auth)/onboarding')
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
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  // Legacy signOut method - kept for compatibility but deprecated
  // Use signOutEverywhere from auth-actions.ts instead
  const signOut = async () => {
    console.log('🔥 [AUTH] ⚠️ DEPRECATED: Using legacy signOut method')
    console.log('🔥 [AUTH] Use signOutEverywhere from auth-actions.ts instead')

    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) throw error
      console.log('🔥 [AUTH] Legacy signOut completed')
    } catch (error) {
      console.error('🔥 [AUTH] Legacy signOut error:', error)
      throw error
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

  console.log('🔧 [AUTH] Context value created:', {ready, signedIn, userType})

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)