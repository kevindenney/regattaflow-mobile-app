import { supabase } from '@/services/supabase'
import { createLogger } from '@/lib/utils/logger';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logger = createLogger('auth-actions');
const AUTH_ACTIONS_DEBUG_ENABLED = false
const authActionsLog = (...args: Parameters<typeof logger.debug>) => {
  if (!AUTH_ACTIONS_DEBUG_ENABLED) {
    return
  }
  logger.debug(...args)
}

/**
 * Clear Supabase auth tokens from storage (AsyncStorage on native, localStorage on web)
 */
const clearAuthStorage = async () => {
  if (Platform.OS === 'web') {
    // Web: clear localStorage
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      const keysToRemove: string[] = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key?.includes('supabase') || key?.includes('auth')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => {
        authActionsLog('[AUTH] Clearing localStorage key:', key)
        window.localStorage.removeItem(key)
      })
      authActionsLog('[AUTH] Cleared', keysToRemove.length, 'localStorage keys')
    }
  } else {
    // Native (iOS/Android): clear AsyncStorage
    try {
      const allKeys = await AsyncStorage.getAllKeys()
      const supabaseKeys = allKeys.filter(key =>
        key.includes('supabase') || key.includes('auth') || key.includes('sb-')
      )
      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys)
        authActionsLog('[AUTH] Cleared', supabaseKeys.length, 'AsyncStorage keys:', supabaseKeys)
      }
    } catch (e) {
      console.warn('[AUTH] AsyncStorage cleanup error:', e)
    }
  }
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

  let signOutSucceeded = false

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
    } else {
      authActionsLog('[AUTH] signOut success')
      signOutSucceeded = true
    }
  } catch (error) {
    // Timeout or network error - continue with local cleanup
    console.warn('[AUTH] Supabase signOut failed (likely network issue):', error)
  }

  // Always clear local storage regardless of server response
  // This ensures user is logged out locally even if network is unavailable
  authActionsLog('[AUTH] Performing local session cleanup...')
  await clearAuthStorage()

  authActionsLog('[AUTH] signOutEverywhere completed, server success:', signOutSucceeded)

  // Don't throw - local cleanup is sufficient for UX
  // User will be logged out locally, and server session will expire naturally
}
