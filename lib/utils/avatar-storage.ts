import { createAdminClient } from '@/lib/supabase/server';

const AVATAR_BUCKET = 'avatars';
const FETCH_TIMEOUT_MS = 5000;
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

function getExtensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[contentType] || 'jpg';
}

/**
 * Checks if a URL is a Google default/placeholder avatar.
 */
function isGoogleDefaultAvatar(url: string): boolean {
  return url.includes('/a/default') || url.includes('=s0');
}

/**
 * Fetches an external avatar image (e.g. from Google OAuth) and uploads it
 * to Supabase Storage. Returns the public Supabase URL on success, null on failure.
 *
 * This eliminates direct browser requests to external CDNs (e.g. lh3.googleusercontent.com)
 * which can trigger HTTP 429 rate limiting in production with multiple concurrent users.
 */
export async function copyExternalAvatarToStorage(
  externalUrl: string,
  userId: string
): Promise<string | null> {
  try {
    if (isGoogleDefaultAvatar(externalUrl)) {
      return null;
    }

    // Request larger size from Google (256px instead of default 96px)
    let fetchUrl = externalUrl;
    if (externalUrl.includes('lh3.googleusercontent.com')) {
      fetchUrl = externalUrl.replace(/=s\d+-c/, '=s256-c');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: { Accept: 'image/*' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(
        `[avatar-storage] Fetch failed: ${response.status} for user ${userId}`
      );
      return null;
    }

    const contentType =
      response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      console.error(
        `[avatar-storage] Invalid content type: ${contentType} for user ${userId}`
      );
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileExtension = getExtensionFromContentType(contentType);
    const filePath = `${userId}/avatar.${fileExtension}`;

    const adminSupabase = createAdminClient();
    const { error: uploadError } = await adminSupabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType,
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      console.error(
        `[avatar-storage] Upload failed for user ${userId}:`,
        uploadError
      );
      return null;
    }

    const {
      data: { publicUrl },
    } = adminSupabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(
        `[avatar-storage] Timeout fetching avatar for user ${userId}`
      );
    } else {
      console.error(
        `[avatar-storage] Unexpected error for user ${userId}:`,
        error
      );
    }
    return null;
  }
}
