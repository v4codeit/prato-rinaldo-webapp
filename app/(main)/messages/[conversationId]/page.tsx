import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { ArrowLeft, X, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  getConversationById,
  getConversationMessages,
  markConversationAsRead,
} from '@/app/actions/conversations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageBubble } from '@/components/molecules/message-bubble';
import { MessageInput } from './message-input';
import { getShortName } from '@/lib/utils/format';

interface ConversationPageProps {
  params: {
    conversationId: string;
  };
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
  const { conversationId } = params;

  const { data: conversation } = await getConversationById(conversationId);

  return {
    title: conversation
      ? `Chat: ${conversation.marketplace_item.title}`
      : 'Conversazione',
    description: 'Messaggi del marketplace',
  };
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } = params;

  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch conversation details
  const { data: conversation, error: convError } = await getConversationById(
    conversationId
  );

  if (convError || !conversation) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Conversazione non trovata</h2>
          <p className="text-muted-foreground mb-6">
            Questa conversazione non esiste o non hai i permessi per vederla.
          </p>
          <Link href="/messages">
            <Button>Torna ai Messaggi</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch messages
  const { data: messages, error: msgError } = await getConversationMessages(
    conversationId
  );

  if (msgError) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Errore nel caricamento dei messaggi. Riprova più tardi.
          </p>
        </div>
      </div>
    );
  }

  // Mark conversation as read
  await markConversationAsRead(conversationId);

  const {
    marketplace_item,
    other_participant,
    status,
    buyer_id,
    seller_id,
  } = conversation;

  const isBuyer = user.id === buyer_id;
  const isSeller = user.id === seller_id;
  const isClosed = status === 'closed';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header with Item Info */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-4 py-4">
            {/* Back Button */}
            <Link href="/messages">
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Torna ai messaggi</span>
              </Button>
            </Link>

            {/* Item Image */}
            <Link
              href={`/marketplace/${marketplace_item.id}`}
              className="flex-shrink-0"
            >
              <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                <Image
                  src={marketplace_item.images?.[0] || '/placeholder-image.png'}
                  alt={marketplace_item.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            </Link>

            {/* Item and Participant Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/marketplace/${marketplace_item.id}`}
                className="hover:underline"
              >
                <h2 className="font-semibold text-sm sm:text-base line-clamp-1">
                  {marketplace_item.title}
                </h2>
              </Link>
              <p className="text-sm text-muted-foreground">
                Chat con {getShortName(other_participant.name)}
              </p>
            </div>

            {/* Status Badge */}
            {isClosed && (
              <Badge variant="secondary" className="flex-shrink-0">
                <X className="h-3 w-3 mr-1" />
                Chiusa
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl py-6">
          {messages && messages.length > 0 ? (
            <div className="space-y-1">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  content={message.content}
                  senderName={message.sender.name}
                  senderAvatar={message.sender.avatar}
                  timestamp={message.created_at}
                  isMine={message.sender_id === user.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nessun messaggio ancora. Inizia la conversazione!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Message Input Form */}
      <div className="border-t bg-background">
        <div className="container max-w-4xl py-4">
          {isClosed ? (
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Questa conversazione è stata chiusa dal venditore.
                {isSeller && ' Puoi riaprirla se necessario.'}
              </p>
              {isSeller && (
                <form action={async () => {
                  'use server';
                  const { reopenConversation } = await import('@/app/actions/conversations');
                  await reopenConversation(conversationId);
                }}>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Riapri Conversazione
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <MessageInput
              conversationId={conversationId}
              disabled={isClosed}
            />
          )}
        </div>
      </div>
    </div>
  );
}
