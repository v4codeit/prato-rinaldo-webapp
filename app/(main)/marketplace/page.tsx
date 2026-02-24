import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/utils/constants';

/**
 * @deprecated This page redirects to the new /mercatino route.
 * The marketplace has been renamed to mercatino.
 */
export default function MarketplacePage() {
  redirect(ROUTES.MERCATINO);
}
