import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as webpush from "jsr:@negrel/webpush";

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
// WEB PUSH using @negrel/webpush (RFC 8291 compliant)
// =====================================================

// Cache application server instance to avoid re-initialization
let appServer: webpush.ApplicationServer | null = null;

async function getApplicationServer(): Promise<webpush.ApplicationServer> {
  if (appServer) return appServer;

  const vapidKeysJson = Deno.env.get("VAPID_KEYS_JWK");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:noreply@pratorinaldo.it";

  if (!vapidKeysJson) {
    throw new Error("VAPID_KEYS_JWK not configured");
  }

  let vapidKeysData;
  try {
    vapidKeysData = JSON.parse(vapidKeysJson);
  } catch (e) {
    throw new Error(`Invalid VAPID_KEYS_JWK JSON: ${e}`);
  }

  console.log("[Push] Importing VAPID keys...");
  const vapidKeys = await webpush.importVapidKeys(vapidKeysData);

  console.log("[Push] Creating ApplicationServer...");
  appServer = await webpush.ApplicationServer.new({
    contactInformation: vapidSubject,
    vapidKeys,
  });

  console.log("[Push] ApplicationServer ready");
  return appServer;
}

// Send push notification to a single subscription
async function sendPushNotification(
  subscription: PushSubscription,
  notification: NotificationData
): Promise<SendResult> {
  try {
    const server = await getApplicationServer();

    // Create PushSubscription object for the library
    const pushSub: webpush.PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh_key,
        auth: subscription.auth_key,
      },
    };

    // Get subscriber from server
    const subscriber = server.subscribe(pushSub);

    // Send encrypted message
    const payload = JSON.stringify(notification);
    console.log(`[Push] Sending to endpoint: ${subscription.endpoint.substring(0, 50)}...`);

    const response = await subscriber.pushTextMessage(payload, {});

    console.log(`[Push] Response status: ${response.status}`);

    if (response.ok || response.status === 201) {
      return { success: true };
    }

    // Handle subscription expired/invalid
    if (response.status === 404 || response.status === 410) {
      return { success: false, expired: true, error: "Subscription expired" };
    }

    const errorText = await response.text();
    console.error(`[Push] Error response: ${errorText}`);
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
    const vapidKeysJson = Deno.env.get("VAPID_KEYS_JWK");
    const appUrl = Deno.env.get("APP_URL") || "https://pratorinaldo.it";

    if (!supabaseUrl || !supabaseKey) {
      console.error("[Push] Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vapidKeysJson) {
      console.error("[Push] Missing VAPID_KEYS_JWK");
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
        console.log(`[Push] Skipping: messageType=${messageType}, authorId=${authorId}`);
        return new Response(
          JSON.stringify({ message: "System message, skipping", sent: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Push] Processing message in topic ${topicId} from author ${authorId}`);

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
        console.log(`[Push] No members to notify for topic ${topicId}:`, membersError?.message || "no members found");
        return new Response(
          JSON.stringify({ message: "No members to notify", sent: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userIds = members.map((m) => m.user_id);
      console.log(`[Push] Found ${userIds.length} members to check: ${userIds.join(", ")}`);

      // Filter users by notification preferences
      const usersToNotify: string[] = [];
      for (const userId of userIds) {
        const { data: shouldSend, error: rpcError } = await supabase.rpc("should_send_push", {
          p_user_id: userId,
          p_notification_type: "message",
        });
        if (rpcError) {
          console.error(`[Push] RPC should_send_push failed for user ${userId}:`, rpcError.message);
          // Default to true if RPC fails (send notification)
          usersToNotify.push(userId);
          continue;
        }
        if (shouldSend !== false) {
          usersToNotify.push(userId);
        }
      }

      console.log(`[Push] ${usersToNotify.length}/${userIds.length} users have push enabled`);

      if (usersToNotify.length === 0) {
        console.log(`[Push] All ${userIds.length} users have push notifications disabled`);
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
        console.log(`[Push] No active subscriptions for ${usersToNotify.length} users:`, subsError?.message || "none found");
        return new Response(
          JSON.stringify({ message: "No active subscriptions", sent: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Push] Found ${subscriptions.length} active subscriptions, sending notifications...`);

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
        const result = await sendPushNotification(sub, notification);

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

        // Log notification
        const logStatus = result.success ? "sent" : result.expired ? "expired" : "failed";
        console.log(`[Push] Notification to ${sub.user_id}: ${logStatus}${result.error ? ` - ${result.error}` : ""}`);

        await supabase.from("push_notification_logs").insert({
          tenant_id: topic.tenant_id,
          user_id: sub.user_id,
          subscription_id: sub.id,
          notification_type: "message",
          title: notification.title,
          body: notification.body,
          url: notification.url,
          tag: notification.tag,
          status: logStatus,
          error_message: result.error,
          sent_at: result.success ? new Date().toISOString() : null,
        });
      }

      console.log(`[Push] Complete: sent=${notificationsSent}, expired=${subscriptionsExpired}, errors=${errors.length}`);
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
