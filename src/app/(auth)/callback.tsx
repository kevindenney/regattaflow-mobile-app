import {useEffect, useRef, useState} from 'react'
import {router} from 'expo-router'
import {supabase} from '@/src/services/supabase'
import {logSession, dumpSbStorage} from '@/src/utils/authDebug'
import {getDashboardRoute, shouldCompleteOnboarding} from '@/src/lib/utils/userTypeRouting'
import {ActivityIndicator, View, Text} from 'react-native'

export default function Callback(){
  const ran = useRef(false)
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(()=>{
    if (ran.current) {
      console.log('[CB] 🚨 CRITICAL: useEffect already ran, skipping (ran.current = true)')
      return
    }
    ran.current = true
    console.log('[CB] ✅ useEffect running for first time')

    // Safety timeout - if callback takes longer than 10s, force redirect
    const safetyTimeout = setTimeout(() => {
      console.error('[CB] 🚨 SAFETY TIMEOUT TRIGGERED - This is forcing redirect to onboarding!')
      console.error('[CB] 🚨 Current URL:', window.location.href)
      console.error('[CB] 🚨 Time elapsed: 10 seconds')
      console.error('[CB] 🚨 This may be interrupting the venue page loading process')
      router.replace('/(auth)/onboarding')
    }, 10000)

    const run = async ()=>{
      try {
        console.log('[CB] === OAuth Callback Handler Starting ===')
        console.log('[CB] location:', window.location.href)

        // Extract hash parameters manually for better debugging
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        console.log('[CB] Hash params extracted:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          accessTokenLength: accessToken?.length || 0
        })

        if (!accessToken) {
          console.error('[CB] No access token in URL')
          setStatus('Invalid authentication response. Redirecting...')
          setTimeout(() => router.replace('/(auth)/login'), 2000)
          return
        }

        setStatus('Exchanging OAuth tokens...')

        // Method 1: Try exchanging tokens manually
        console.log('[CB] Attempting manual token exchange...')
        const {data: tokenData, error: tokenError} = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        })

        if (tokenError) {
          console.error('[CB] Token exchange error:', tokenError)
          setStatus('Authentication failed. Redirecting...')
          setTimeout(() => router.replace('/(auth)/login'), 2000)
          return
        }

        console.log('[CB] Token exchange successful:', {
          hasSession: !!tokenData.session,
          hasUser: !!tokenData.session?.user,
          userEmail: tokenData.session?.user?.email
        })

        await logSession(supabase, 'AFTER_MANUAL_EXCHANGE')
        dumpSbStorage()

        const session = tokenData?.session
        if (!session?.user) {
          console.warn('[CB] No session after OAuth callback')
          setStatus('No session found. Redirecting to login...')
          setTimeout(() => router.replace('/(auth)/login'), 2000)
          return
        }

      setStatus('Loading your profile...')

      // Clean up URL hash immediately
      try {
        window.history.replaceState(null, '', '/callback')
      } catch (e) {
        console.warn('[CB] History replace error:', e)
      }

      // Fetch user profile to determine routing with timeout
      try {
        console.log('[CB] Fetching user profile...')
        const {data: profile, error: profileError} = await Promise.race([
          supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
          )
        ])

        console.log('[CB] Profile fetch result:', {
          hasProfile: !!profile,
          userType: profile?.user_type,
          onboardingCompleted: profile?.onboarding_completed,
          error: profileError?.message
        })

        if (profileError) {
          console.warn('[CB] Profile fetch error, assuming needs onboarding:', profileError)
          setStatus('Setting up your account...')
          setTimeout(() => router.replace('/(auth)/onboarding'), 100)
          clearTimeout(safetyTimeout)
          return
        }

        const needsOnboarding = shouldCompleteOnboarding(profile)
        console.log('[CB] Onboarding check:', { needsOnboarding })

        if (needsOnboarding) {
          console.log('[CB] ✅ User needs onboarding - routing to onboarding')
          setStatus('Setting up your account...')
          setTimeout(() => {
            console.log('[CB] 🚀 Executing router.replace to onboarding')
            router.replace('/(auth)/onboarding')
          }, 100)
        } else {
          const dest = getDashboardRoute(profile?.user_type)
          console.log('[CB] ✅ User onboarded - routing to dashboard:', dest)
          console.log('[CB] 📊 User type:', profile?.user_type)
          setStatus('Redirecting to dashboard...')
          setTimeout(() => {
            console.log('[CB] 🚀 Executing router.replace to:', dest)
            router.replace(dest)
          }, 100)
        }
      } catch (e) {
        console.error('[CB] Profile fetch error:', e)
        setStatus('Setting up your account...')
        setTimeout(() => router.replace('/(auth)/onboarding'), 100)
      } finally {
        clearTimeout(safetyTimeout)
      }
    } catch (criticalError) {
      console.error('[CB] Critical error in callback handler:', criticalError)
      setStatus('Error occurred. Redirecting...')
      setTimeout(() => router.replace('/(auth)/login'), 2000)
      clearTimeout(safetyTimeout)
    }
  }
  run()

  return () => {
    clearTimeout(safetyTimeout)
  }
  },[])

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24}}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={{marginTop: 16, fontSize: 16, color: '#64748B'}}>{status}</Text>
    </View>
  )
}