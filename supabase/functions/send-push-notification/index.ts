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
// NOTE: @negrel/webpush uses exception-based error handling
// pushTextMessage() returns void, errors are THROWN as PushMessageError
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

    // pushTextMessage() returns void, NOT Response!
    // Errors are thrown as exceptions, success = no exception
    await subscriber.pushTextMessage(payload, {});

    // If we reach here, the push was successful
    console.log(`[Push] Success!`);
    return { success: true };
  } catch (error) {
    // Handle PushMessageError from the library
    if (error && typeof error === "object" && "response" in error) {
      const pushError = error as { response?: Response; isGone?: boolean };

      // Subscription expired (410 Gone) - library may set isGone flag
      if (pushError.isGone) {
        console.log(`[Push] Subscription expired (isGone)`);
        return { success: false, expired: true, error: "Subscription expired" };
      }

      // Other HTTP errors
      const status = pushError.response?.status;
      if (status === 404 || status === 410) {
        console.log(`[Push] Subscription expired (HTTP ${status})`);
        return { success: false, expired: true, error: `HTTP ${status}` };
      }

      const errorText = await pushError.response?.text?.() || "Unknown HTTP error";
      console.error(`[Push] HTTP error: ${status} - ${errorText}`);
      return { success: false, error: `HTTP ${status}: ${errorText}` };
    }

    // Generic errors
    const errorMessage = error instanceof Error ? error.message : String(error);
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
      // Uses SECURITY DEFINER function to bypass RLS (service role has no auth.uid())
      const { data: members, error: membersError } = await supabase
        .rpc("get_topic_members_for_notification", {
          p_topic_id: topicId,
          p_exclude_user_id: authorId,
        });

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

    // =====================================================
    // HANDLE USER_NOTIFICATIONS INSERT
    // =====================================================
    else if (table === "user_notifications" && type === "INSERT") {
      const notificationRecord = record;
      const userId = notificationRecord.user_id as string;
      const title = notificationRecord.title as string;
      const message = notificationRecord.message as string;
      const notifType = notificationRecord.type as string;
      const actionUrl = notificationRecord.action_url as string;
      const relatedId = notificationRecord.related_id as string;

      console.log(`[Push] Processing user notification for user ${userId}: ${notifType}`);

      // Check if user has push enabled for this type
      const { data: shouldSend, error: rpcError } = await supabase.rpc("should_send_push", {
        p_user_id: userId,
        p_notification_type: notifType,
      });

      if (rpcError) {
        console.error(`[Push] RPC should_send_push failed for user ${userId}:`, rpcError.message);
      }

      if (shouldSend === false) {
        console.log(`[Push] User ${userId} has push disabled for type ${notifType}`);
        return new Response(
          JSON.stringify({ message: "Push disabled for user", sent: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get push subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from("push_subscriptions")
        .select("id, user_id, endpoint, p256dh_key, auth_key")
        .eq("user_id", userId)
        .eq("is_active", true)
        .lt("failed_count", 3);

      if (subsError || !subscriptions || subscriptions.length === 0) {
        console.log(`[Push] No active subscriptions for user ${userId}`);
        return new Response(
          JSON.stringify({ message: "No active subscriptions", sent: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Push] Found ${subscriptions.length} active subscriptions for user ${userId}`);

      // Prepare notification payload
      const pushPayload: NotificationData = {
        title: title,
        body: message || "Nuova notifica",
        icon: `${appUrl}/icons/icon-192x192.png`,
        badge: `${appUrl}/icons/icon-72x72.png`,
        url: actionUrl ? `${appUrl}${actionUrl}` : `${appUrl}/notifications`,
        tag: `notif-${notificationRecord.id}`,
        data: {
          notificationId: notificationRecord.id,
          type: notifType,
          relatedId: relatedId,
        },
      };

      // Send to all subscriptions
      for (const sub of subscriptions) {
        const result = await sendPushNotification(sub, pushPayload);

        if (result.success) {
          notificationsSent++;
          await supabase.rpc("mark_push_subscription_used", { p_subscription_id: sub.id });
        } else if (result.expired) {
          subscriptionsExpired++;
          await supabase.from("push_subscriptions").update({ is_active: false }).eq("id", sub.id);
        } else {
          errors.push(result.error || "Unknown error");
          await supabase.rpc("increment_push_failed_count", { p_subscription_id: sub.id });
        }

        // Log
        const logStatus = result.success ? "sent" : result.expired ? "expired" : "failed";
        await supabase.from("push_notification_logs").insert({
          tenant_id: notificationRecord.tenant_id,
          user_id: sub.user_id,
          subscription_id: sub.id,
          notification_type: notifType,
          title: pushPayload.title,
          body: pushPayload.body,
          url: pushPayload.url,
          tag: pushPayload.tag,
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
