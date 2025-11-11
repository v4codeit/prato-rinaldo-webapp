import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, Inbox } from 'lucide-react';
import { requireVerifiedResident } from '@/lib/auth/dal';
import { getMyConversations } from '@/app/actions/conversations';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { getShortName } from '@/lib/utils/format';
import { it } from 'date-fns/locale';

/**
 * Messages Inbox Page
 *
 * Displays all user's conversations (as buyer or seller).
 * Shows item thumbnail, participant name, last message preview, and unread count.
 *
 * Features:
 * - Server-side rendered list
 * - Empty state
 * - Unread badges
 * - Relative timestamps
 * - Responsive grid
 * - Click to navigate to conversation
 */

export const metadata = {
  title: 'Messaggi - Community Prato Rinaldo',
  description: 'Visualizza le tue conversazioni del marketplace',
};

export default async function MessagesPage() {
  // Require verified resident (redirects if not authenticated/verified)
  await requireVerifiedResident();

  // Fetch conversations
  const { data: conversations, error } = await getMyConversations();

  if (error) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Messaggi</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Errore nel caricamento delle conversazioni. Riprova più tardi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Messaggi</h1>
      </div>

      {/* Conversations List */}
      {!conversations || conversations.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Empty State Component
 * Shown when user has no conversations
 */
function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-muted">
          <Inbox className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Nessun messaggio</h3>
          <p className="text-muted-foreground max-w-md">
            Non hai ancora conversazioni. Inizia a chattare con i venditori
            del marketplace per fare domande sui loro prodotti.
          </p>
        </div>
        <Link href="/marketplace">
          <button className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Esplora Marketplace
          </button>
        </Link>
      </div>
    </Card>
  );
}

/**
 * Conversation Card Component
 * Shows single conversation preview in the list
 */
interface ConversationCardProps {
  conversation: {
    id: string;
    marketplace_item: {
      id: string;
      title: string;
      price: number;
      images: string[];
    };
    other_participant: {
      id: string;
      name: string;
      avatar: string | null;
    };
    last_message_at: string;
    last_message_preview: string;
    unread_count: number;
    status: string;
  };
}

function ConversationCard({ conversation }: ConversationCardProps) {
  const {
    id,
    marketplace_item,
    other_participant,
    last_message_at,
    last_message_preview,
    unread_count,
    status,
  } = conversation;

  // Format timestamp
  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(last_message_at), {
        addSuffix: true,
        locale: it,
      });
    } catch (error) {
      return 'recentemente';
    }
  }, [last_message_at]);

  // Get first image or use placeholder
  const itemImage = marketplace_item.images?.[0] || '/placeholder-image.png';

  return (
    <Link href={`/messages/${id}` as any}>
      <Card
        className={cn(
          'p-4 hover:bg-accent transition-colors cursor-pointer',
          unread_count > 0 && 'border-primary/50 bg-primary/5'
        )}
      >
        <div className="flex items-center gap-4">
          {/* Item Image */}
          <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
            <Image
              src={itemImage}
              alt={marketplace_item.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title and Badge Row */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm line-clamp-1">
                {marketplace_item.title}
              </h3>
              {unread_count > 0 && (
                <Badge
                  variant="default"
                  className="flex-shrink-0 h-5 min-w-[20px] px-1.5"
                >
                  {unread_count > 99 ? '99+' : unread_count}
                </Badge>
              )}
            </div>

            {/* Participant Name */}
            <p className="text-sm text-muted-foreground mb-1">
              {getShortName(other_participant.name)}
            </p>

            {/* Last Message Preview */}
            <p
              className={cn(
                'text-sm line-clamp-1',
                unread_count > 0
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {last_message_preview || 'Nessun messaggio'}
            </p>
          </div>

          {/* Timestamp and Status */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {timeAgo}
            </span>
            {status === 'closed' && (
              <Badge variant="secondary" className="text-xs">
                Chiusa
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

/**
 * Loading Skeleton Component
 * Shown while conversations are loading
 */
export function ConversationSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-full" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    </Card>
  );
}
