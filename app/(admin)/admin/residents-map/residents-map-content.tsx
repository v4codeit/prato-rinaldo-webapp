import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getResidentsForMap } from '@/app/actions/users';
import { ResidentsMapClient } from './residents-map-client';

export async function ResidentsMapContent() {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  const { residents, error } = await getResidentsForMap();

  return (
    <ResidentsMapClient
      residents={residents}
      error={error}
    />
  );
}
