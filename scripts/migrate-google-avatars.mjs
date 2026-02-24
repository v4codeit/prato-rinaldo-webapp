/**
 * One-time migration script: Copy Google CDN avatar URLs to Supabase Storage.
 *
 * This fixes HTTP 429 (Too Many Requests) from lh3.googleusercontent.com
 * in production by storing avatars locally in Supabase Storage.
 *
 * Usage:
 *   node scripts/migrate-google-avatars.mjs
 *
 * Required environment variables (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Options:
 *   DRY_RUN=1 node scripts/migrate-google-avatars.mjs   # Preview only, no changes
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local may not exist if env vars are set directly
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN === '1';
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 500;
const FETCH_TIMEOUT_MS = 5000;
const AVATAR_BUCKET = 'avatars';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

function getExtensionFromContentType(contentType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[contentType] || 'jpg';
}

function isGoogleDefaultAvatar(url) {
  return url.includes('/a/default') || url.includes('=s0');
}

async function copyAvatarToStorage(externalUrl, userId) {
  if (isGoogleDefaultAvatar(externalUrl)) {
    return { status: 'skipped', reason: 'default avatar' };
  }

  let fetchUrl = externalUrl;
  if (externalUrl.includes('lh3.googleusercontent.com')) {
    fetchUrl = externalUrl.replace(/=s\d+-c/, '=s256-c');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: { Accept: 'image/*' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { status: 'failed', reason: `HTTP ${response.status}` };
    }

    const contentType =
      response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return { status: 'failed', reason: `Invalid content type: ${contentType}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    const ext = getExtensionFromContentType(contentType);
    const filePath = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType,
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      return { status: 'failed', reason: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

    return { status: 'success', publicUrl };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      return { status: 'failed', reason: 'timeout' };
    }
    return { status: 'failed', reason: error.message };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(
    DRY_RUN
      ? '=== DRY RUN MODE (no changes will be made) ==='
      : '=== MIGRATING Google avatars to Supabase Storage ==='
  );

  // Fetch all users with Google CDN avatar URLs
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, avatar')
    .like('avatar', '%lh3.googleusercontent.com%');

  if (error) {
    console.error('Failed to fetch users:', error);
    process.exit(1);
  }

  console.log(`Found ${users.length} users with Google CDN avatar URLs\n`);

  if (users.length === 0) {
    console.log('Nothing to migrate!');
    return;
  }

  const results = { success: 0, failed: 0, skipped: 0 };
  const failures = [];

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(users.length / BATCH_SIZE);

    console.log(`--- Batch ${batchNum}/${totalBatches} ---`);

    for (const user of batch) {
      const label = `  [${user.id.slice(0, 8)}] ${user.name || '(no name)'}`;

      if (DRY_RUN) {
        console.log(`${label} -> would migrate: ${user.avatar.slice(0, 60)}...`);
        results.skipped++;
        continue;
      }

      const result = await copyAvatarToStorage(user.avatar, user.id);

      if (result.status === 'success') {
        // Update the user's avatar URL to the Supabase Storage URL
        const { error: updateError } = await supabase
          .from('users')
          .update({ avatar: result.publicUrl })
          .eq('id', user.id);

        if (updateError) {
          console.log(`${label} -> upload OK but DB update failed: ${updateError.message}`);
          results.failed++;
          failures.push({ id: user.id, name: user.name, reason: `DB update: ${updateError.message}` });
        } else {
          console.log(`${label} -> migrated OK`);
          results.success++;
        }
      } else if (result.status === 'skipped') {
        console.log(`${label} -> skipped (${result.reason})`);
        results.skipped++;
      } else {
        console.log(`${label} -> FAILED: ${result.reason}`);
        results.failed++;
        failures.push({ id: user.id, name: user.name, reason: result.reason });
      }
    }

    // Delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < users.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log('\n=== MIGRATION COMPLETE ===');
  console.log(`  Success: ${results.success}`);
  console.log(`  Failed:  ${results.failed}`);
  console.log(`  Skipped: ${results.skipped}`);
  console.log(`  Total:   ${users.length}`);

  if (failures.length > 0) {
    console.log('\nFailed users (need manual review):');
    for (const f of failures) {
      console.log(`  - ${f.id} (${f.name}): ${f.reason}`);
    }
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
