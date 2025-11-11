'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './footer';

type SocialLinks = {
  facebook: string;
  instagram: string;
  twitter: string;
};

/**
 * Conditional Footer Wrapper
 *
 * Visibility rules:
 * - Homepage (pathname === '/'): Always visible (mobile + desktop)
 * - Other pages: Visible only on desktop (hidden on mobile)
 *
 * This ensures footer is only shown on mobile when on homepage,
 * while keeping it visible on desktop for all pages.
 */
export function ConditionalFooter({ socialLinks }: { socialLinks: SocialLinks }) {
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  return (
    <div className={isHomepage ? "block" : "hidden md:block"}>
      <Footer socialLinks={socialLinks} />
    </div>
  );
}
