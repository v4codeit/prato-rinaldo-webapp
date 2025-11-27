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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      aggregated_stats: {
        Row: {
          id: string
          metadata: Json | null
          stat_key: string
          stat_value: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          stat_key: string
          stat_value?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          stat_key?: string
          stat_value?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aggregated_stats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          emoji: string | null
          end_date: string | null
          id: string
          is_active: boolean
          link: string | null
          priority: number
          start_date: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          link?: string | null
          priority?: number
          start_date?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          link?: string | null
          priority?: number
          start_date?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
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
          created_at: string
          criteria: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          points: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          criteria?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          points?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          criteria?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          points?: number
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
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          item_type: string
          name: string
          slug: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          item_type: string
          name: string
          slug: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          item_type?: string
          name?: string
          slug?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          last_message_at: string
          last_message_preview: string
          marketplace_item_id: string
          seller_id: string
          status: Database["public"]["Enums"]["conversation_status"]
          tenant_id: string
          unread_count_buyer: number
          unread_count_seller: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          last_message_preview?: string
          marketplace_item_id: string
          seller_id: string
          status?: Database["public"]["Enums"]["conversation_status"]
          tenant_id: string
          unread_count_buyer?: number
          unread_count_seller?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          last_message_preview?: string
          marketplace_item_id?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          tenant_id?: string
          unread_count_buyer?: number
          unread_count_seller?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
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
          created_at: string
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          tenant_id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          tenant_id: string
          title: string
          uploaded_by: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          tenant_id?: string
          title?: string
          uploaded_by?: string
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
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          status: Database["public"]["Enums"]["event_rsvp_status"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          status?: Database["public"]["Enums"]["event_rsvp_status"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          status?: Database["public"]["Enums"]["event_rsvp_status"]
          tenant_id?: string
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
            foreignKeyName: "event_rsvps_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          category_id: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_private: boolean
          location: string | null
          max_attendees: number | null
          organizer_id: string
          price: number | null
          requires_payment: boolean
          start_date: string
          status: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_private?: boolean
          location?: string | null
          max_attendees?: number | null
          organizer_id: string
          price?: number | null
          requires_payment?: boolean
          start_date: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_private?: boolean
          location?: string | null
          max_attendees?: number | null
          organizer_id?: string
          price?: number | null
          requires_payment?: boolean
          start_date?: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
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
      marketplace_items: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          committee_percentage: number
          condition: Database["public"]["Enums"]["marketplace_condition"] | null
          created_at: string
          description: string | null
          id: string
          images: Json | null
          is_private: boolean
          is_sold: boolean
          price: number
          seller_id: string
          sold_at: string | null
          status: Database["public"]["Enums"]["marketplace_status"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          committee_percentage?: number
          condition?:
            | Database["public"]["Enums"]["marketplace_condition"]
            | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_private?: boolean
          is_sold?: boolean
          price: number
          seller_id: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["marketplace_status"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          committee_percentage?: number
          condition?:
            | Database["public"]["Enums"]["marketplace_condition"]
            | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_private?: boolean
          is_sold?: boolean
          price?: number
          seller_id?: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["marketplace_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
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
            foreignKeyName: "marketplace_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions_log: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action_type"]
          created_at: string
          id: string
          item_id: string
          item_type: string
          metadata: Json | null
          new_status: string | null
          note: string | null
          performed_by: string
          performed_by_name: string | null
          previous_status: string | null
          queue_item_id: string
          tenant_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action_type"]
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          metadata?: Json | null
          new_status?: string | null
          note?: string | null
          performed_by: string
          performed_by_name?: string | null
          previous_status?: string | null
          queue_item_id: string
          tenant_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action_type"]
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          metadata?: Json | null
          new_status?: string | null
          note?: string | null
          performed_by?: string
          performed_by_name?: string | null
          previous_status?: string | null
          queue_item_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_log_performed_by_fkey"
            columns: ["performed_by"]
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
          {
            foreignKeyName: "moderation_actions_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_queue: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          item_content: string | null
          item_creator_id: string | null
          item_creator_name: string | null
          item_id: string
          item_title: string | null
          item_type: Database["public"]["Enums"]["moderation_item_type"]
          moderated_at: string | null
          moderated_by: string | null
          moderation_note: string | null
          priority: Database["public"]["Enums"]["moderation_priority"]
          report_count: number
          report_reasons: Json | null
          status: Database["public"]["Enums"]["moderation_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          item_content?: string | null
          item_creator_id?: string | null
          item_creator_name?: string | null
          item_id: string
          item_title?: string | null
          item_type: Database["public"]["Enums"]["moderation_item_type"]
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          priority?: Database["public"]["Enums"]["moderation_priority"]
          report_count?: number
          report_reasons?: Json | null
          status?: Database["public"]["Enums"]["moderation_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          item_content?: string | null
          item_creator_id?: string | null
          item_creator_name?: string | null
          item_id?: string
          item_title?: string | null
          item_type?: Database["public"]["Enums"]["moderation_item_type"]
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          priority?: Database["public"]["Enums"]["moderation_priority"]
          report_count?: number
          report_reasons?: Json | null
          status?: Database["public"]["Enums"]["moderation_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_moderation_queue_item_creator"
            columns: ["item_creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_queue_moderated_by_fkey"
            columns: ["moderated_by"]
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
      proposal_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          order_index: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          order_index?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          order_index?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          proposal_id: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          proposal_id: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          proposal_id?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_comments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_status_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["proposal_status"]
          old_status: Database["public"]["Enums"]["proposal_status"] | null
          proposal_id: string
          reason: string | null
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["proposal_status"]
          old_status?: Database["public"]["Enums"]["proposal_status"] | null
          proposal_id: string
          reason?: string | null
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["proposal_status"]
          old_status?: Database["public"]["Enums"]["proposal_status"] | null
          proposal_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_status_history_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_votes: {
        Row: {
          created_at: string
          id: string
          proposal_id: string
          user_id: string
          vote_type: Database["public"]["Enums"]["proposal_vote_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          proposal_id: string
          user_id: string
          vote_type: Database["public"]["Enums"]["proposal_vote_type"]
        }
        Update: {
          created_at?: string
          id?: string
          proposal_id?: string
          user_id?: string
          vote_type?: Database["public"]["Enums"]["proposal_vote_type"]
        }
        Relationships: [
          {
            foreignKeyName: "proposal_votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          author_id: string
          category_id: string
          completed_date: string | null
          created_at: string
          decline_reason: string | null
          description: string
          downvotes: number
          id: string
          planned_date: string | null
          score: number | null
          status: Database["public"]["Enums"]["proposal_status"]
          tenant_id: string
          title: string
          updated_at: string
          upvotes: number
          view_count: number
        }
        Insert: {
          author_id: string
          category_id: string
          completed_date?: string | null
          created_at?: string
          decline_reason?: string | null
          description: string
          downvotes?: number
          id?: string
          planned_date?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["proposal_status"]
          tenant_id: string
          title: string
          updated_at?: string
          upvotes?: number
          view_count?: number
        }
        Update: {
          author_id?: string
          category_id?: string
          completed_date?: string | null
          created_at?: string
          decline_reason?: string | null
          description?: string
          downvotes?: number
          id?: string
          planned_date?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["proposal_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
          upvotes?: number
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "proposal_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          service_profile_id: string
          tenant_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          service_profile_id: string
          tenant_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          service_profile_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_professional_profile_id_fkey"
            columns: ["service_profile_id"]
            isOneToOne: false
            referencedRelation: "service_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_profiles: {
        Row: {
          address: string | null
          availability_hours: number | null
          business_name: string | null
          category: string
          certifications: string[] | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean
          is_reported: boolean
          is_volunteer: boolean
          logo_url: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_note: string | null
          portfolio_images: Json | null
          profile_type: Database["public"]["Enums"]["service_profile_type"]
          report_count: number
          reported_by: Json | null
          representative_name: string | null
          services: string[] | null
          status: Database["public"]["Enums"]["marketplace_status"]
          tenant_id: string
          updated_at: string
          user_id: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          availability_hours?: number | null
          business_name?: string | null
          category: string
          certifications?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          is_reported?: boolean
          is_volunteer?: boolean
          logo_url?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          portfolio_images?: Json | null
          profile_type?: Database["public"]["Enums"]["service_profile_type"]
          report_count?: number
          reported_by?: Json | null
          representative_name?: string | null
          services?: string[] | null
          status?: Database["public"]["Enums"]["marketplace_status"]
          tenant_id: string
          updated_at?: string
          user_id: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          availability_hours?: number | null
          business_name?: string | null
          category?: string
          certifications?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          is_reported?: boolean
          is_volunteer?: boolean
          logo_url?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          portfolio_images?: Json | null
          profile_type?: Database["public"]["Enums"]["service_profile_type"]
          report_count?: number
          reported_by?: Json | null
          representative_name?: string | null
          services?: string[] | null
          status?: Database["public"]["Enums"]["marketplace_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_profiles_moderated_by_fkey"
            columns: ["moderated_by"]
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
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          category: string
          description: string | null
          id: string
          key: string
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          category: string
          description?: string | null
          id?: string
          key: string
          tenant_id: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          key?: string
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_site_settings_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          accent_color: string | null
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          enabled_modules: Json
          hero_image: string | null
          id: string
          is_active: boolean
          logo: string | null
          maintenance_message: string | null
          maintenance_mode: boolean
          max_storage_mb: number
          max_users: number
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
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          enabled_modules?: Json
          hero_image?: string | null
          id?: string
          is_active?: boolean
          logo?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean
          max_storage_mb?: number
          max_users?: number
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
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          enabled_modules?: Json
          hero_image?: string | null
          id?: string
          is_active?: boolean
          logo?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean
          max_storage_mb?: number
          max_users?: number
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
          updated_at?: string
        }
        Relationships: []
      }
      tutorial_requests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["moderation_status"]
          tenant_id: string
          topic: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["moderation_status"]
          tenant_id: string
          topic: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["moderation_status"]
          tenant_id?: string
          topic?: string
        }
        Relationships: [
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
      tutorials: {
        Row: {
          author_id: string
          category: string | null
          content: string
          cover_image: string | null
          created_at: string
          id: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id: string
          category?: string | null
          content: string
          cover_image?: string | null
          created_at?: string
          id?: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          id?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutorials_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorials_tenant_id_fkey"
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
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
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
      users: {
        Row: {
          admin_permissions: Json | null
          admin_role: Database["public"]["Enums"]["admin_role"] | null
          avatar: string | null
          bio: string | null
          committee_role: Database["public"]["Enums"]["committee_role"] | null
          created_at: string
          email: string | null
          has_minors: boolean | null
          has_seniors: boolean | null
          household_size: number | null
          id: string
          is_in_board: boolean
          is_in_council: boolean
          last_signed_in: string
          membership_type: Database["public"]["Enums"]["membership_type"] | null
          minors_count: number | null
          municipality: Database["public"]["Enums"]["municipality"] | null
          name: string | null
          onboarding_completed: boolean
          onboarding_step: number
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          seniors_count: number | null
          street: string | null
          street_number: string | null
          tenant_id: string
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          zip_code: string | null
        }
        Insert: {
          admin_permissions?: Json | null
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          avatar?: string | null
          bio?: string | null
          committee_role?: Database["public"]["Enums"]["committee_role"] | null
          created_at?: string
          email?: string | null
          has_minors?: boolean | null
          has_seniors?: boolean | null
          household_size?: number | null
          id: string
          is_in_board?: boolean
          is_in_council?: boolean
          last_signed_in?: string
          membership_type?:
            | Database["public"]["Enums"]["membership_type"]
            | null
          minors_count?: number | null
          municipality?: Database["public"]["Enums"]["municipality"] | null
          name?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          seniors_count?: number | null
          street?: string | null
          street_number?: string | null
          tenant_id: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          zip_code?: string | null
        }
        Update: {
          admin_permissions?: Json | null
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          avatar?: string | null
          bio?: string | null
          committee_role?: Database["public"]["Enums"]["committee_role"] | null
          created_at?: string
          email?: string | null
          has_minors?: boolean | null
          has_seniors?: boolean | null
          household_size?: number | null
          id?: string
          is_in_board?: boolean
          is_in_council?: boolean
          last_signed_in?: string
          membership_type?:
            | Database["public"]["Enums"]["membership_type"]
            | null
          minors_count?: number | null
          municipality?: Database["public"]["Enums"]["municipality"] | null
          name?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          seniors_count?: number | null
          street?: string | null
          street_number?: string | null
          tenant_id?: string
          updated_at?: string
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
      topics: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean
          member_count: number
          message_count: number
          name: string
          slug: string
          sort_order: number
          tenant_id: string
          updated_at: string
          visibility: Database["public"]["Enums"]["topic_visibility"]
          write_permission: Database["public"]["Enums"]["topic_write_permission"]
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          member_count?: number
          message_count?: number
          name: string
          slug: string
          sort_order?: number
          tenant_id: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["topic_visibility"]
          write_permission?: Database["public"]["Enums"]["topic_write_permission"]
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          member_count?: number
          message_count?: number
          name?: string
          slug?: string
          sort_order?: number
          tenant_id?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["topic_visibility"]
          write_permission?: Database["public"]["Enums"]["topic_write_permission"]
        }
        Relationships: [
          {
            foreignKeyName: "topics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_members: {
        Row: {
          created_at: string
          id: string
          is_muted: boolean
          last_read_at: string | null
          role: Database["public"]["Enums"]["topic_member_role"]
          topic_id: string
          unread_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_muted?: boolean
          last_read_at?: string | null
          role?: Database["public"]["Enums"]["topic_member_role"]
          topic_id: string
          unread_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_muted?: boolean
          last_read_at?: string | null
          role?: Database["public"]["Enums"]["topic_member_role"]
          topic_id?: string
          unread_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_members_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_messages: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_deleted: boolean
          is_edited: boolean
          message_type: Database["public"]["Enums"]["topic_message_type"]
          metadata: Json | null
          reactions: Json | null
          reply_to_id: string | null
          topic_id: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          message_type?: Database["public"]["Enums"]["topic_message_type"]
          metadata?: Json | null
          reactions?: Json | null
          reply_to_id?: string | null
          topic_id: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          message_type?: Database["public"]["Enums"]["topic_message_type"]
          metadata?: Json | null
          reactions?: Json | null
          reply_to_id?: string | null
          topic_id?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "topic_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_messages_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          message_id: string
          url: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          message_id: string
          url: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          message_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "topic_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          emoji: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          emoji: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          emoji?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "topic_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_moderator: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_verified: { Args: never; Returns: boolean }
      promote_to_super_admin: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      seed_general_settings_for_tenant: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
      conversation_status: "active" | "closed"
      event_rsvp_status: "going" | "maybe" | "not_going"
      event_type: "public" | "private" | "fundraiser"
      item_type:
        | "marketplace_item"
        | "professional_profile"
        | "forum_thread"
        | "forum_post"
        | "tutorial_request"
        | "event"
        | "article"
      marketplace_condition: "new" | "like_new" | "good" | "fair" | "poor"
      marketplace_status: "pending" | "approved" | "sold" | "rejected"
      membership_type: "resident" | "domiciled" | "landowner"
      moderation_action: "approve" | "reject" | "flag" | "unflag"
      moderation_action_type:
        | "created"
        | "assigned"
        | "approved"
        | "rejected"
        | "reported"
        | "edited"
        | "deleted"
      moderation_item_type:
        | "marketplace"
        | "service_profile"
        | "proposal"
        | "proposal_comment"
        | "tutorial_request"
      moderation_priority: "low" | "medium" | "high" | "urgent"
      moderation_status: "pending" | "in_review" | "approved" | "rejected"
      municipality: "san_cesareo" | "zagarolo"
      payment_status: "pending" | "paid" | "refunded"
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
      proposal_status:
        | "proposed"
        | "under_review"
        | "approved"
        | "in_progress"
        | "completed"
        | "declined"
      proposal_vote_type: "up" | "down"
      rsvp_status: "going" | "maybe" | "not_going"
      service_profile_type: "volunteer" | "professional"
      subscription_status: "trial" | "active" | "suspended" | "cancelled"
      subscription_type: "monthly" | "annual"
      tutorial_status: "pending" | "in_progress" | "completed" | "rejected"
      topic_message_type: "text" | "system" | "auto_post" | "image" | "voice"
      topic_visibility: "public" | "authenticated" | "verified" | "members_only"
      topic_write_permission: "all_viewers" | "verified" | "members_only" | "admins_only"
      topic_member_role: "admin" | "moderator" | "writer" | "viewer"
      topic_reaction_type: "like" | "love" | "laugh" | "wow" | "sad" | "angry"
      user_role: "user" | "admin" | "super_admin"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          format: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          format?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS"
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
  graphql_public: {
    Enums: {},
  },
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
      conversation_status: ["active", "closed"],
      event_rsvp_status: ["going", "maybe", "not_going"],
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
      marketplace_condition: ["new", "like_new", "good", "fair", "poor"],
      marketplace_status: ["pending", "approved", "sold", "rejected"],
      membership_type: ["resident", "domiciled", "landowner"],
      moderation_action: ["approve", "reject", "flag", "unflag"],
      moderation_action_type: [
        "created",
        "assigned",
        "approved",
        "rejected",
        "reported",
        "edited",
        "deleted",
      ],
      moderation_item_type: [
        "marketplace",
        "service_profile",
        "proposal",
        "proposal_comment",
        "tutorial_request",
      ],
      moderation_priority: ["low", "medium", "high", "urgent"],
      moderation_status: ["pending", "in_review", "approved", "rejected"],
      municipality: ["san_cesareo", "zagarolo"],
      payment_status: ["pending", "paid", "refunded"],
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
      proposal_status: [
        "proposed",
        "under_review",
        "approved",
        "in_progress",
        "completed",
        "declined",
      ],
      proposal_vote_type: ["up", "down"],
      rsvp_status: ["going", "maybe", "not_going"],
      service_profile_type: ["volunteer", "professional"],
      subscription_status: ["trial", "active", "suspended", "cancelled"],
      subscription_type: ["monthly", "annual"],
      tutorial_status: ["pending", "in_progress", "completed", "rejected"],
      topic_message_type: ["text", "system", "auto_post", "image", "voice"],
      topic_visibility: ["public", "authenticated", "verified", "members_only"],
      topic_write_permission: ["all_viewers", "verified", "members_only", "admins_only"],
      topic_member_role: ["admin", "moderator", "writer", "viewer"],
      topic_reaction_type: ["like", "love", "laugh", "wow", "sad", "angry"],
      user_role: ["user", "admin", "super_admin"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS"],
    },
  },
} as const
