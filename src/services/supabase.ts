import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          subscription_status: string
          subscription_tier: string
          stripe_customer_id: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          subscription_status?: string
          subscription_tier?: string
          stripe_customer_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          subscription_status?: string
          subscription_tier?: string
          stripe_customer_id?: string
          created_at?: string
        }
      }
      regattas: {
        Row: {
          id: string
          user_id: string
          name: string
          venue: any // jsonb
          start_date: string
          end_date: string
          organizing_authority: string
          documents: any[] // jsonb[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          venue: any
          start_date: string
          end_date: string
          organizing_authority: string
          documents?: any[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          venue?: any
          start_date?: string
          end_date?: string
          organizing_authority?: string
          documents?: any[]
          created_at?: string
        }
      }
      races: {
        Row: {
          id: string
          regatta_id: string
          race_number: number
          scheduled_start: string
          actual_start: string | null
          course_config: any // jsonb
          weather_snapshot: any // jsonb
          strategy: any // jsonb
          crew_members: string[]
          status: string
        }
        Insert: {
          id?: string
          regatta_id: string
          race_number: number
          scheduled_start: string
          actual_start?: string | null
          course_config: any
          weather_snapshot?: any
          strategy?: any
          crew_members?: string[]
          status?: string
        }
        Update: {
          id?: string
          regatta_id?: string
          race_number?: number
          scheduled_start?: string
          actual_start?: string | null
          course_config?: any
          weather_snapshot?: any
          strategy?: any
          crew_members?: string[]
          status?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']