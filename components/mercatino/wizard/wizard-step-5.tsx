'use client';

import * as React from 'react';
import { Info, Heart, Image as ImageIcon, Phone, MapPin, BedDouble, Maximize2, Home, Gift, Tag, Euro } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils/cn';
import {
  MERCATINO_CONDITION_LABELS,
  MERCATINO_LISTING_TYPE_LABELS,
  MERCATINO_OBJECT_TYPE_LABELS,
  MERCATINO_REAL_ESTATE_TYPE_LABELS,
  MERCATINO_CONTACT_METHOD_LABELS,
  MERCATINO_DONATION_PRESETS,
  MERCATINO_MIN_DONATION_CENTS,
} from '@/lib/utils/constants';
import type { WizardStep1Data } from './wizard-step-1';
import type { WizardStep2ObjectData, WizardStep2RealEstateData } from './wizard-step-2';
import type { WizardStep3Data } from './wizard-step-3';
import type { WizardStep4Data } from './wizard-step-4';

export interface WizardStep5Data {
  agreeToTerms: boolean;
  wantsToDonate: boolean;
  donationAmountCents: number; // In cents (100 = 1€)
}

interface MercatinoWizardData {
  step1?: WizardStep1Data;
  step2?: WizardStep2ObjectData | WizardStep2RealEstateData;
  step3?: WizardStep3Data;
  step4?: WizardStep4Data;
  step5?: WizardStep5Data;
}

interface WizardStep5Props {
  wizardData: MercatinoWizardData;
  data?: Partial<WizardStep5Data>;
  onChange: (data: Partial<WizardStep5Data>) => void;
}

