export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          analysis_data: Json
          analysis_type: string
          confidence_score: number | null
          created_at: string | null
          id: string
          input_data: Json | null
          regatta_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_data: Json
          analysis_type: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          input_data?: Json | null
          regatta_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_data?: Json
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          input_data?: Json | null
          regatta_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_regatta_id_fkey"
            columns: ["regatta_id"]
            isOneToOne: false
            referencedRelation: "race_analytics"
            referencedColumns: ["regatta_id"]
          },
          {
            foreignKeyName: "ai_analyses_regatta_id_fkey"
            columns: ["regatta_id"]
            isOneToOne: false
            referencedRelation: "regattas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          function_name: string
          id: string
          processing_time_ms: number | null
          request_data: Json | null
          response_data: Json | null
          success: boolean | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          function_name: string
          id?: string
          processing_time_ms?: number | null
          request_data?: Json | null
          response_data?: Json | null
          success?: boolean | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          function_name?: string
          id?: string
          processing_time_ms?: number | null
          request_data?: Json | null
          response_data?: Json | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_classes: {
        Row: {
          auto_scrape_enabled: boolean | null
          class_association: string | null
          id: string
          measurement_rules: Json | null
          metadata: Json | null
          name: string
          tuning_guide_url: string | null
        }
        Insert: {
          auto_scrape_enabled?: boolean | null
          class_association?: string | null
          id?: string
          measurement_rules?: Json | null
          metadata?: Json | null
          name: string
          tuning_guide_url?: string | null
        }
        Update: {
          auto_scrape_enabled?: boolean | null
          class_association?: string | null
          id?: string
          measurement_rules?: Json | null
          metadata?: Json | null
          name?: string
          tuning_guide_url?: string | null
        }
        Relationships: []
      }
      boat_positions: {
        Row: {
          boat_id: string
          heading: number | null
          id: string
          metadata: Json | null
          position: unknown | null
          regatta_id: string
          speed_knots: number | null
          timestamp: string | null
        }
        Insert: {
          boat_id: string
          heading?: number | null
          id?: string
          metadata?: Json | null
          position?: unknown | null
          regatta_id: string
          speed_knots?: number | null
          timestamp?: string | null
        }
        Update: {
          boat_id?: string
          heading?: number | null
          id?: string
          metadata?: Json | null
          position?: unknown | null
          regatta_id?: string
          speed_knots?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boat_positions_regatta_id_fkey"
            columns: ["regatta_id"]
            isOneToOne: false
            referencedRelation: "race_analytics"
            referencedColumns: ["regatta_id"]
          },
          {
            foreignKeyName: "boat_positions_regatta_id_fkey"
            columns: ["regatta_id"]
            isOneToOne: false
            referencedRelation: "regattas"
            referencedColumns: ["id"]
          },
        ]
      }
      club_class_fleets: {
        Row: {
          active_boats_count: number | null
          class_id: string
          club_id: string
          fleet_captain_id: string | null
          fleet_notes: string | null
        }
        Insert: {
          active_boats_count?: number | null
          class_id: string
          club_id: string
          fleet_captain_id?: string | null
          fleet_notes?: string | null
        }
        Update: {
          active_boats_count?: number | null
          class_id?: string
          club_id?: string
          fleet_captain_id?: string | null
          fleet_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_class_fleets_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "boat_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_class_fleets_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_class_fleets_fleet_captain_id_fkey"
            columns: ["fleet_captain_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          membership_end: string | null
          membership_number: string | null
          membership_start: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          membership_end?: string | null
          membership_number?: string | null
          membership_start?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          membership_end?: string | null
          membership_number?: string | null
          membership_start?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          address: string | null
          club_type: string | null
          contact_person: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          location: unknown | null
          logo_url: string | null
          membership_type: string | null
          name: string
          phone: string | null
          short_name: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          club_type?: string | null
          contact_person?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          location?: unknown | null
          logo_url?: string | null
          membership_type?: string | null
          name: string
          phone?: string | null
          short_name?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          club_type?: string | null
          contact_person?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          location?: unknown | null
          logo_url?: string | null
          membership_type?: string | null
          name?: string
          phone?: string | null
          short_name?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      coach_availability: {
        Row: {
          coach_id: string | null
          created_at: string | null
          day_of_week: number | null
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          timezone: string
          updated_at: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          timezone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_availability_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_profiles: {
        Row: {
          bio: string | null
          certifications: Json | null
          created_at: string | null
          currency: string | null
          experience_years: number | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          location_preferences: Json | null
          profile_image_url: string | null
          rating: number | null
          stripe_account_id: string | null
          total_sessions: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          certifications?: Json | null
          created_at?: string | null
          currency?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          location_preferences?: Json | null
          profile_image_url?: string | null
          rating?: number | null
          stripe_account_id?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          certifications?: Json | null
          created_at?: string | null
          currency?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          location_preferences?: Json | null
          profile_image_url?: string | null
          rating?: number | null
          stripe_account_id?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      coach_services: {
        Row: {
          coach_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          max_participants: number | null
          name: string
          price: number | null
          service_type: string
          updated_at: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          name: string
          price?: number | null
          service_type: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          name?: string
          price?: number | null
          service_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_services_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_specializations: {
        Row: {
          class_id: string
          coach_id: string
          experience_years: number | null
          rate_per_session: number | null
        }
        Insert: {
          class_id: string
          coach_id: string
          experience_years?: number | null
          rate_per_session?: number | null
        }
        Update: {
          class_id?: string
          coach_id?: string
          experience_years?: number | null
          rate_per_session?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_specializations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "boat_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_specializations_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_sessions: {
        Row: {
          coach_id: string | null
          coach_notes: string | null
          created_at: string | null
          currency: string | null
          duration_minutes: number
          id: string
          meeting_link: string | null
          scheduled_at: string
          service_id: string | null
          session_notes: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          student_id: string | null
          student_notes: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          coach_id?: string | null
          coach_notes?: string | null
          created_at?: string | null
          currency?: string | null
          duration_minutes: number
          id?: string
          meeting_link?: string | null
          scheduled_at: string
          service_id?: string | null
          session_notes?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          student_notes?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          coach_id?: string | null
          coach_notes?: string | null
          created_at?: string | null
          currency?: string | null
          duration_minutes?: number
          id?: string
          meeting_link?: string | null
          scheduled_at?: string
          service_id?: string | null
          session_notes?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          student_notes?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_sessions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "coach_services"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_analysis: Json | null
          created_at: string | null
          description: string | null
          document_type: string | null
          extracted_content: string | null
          file_path: string
          file_size: number
          filename: string
          id: string
          mime_type: string
          processing_status: string | null
          tags: Json | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string | null
          description?: string | null
          document_type?: string | null
          extracted_content?: string | null
          file_path: string
          file_size: number
          filename: string
          id?: string
          mime_type: string
          processing_status?: string | null
          tags?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string | null
          description?: string | null
          document_type?: string | null
          extracted_content?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          mime_type?: string
          processing_status?: string | null
          tags?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }

      fleet_activity: {
        Row: {
          actor_id: string | null
          activity_type: string
          created_at: string | null
          fleet_id: string
          id: string
          payload: Json
          visibility: string
        }
        Insert: {
          actor_id?: string | null
          activity_type: string
          created_at?: string | null
          fleet_id: string
          id?: string
          payload?: Json
          visibility?: string
        }
        Update: {
          actor_id?: string | null
          activity_type?: string
          created_at?: string | null
          fleet_id?: string
          id?: string
          payload?: Json
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_activity_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_documents: {
        Row: {
          created_at: string | null
          document_id: string
          fleet_id: string
          id: string
          notify_followers: boolean | null
          shared_by: string | null
          tags: string[] | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          fleet_id: string
          id?: string
          notify_followers?: boolean | null
          shared_by?: string | null
          tags?: string[] | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          fleet_id?: string
          id?: string
          notify_followers?: boolean | null
          shared_by?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fleet_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_documents_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_documents_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_followers: {
        Row: {
          created_at: string | null
          fleet_id: string
          follower_id: string
          id: string
          notify_on_announcements: boolean | null
          notify_on_documents: boolean | null
          notify_on_events: boolean | null
        }
        Insert: {
          created_at?: string | null
          fleet_id: string
          follower_id: string
          id?: string
          notify_on_announcements?: boolean | null
          notify_on_documents?: boolean | null
          notify_on_events?: boolean | null
        }
        Update: {
          created_at?: string | null
          fleet_id?: string
          follower_id?: string
          id?: string
          notify_on_announcements?: boolean | null
          notify_on_documents?: boolean | null
          notify_on_events?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fleet_followers_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_members: {
        Row: {
          fleet_id: string
          id: string
          invited_by: string | null
          joined_at: string | null
          metadata: Json | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          fleet_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          metadata?: Json | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          fleet_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          metadata?: Json | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_members_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fleets: {
        Row: {
          class_id: string | null
          club_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          region: string | null
          slug: string | null
          updated_at: string | null
          visibility: string
          whatsapp_link: string | null
        }
        Insert: {
          class_id?: string | null
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          region?: string | null
          slug?: string | null
          updated_at?: string | null
          visibility?: string
          whatsapp_link?: string | null
        }
        Update: {
          class_id?: string | null
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          region?: string | null
          slug?: string | null
          updated_at?: string | null
          visibility?: string
          whatsapp_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fleets_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "boat_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleets_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      external_race_results: {
        Row: {
          boat_class: string | null
          club: string | null
          created_at: string | null
          external_regatta_id: string | null
          finish_position: number | null
          fleet: string | null
          id: string
          last_updated: string | null
          points: number | null
          race_number: number | null
          regatta_id: string | null
          sail_number: string | null
          sailor_name: string
          source: string
          source_url: string | null
        }
        Insert: {
          boat_class?: string | null
          club?: string | null
          created_at?: string | null
          external_regatta_id?: string | null
          finish_position?: number | null
          fleet?: string | null
          id?: string
          last_updated?: string | null
          points?: number | null
          race_number?: number | null
          regatta_id?: string | null
          sail_number?: string | null
          sailor_name: string
          source: string
          source_url?: string | null
        }
        Update: {
          boat_class?: string | null
          club?: string | null
          created_at?: string | null
          external_regatta_id?: string | null
          finish_position?: number | null
          fleet?: string | null
          id?: string
          last_updated?: string | null
          points?: number | null
          race_number?: number | null
          regatta_id?: string | null
          sail_number?: string | null
          sailor_name?: string
          source?: string
          source_url?: string | null
        }
        Relationships: []
      }
      global_racing_events: {
        Row: {
          boat_classes: Json | null
          contact_email: string | null
          created_at: string | null
          end_date: string | null
          entry_fee_range: string | null
          entry_status: string | null
          event_type: string | null
          expected_participants: number | null
          id: string
          last_updated: string | null
          name: string
          prestige_level: string | null
          source: string
          start_date: string
          venue_id: string | null
          website_url: string | null
        }
        Insert: {
          boat_classes?: Json | null
          contact_email?: string | null
          created_at?: string | null
          end_date?: string | null
          entry_fee_range?: string | null
          entry_status?: string | null
          event_type?: string | null
          expected_participants?: number | null
          id?: string
          last_updated?: string | null
          name: string
          prestige_level?: string | null
          source: string
          start_date: string
          venue_id?: string | null
          website_url?: string | null
        }
        Update: {
          boat_classes?: Json | null
          contact_email?: string | null
          created_at?: string | null
          end_date?: string | null
          entry_fee_range?: string | null
          entry_status?: string | null
          event_type?: string | null
          expected_participants?: number | null
          id?: string
          last_updated?: string | null
          name?: string
          prestige_level?: string | null
          source?: string
          start_date?: string
          venue_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "global_racing_events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "sailing_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          marketing_consent: boolean | null
          organization: string | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          marketing_consent?: boolean | null
          organization?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_consent?: boolean | null
          organization?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      race_events: {
        Row: {
          boat_classes: Json | null
          club_id: string | null
          course_description: string | null
          created_at: string | null
          entry_fee: number | null
          event_date: string
          id: string
          max_participants: number | null
          name: string
          regatta_id: string | null
          registration_deadline: string | null
          results: Json | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          weather_conditions: Json | null
        }
        Insert: {
          boat_classes?: Json | null
          club_id?: string | null
          course_description?: string | null
          created_at?: string | null
          entry_fee?: number | null
          event_date: string
          id?: string
          max_participants?: number | null
          name: string
          regatta_id?: string | null
          registration_deadline?: string | null
          results?: Json | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          weather_conditions?: Json | null
        }
        Update: {
          boat_classes?: Json | null
          club_id?: string | null
          course_description?: string | null
          created_at?: string | null
          entry_fee?: number | null
          event_date?: string
          id?: string
          max_participants?: number | null
          name?: string
          regatta_id?: string | null
          registration_deadline?: string | null
          results?: Json | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          weather_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "race_events_regatta_id_fkey"
            columns: ["regatta_id"]
            isOneToOne: false
            referencedRelation: "race_analytics"
            referencedColumns: ["regatta_id"]
          },
          {
            foreignKeyName: "race_events_regatta_id_fkey"
            columns: ["regatta_id"]
            isOneToOne: false
            referencedRelation: "regattas"
            referencedColumns: ["id"]
          },
        ]
      }
      race_registrations: {
        Row: {
          boat_class: string | null
          boat_name: string | null
          club: string | null
          created_at: string | null
          emergency_contact: Json | null
          id: string
          payment_status: string | null
          race_event_id: string | null
          registration_date: string | null
          sail_number: string | null
          sailor_id: string | null
          special_requirements: string | null
        }
        Insert: {
          boat_class?: string | null
          boat_name?: string | null
          club?: string | null
          created_at?: string | null
          emergency_contact?: Json | null
          id?: string
          payment_status?: string | null
          race_event_id?: string | null
          registration_date?: string | null
          sail_number?: string | null
          sailor_id?: string | null
          special_requirements?: string | null
        }
        Update: {
          boat_class?: string | null
          boat_name?: string | null
          club?: string | null
          created_at?: string | null
          emergency_contact?: Json | null
          id?: string
          payment_status?: string | null
          race_event_id?: string | null
          registration_date?: string | null
          sail_number?: string | null
          sailor_id?: string | null
          special_requirements?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "race_registrations_race_event_id_fkey"
            columns: ["race_event_id"]
            isOneToOne: false
            referencedRelation: "race_events"
            referencedColumns: ["id"]
          },
        ]
      }
      regatta_results: {
        Row: {
          boat_class: string | null
          boat_name: string | null
          corrected_time: unknown | null
          created_at: string | null
          disqualified: boolean | null
          dnf: boolean | null
          dns: boolean | null
          elapsed_time: unknown | null
          finish_position: number | null
          finish_time: string | null
          handicap_rating: number | null
          id: string
          points: number | null
          race_number: number | null
          regatta_id: string | null
          sail_number: string | null
          sailor_id: string | null
          updated_at: string | null
        }
        Insert: {
          boat_class?: string | null
          boat_name?: string | null
          corrected_time?: unknown | null
          created_at?: string | null
          disqualified?: boolean | null
          dnf?: boolean | null
          dns?: boolean | null
          elapsed_time?: unknown | null
          finish_position?: number | null
          finish_time?: string | null
          handicap_rating?: number | null
          id?: string
          points?: number | null
          race_number?: number | null
          regatta_id?: string | null
          sail_number?: string | null
          sailor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          boat_class?: string | null
          boat_name?: string | null
          corrected_time?: unknown | null
          created_at?: string | null
          disqualified?: boolean | null
          dnf?: boolean | null
          dns?: boolean | null
          elapsed_time?: unknown | null
          finish_position?: number | null
          finish_time?: string | null
          handicap_rating?: number | null
          id?: string
          points?: number | null
          race_number?: number | null
          regatta_id?: string | null
          sail_number?: string | null
          sailor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regatta_results_regatta_id_fkey"
            columns: ["regatta_id"]
            isOneToOne: false
            referencedRelation: "race_analytics"
            referencedColumns: ["regatta_id"]
          },
          {
            foreignKeyName: "regatta_results_regatta_id_fkey"
            columns: ["regatta_id"]
            isOneToOne: false
            referencedRelation: "regattas"
            referencedColumns: ["id"]
          },
        ]
      }
      regattas: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          location: unknown | null
          metadata: Json | null
          name: string
          start_date: string
          status: Database["public"]["Enums"]["regatta_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: unknown | null
          metadata?: Json | null
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["regatta_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: unknown | null
          metadata?: Json | null
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["regatta_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regattas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sailing_documents: {
        Row: {
          ai_summary: string | null
          author: string | null
          category: string | null
          course_data: Json | null
          created_at: string | null
          document_hash: string
          extracted_text: string | null
          file_path: string
          file_size: number
          filename: string
          id: string
          metadata: Json | null
          mime_type: string
          page_count: number | null
          processing_status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          author?: string | null
          category?: string | null
          course_data?: Json | null
          created_at?: string | null
          document_hash: string
          extracted_text?: string | null
          file_path: string
          file_size: number
          filename: string
          id?: string
          metadata?: Json | null
          mime_type: string
          page_count?: number | null
          processing_status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          author?: string | null
          category?: string | null
          course_data?: Json | null
          created_at?: string | null
          document_hash?: string
          extracted_text?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          metadata?: Json | null
          mime_type?: string
          page_count?: number | null
          processing_status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sailing_specialties: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      sailing_venues: {
        Row: {
          coordinates_lat: number
          coordinates_lng: number
          country: string
          created_at: string | null
          data_quality: string
          established_year: number | null
          id: string
          name: string
          region: string
          time_zone: string
          updated_at: string | null
          venue_type: string
        }
        Insert: {
          coordinates_lat: number
          coordinates_lng: number
          country: string
          created_at?: string | null
          data_quality?: string
          established_year?: number | null
          id: string
          name: string
          region: string
          time_zone: string
          updated_at?: string | null
          venue_type: string
        }
        Update: {
          coordinates_lat?: number
          coordinates_lng?: number
          country?: string
          created_at?: string | null
          data_quality?: string
          established_year?: number | null
          id?: string
          name?: string
          region?: string
          time_zone?: string
          updated_at?: string | null
          venue_type?: string
        }
        Relationships: []
      }
      sailor_classes: {
        Row: {
          boat_name: string | null
          class_id: string
          is_primary: boolean | null
          joined_at: string | null
          sail_number: string | null
          sailor_id: string
        }
        Insert: {
          boat_name?: string | null
          class_id: string
          is_primary?: boolean | null
          joined_at?: string | null
          sail_number?: string | null
          sailor_id: string
        }
        Update: {
          boat_name?: string | null
          class_id?: string
          is_primary?: boolean | null
          joined_at?: string | null
          sail_number?: string | null
          sailor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sailor_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "boat_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sailor_classes_sailor_id_fkey"
            columns: ["sailor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sailor_profiles: {
        Row: {
          achievements: Json | null
          boat_class_preferences: Json | null
          created_at: string | null
          emergency_contact: Json | null
          experience_level: string | null
          home_club: string | null
          id: string
          preferred_venues: Json | null
          sailing_number: string | null
          sailing_since: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          achievements?: Json | null
          boat_class_preferences?: Json | null
          created_at?: string | null
          emergency_contact?: Json | null
          experience_level?: string | null
          home_club?: string | null
          id?: string
          preferred_venues?: Json | null
          sailing_number?: string | null
          sailing_since?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievements?: Json | null
          boat_class_preferences?: Json | null
          created_at?: string | null
          emergency_contact?: Json | null
          experience_level?: string | null
          home_club?: string | null
          id?: string
          preferred_venues?: Json | null
          sailing_number?: string | null
          sailing_since?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sensor_configurations: {
        Row: {
          calibration_data: Json | null
          configuration: Json | null
          created_at: string | null
          device_name: string
          device_type: string | null
          id: string
          is_active: boolean | null
          last_seen: string | null
          manufacturer: string | null
          model: string | null
          serial_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          calibration_data?: Json | null
          configuration?: Json | null
          created_at?: string | null
          device_name: string
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          manufacturer?: string | null
          model?: string | null
          serial_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          calibration_data?: Json | null
          configuration?: Json | null
          created_at?: string | null
          device_name?: string
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          manufacturer?: string | null
          model?: string | null
          serial_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sensor_data_logs: {
        Row: {
          created_at: string | null
          data_quality_score: number | null
          id: string
          location: unknown | null
          sensor_id: string | null
          sensor_readings: Json
          session_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_quality_score?: number | null
          id?: string
          location?: unknown | null
          sensor_id?: string | null
          sensor_readings: Json
          session_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_quality_score?: number | null
          id?: string
          location?: unknown | null
          sensor_id?: string | null
          sensor_readings?: Json
          session_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_data_logs_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensor_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      session_reviews: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          rating: number
          review_text: string | null
          reviewer_id: string | null
          session_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          rating: number
          review_text?: string | null
          reviewer_id?: string | null
          session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          rating?: number
          review_text?: string | null
          reviewer_id?: string | null
          session_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          metadata: Json | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          price_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id: string
          metadata?: Json | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          price_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          price_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_venue_profiles: {
        Row: {
          created_at: string | null
          equipment_setup: Json | null
          favorite_conditions: Json | null
          id: string
          last_visited: string | null
          local_contacts: Json | null
          performance_rating: number | null
          personal_notes: string | null
          preferred_courses: Json | null
          updated_at: string | null
          user_id: string | null
          venue_id: string | null
          visits_count: number | null
        }
        Insert: {
          created_at?: string | null
          equipment_setup?: Json | null
          favorite_conditions?: Json | null
          id?: string
          last_visited?: string | null
          local_contacts?: Json | null
          performance_rating?: number | null
          personal_notes?: string | null
          preferred_courses?: Json | null
          updated_at?: string | null
          user_id?: string | null
          venue_id?: string | null
          visits_count?: number | null
        }
        Update: {
          created_at?: string | null
          equipment_setup?: Json | null
          favorite_conditions?: Json | null
          id?: string
          last_visited?: string | null
          local_contacts?: Json | null
          performance_rating?: number | null
          personal_notes?: string | null
          preferred_courses?: Json | null
          updated_at?: string | null
          user_id?: string | null
          venue_id?: string | null
          visits_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_venue_profiles_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "sailing_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          onboarding_completed: boolean | null
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_type: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          onboarding_completed?: boolean | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_type: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          onboarding_completed?: boolean | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      venue_transitions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          detected_at: string | null
          device_info: Json | null
          from_venue_id: string | null
          id: string
          location_accuracy_meters: number | null
          to_venue_id: string | null
          transition_type: string | null
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          detected_at?: string | null
          device_info?: Json | null
          from_venue_id?: string | null
          id?: string
          location_accuracy_meters?: number | null
          to_venue_id?: string | null
          transition_type?: string | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          detected_at?: string | null
          device_info?: Json | null
          from_venue_id?: string | null
          id?: string
          location_accuracy_meters?: number | null
          to_venue_id?: string | null
          transition_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_transitions_from_venue_id_fkey"
            columns: ["from_venue_id"]
            isOneToOne: false
            referencedRelation: "sailing_venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_transitions_to_venue_id_fkey"
            columns: ["to_venue_id"]
            isOneToOne: false
            referencedRelation: "sailing_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_conditions: {
        Row: {
          id: string
          location: unknown | null
          metadata: Json | null
          pressure_hpa: number | null
          source: string | null
          temperature_celsius: number | null
          timestamp: string | null
          visibility_km: number | null
          wave_height_meters: number | null
          wind_direction: number | null
          wind_speed_knots: number | null
        }
        Insert: {
          id?: string
          location?: unknown | null
          metadata?: Json | null
          pressure_hpa?: number | null
          source?: string | null
          temperature_celsius?: number | null
          timestamp?: string | null
          visibility_km?: number | null
          wave_height_meters?: number | null
          wind_direction?: number | null
          wind_speed_knots?: number | null
        }
        Update: {
          id?: string
          location?: unknown | null
          metadata?: Json | null
          pressure_hpa?: number | null
          source?: string | null
          temperature_celsius?: number | null
          timestamp?: string | null
          visibility_km?: number | null
          wave_height_meters?: number | null
          wind_direction?: number | null
          wind_speed_knots?: number | null
        }
        Relationships: []
      }
      weather_insights: {
        Row: {
          accuracy_rating: number | null
          context: string
          created_at: string | null
          id: string
          insights_data: Json
          location: unknown
          regatta_id: string | null
          timeframe: string
          user_id: string
          weather_data: Json | null
        }
        Insert: {
          accuracy_rating?: number | null
          context: string
          created_at?: string | null
          id?: string
          insights_data: Json
          location: unknown
          regatta_id?: string | null
          timeframe: string
          user_id: string
          weather_data?: Json | null
        }
        Update: {
          accuracy_rating?: number | null
          context?: string
          created_at?: string | null
          id?: string
          insights_data?: Json
          location?: unknown
          regatta_id?: string | null
          timeframe?: string
          user_id?: string
          weather_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_insights_regatta_id_fkey"
            columns: ["regatta_id"]
            isOneToOne: false
            referencedRelation: "race_analytics"
            referencedColumns: ["regatta_id"]
          },
          {
            foreignKeyName: "weather_insights_regatta_id_fkey"
            columns: ["regatta_id"]
            isOneToOne: false
            referencedRelation: "regattas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weather_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      yacht_clubs: {
        Row: {
          coordinates_lat: number | null
          coordinates_lng: number | null
          created_at: string | null
          founded: number | null
          id: string
          membership_type: string
          name: string
          prestige_level: string
          short_name: string | null
          updated_at: string | null
          venue_id: string | null
          website: string | null
        }
        Insert: {
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string | null
          founded?: number | null
          id: string
          membership_type?: string
          name: string
          prestige_level?: string
          short_name?: string | null
          updated_at?: string | null
          venue_id?: string | null
          website?: string | null
        }
        Update: {
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string | null
          founded?: number | null
          id?: string
          membership_type?: string
          name?: string
          prestige_level?: string
          short_name?: string | null
          updated_at?: string | null
          venue_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yacht_clubs_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "sailing_venues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_insights_summary: {
        Row: {
          analysis_created: string | null
          analysis_type: string | null
          confidence_score: number | null
          first_name: string | null
          last_name: string | null
          regatta_name: string | null
          regatta_status: Database["public"]["Enums"]["regatta_status"] | null
          start_date: string | null
          total_analyses_for_regatta: number | null
        }
        Relationships: []
      }
      race_analytics: {
        Row: {
          average_speed: number | null
          last_position_update: string | null
          participating_boats: number | null
          race_start_time: string | null
          regatta_id: string | null
          regatta_name: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["regatta_status"] | null
          top_speed: number | null
        }
        Relationships: []
      }
      weather_impact: {
        Row: {
          avg_boat_speed: number | null
          avg_wave_height: number | null
          avg_wind_direction: number | null
          avg_wind_speed: number | null
          hour: string | null
          position_reports: number | null
          regatta_name: string | null
          wind_speed_correlation: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      find_nearby_regattas: {
        Args: { radius_km?: number; user_location: unknown }
        Returns: {
          distance_km: number
          id: string
          name: string
          start_date: string
          status: string
        }[]
      }
      get_latest_boat_positions: {
        Args: { minutes_ago?: number; p_regatta_id: string }
        Returns: {
          boat_id: string
          boat_position: unknown
          heading: number
          position_timestamp: string
          speed_knots: number
        }[]
      }
      get_regatta_weather: {
        Args: { regatta_location: unknown; time_range_hours?: number }
        Returns: {
          distance_km: number
          wave_height_meters: number
          weather_timestamp: string
          wind_direction: number
          wind_speed_knots: number
        }[]
      }
      get_user_ai_stats: {
        Args: { p_days?: number; p_user_id: string }
        Returns: {
          avg_processing_time: number
          function_name: string
          last_used: string
          successful_requests: number
          total_requests: number
          total_tokens: number
        }[]
      }
      get_venue_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      log_ai_usage: {
        Args: {
          p_error_message?: string
          p_function_name: string
          p_processing_time_ms?: number
          p_request_data?: Json
          p_response_data?: Json
          p_success?: boolean
          p_tokens_used?: number
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      plan_type: "basic" | "pro" | "enterprise"
      regatta_status: "planned" | "active" | "completed" | "canceled"
      subscription_status:
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "trialing"
        | "unpaid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      plan_type: ["basic", "pro", "enterprise"],
      regatta_status: ["planned", "active", "completed", "canceled"],
      subscription_status: [
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "trialing",
        "unpaid",
      ],
    },
  },
} as const
