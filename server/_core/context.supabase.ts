import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createClient } from "../../lib/supabase/server";
import type { Database } from "../../lib/supabase/database.types";

export type SupabaseUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  avatar: string | null;
  role: 'user' | 'admin' | 'super_admin';
  adminRole: 'president' | 'vice_president' | 'secretary' | 'treasurer' | 'councilor' | null;
  userType: 'resident' | 'domiciled' | 'landowner';
  verificationStatus: 'pending' | 'approved' | 'rejected';
  onboardingCompleted: boolean;
  onboardingStep: number;
  committeeRole: string | null;
  isInBoard: boolean;
  isInCouncil: boolean;
  bio: string | null;
  phone: string | null;
  createdAt: string;
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: SupabaseUser | null;
  supabase: ReturnType<typeof createClient>;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const supabase = createClient(opts.req, opts.res);
  
  let user: SupabaseUser | null = null;

  try {
    // Get current session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session?.user && !error) {
      // Fetch user data from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single<Database['public']['Tables']['users']['Row']>();

      if (userData && !userError) {
        // Map database user to context user
        user = {
          id: userData.id,
          tenantId: userData.tenant_id,
          email: userData.email || '',
          name: userData.name || '',
          avatar: userData.avatar,
          role: userData.role,
          adminRole: userData.admin_role as any,
          userType: userData.membership_type as 'resident' | 'domiciled' | 'landowner',
          verificationStatus: userData.verification_status,
          onboardingCompleted: userData.onboarding_completed || false,
          onboardingStep: userData.onboarding_step || 0,
          committeeRole: userData.committee_role,
          isInBoard: userData.is_in_board || false,
          isInCouncil: userData.is_in_council || false,
          bio: userData.bio,
          phone: userData.phone,
          createdAt: userData.created_at || new Date().toISOString(),
        };
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures
    console.error('Auth error:', error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    supabase,
  };
}

