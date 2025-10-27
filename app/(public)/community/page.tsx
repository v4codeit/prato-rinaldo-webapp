import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'La Community',
  description: 'La community del Comitato di Quartiere',
};

export default function CommunityPage() {
  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Users className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">La Community - Prossimamente</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Contenuto in arrivo: membri, gruppi e iniziative della community.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
