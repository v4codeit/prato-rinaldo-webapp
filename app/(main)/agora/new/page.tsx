import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ROUTES, VERIFICATION_STATUS } from '@/lib/utils/constants';
import { ProposalForm } from '@/components/organisms/proposal-form';

export const metadata = {
  title: 'Nuova Proposta - Agora',
  description: 'Crea una nuova proposta per la comunità',
};

export default async function NewProposalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Require authentication
  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // Check verification status
  const { data: profile } = await supabase
    .from('users')
    .select('verification_status')
    .eq('id', user.id)
    .single() as { data: { verification_status: string } | null };

  const isVerified = profile?.verification_status === VERIFICATION_STATUS.APPROVED;

  if (!isVerified) {
    redirect(ROUTES.AGORA);
  }

  return (
    <div className="container py-8 max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href={ROUTES.AGORA}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna all'Agora
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Crea una Nuova Proposta</CardTitle>
          <CardDescription>
            Le proposte verranno revisionate dalla comunità e potranno essere
            approvate per l'implementazione. Assicurati di descrivere chiaramente
            la tua idea e i benefici per la comunità.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProposalForm />
        </CardContent>
      </Card>
    </div>
  );
}
