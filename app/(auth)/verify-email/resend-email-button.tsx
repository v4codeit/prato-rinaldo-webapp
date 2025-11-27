'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { resendVerificationEmail } from '@/app/actions/auth';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface ResendEmailButtonProps {
  email?: string | null;
}

export function ResendEmailButton({ email }: ResendEmailButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleResend = () => {
    setStatus('idle');
    setMessage(null);

    startTransition(async () => {
      // Create FormData with email if available
      const formData = new FormData();
      if (email) {
        formData.append('email', email);
      }

      const result = await resendVerificationEmail(formData);

      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Email inviata!');
      } else {
        setStatus('error');
        setMessage(result.error || 'Errore durante l\'invio');
      }
    });
  };

  if (status === 'success') {
    return (
      <Button variant="ghost" className="w-full" disabled>
        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
        <span className="text-green-600">{message}</span>
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        className="w-full"
        onClick={handleResend}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Invio in corso...
          </>
        ) : (
          'Invia Nuovamente Email'
        )}
      </Button>
      {status === 'error' && message && (
        <p className="text-sm text-destructive text-center">{message}</p>
      )}
    </div>
  );
}
