import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ConversationContent } from './conversation-content';

interface ConversationPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

/**
 * Chat Thread Page
 *
 * Single conversation view with messages and input form.
 *
 * Features:
 * - Header with item info and back button
 * - Scrollable message list (auto-scrolls to bottom)
 * - Message input form
 * - Real-time updates (via revalidation)
 * - Mark as read on load
 * - Status indicators (closed conversations)
 */

export async function generateMetadata({ params }: ConversationPageProps) {
  // Static metadata - dynamic metadata would require cookies() which causes PPR issues
  return {
    title: 'Conversazione',
    description: 'Messaggi del marketplace',
  };
}

function ConversationSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
            <div className="h-12 w-12 rounded-md bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } = await params;

  return (
    <Suspense fallback={<ConversationSkeleton />}>
      <ConversationContent conversationId={conversationId} />
    </Suspense>
  );
}
