/**
 * Supabase Client for Browser
 * Used in client-side components and pages
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

// Singleton instance
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set VITE_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and VITE_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

  return supabaseClient;
}

// Export singleton instance
export const supabase = createClient();

