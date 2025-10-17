/**
 * Supabase Database Types
 * Simplified version - can be regenerated with:
 * npx supabase gen types typescript --project-id kyrliitlqshmwbzaaout
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          name: string | null;
          email: string | null;
          login_method: string | null;
          role: 'user' | 'admin' | 'super_admin';
          verification_status: 'pending' | 'approved' | 'rejected';
          membership_type: 'resident' | 'domiciled' | 'landowner' | null;
          street: string | null;
          street_number: string | null;
          zip_code: string | null;
          municipality: 'san_cesareo' | 'zagarolo' | null;
          household_size: number | null;
          has_minors: boolean | null;
          minors_count: number | null;
          has_seniors: boolean | null;
          seniors_count: number | null;
          admin_role: 'super_admin' | 'admin' | 'moderator' | null;
          admin_permissions: Json | null;
          committee_role: 'president' | 'vice_president' | 'secretary' | 'treasurer' | 'board_member' | 'council_member' | null;
          is_in_board: boolean | null;
          is_in_council: boolean | null;
          onboarding_completed: boolean | null;
          onboarding_step: number | null;
          phone: string | null;
          bio: string | null;
          avatar: string | null;
          created_at: string | null;
          last_signed_in: string | null;
        };
        Insert: Partial<Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'last_signed_in'>>;
        Update: Partial<Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'last_signed_in'>>;
      };

    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_tenant_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_verified: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

