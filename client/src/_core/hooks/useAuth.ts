import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

/**
 * Legacy hook for backward compatibility.
 * Now wraps useSupabaseAuth instead of using tRPC.
 * 
 * @deprecated Use useSupabaseAuth directly for new code
 */
export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};

  const { user, loading, signOut } = useSupabaseAuth();

  const state = useMemo(() => {
    // Maintain localStorage for backward compatibility
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(user)
    );
    
    return {
      user: user ?? null,
      loading,
      error: null, // Supabase errors are handled in useSupabaseAuth
      isAuthenticated: Boolean(user),
    };
  }, [user, loading]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    loading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => {
      // Trigger a page reload to refresh Supabase session
      window.location.reload();
    },
    logout: signOut,
  };
}
