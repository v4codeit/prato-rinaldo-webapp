'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { completeOnboarding } from '@/app/actions/auth';
import { ROUTES } from '@/lib/utils/constants';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [step1Data, setStep1Data] = useState<any>(null);

  async function handleStep1Submit(formData: FormData) {
    setLoading(true);

    const data = {
      membership_type: formData.get('membershipType') as string,
      street: formData.get('street') as string,
      street_number: formData.get('streetNumber') as string,
      zip_code: formData.get('zipCode') as string || '00030',
      municipality: formData.get('municipality') as string,
    };

    setStep1Data(data);
    setStep(2);
    setLoading(false);
  }

  async function handleStep2Submit(formData: FormData) {
    setLoading(true);

    const data = {
      ...step1Data,
      household_size: parseInt(formData.get('householdSize') as string) || null,
      has_minors: formData.get('hasMinors') === 'true',
      minors_count: parseInt(formData.get('minorsCount') as string) || 0,
      has_seniors: formData.get('hasSeniors') === 'true',
      seniors_count: parseInt(formData.get('seniorsCount') as string) || 0,
    };

    const result = await completeOnboarding(2, data);

    if (result.error) {
      alert(result.error);
      setLoading(false);
    } else {
      router.push(ROUTES.HOME);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Benvenuto! Completa il tuo profilo</CardTitle>
            <CardDescription>
              Passo {step} di 2 - Queste informazioni ci aiutano a servirti meglio
            </CardDescription>
            <div className="mt-4 flex gap-2">
              <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </CardHeader>

          {step === 1 && (
            <form action={handleStep1Submit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="membershipType">
                    Tipo di appartenenza <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="membershipType"
                    name="membershipType"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Seleziona...</option>
                    <option value="resident">Residente</option>
                    <option value="domiciled">Domiciliato</option>
                    <option value="landowner">Proprietario</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Via"
                    name="street"
                    type="text"
                    required
                    placeholder="Via Roma"
                  />
                  <FormField
                    label="Numero Civico"
                    name="streetNumber"
                    type="text"
                    required
                    placeholder="123"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="CAP"
                    name="zipCode"
                    type="text"
                    placeholder="00030"
                  />
                  <div className="space-y-2">
                    <Label htmlFor="municipality">
                      Comune <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="municipality"
                      name="municipality"
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="">Seleziona...</option>
                      <option value="san_cesareo">San Cesareo</option>
                      <option value="zagarolo">Zagarolo</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Caricamento...' : 'Continua'}
                </Button>
              </CardFooter>
            </form>
          )}

          {step === 2 && (
            <form action={handleStep2Submit}>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Queste informazioni sono opzionali ma ci aiutano a comprendere meglio la community.
                </p>

                <FormField
                  label="Numero componenti nucleo familiare"
                  name="householdSize"
                  type="number"
                  placeholder="4"
                />

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      id="hasMinors"
                      name="hasMinors"
                      value="true"
                      className="rounded"
                    />
                    <Label htmlFor="hasMinors">Presenza di minori</Label>
                  </div>
                  <FormField
                    label="Numero di minori"
                    name="minorsCount"
                    type="number"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      id="hasSeniors"
                      name="hasSeniors"
                      value="true"
                      className="rounded"
                    />
                    <Label htmlFor="hasSeniors">Presenza di over 65</Label>
                  </div>
                  <FormField
                    label="Numero di over 65"
                    name="seniorsCount"
                    type="number"
                    placeholder="0"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1"
                >
                  Indietro
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Caricamento...' : 'Completa'}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
