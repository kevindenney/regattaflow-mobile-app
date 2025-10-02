import { supabase } from '@/src/services/supabase'

const AUTH_ACTIONS_DEBUG_ENABLED = false
const authActionsLog = (...args: Parameters<typeof console.log>) => {
  if (!AUTH_ACTIONS_DEBUG_ENABLED) {
    return
  }
  console.log(...args)
}

export const signOutEverywhere = async () => {
  authActionsLog('[AUTH] signOut start')

  // CRITICAL: Clean URL hash BEFORE calling signOut to prevent immediate re-authentication
  authActionsLog('[AUTH] Pre-emptive URL hash cleanup...')
  try {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      authActionsLog('[AUTH] Current URL:', url.href)
      authActionsLog('[AUTH] Current hash:', url.hash)

      if (url.hash.includes('access_token') || url.hash.includes('refresh_token')) {
        authActionsLog('[AUTH] Found auth tokens in hash, cleaning BEFORE signOut...')
        window.history.replaceState(null, '', url.origin + url.pathname)
        authActionsLog('[AUTH] Hash cleaned successfully before signOut')
      } else {
        authActionsLog('[AUTH] No auth tokens found in hash')
      }
    }
  } catch (e) {
    console.warn('[AUTH] pre-emptive hash scrub fail', e)
  }

  authActionsLog('[AUTH] About to call supabase.auth.signOut with global scope...')

  try {
    // Add timeout to prevent infinite hanging
    const signOutPromise = supabase.auth.signOut({ scope: 'global' })
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase signOut timeout after 10 seconds')), 10000)
    )

    authActionsLog('[AUTH] Waiting for supabase.auth.signOut with 10s timeout...')
    const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any
    authActionsLog('[AUTH] supabase.auth.signOut completed, error:', error)

    if (error) {
      console.error('[AUTH] signOut error:', error)
      // Don't throw on error - try to continue with manual cleanup
      authActionsLog('[AUTH] Continuing despite Supabase error...')
    } else {
      authActionsLog('[AUTH] signOut success')
    }

    // Manual state cleanup as fallback
    authActionsLog('[AUTH] Performing manual session cleanup...')
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
          authActionsLog('[AUTH] Clearing localStorage key:', key)
          localStorage.removeItem(key)
        })
      }
    } catch (e) {
      console.warn('[AUTH] Manual cleanup error:', e)
    }

    authActionsLog('[AUTH] signOutEverywhere completed successfully')
  } catch (error) {
    console.error('[AUTH] signOutEverywhere failed with error:', error)

    // Even if Supabase fails, try manual cleanup
    authActionsLog('[AUTH] Attempting manual cleanup after failure...')
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
