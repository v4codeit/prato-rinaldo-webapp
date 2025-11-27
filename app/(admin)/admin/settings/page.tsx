import { Suspense } from 'react';
import { SettingsContent } from './settings-content';
import { SettingsSkeleton } from './settings-skeleton';

export const metadata = {
  title: 'Impostazioni Sito - Admin',
  description: 'Gestisci le impostazioni generali del sito',
};

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
