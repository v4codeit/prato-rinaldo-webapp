import { Suspense } from 'react';
import { getEventById } from '@/app/actions/events';
import { EventContent } from './event-content';
import { EventSkeleton } from './event-skeleton';
import { ROUTES } from '@/lib/utils/constants';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event } = await getEventById(id);

  if (!event) {
    return {
      title: 'Evento non trovato',
    };
  }

  return {
    title: event.title,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      images: event.cover_image ? [event.cover_image] : [],
    },
  };
}

export default async function EventDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const returnTo = search.returnTo || ROUTES.EVENTS;

  return (
    <Suspense fallback={<EventSkeleton />}>
      <EventContent id={id} returnTo={returnTo} />
    </Suspense>
  );
}