export function WizardStep5({ wizardData, data, onChange }: WizardStep5Props) {
  const { step1, step2, step3, step4 } = wizardData;
  const [customAmount, setCustomAmount] = React.useState<string>('');
  const [showCustomInput, setShowCustomInput] = React.useState(false);

  const isRealEstate = step1?.listingType === 'real_estate';
  const isGift = step1?.objectType === 'gift';
  const step2Data = step2 as WizardStep2ObjectData | WizardStep2RealEstateData | undefined;

  // Get price from step2 data
  const price = step2Data?.price || 0;

  // Get current donation amount in euros for display
  const donationCents = data?.donationAmountCents || 0;
  const donationEuros = donationCents / 100;

  // Format price
  const formatPrice = (amount: number) => {
    return amount.toLocaleString('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Format cents to euros
  const formatCentsToEuros = (cents: number) => {
    return (cents / 100).toLocaleString('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Handle preset selection
  const handlePresetSelect = (cents: number) => {
    setShowCustomInput(false);
    setCustomAmount('');
    onChange({ donationAmountCents: cents, wantsToDonate: true });
  };

  // Handle custom amount change
  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const euros = parseFloat(value.replace(',', '.'));
    if (!isNaN(euros) && euros >= 1) {
      const cents = Math.round(euros * 100);
      onChange({ donationAmountCents: cents, wantsToDonate: true });
    } else if (value === '' || euros < 1) {
      onChange({ donationAmountCents: 0, wantsToDonate: false });
    }
  };

  // Handle donation toggle
  const handleDonationToggle = (enabled: boolean) => {
    if (enabled) {
      // Default to first preset (1€)
      onChange({ wantsToDonate: true, donationAmountCents: MERCATINO_MIN_DONATION_CENTS });
    } else {
      onChange({ wantsToDonate: false, donationAmountCents: 0 });
      setShowCustomInput(false);
      setCustomAmount('');
    }
  };

  // Check if a preset is selected
  const isPresetSelected = (cents: number) => {
    return donationCents === cents && !showCustomInput;
  };

  // Get type label
  const getTypeLabel = () => {
    if (isRealEstate) {
      return `${MERCATINO_LISTING_TYPE_LABELS.real_estate} - ${
        MERCATINO_REAL_ESTATE_TYPE_LABELS[step1?.realEstateType || 'sale']
      }`;
    }
    return `${MERCATINO_LISTING_TYPE_LABELS.objects} - ${
      MERCATINO_OBJECT_TYPE_LABELS[step1?.objectType || 'sale']
    }`;
  };

  return (
    <div className="space-y-6">
      {/* Preview Section */}
      <div>
        <Label className="text-base font-semibold">Riepilogo annuncio</Label>
        <p className="text-sm text-slate-500 mt-1">
          Verifica che tutti i dati siano corretti prima di pubblicare.
        </p>
      </div>

      {/* Preview Card */}
      <Card className="overflow-hidden">
        {/* Image Preview */}
        {step3?.images && step3.images.length > 0 && (
          <div className="relative aspect-video bg-slate-100">
            <img
              src={step3.images[0]}
              alt="Anteprima"
              className="w-full h-full object-cover"
            />
            {step3.images.length > 1 && (
              <Badge className="absolute bottom-3 right-3 bg-black/60 text-white border-0">
                <ImageIcon className="h-3 w-3 mr-1" />
                {step3.images.length} foto
              </Badge>
            )}
            {/* Type Badge */}
            <Badge
              className={cn(
                "absolute top-3 left-3 border-0",
                isRealEstate
                  ? "bg-blue-500 text-white"
                  : isGift
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-500 text-white"
              )}
            >
              {isRealEstate ? (
                <Home className="h-3 w-3 mr-1" />
              ) : isGift ? (
                <Gift className="h-3 w-3 mr-1" />
              ) : (
                <Tag className="h-3 w-3 mr-1" />
              )}
              {getTypeLabel()}
            </Badge>
          </div>
        )}

        <CardContent className="p-4 space-y-4">
          {/* Title & Price */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-900">
              {step2Data?.title || 'Titolo annuncio'}
            </h3>
            <span
              className={cn(
                "text-xl font-bold whitespace-nowrap",
                isGift ? "text-amber-600" : "text-emerald-600"
              )}
            >
              {isGift ? 'Regalo' : formatPrice(price)}
            </span>
          </div>

          {/* Description Preview */}
          <p className="text-sm text-slate-600 line-clamp-3">
            {step2Data?.description || 'Descrizione annuncio...'}
          </p>

          {/* Details Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Condition (for objects) */}
            {!isRealEstate && 'condition' in (step2Data || {}) && (
              <Badge variant="secondary">
                {MERCATINO_CONDITION_LABELS[(step2Data as WizardStep2ObjectData)?.condition || 'good']}
              </Badge>
            )}

            {/* Real estate details */}
            {isRealEstate && 'squareMeters' in (step2Data || {}) && (
              <>
                {(step2Data as WizardStep2RealEstateData)?.squareMeters && (
                  <Badge variant="secondary">
                    <Maximize2 className="h-3 w-3 mr-1" />
                    {(step2Data as WizardStep2RealEstateData).squareMeters} m²
                  </Badge>
                )}
                {(step2Data as WizardStep2RealEstateData)?.rooms && (
                  <Badge variant="secondary">
                    <BedDouble className="h-3 w-3 mr-1" />
                    {(step2Data as WizardStep2RealEstateData).rooms} locali
                  </Badge>
                )}
              </>
            )}

            {/* Address Zone */}
            {isRealEstate && (step2Data as WizardStep2RealEstateData)?.addressZone && (
              <Badge variant="outline">
                <MapPin className="h-3 w-3 mr-1" />
                {(step2Data as WizardStep2RealEstateData).addressZone}
              </Badge>
            )}

            {/* Private */}
            {step2Data?.isPrivate && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                🔒 Privato
              </Badge>
            )}
          </div>

          <Separator />

          {/* Contact Methods */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Metodi di contatto:</p>
            <div className="flex flex-wrap gap-2">
              {step4?.contactMethods?.map((contact) => (
                <Badge key={contact.method} variant="outline" className="text-xs">
                  <Phone className="h-3 w-3 mr-1" />
                  {MERCATINO_CONTACT_METHOD_LABELS[contact.method]}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donation Section (always shown, even for gifts) */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Heart className="h-5 w-5 fill-amber-500 text-amber-500" />
              Supporta il Comitato
            </CardTitle>
            <Switch
              checked={data?.wantsToDonate || false}
              onCheckedChange={handleDonationToggle}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-amber-700">
            Fai una donazione al Comitato di Prato Rinaldo per sostenere
            le attività della comunità. Minimo 1€.
          </p>

          {/* Donation Amount Selection - Only show when enabled */}
          {data?.wantsToDonate && (
            <div className="space-y-4">
              {/* Preset Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {MERCATINO_DONATION_PRESETS.map((preset) => (
                  <Button
                    key={preset.cents}
                    type="button"
                    variant={isPresetSelected(preset.cents) ? 'default' : 'outline'}
                    onClick={() => handlePresetSelect(preset.cents)}
                    className={cn(
                      'rounded-xl h-12 font-bold transition-all',
                      isPresetSelected(preset.cents)
                        ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                        : 'bg-white hover:bg-amber-100 text-amber-700 border-amber-300'
                    )}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Custom Amount Button */}
              <Button
                type="button"
                variant={showCustomInput ? 'default' : 'outline'}
                onClick={() => {
                  setShowCustomInput(true);
                  // Clear preset selection when entering custom mode
                  if (!showCustomInput) {
                    onChange({ donationAmountCents: 0, wantsToDonate: true });
                  }
                }}
                className={cn(
                  'w-full rounded-xl h-10 transition-all',
                  showCustomInput
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                    : 'bg-white hover:bg-amber-100 text-amber-700 border-amber-300'
                )}
              >
                Altro importo
              </Button>

              {/* Custom Amount Input */}
              {showCustomInput && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-amber-800">
                    Importo personalizzato (min. 1€)
                  </Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                    <Input
                      type="number"
                      min={1}
                      step={0.5}
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      placeholder="1.00"
                      className="rounded-xl pl-10 bg-white border-amber-300 focus:border-amber-500"
                    />
                  </div>
                  {customAmount && parseFloat(customAmount.replace(',', '.')) < 1 && (
                    <p className="text-xs text-red-500">
                      La donazione minima è di 1€
                    </p>
                  )}
                </div>
              )}

              {/* Donation Preview */}
              {donationCents > 0 && (
                <div className="bg-white/60 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-700">La tua donazione</span>
                    <span className="text-xl font-bold text-amber-600">
                      {formatCentsToEuros(donationCents)}
                    </span>
                  </div>
                  <p className="text-xs text-amber-600 mt-3">
                    💡 La donazione verrà richiesta tramite Stripe dopo la pubblicazione
                  </p>
                </div>
              )}
            </div>
          )}

          {!data?.wantsToDonate && (
            <p className="text-xs text-amber-600">
              Attiva per fare una donazione volontaria - ogni contributo conta! 💛
            </p>
          )}
        </CardContent>
      </Card>

      {/* Terms Agreement */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={data?.agreeToTerms || false}
              onCheckedChange={(checked) =>
                onChange({ agreeToTerms: checked === true })
              }
              className="mt-1"
            />
            <div>
              <Label
                htmlFor="terms"
                className="text-sm font-medium cursor-pointer"
              >
                Accetto i termini e le condizioni <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-slate-500 mt-1">
                Confermo che le informazioni inserite sono veritiere e che il contenuto
                rispetta le{' '}
                <a href="/terms" className="text-emerald-600 hover:underline">
                  linee guida della community
                </a>
                . L'annuncio sarà sottoposto a moderazione prima della pubblicazione.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Cosa succede dopo?</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1">
              <li>• Il tuo annuncio verrà inviato ai moderatori</li>
              <li>• Riceverai una notifica quando sarà approvato</li>
              <li>• Gli interessati potranno contattarti direttamente</li>
              {data?.wantsToDonate && donationCents > 0 && (
                <li>• Ti invieremo il link per completare la donazione</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Validation Message */}
      {!data?.agreeToTerms && (
        <p className="text-sm text-amber-600">
          ⚠️ Accetta i termini e le condizioni per pubblicare l'annuncio
        </p>
      )}
    </div>
  );
}
