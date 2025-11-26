import { connection } from 'next/server';
import { getCachedUserAuth } from '@/lib/auth/cached-user';
import { getTenantSocialLinks } from '@/app/actions/tenant-settings';
import { Header } from '@/components/organisms/header/header';
import { ConditionalFooter } from '@/components/organisms/footer/conditional-footer';
import { PrivateLayoutClient } from './private-layout-client';

/**
 * PrivateLayoutContent - Async Server Component for user fetching
 *
 * Uses connection() to force dynamic rendering at request time.
 * This ensures cookies() is called with a valid request context.
 *
 * Pattern: Layout (sync) → Suspense → LayoutContent (async + dynamic) → Children
 */
export async function PrivateLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  // Force dynamic rendering - excludes this component from prerendering
  await connection();

  // Fetch user + profile using cached function (inside Suspense, safe!)
  const user = await getCachedUserAuth();

  // Fetch tenant social links (inside Suspense, safe!)
  const socialLinksData = await getTenantSocialLinks();
  const socialLinks = {
    facebook: socialLinksData.facebook,
    instagram: socialLinksData.instagram,
    twitter: socialLinksData.twitter,
  };

  // Map to Header-compatible format
  const userWithVerification = user ? {
    id: user.id,
    name: user.user_metadata?.name || user.email,
    email: user.email,
    avatar: user.avatar,
    verification_status: user.verification_status,
    role: user.role,
  } : null;

  return (
    <>
      <Header user={userWithVerification} />
      <PrivateLayoutClient user={userWithVerification}>
        {children}
      </PrivateLayoutClient>
      <ConditionalFooter socialLinks={socialLinks} />
    </>
  );
}
