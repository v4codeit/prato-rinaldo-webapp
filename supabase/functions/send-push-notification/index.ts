import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// =====================================================
// TYPES
// =====================================================

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

interface SendResult {
  success: boolean;
  error?: string;
  expired?: boolean;
}

// =====================================================
// WEB PUSH IMPLEMENTATION (Pure Deno, no external libs)
// Based on Web Push Protocol: https://tools.ietf.org/html/rfc8291
// =====================================================

// Base64URL encoding/decoding
function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate VAPID JWT token
async function generateVapidJwt(
  audience: string,
  subject: string,
  publicKey: string,
  privateKey: string,
  expiration: number
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: expiration,
    sub: subject,
  };

  const headerB64 = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const payloadB64 = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key for signing
  const privateKeyBytes = base64UrlDecode(privateKey);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  return `${unsignedToken}.${signatureB64}`;
}

// Encrypt payload using ECDH + AES-GCM (Web Push encryption)
async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authKey: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; publicKey: Uint8Array }> {
  // Generate ephemeral key pair
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // Import subscriber's public key
  const subscriberPubKeyRaw = base64UrlDecode(p256dhKey);
  const subscriberPubKey = await crypto.subtle.importKey(
    "raw",
    subscriberPubKeyRaw,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPubKey },
    keyPair.privateKey,
    256
  );

  // Get auth secret
  const authSecret = base64UrlDecode(authKey);

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Export ephemeral public key
  const localPubKeyRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const localPubKeyBytes = new Uint8Array(localPubKeyRaw);

  // Derive encryption key using HKDF
  const sharedSecretKey = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  // Create info for HKDF
  const encoder = new TextEncoder();
  const info = new Uint8Array([
    ...encoder.encode("Content-Encoding: aes128gcm\0"),
  ]);

  // Derive key material
  const keyMaterial = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: authSecret,
      info: info,
    },
    sharedSecretKey,
    128 + 96 // key + nonce bits
  );

  const keyMaterialBytes = new Uint8Array(keyMaterial);
  const contentEncryptionKey = keyMaterialBytes.slice(0, 16);
  const nonce = keyMaterialBytes.slice(16, 28);

  // Import AES key
  const aesKey = await crypto.subtle.importKey(
    "raw",
    contentEncryptionKey,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Add padding to payload
  const payloadBytes = encoder.encode(payload);
  const paddingLength = Math.max(0, 3052 - payloadBytes.length);
  const paddedPayload = new Uint8Array(2 + payloadBytes.length + paddingLength);
  paddedPayload[0] = (paddingLength >> 8) & 0xff;
  paddedPayload[1] = paddingLength & 0xff;
  paddedPayload.set(payloadBytes, 2);

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    aesKey,
    paddedPayload
  );

  return {
    ciphertext: new Uint8Array(ciphertext),
    salt,
    publicKey: localPubKeyBytes,
  };
}

