import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ROUTES } from '@/lib/utils/constants';
import { Mail } from 'lucide-react';

export const metadata = {
  title: 'Verifica Email',
  description: 'Verifica il tuo indirizzo email',
};

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader>
        <div className="mx-auto mb-4 rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-center">Verifica la tua Email</CardTitle>
        <CardDescription className="text-center">
          Controlla la tua casella di posta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <p className="text-sm">
            Ti abbiamo inviato un'email con un link di verifica. Clicca sul link per
            completare la registrazione e attivare il tuo account.
          </p>
        </Alert>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Non hai ricevuto l'email?</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Controlla la cartella spam o posta indesiderata</li>
            <li>Assicurati di aver inserito l'email corretta</li>
            <li>Attendi qualche minuto e ricontrolla</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button asChild className="w-full">
          <Link href={ROUTES.LOGIN}>Vai al Login</Link>
        </Button>
        <Button variant="ghost" className="w-full">
          Invia Nuovamente Email
        </Button>
      </CardFooter>
    </Card>
  );
}
