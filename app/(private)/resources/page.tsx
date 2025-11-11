import { requireVerifiedResident } from '@/lib/auth/dal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Video } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Risorse',
  description: 'Documenti e tutorial per la community',
};

export default async function ResourcesPage() {
  // Require verified resident (redirects if not authenticated/verified)
  await requireVerifiedResident();
  return (
    <div className="container py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Risorse</h1>
        <p className="text-lg text-muted-foreground">
          Documenti e tutorial per la community
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/resources/documents">
          <Card className="h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Documenti</CardTitle>
              </div>
              <CardDescription className="text-base">
                Accedi ai documenti ufficiali, regolamenti e modulistica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Esplora Documenti
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/resources/tutorials">
          <Card className="h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Tutorial</CardTitle>
              </div>
              <CardDescription className="text-base">
                Guide e tutorial per utilizzare i servizi della community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Esplora Tutorial
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