// Send push notification to a single subscription
async function sendPushNotification(
  subscription: PushSubscription,
  notification: NotificationData,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<SendResult> {
  try {
    const payload = JSON.stringify(notification);
    const endpoint = new URL(subscription.endpoint);
    const audience = `${endpoint.protocol}//${endpoint.host}`;
    const expiration = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour

    // Generate VAPID JWT
    const jwt = await generateVapidJwt(
      audience,
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey,
      expiration
    );

    // Encrypt payload
    const encrypted = await encryptPayload(
      payload,
      subscription.p256dh_key,
      subscription.auth_key
    );

    // Build request body with aes128gcm encoding
    const recordSize = 4096;
    const body = new Uint8Array(
      21 + encrypted.publicKey.length + encrypted.ciphertext.length
    );
    body.set(encrypted.salt, 0);
    body[16] = (recordSize >> 24) & 0xff;
    body[17] = (recordSize >> 16) & 0xff;
    body[18] = (recordSize >> 8) & 0xff;
    body[19] = recordSize & 0xff;
    body[20] = encrypted.publicKey.length;
    body.set(encrypted.publicKey, 21);
    body.set(encrypted.ciphertext, 21 + encrypted.publicKey.length);

    // Send to push service
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL": "3600",
        "Urgency": "normal",
      },
      body,
    });

    if (response.ok || response.status === 201) {
      return { success: true };
    }

    // Handle errors
    if (response.status === 404 || response.status === 410) {
      // Subscription expired or invalid
      return { success: false, expired: true, error: "Subscription expired" };
    }

    const errorText = await response.text();
    return {
      success: false,
      error: `HTTP ${response.status}: ${errorText}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Push] Error sending notification:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:noreply@pratorinaldo.it";
    const appUrl = Deno.env.get("APP_URL") || "https://pratorinaldo.it";

    if (!supabaseUrl || !supabaseKey) {
      console.error("[Push] Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("[Push] Missing VAPID keys");
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse webhook payload
    const webhookData: WebhookPayload = await req.json();
    const { type, table, record } = webhookData;

    console.log(`[Push] Received webhook: ${type} on ${table}`);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    let notificationsSent = 0;
    let subscriptionsExpired = 0;
    let errors: string[] = [];

    // =====================================================
    // HANDLE TOPIC_MESSAGES INSERT
    // =====================================================
    if (table === "topic_messages" && type === "INSERT") {
      const message = record;
      const topicId = message.topic_id as string;
      const authorId = message.author_id as string;
      const content = message.content as string;
      const messageType = message.message_type as string;

      // Skip system messages
      if (messageType === "system" || !authorId) {
        return new Response(
          JSON.stringify({ message: "System message, skipping", sent: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get topic info
      const { data: topic, error: topicError } = await supabase
        .from("topics")
        .select("id, name, slug, tenant_id")
        .eq("id", topicId)
        .single();

      if (topicError || !topic) {
        console.error("[Push] Topic not found:", topicError);
        return new Response(
          JSON.stringify({ message: "Topic not found", sent: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get author name
      const { data: author } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", authorId)
        .single();

      const authorName = author?.name || author?.email?.split("@")[0] || "Qualcuno";

      // Get topic members to notify (excluding author, non-muted)
      const { data: members, error: membersError } = await supabase
        .from("topic_members")
        .select("user_id")
        .eq("topic_id", topicId)
        .eq("is_muted", false)
        .neq("user_id", authorId);

      if (membersError || !members || members.length === 0) {
        return new Response(
          JSON.stringify({ message: "No members to notify", sent: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userIds = members.map((m) => m.user_id);

      // Filter users by notification preferences
      const usersToNotify: string[] = [];
      for (const userId of userIds) {
        const { data: shouldSend } = await supabase.rpc("should_send_push", {
          p_user_id: userId,
          p_notification_type: "message",
        });
        if (shouldSend !== false) {
          usersToNotify.push(userId);
        }
      }

      if (usersToNotify.length === 0) {
        return new Response(
          JSON.stringify({ message: "All users have push disabled", sent: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get push subscriptions for these users
      const { data: subscriptions, error: subsError } = await supabase
        .from("push_subscriptions")
        .select("id, user_id, endpoint, p256dh_key, auth_key")
        .in("user_id", usersToNotify)
        .eq("is_active", true)
        .lt("failed_count", 3);

      if (subsError || !subscriptions || subscriptions.length === 0) {
        return new Response(
          JSON.stringify({ message: "No active subscriptions", sent: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prepare notification
      const truncatedContent = content.length > 100 ? content.substring(0, 100) + "..." : content;
      const notification: NotificationData = {
        title: topic.name,
        body: `${authorName}: ${truncatedContent}`,
        icon: `${appUrl}/icons/icon-192x192.png`,
        badge: `${appUrl}/icons/icon-72x72.png`,
        url: `${appUrl}/community/${topic.slug}`,
        tag: `topic-${topicId}`,
        data: {
          topicId,
          messageId: message.id as string,
          type: "message",
        },
      };

      // Send push to each subscription
      for (const sub of subscriptions) {
        const result = await sendPushNotification(
          sub,
          notification,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        );

        if (result.success) {
          notificationsSent++;
          // Mark subscription as used
          await supabase.rpc("mark_push_subscription_used", {
            p_subscription_id: sub.id,
          });
        } else if (result.expired) {
          subscriptionsExpired++;
          // Deactivate expired subscription
          await supabase
            .from("push_subscriptions")
            .update({ is_active: false })
            .eq("id", sub.id);
        } else {
          errors.push(result.error || "Unknown error");
          // Increment failed count
          await supabase.rpc("increment_push_failed_count", {
            p_subscription_id: sub.id,
          });
        }

        // Log notification (optional, for debugging)
        await supabase.from("push_notification_logs").insert({
          tenant_id: topic.tenant_id,
          user_id: sub.user_id,
          subscription_id: sub.id,
          notification_type: "message",
          title: notification.title,
          body: notification.body,
          url: notification.url,
          tag: notification.tag,
          status: result.success ? "sent" : result.expired ? "expired" : "failed",
          error_message: result.error,
          sent_at: result.success ? new Date().toISOString() : null,
        });
      }
    }

    // Return result
    return new Response(
      JSON.stringify({
        success: true,
        sent: notificationsSent,
        expired: subscriptionsExpired,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Push] Error processing webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Return 200 to prevent webhook retries
    return new Response(
      JSON.stringify({ error: "Internal error", message: errorMessage, sent: 0 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
});
