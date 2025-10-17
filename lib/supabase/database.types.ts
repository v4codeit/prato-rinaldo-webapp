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
      articles: {
        Row: {
          author_id: string
          content: string
          cover_image: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          points: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          points?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          points?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          tenant_id: string
          title: string
          uploader_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          tenant_id: string
          title: string
          uploader_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          tenant_id?: string
          title?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string | null
          event_id: string
          guests_count: number | null
          id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          guests_count?: number | null
          id?: string
          status: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          guests_count?: number | null
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string
          end_date: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          fundraiser_current: number | null
          fundraiser_goal: number | null
          id: string
          image: string | null
          location: string | null
          max_participants: number | null
          organizer_id: string
          start_date: string
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          end_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          fundraiser_current?: number | null
          fundraiser_goal?: number | null
          id?: string
          image?: string | null
          location?: string | null
          max_participants?: number | null
          organizer_id: string
          start_date: string
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          end_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          fundraiser_current?: number | null
          fundraiser_goal?: number | null
          id?: string
          image?: string | null
          location?: string | null
          max_participants?: number | null
          organizer_id?: string
          start_date?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author_id: string
          content: string
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["moderation_status"]
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["moderation_status"]
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["moderation_status"]
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author_id: string
          category_id: string
          content: string
          created_at: string | null
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          status: Database["public"]["Enums"]["moderation_status"]
          tenant_id: string
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          author_id: string
          category_id: string
          content: string
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          status?: Database["public"]["Enums"]["moderation_status"]
          tenant_id: string
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string
          category_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          status?: Database["public"]["Enums"]["moderation_status"]
          tenant_id?: string
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string | null
          description: string
          donation_percentage: number | null
          id: string
          images: Json | null
          price: number
          seller_id: string
          status: Database["public"]["Enums"]["marketplace_status"]
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          donation_percentage?: number | null
          id?: string
          images?: Json | null
          price: number
          seller_id: string
          status?: Database["public"]["Enums"]["marketplace_status"]
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          donation_percentage?: number | null
          id?: string
          images?: Json | null
          price?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["marketplace_status"]
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_items_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions_log: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action"]
          created_at: string | null
          id: string
          moderator_id: string
          queue_item_id: string
          reason: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action"]
          created_at?: string | null
          id?: string
          moderator_id: string
          queue_item_id: string
          reason?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action"]
          created_at?: string | null
          id?: string
          moderator_id?: string
          queue_item_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_log_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_log_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "moderation_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_queue: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: string
          item_id: string
          item_type: Database["public"]["Enums"]["item_type"]
          priority: Database["public"]["Enums"]["moderation_priority"]
          report_reasons: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          item_id: string
          item_type: Database["public"]["Enums"]["item_type"]
          priority?: Database["public"]["Enums"]["moderation_priority"]
          report_reasons?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["item_type"]
          priority?: Database["public"]["Enums"]["moderation_priority"]
          report_reasons?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          availability: Database["public"]["Enums"]["availability_type"]
          category: Database["public"]["Enums"]["professional_category"]
          created_at: string | null
          description: string
          email: string | null
          hourly_rate: number | null
          id: string
          phone: string | null
          status: Database["public"]["Enums"]["moderation_status"]
          tenant_id: string
          title: string
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          availability?: Database["public"]["Enums"]["availability_type"]
          category: Database["public"]["Enums"]["professional_category"]
          created_at?: string | null
          description: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          tenant_id: string
          title: string
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          availability?: Database["public"]["Enums"]["availability_type"]
          category?: Database["public"]["Enums"]["professional_category"]
          created_at?: string | null
          description?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          tenant_id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          hero_image: string | null
          id: string
          is_active: boolean
          logo: string | null
          maintenance_message: string | null
          maintenance_mode: boolean
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          social_facebook: string | null
          social_instagram: string | null
          social_twitter: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          subscription_type:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          hero_image?: string | null
          id?: string
          is_active?: boolean
          logo?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_type?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          hero_image?: string | null
          id?: string
          is_active?: boolean
          logo?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_type?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tutorial_requests: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["tutorial_status"]
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["tutorial_status"]
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["tutorial_status"]
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          points: number
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points: number
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          admin_permissions: Json | null
          admin_role: Database["public"]["Enums"]["admin_role"] | null
          avatar: string | null
          bio: string | null
          committee_role: Database["public"]["Enums"]["committee_role"] | null
          created_at: string | null
          email: string | null
          has_minors: boolean | null
          has_seniors: boolean | null
          household_size: number | null
          id: string
          is_in_board: boolean | null
          is_in_council: boolean | null
          last_signed_in: string | null
          login_method: string | null
          membership_type: Database["public"]["Enums"]["membership_type"] | null
          minors_count: number | null
          municipality: Database["public"]["Enums"]["municipality"] | null
          name: string | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          seniors_count: number | null
          street: string | null
          street_number: string | null
          tenant_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          zip_code: string | null
        }
        Insert: {
          admin_permissions?: Json | null
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          avatar?: string | null
          bio?: string | null
          committee_role?: Database["public"]["Enums"]["committee_role"] | null
          created_at?: string | null
          email?: string | null
          has_minors?: boolean | null
          has_seniors?: boolean | null
          household_size?: number | null
          id: string
          is_in_board?: boolean | null
          is_in_council?: boolean | null
          last_signed_in?: string | null
          login_method?: string | null
          membership_type?:
            | Database["public"]["Enums"]["membership_type"]
            | null
          minors_count?: number | null
          municipality?: Database["public"]["Enums"]["municipality"] | null
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          seniors_count?: number | null
          street?: string | null
          street_number?: string | null
          tenant_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          zip_code?: string | null
        }
        Update: {
          admin_permissions?: Json | null
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          avatar?: string | null
          bio?: string | null
          committee_role?: Database["public"]["Enums"]["committee_role"] | null
          created_at?: string | null
          email?: string | null
          has_minors?: boolean | null
          has_seniors?: boolean | null
          household_size?: number | null
          id?: string
          is_in_board?: boolean | null
          is_in_council?: boolean | null
          last_signed_in?: string | null
          login_method?: string | null
          membership_type?:
            | Database["public"]["Enums"]["membership_type"]
            | null
          minors_count?: number | null
          municipality?: Database["public"]["Enums"]["municipality"] | null
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          seniors_count?: number | null
          street?: string | null
          street_number?: string | null
          tenant_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_verified: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      admin_role: "super_admin" | "admin" | "moderator"
      availability_type: "volunteer" | "paid" | "both"
      committee_role:
        | "president"
        | "vice_president"
        | "secretary"
        | "treasurer"
        | "board_member"
        | "council_member"
      content_status: "draft" | "published" | "archived"
      event_type: "public" | "private" | "fundraiser"
      item_type:
        | "marketplace_item"
        | "professional_profile"
        | "forum_thread"
        | "forum_post"
        | "tutorial_request"
        | "event"
        | "article"
      marketplace_status: "pending" | "approved" | "rejected" | "sold"
      membership_type: "resident" | "domiciled" | "landowner"
      moderation_action: "approve" | "reject" | "flag" | "unflag"
      moderation_priority: "low" | "medium" | "high" | "urgent"
      moderation_status: "pending" | "approved" | "rejected"
      municipality: "san_cesareo" | "zagarolo"
      professional_category:
        | "plumbing"
        | "electrical"
        | "construction"
        | "gardening"
        | "cleaning"
        | "it"
        | "legal"
        | "medical"
        | "education"
        | "other"
      rsvp_status: "going" | "maybe" | "not_going"
      subscription_status: "trial" | "active" | "suspended" | "cancelled"
      subscription_type: "monthly" | "annual"
      tutorial_status: "pending" | "in_progress" | "completed" | "rejected"
      user_role: "user" | "admin" | "super_admin"
      verification_status: "pending" | "approved" | "rejected"
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
      admin_role: ["super_admin", "admin", "moderator"],
      availability_type: ["volunteer", "paid", "both"],
      committee_role: [
        "president",
        "vice_president",
        "secretary",
        "treasurer",
        "board_member",
        "council_member",
      ],
      content_status: ["draft", "published", "archived"],
      event_type: ["public", "private", "fundraiser"],
      item_type: [
        "marketplace_item",
        "professional_profile",
        "forum_thread",
        "forum_post",
        "tutorial_request",
        "event",
        "article",
      ],
      marketplace_status: ["pending", "approved", "rejected", "sold"],
      membership_type: ["resident", "domiciled", "landowner"],
      moderation_action: ["approve", "reject", "flag", "unflag"],
      moderation_priority: ["low", "medium", "high", "urgent"],
      moderation_status: ["pending", "approved", "rejected"],
      municipality: ["san_cesareo", "zagarolo"],
      professional_category: [
        "plumbing",
        "electrical",
        "construction",
        "gardening",
        "cleaning",
        "it",
        "legal",
        "medical",
        "education",
        "other",
      ],
      rsvp_status: ["going", "maybe", "not_going"],
      subscription_status: ["trial", "active", "suspended", "cancelled"],
      subscription_type: ["monthly", "annual"],
      tutorial_status: ["pending", "in_progress", "completed", "rejected"],
      user_role: ["user", "admin", "super_admin"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const


