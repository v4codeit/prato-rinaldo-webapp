import { connection } from 'next/server';
import { requireVerifiedResident } from '@/lib/auth/dal';
import { getSetting } from '@/app/actions/site-settings';
import { MioCondominioClient } from './mio-condominio-client';

export async function MioCondominioContent() {
  await connection(); // Force dynamic rendering - MUST be first

  // Require verified resident (redirects if not authenticated/verified)
  await requireVerifiedResident();

  // Fetch contatti amministratore da site_settings
  const [emailResult, phoneResult, addressResult] = await Promise.all([
    getSetting('contact_email'),
    getSetting('contact_phone'),
    getSetting('contact_address'),
  ]);

  const contactEmail = emailResult.setting?.value || '';
  const contactPhone = phoneResult.setting?.value || '';
  const contactAddress = addressResult.setting?.value || '';

  return (
    <MioCondominioClient
      contactEmail={contactEmail}
      contactPhone={contactPhone}
      contactAddress={contactAddress}
    />
  );
}
