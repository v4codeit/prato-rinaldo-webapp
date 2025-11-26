'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { ROUTES } from '@/lib/utils/constants';
import Link from 'next/link';
import type { Route } from 'next';

/**
 * Auth Error Handler
 *
 * Displays a user-friendly dialog when Supabase redirects with auth errors.
 * Common scenarios:
 * - Expired password recovery link (otp_expired)
 * - Invalid or already used link (access_denied)
 * - Email verification errors
 *
 * After displaying the error, cleans the URL by removing error params.
 */

interface ErrorInfo {
  title: string;
  description: string;
  action: string;
  href: string;
}

const ERROR_MESSAGES: Record<string, ErrorInfo> = {
  otp_expired: {
    title: 'Link Scaduto',
    description: 'Il link di recupero password è scaduto o è già stato utilizzato. I link sono validi per 1 ora.',
    action: 'Richiedi Nuovo Link',
    href: ROUTES.FORGOT_PASSWORD,
  },
  access_denied: {
    title: 'Accesso Negato',
    description: 'Non è stato possibile completare l\'operazione. Il link potrebbe essere scaduto o già utilizzato.',
    action: 'Richiedi Nuovo Link',
    href: ROUTES.FORGOT_PASSWORD,
  },
  invalid_request: {
    title: 'Richiesta Non Valida',
    description: 'La richiesta non è valida. Riprova o contatta il supporto.',
    action: 'Vai al Login',
    href: ROUTES.LOGIN,
  },
  user_not_found: {
    title: 'Utente Non Trovato',
    description: 'Non abbiamo trovato un account associato a questa email.',
    action: 'Registrati',
    href: ROUTES.REGISTER,
  },
  email_not_confirmed: {
    title: 'Email Non Verificata',
    description: 'Devi verificare la tua email prima di poter accedere.',
    action: 'Vai al Login',
    href: ROUTES.LOGIN,
  },
  user_already_exists: {
    title: 'Utente Già Registrato',
    description: 'Esiste già un account con questa email. Prova ad accedere.',
    action: 'Vai al Login',
    href: ROUTES.LOGIN,
  },
};

const DEFAULT_ERROR: ErrorInfo = {
  title: 'Errore di Autenticazione',
  description: 'Si è verificato un errore durante l\'autenticazione. Riprova.',
  action: 'Chiudi',
  href: ROUTES.HOME,
};

export function AuthErrorHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);

  useEffect(() => {
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    // Check if there are auth error params
    if (error || errorCode) {
      // Get error info from mapping or use default
      let info = ERROR_MESSAGES[errorCode || ''];

      if (!info) {
        // Use error_description if available, otherwise default
        info = {
          ...DEFAULT_ERROR,
          description: errorDescription?.replace(/\+/g, ' ') || DEFAULT_ERROR.description,
        };
      }

      setErrorInfo(info);
      setOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setOpen(false);
    // Clean URL by removing error params
    router.replace(pathname as Route);
  };

  const handleAction = () => {
    setOpen(false);
    // Navigate to action URL (router.replace will be called by Link)
  };

  if (!errorInfo) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 rounded-full bg-destructive/10 w-16 h-16 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center">{errorInfo.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {errorInfo.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Chiudi
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href={errorInfo.href as Route} onClick={handleAction}>
              {errorInfo.action}
            </Link>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
