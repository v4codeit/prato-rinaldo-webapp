import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { createAdminClient } from "../../lib/supabase/server";

/**
 * OAuth Routes - Migrated to Supabase
 * Handles OAuth callback and user creation in Supabase
 */

const DEFAULT_TENANT_ID = "prato-rinaldo-default";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function getOrCreateDefaultTenant(): Promise<string> {
  const supabase = createAdminClient();
  
  try {
    // Check if default tenant exists
    const { data: existing, error: selectError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', DEFAULT_TENANT_ID)
      .single();
    
    if (existing && !selectError) {
      return existing.id;
    }
    
    // Create default tenant
    const { error: insertError } = await supabase
      .from('tenants')
      .insert({
        id: DEFAULT_TENANT_ID,
        name: 'Comitato Prato Rinaldo',
        slug: 'prato-rinaldo',
        description: 'Comitato cittadini di Prato Rinaldo - San Cesareo e Zagarolo',
        subscription_status: 'active',
        subscription_type: 'annual',
      });
    
    if (insertError) {
      console.error('[Tenant] Error creating default tenant:', insertError);
    } else {
      console.log('[Tenant] Default tenant created:', DEFAULT_TENANT_ID);
    }
    
    return DEFAULT_TENANT_ID;
  } catch (error) {
    console.error('[Tenant] Error managing default tenant:', error);
    return DEFAULT_TENANT_ID;
  }
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      // Exchange code for token with Manus OAuth
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      const tenantId = await getOrCreateDefaultTenant();
      const supabase = createAdminClient();

      // Check if user already exists in Supabase
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userInfo.openId)
        .single();

      if (!existingUser) {
        // Create user in Supabase Auth (if using email)
        if (userInfo.email) {
          const { error: authError } = await supabase.auth.admin.createUser({
            email: userInfo.email,
            email_confirm: true,
            user_metadata: {
              name: userInfo.name,
              openId: userInfo.openId,
              loginMethod: userInfo.loginMethod ?? userInfo.platform,
            },
          });

          if (authError) {
            console.warn('[OAuth] Failed to create Supabase auth user:', authError);
            // Continue anyway - we'll create the user in the users table
          }
        }

        // Insert user into users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userInfo.openId,
            tenant_id: tenantId,
            name: userInfo.name || null,
            email: userInfo.email || null,
            login_method: userInfo.loginMethod ?? userInfo.platform ?? null,
            last_signed_in: new Date().toISOString(),
            role: 'user',
            verification_status: 'pending',
            onboarding_completed: false,
            onboarding_step: 0,
          });

        if (insertError) {
          console.error('[OAuth] Failed to insert user:', insertError);
          throw new Error('Failed to create user in database');
        }

        console.log('[OAuth] New user created:', userInfo.openId);
      } else {
        // Update last signed in
        const { error: updateError } = await supabase
          .from('users')
          .update({
            last_signed_in: new Date().toISOString(),
            name: userInfo.name || null,
            email: userInfo.email || null,
          })
          .eq('id', userInfo.openId);

        if (updateError) {
          console.warn('[OAuth] Failed to update user:', updateError);
        }

        console.log('[OAuth] Existing user signed in:', userInfo.openId);
      }

      // Create Manus session token (for compatibility)
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { 
        ...cookieOptions, 
        maxAge: ONE_YEAR_MS 
      });

      // Redirect to onboarding if not completed, otherwise to home
      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', userInfo.openId)
        .single();

      const redirectUrl = userData?.onboarding_completed ? '/' : '/onboarding';
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

