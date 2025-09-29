import { supabase } from '@/src/services/supabase'

export const signOutEverywhere = async () => {
  console.log('[AUTH] signOut start')

  // CRITICAL: Clean URL hash BEFORE calling signOut to prevent immediate re-authentication
  console.log('[AUTH] Pre-emptive URL hash cleanup...')
  try {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      console.log('[AUTH] Current URL:', url.href)
      console.log('[AUTH] Current hash:', url.hash)

      if (url.hash.includes('access_token') || url.hash.includes('refresh_token')) {
        console.log('[AUTH] Found auth tokens in hash, cleaning BEFORE signOut...')
        window.history.replaceState(null, '', url.origin + url.pathname)
        console.log('[AUTH] Hash cleaned successfully before signOut')
      } else {
        console.log('[AUTH] No auth tokens found in hash')
      }
    }
  } catch (e) {
    console.warn('[AUTH] pre-emptive hash scrub fail', e)
  }

  console.log('[AUTH] About to call supabase.auth.signOut with global scope...')

  try {
    // Add timeout to prevent infinite hanging
    const signOutPromise = supabase.auth.signOut({ scope: 'global' })
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase signOut timeout after 10 seconds')), 10000)
    )

    console.log('[AUTH] Waiting for supabase.auth.signOut with 10s timeout...')
    const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any
    console.log('[AUTH] supabase.auth.signOut completed, error:', error)

    if (error) {
      console.error('[AUTH] signOut error:', error)
      // Don't throw on error - try to continue with manual cleanup
      console.log('[AUTH] Continuing despite Supabase error...')
    } else {
      console.log('[AUTH] signOut success')
    }

    // Manual state cleanup as fallback
    console.log('[AUTH] Performing manual session cleanup...')
    try {
      // Clear local storage
      if (typeof window !== 'undefined') {
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.includes('supabase') || key?.includes('auth')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => {
          console.log('[AUTH] Clearing localStorage key:', key)
          localStorage.removeItem(key)
        })
      }
    } catch (e) {
      console.warn('[AUTH] Manual cleanup error:', e)
    }

    console.log('[AUTH] signOutEverywhere completed successfully')
  } catch (error) {
    console.error('[AUTH] signOutEverywhere failed with error:', error)

    // Even if Supabase fails, try manual cleanup
    console.log('[AUTH] Attempting manual cleanup after failure...')
    try {
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key)
          }
        })
      }
    } catch (e) {
      console.warn('[AUTH] Emergency cleanup failed:', e)
    }

    throw error
  }
}