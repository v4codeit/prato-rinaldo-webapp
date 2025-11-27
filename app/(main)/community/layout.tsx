import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Chat in tempo reale con la community di Prato Rinaldo',
};

/**
 * Community Layout
 * Simple wrapper for community pages
 */
export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
