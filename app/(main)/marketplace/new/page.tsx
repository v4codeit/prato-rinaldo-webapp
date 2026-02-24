import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/utils/constants';

/**
 * @deprecated This page redirects to the new /mercatino/new route.
 * The marketplace has been renamed to mercatino.
 */
export default function NewMarketplacePage() {
  redirect(`${ROUTES.MERCATINO}/new`);
}
