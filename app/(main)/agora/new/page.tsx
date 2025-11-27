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
    <div className="container py-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href={ROUTES.AGORA}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna all'Agorà
        </Link>
      </Button>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nuova Proposta</h1>
        <p className="text-muted-foreground mt-1">
          Proponi un'iniziativa per migliorare la nostra comunità
        </p>
      </div>

      <Card className="bg-white border rounded-3xl shadow-sm">
        <CardHeader className="p-6 md:p-8 pb-0 md:pb-0">
          <CardTitle className="text-xl">Dettagli Proposta</CardTitle>
          <CardDescription>
            Le proposte verranno revisionate dalla comunità e potranno essere
            approvate per l'implementazione.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <ProposalForm />
        </CardContent>
      </Card>
    </div>
  );
}
