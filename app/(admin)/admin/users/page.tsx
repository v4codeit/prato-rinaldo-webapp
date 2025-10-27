import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/utils/constants';

export const metadata = {
  title: 'Gestione Utenti - Prossimamente',
  description: 'Gestione utenti della piattaforma',
};

export default function UsersManagementPage() {
  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Users className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Gestione Utenti</CardTitle>
            <CardDescription className="text-lg">
              Questa funzionalità sarà disponibile a breve
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Stiamo lavorando per portare presto la gestione completa degli utenti,
              inclusi ruoli, permessi e moderazione avanzata.
            </p>
            <Button asChild>
              <Link href="/admin/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna alla Dashboard Admin
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
