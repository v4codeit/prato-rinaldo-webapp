import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export const metadata = {
  title: 'Chi Siamo',
  description: 'Informazioni sul Comitato di Quartiere Prato Rinaldo',
};

export default function AboutPage() {
  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Info className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Chi Siamo - Prossimamente</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Contenuto in arrivo: storia, missione e valori del Comitato di Quartiere Prato Rinaldo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
