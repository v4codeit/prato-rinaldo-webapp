/**
 * Questo file conterrà i tipi generati automaticamente da Supabase
 * Generarli con: pnpm supabase:gen-types
 *
 * Per ora definiamo un placeholder Database type
 */

export type Database = {
  public: {
    Tables: {
      [key: string]: any;
    };
    Views: {
      [key: string]: any;
    };
    Functions: {
      [key: string]: any;
    };
    Enums: {
      [key: string]: any;
    };
  };
};

// Helper types per Supabase queries
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
