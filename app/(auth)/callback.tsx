import {useEffect, useRef, useState} from 'react'
import {router} from 'expo-router'
import {supabase} from '@/services/supabase'
import {logSession, dumpSbStorage} from '@/utils/authDebug'
import {getDashboardRoute} from '@/lib/utils/userTypeRouting'
import {ActivityIndicator, View, Text} from 'react-native'
import {createLogger} from '@/lib/utils/logger'

const logger = createLogger('OAuthCallback')

export default function Callback(){
  const ran = useRef(false)
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(()=>{
    if (ran.current) {
      return
    }
    ran.current = true

    // Safety timeout - if callback takes longer than 10s, force redirect
    const safetyTimeout = setTimeout(() => {
      logger.error('Safety timeout triggered after 10 seconds')
      router.replace(getDashboardRoute(null) as any)
    }, 10000)

    const run = async ()=>{
      try {
        // Extract hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (!accessToken) {
          logger.error('No access token in OAuth callback')
          setStatus('Invalid authentication response. Redirecting...')
          setTimeout(() => router.replace('/(auth)/login'), 2000)
          return
        }

        setStatus('Exchanging OAuth tokens...')

        const {data: tokenData, error: tokenError} = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        })

        if (tokenError) {
          logger.error('Token exchange error:', tokenError)
          setStatus('Authentication failed. Redirecting...')
          setTimeout(() => router.replace('/(auth)/login'), 2000)
          return
        }

        await logSession(supabase, 'AFTER_MANUAL_EXCHANGE')
        dumpSbStorage()

        const session = tokenData?.session
        if (!session?.user) {
          logger.warn('No session after OAuth callback')
          setStatus('No session found. Redirecting to login...')
          setTimeout(() => router.replace('/(auth)/login'), 2000)
          return
        }

      setStatus('Loading your profile...')

      // Clean up URL hash immediately
      try {
        window.history.replaceState(null, '', '/callback')
      } catch (e) {
        logger.error('History replace error:', e)
      }

      // Fetch user profile to determine routing with timeout
      try {
        logger.info('Fetching user profile for user:', session.user.id, session.user.email)

        const result = await Promise.race([
          supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
          )
        ])

        const {data: profile, error: profileError} = result as any

        logger.info('Profile fetch result:', {
          hasProfile: !!profile,
          profileData: profile,
          hasError: !!profileError,
          error: profileError
        })

        if (profileError) {
          logger.warn('Profile fetch error, routing to default dashboard:', profileError)
          setStatus('Setting up your account...')
          const destination = getDashboardRoute(null)
          setTimeout(() => router.replace(destination as any), 100)
          clearTimeout(safetyTimeout)
          return
        }

        const dest = getDashboardRoute(profile?.user_type ?? null)
        logger.info('Redirecting to dashboard:', dest)
        setStatus('Redirecting to dashboard...')
        setTimeout(() => {
          router.replace(dest as any)
        }, 100)
      } catch (e) {
        logger.error('Profile fetch error:', e)
        setStatus('Setting up your account...')
        const destination = getDashboardRoute(null)
        setTimeout(() => router.replace(destination as any), 100)
      } finally {
        clearTimeout(safetyTimeout)
      }
    } catch (criticalError) {
      logger.error('Critical error in callback handler:', criticalError)
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
