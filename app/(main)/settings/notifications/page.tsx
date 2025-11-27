import { requireAuthWithOnboarding } from '@/lib/auth/dal';
import { NotificationSettings } from '@/components/organisms/notifications';

export const metadata = {
  title: 'Notifiche',
  description: 'Gestisci le tue preferenze di notifica',
};

export default async function NotificationsSettingsPage() {
  // Require authenticated user with completed onboarding
  await requireAuthWithOnboarding();

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Notifiche</h1>
          <p className="text-muted-foreground">
            Gestisci le tue preferenze di notifica push e email
          </p>
        </div>

        <NotificationSettings />
      </div>
    </div>
  );
}
