import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/utils/constants';

/**
 * @deprecated This page redirects to the new /mercatino/[id] route.
 * The marketplace has been renamed to mercatino.
 */
export default async function MarketplaceItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;

  // Preserve returnTo parameter if it exists
  const returnToParam = search.returnTo ? `?returnTo=${encodeURIComponent(search.returnTo)}` : '';
  redirect(`${ROUTES.MERCATINO}/${id}${returnToParam}`);
}
