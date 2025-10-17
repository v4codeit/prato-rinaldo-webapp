/**
 * Supabase Client for Server
 * Used in tRPC context and server-side operations
 */

import { createServerClient } from '@supabase/ssr';
import type { Database } from './database.types';
import type { IncomingMessage, ServerResponse } from 'http';

export function createClient(req: IncomingMessage, res: ServerResponse) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        // Parse cookies from request headers
        const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        return cookies?.[name];
      },
      set(name: string, value: string, options: any) {
        // Set cookie in response headers
        const cookieString = `${name}=${value}; Path=${options.path || '/'}; ${
          options.maxAge ? `Max-Age=${options.maxAge};` : ''
        } ${options.httpOnly ? 'HttpOnly;' : ''} ${
          options.secure ? 'Secure;' : ''
        } ${options.sameSite ? `SameSite=${options.sameSite};` : ''}`;

        const existingCookies = res.getHeader('Set-Cookie') || [];
        const cookiesArray = Array.isArray(existingCookies)
          ? existingCookies
          : [existingCookies.toString()];
        
        res.setHeader('Set-Cookie', [...cookiesArray, cookieString]);
      },
      remove(name: string, options: any) {
        // Remove cookie by setting Max-Age=0
        const cookieString = `${name}=; Path=${options?.path || '/'}; Max-Age=0;`;
        const existingCookies = res.getHeader('Set-Cookie') || [];
        const cookiesArray = Array.isArray(existingCookies)
          ? existingCookies
          : [existingCookies.toString()];
        res.setHeader('Set-Cookie', [...cookiesArray, cookieString]);
      },
    },
  });
}

/**
 * Create admin client with service role key (bypasses RLS)
 * Use with caution - only for admin operations
 */
export function createAdminClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get: () => undefined,
      set: () => {},
      remove: () => {},
    },
  });
}

