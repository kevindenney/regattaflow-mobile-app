import React, { createContext, useContext, useState } from 'react'
import type { AuthContextType, User, AuthState } from '@/src/lib/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: false,
    error: null,
  })

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    // Mock sign in
    setTimeout(() => {
      const mockUser: User = {
        id: 'mock-user-id',
        email,
        fullName: 'Demo Sailor',
        subscription: {
          status: 'active',
          tier: 'sailor',
          validUntil: new Date(2025, 11, 31),
        }
      }
      setState({ user: mockUser, loading: false, error: null })
    }, 1000)
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    // Mock sign up
    setTimeout(() => {
      const mockUser: User = {
        id: 'mock-new-user-id',
        email,
        fullName,
        subscription: {
          status: 'trialing',
          tier: 'free',
          validUntil: new Date(2025, 11, 31),
        }
      }
      setState({ user: mockUser, loading: false, error: null })
    }, 1000)
  }

  const signOut = async () => {
    setState({ user: null, loading: false, error: null })
  }

  const resetPassword = async (email: string) => {
    // Mock password reset
    console.log('Password reset requested for:', email)
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}