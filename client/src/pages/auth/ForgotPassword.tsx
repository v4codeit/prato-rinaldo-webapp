import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPassword() {
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
            <CardTitle>Password dimenticata?</CardTitle>
            <CardDescription>
              Nessun problema. Ti invieremo un link per reimpostarla.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

