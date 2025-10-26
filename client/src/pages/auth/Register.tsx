import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Prato Rinaldo</h1>
          <p className="mt-2 text-sm text-gray-600">
            Piattaforma Comitato Cittadini
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crea un account</CardTitle>
            <CardDescription>
              Registrati per unirti alla comunità di Prato Rinaldo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-gray-600">
          Registrandoti, accetti i nostri{' '}
          <a href="/privacy" className="text-primary hover:underline">
            termini di servizio
          </a>{' '}
          e la{' '}
          <a href="/privacy" className="text-primary hover:underline">
            privacy policy
          </a>
        </p>
      </div>
    </div>
  );
}

