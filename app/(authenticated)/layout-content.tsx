import { getCachedUserAuth } from '@/lib/auth/cached-user';
import { getTenantSocialLinks } from '@/app/actions/tenant-settings';
import { Header } from '@/components/organisms/header/header';
import { ConditionalFooter } from '@/components/organisms/footer/conditional-footer';
import { AuthenticatedLayoutClient } from './authenticated-layout-client';

/**
 * AuthenticatedLayoutContent - Async Server Component for user fetching
 *
 * This component is wrapped in Suspense by the parent layout.
 * It can safely call async functions that use cookies() because
 * it's inside a Suspense boundary, preventing "Uncached data" errors.
 *
 * Pattern: Layout (sync) → Suspense → LayoutContent (async) → Children
 */
export async function AuthenticatedLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <AuthenticatedLayoutClient user={userWithVerification}>
        {children}
      </AuthenticatedLayoutClient>
      <ConditionalFooter socialLinks={socialLinks} />
    </>
  );
}
