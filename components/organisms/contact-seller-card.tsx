'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getOrCreateConversation, sendMessage } from '@/app/actions/conversations';
import { toast } from 'sonner';

interface ContactSellerCardProps {
  marketplaceItemId: string;
  sellerId: string;
  sellerName: string;
  currentUserId?: string;
}

/**
 * ContactSellerCard Component
 *
 * Displays a card with "Contatta Venditore" button that opens a dialog
 * for sending the first message. Creates conversation and redirects to chat.
 *
 * Features:
 * - Dialog modal with message form
 * - Character counter (max 2000)
 * - Loading states
 * - Error handling
 * - Hides button if user is the seller
 *
 * @example
 * <ContactSellerCard
 *   marketplaceItemId="uuid"
 *   sellerId="uuid"
 *   sellerName="Mario Rossi"
 *   currentUserId="uuid"
 * />
 */
export function ContactSellerCard({
  marketplaceItemId,
  sellerId,
  sellerName,
  currentUserId,
}: ContactSellerCardProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Hide button if current user is the seller
  if (currentUserId === sellerId) {
    return null;
  }

  // Don't show if user is not logged in
  if (!currentUserId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contatta il Venditore</CardTitle>
          <CardDescription>
            Hai domande su questo prodotto? Effettua l&apos;accesso per contattare il venditore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => router.push('/login')}
          >
            <Mail className="mr-2 h-4 w-4" />
            Accedi per Contattare
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Scrivi un messaggio prima di inviare');
      return;
    }

    if (message.length > 2000) {
      toast.error('Il messaggio è troppo lungo (max 2000 caratteri)');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Get or create conversation
      const conversationResult = await getOrCreateConversation(marketplaceItemId);

      if (conversationResult.error || !conversationResult.data) {
        toast.error(conversationResult.error || 'Errore nella creazione della conversazione');
        setIsLoading(false);
        return;
      }

      const conversationId = conversationResult.data.id;

      // Step 2: Send the first message
      const messageResult = await sendMessage(conversationId, message);

      if (messageResult.error || !messageResult.data) {
        toast.error(messageResult.error || 'Errore nell\'invio del messaggio');
        setIsLoading(false);
        return;
      }

      // Step 3: Success - redirect to conversation
      toast.success('Messaggio inviato con successo!');
      setOpen(false);
      setMessage('');
      router.push(`/messages/${conversationId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Errore imprevisto. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const characterCount = message.length;
  const isOverLimit = characterCount > 2000;
  const isNearLimit = characterCount > 1800;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contatta il Venditore</CardTitle>
        <CardDescription>
          Hai domande su questo prodotto? Invia un messaggio a {sellerName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Contatta Venditore
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Invia un messaggio</DialogTitle>
              <DialogDescription>
                Scrivi un messaggio a {sellerName}. Riceverai risposta nella sezione Messaggi.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Il tuo messaggio</Label>
                  <Textarea
                    id="message"
                    placeholder="Es: Ciao! Sono interessato a questo prodotto. È ancora disponibile?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[120px] resize-none"
                    disabled={isLoading}
                    maxLength={2100} // Allow typing a bit over to show error
                    aria-describedby="char-count"
                  />
                  <p
                    id="char-count"
                    className={`text-xs text-right ${
                      isOverLimit
                        ? 'text-destructive font-medium'
                        : isNearLimit
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {characterCount}/2000 caratteri
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    setMessage('');
                  }}
                  disabled={isLoading}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !message.trim() || isOverLimit}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Invio...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Invia Messaggio
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
