import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAuthWithOnboarding } from '@/lib/auth/dal';

export const metadata = {
  title: 'Impostazioni',
  description: 'Gestisci le tue impostazioni account',
};

export default async function SettingsPage() {
  // Require authenticated user with completed onboarding
  await requireAuthWithOnboarding();
  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Impostazioni</h1>
          <p className="text-muted-foreground">
            Gestisci le preferenze del tuo account e le impostazioni di privacy
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Impostazioni Account</CardTitle>
            <CardDescription>
              Questa sezione è in fase di sviluppo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Le impostazioni account saranno disponibili a breve. Qui potrai gestire:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Informazioni personali</li>
              <li>Preferenze di notifica</li>
              <li>Privacy e sicurezza</li>
              <li>Gestione email</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
