import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Platform-specific storage adapter
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Use localStorage for web
    return {
      getItem: async (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: async (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: async (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      }
    };
  } else {
    // Use SecureStore for native platforms
    return {
      getItem: async (key: string) => {
        return await SecureStore.getItemAsync(key);
      },
      setItem: async (key: string, value: string) => {
        await SecureStore.setItemAsync(key, value);
      },
      removeItem: async (key: string) => {
        await SecureStore.deleteItemAsync(key);
      }
    };
  }
};

const ExpoSecureStorage = createStorageAdapter();

export type UserType = 'sailor' | 'coach' | 'club' | null;
export type UsersRow = { id: string; email: string | null; user_type: UserType; };

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

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
          user_type: 'sailor' | 'coach' | 'club' | null
          onboarding_completed?: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          subscription_status?: string
          subscription_tier?: string
          stripe_customer_id?: string
          user_type?: 'sailor' | 'coach' | 'club' | null
          onboarding_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          subscription_status?: string
          subscription_tier?: string
          stripe_customer_id?: string
          user_type?: 'sailor' | 'coach' | 'club' | null
          onboarding_completed?: boolean
          created_at?: string
        }
      }
      club_profiles: {
        Row: {
          id: string
          user_id: string
          club_name: string
          website_url: string
          yacht_club_id: string | null
          verification_status: 'pending' | 'verified' | 'rejected'
          verification_method: 'dns' | 'meta_tag' | 'manual' | null
          verification_token: string | null
          verified_at: string | null
          established_year: number | null
          member_count: number | null
          extracted_data: any
          admin_review_status: 'pending' | 'approved' | 'rejected'
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          club_name: string
          website_url: string
          yacht_club_id?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          verification_method?: 'dns' | 'meta_tag' | 'manual' | null
          verification_token?: string | null
          verified_at?: string | null
          established_year?: number | null
          member_count?: number | null
          extracted_data?: any
          admin_review_status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          club_name?: string
          website_url?: string
          yacht_club_id?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          verification_method?: 'dns' | 'meta_tag' | 'manual' | null
          verification_token?: string | null
          verified_at?: string | null
          established_year?: number | null
          member_count?: number | null
          extracted_data?: any
          admin_review_status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      club_subscriptions: {
        Row: {
          id: string
          club_profile_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          plan_id: 'starter' | 'professional' | 'enterprise'
          status: 'active' | 'cancelled' | 'past_due' | 'trialing'
          amount: number
          currency: string
          interval: 'month' | 'year'
          trial_start: string | null
          trial_end: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_profile_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          plan_id: 'starter' | 'professional' | 'enterprise'
          status?: 'active' | 'cancelled' | 'past_due' | 'trialing'
          amount: number
          currency?: string
          interval?: 'month' | 'year'
          trial_start?: string | null
          trial_end?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_profile_id?: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          plan_id?: 'starter' | 'professional' | 'enterprise'
          status?: 'active' | 'cancelled' | 'past_due' | 'trialing'
          amount?: number
          currency?: string
          interval?: 'month' | 'year'
          trial_start?: string | null
          trial_end?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      club_verification_attempts: {
        Row: {
          id: string
          club_profile_id: string
          method: 'dns' | 'meta_tag'
          website_url: string
          success: boolean
          error_message: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          club_profile_id: string
          method: 'dns' | 'meta_tag'
          website_url: string
          success?: boolean
          error_message?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          club_profile_id?: string
          method?: 'dns' | 'meta_tag'
          website_url?: string
          success?: boolean
          error_message?: string | null
          ip_address?: string | null
          created_at?: string
        }
      }
    coach_profiles: {
      Row: {
        id: string
        user_id: string
        full_name: string
        professional_title: string
        experience_level: string
        organization: string | null
        phone: string | null
        languages: string[]
        profile_completed: boolean
        profile_published: boolean
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        user_id: string
        full_name: string
        professional_title: string
        experience_level: string
        organization?: string | null
        phone?: string | null
        languages?: string[]
        profile_completed?: boolean
        profile_published?: boolean
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        user_id?: string
        full_name?: string
        professional_title?: string
        experience_level?: string
        organization?: string | null
        phone?: string | null
        languages?: string[]
        profile_completed?: boolean
        profile_published?: boolean
        created_at?: string
        updated_at?: string
      }
    }
    coach_availability: {
      Row: {
        id: string
        coach_id: string
        monday: boolean
        tuesday: boolean
        wednesday: boolean
        thursday: boolean
        friday: boolean
        saturday: boolean
        sunday: boolean
        morning: boolean
        afternoon: boolean
        evening: boolean
        location_preference: string
        remote_coaching: boolean
        max_distance_km: number
        individual_sessions: boolean
        small_group: boolean
        large_group: boolean
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        coach_id: string
        monday?: boolean
        tuesday?: boolean
        wednesday?: boolean
        thursday?: boolean
        friday?: boolean
        saturday?: boolean
        sunday?: boolean
        morning?: boolean
        afternoon?: boolean
        evening?: boolean
        location_preference?: string
        remote_coaching?: boolean
        max_distance_km?: number
        individual_sessions?: boolean
        small_group?: boolean
        large_group?: boolean
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        coach_id?: string
        monday?: boolean
        tuesday?: boolean
        wednesday?: boolean
        thursday?: boolean
        friday?: boolean
        saturday?: boolean
        sunday?: boolean
        morning?: boolean
        afternoon?: boolean
        evening?: boolean
        location_preference?: string
        remote_coaching?: boolean
        max_distance_km?: number
        individual_sessions?: boolean
        small_group?: boolean
        large_group?: boolean
        created_at?: string
        updated_at?: string
      }
    }
    coach_services: {
      Row: {
        id: string
        coach_id: string
        pricing_model: string
        currency: string
        hourly_rate: number | null
        session_duration_minutes: number | null
        single_session_price: number | null
        five_session_price: number | null
        ten_session_price: number | null
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        coach_id: string
        pricing_model?: string
        currency?: string
        hourly_rate?: number | null
        session_duration_minutes?: number | null
        single_session_price?: number | null
        five_session_price?: number | null
        ten_session_price?: number | null
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        coach_id?: string
        pricing_model?: string
        currency?: string
        hourly_rate?: number | null
        session_duration_minutes?: number | null
        single_session_price?: number | null
        five_session_price?: number | null
        ten_session_price?: number | null
        created_at?: string
        updated_at?: string
      }
    }
    boat_classes: {
      Row: {
        id: string
        name: string
        class_association: string | null
        tuning_guide_url: string | null
        auto_scrape_enabled: boolean | null
        measurement_rules: any | null
        metadata: any | null
      }
      Insert: {
        id?: string
        name: string
        class_association?: string | null
        tuning_guide_url?: string | null
        auto_scrape_enabled?: boolean | null
        measurement_rules?: any | null
        metadata?: any | null
      }
      Update: {
        id?: string
        name?: string
        class_association?: string | null
        tuning_guide_url?: string | null
        auto_scrape_enabled?: boolean | null
        measurement_rules?: any | null
        metadata?: any | null
      }
    }
    sailor_classes: {
      Row: {
        sailor_id: string
        class_id: string
        is_primary: boolean | null
        boat_name: string | null
        sail_number: string | null
        joined_at: string | null
      }
      Insert: {
        sailor_id: string
        class_id: string
        is_primary?: boolean | null
        boat_name?: string | null
        sail_number?: string | null
        joined_at?: string | null
      }
      Update: {
        sailor_id?: string
        class_id?: string
        is_primary?: boolean | null
        boat_name?: string | null
        sail_number?: string | null
        joined_at?: string | null
      }
    }
    coach_specializations: {
      Row: {
        coach_id: string
        class_id: string
        experience_years: number | null
        rate_per_session: number | null
      }
      Insert: {
        coach_id: string
        class_id: string
        experience_years?: number | null
        rate_per_session?: number | null
      }
      Update: {
        coach_id?: string
        class_id?: string
        experience_years?: number | null
        rate_per_session?: number | null
      }
    }
    club_class_fleets: {
      Row: {
        club_id: string
        class_id: string
        fleet_captain_id: string | null
        active_boats_count: number | null
        fleet_notes: string | null
      }
      Insert: {
        club_id: string
        class_id: string
        fleet_captain_id?: string | null
        active_boats_count?: number | null
        fleet_notes?: string | null
      }
      Update: {
        club_id?: string
        class_id?: string
        fleet_captain_id?: string | null
        active_boats_count?: number | null
        fleet_notes?: string | null
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

// Query retry wrapper with timeout logic
export const queryWithRetry = async <T>(
  queryFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 [QUERY] Attempt ${i + 1}/${retries}`);
      const start = Date.now();
      const result = await queryFn();
      const duration = Date.now() - start;
      console.log(`✅ [QUERY] Success in ${duration}ms on attempt ${i + 1}`);
      return result;
    } catch (err: any) {
      console.warn(`⚠️ [QUERY] Attempt ${i + 1} failed:`, err.message);

      if (i < retries - 1) {
        console.log(`🔄 [QUERY] Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 1.5; // Exponential backoff
      } else {
        console.error(`🔴 [QUERY] All ${retries} attempts failed`);
        throw err;
      }
    }
  }
  throw new Error('Query failed after all retries');
}

// Test connectivity to Supabase
export const testSupabaseConnectivity = async (): Promise<{ success: boolean; duration: number; error?: string }> => {
  const start = Date.now();
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
      },
      signal: AbortSignal.timeout(5000)
    });

    const duration = Date.now() - start;
    return {
      success: response.ok,
      duration,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error: any) {
    const duration = Date.now() - start;
    return {
      success: false,
      duration,
      error: error.message
    };
  }
}