import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '../../../../lib/supabase/client';

export default function VerifyEmail() {
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResendEmail = async () => {
    try {
      setResending(true);
      setMessage(null);

      // Ottieni l'email dell'utente dalla sessione
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('Email utente non trovata');
      }

      // Reinvia l'email di verifica
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Email di verifica inviata! Controlla la tua casella di posta.',
      });
    } catch (error: any) {
      console.error('Resend email error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Errore durante l\'invio dell\'email. Riprova.',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Prato Rinaldo</h1>
          <p className="mt-2 text-sm text-gray-600">
            Piattaforma Comitato Cittadini
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verifica la tua email</CardTitle>
            <CardDescription>
              Abbiamo inviato un link di verifica al tuo indirizzo email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 text-blue-900 border-blue-200">
              <AlertDescription>
                <p className="font-medium mb-2">📧 Controlla la tua casella di posta</p>
                <p className="text-sm">
                  Ti abbiamo inviato un'email con un link per verificare il tuo account.
                  Clicca sul link nell'email per completare la registrazione.
                </p>
              </AlertDescription>
            </Alert>

            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}
                     className={message.type === 'success' ? 'bg-green-50 text-green-900 border-green-200' : ''}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Non hai ricevuto l'email?
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Controlla la cartella spam o posta indesiderata</li>
                <li>Verifica che l'indirizzo email sia corretto</li>
                <li>Attendi qualche minuto e riprova</li>
              </ul>
            </div>

            <Button
              onClick={handleResendEmail}
              disabled={resending}
              variant="outline"
              className="w-full"
            >
              {resending ? 'Invio in corso...' : 'Invia di nuovo l\'email'}
            </Button>

            <div className="text-center pt-4">
              <a href="/login" className="text-sm text-primary hover:underline">
                Torna al login
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

