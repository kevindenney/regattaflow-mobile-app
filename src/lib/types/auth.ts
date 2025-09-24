export interface User {
  id: string
  email: string
  fullName: string
  subscription: {
    status: 'active' | 'trialing' | 'canceled' | 'past_due'
    tier: 'free' | 'sailor' | 'team' | 'enterprise'
    validUntil: Date
  }
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}