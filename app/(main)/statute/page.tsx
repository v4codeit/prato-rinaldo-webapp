import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export const metadata = {
  title: 'Statuto',
  description: 'Statuto del Comitato di Quartiere Prato Rinaldo',
};

export default function StatutePage() {
  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <FileText className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Statuto - Prossimamente</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Contenuto in arrivo: statuto e regolamenti del Comitato.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
