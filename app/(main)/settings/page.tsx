import Link from 'next/link';
import { Bell, User, Shield, Mail, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAuthWithOnboarding } from '@/lib/auth/dal';
import type { Route } from 'next';

export const metadata = {
  title: 'Impostazioni',
  description: 'Gestisci le tue impostazioni account',
};

interface SettingsLinkProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  available?: boolean;
}

function SettingsLink({ href, icon, title, description, available = false }: SettingsLinkProps) {
  if (!available) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30 opacity-60">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          Prossimamente
        </span>
      </div>
    );
  }

  return (
    <Link
      href={href as Route}
      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
}

export default async function SettingsPage() {
  // Require authenticated user with completed onboarding
  await requireAuthWithOnboarding();

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Impostazioni</h1>
          <p className="text-muted-foreground">
            Gestisci le preferenze del tuo account e le impostazioni di privacy
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Impostazioni Account</CardTitle>
            <CardDescription>
              Personalizza la tua esperienza sulla piattaforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingsLink
              href="/settings/notifications"
              icon={<Bell className="h-5 w-5" />}
              title="Notifiche"
              description="Gestisci le preferenze di notifica push e email"
              available={true}
            />

            <SettingsLink
              href="/settings/profile"
              icon={<User className="h-5 w-5" />}
              title="Profilo"
              description="Modifica le tue informazioni personali"
              available={false}
            />

            <SettingsLink
              href="/settings/privacy"
              icon={<Shield className="h-5 w-5" />}
              title="Privacy e Sicurezza"
              description="Gestisci la visibilità e la sicurezza del tuo account"
              available={false}
            />

            <SettingsLink
              href="/settings/email"
              icon={<Mail className="h-5 w-5" />}
              title="Email"
              description="Gestisci le preferenze email e le newsletter"
              available={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
