import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck } from 'lucide-react';

export const metadata = {
  title: 'Termini di Servizio',
  description: 'Termini e condizioni d\'uso',
};

export default function TermsPage() {
  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <FileCheck className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Termini di Servizio - Prossimamente</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Contenuto in arrivo: termini e condizioni d'uso della piattaforma.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
