import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Informativa sulla privacy',
};

export default function PrivacyPage() {
  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Privacy Policy - Prossimamente</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Contenuto in arrivo: informativa completa sulla privacy e trattamento dati.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
