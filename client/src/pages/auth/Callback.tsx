import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '../../../../lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Callback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifica in corso...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Ottieni la sessione corrente
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error('Nessuna sessione trovata');
        }

        // Verifica se l'utente ha completato l'onboarding
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          // Non bloccare il flusso se non troviamo i dati utente
        }

        setStatus('success');
        setMessage('Verifica completata! Reindirizzamento...');

        // Redirect appropriato
        setTimeout(() => {
          if (userData && !userData.onboarding_completed) {
            setLocation('/onboarding');
          } else {
            setLocation('/');
          }
        }, 1500);

      } catch (error: any) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Errore durante la verifica. Riprova.');
        
        // Redirect al login dopo 3 secondi in caso di errore
        setTimeout(() => {
          setLocation('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [setLocation]);

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
            <CardTitle>
              {status === 'loading' && 'Verifica in corso...'}
              {status === 'success' && 'Verifica completata!'}
              {status === 'error' && 'Errore di verifica'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Attendere prego'}
              {status === 'success' && 'Reindirizzamento in corso'}
              {status === 'error' && 'Si è verificato un problema'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'loading' && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}
            
            {status === 'success' && (
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {status === 'error' && (
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

