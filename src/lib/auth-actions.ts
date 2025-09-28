import { supabase } from '@/src/services/supabase'

export const signOutEverywhere = async () => {
  console.log('[AUTH-ACTIONS] signOut start')

  try {
    const { error } = await supabase.auth.signOut({ scope: 'global' })

    if (error) {
      console.error('[AUTH-ACTIONS] signOut error:', error)
      throw error
    }

    console.log('[AUTH-ACTIONS] signOut success - global scope revoked')

    // Clear any URL hash fragments that might re-trigger auth
    try {
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/')
      }
    } catch (e) {
      console.warn('[AUTH-ACTIONS] Could not clear URL hash:', e)
    }

  } catch (error) {
    console.error('[AUTH-ACTIONS] signOut failed:', error)
    throw error
  }
}