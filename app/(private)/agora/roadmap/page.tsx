import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ROUTES, VERIFICATION_STATUS } from '@/lib/utils/constants';

export const metadata = {
  title: 'Roadmap Proposte - Prossimamente',
  description: 'Visualizza la roadmap delle proposte approvate',
};

export default async function RoadmapPage() {
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
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <MapPin className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Roadmap Proposte</CardTitle>
            <CardDescription className="text-lg">
              Questa funzionalità sarà disponibile a breve
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Stiamo lavorando per portare presto la roadmap delle proposte approvate,
              con timeline, milestone e aggiornamenti sullo stato di avanzamento.
            </p>
            <Button asChild>
              <Link href={ROUTES.AGORA}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna all'Agorà
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
