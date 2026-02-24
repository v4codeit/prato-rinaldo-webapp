'use client';

import * as React from 'react';
import { Home, Package, Tag, Gift, Key, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils/cn';
import {
  MERCATINO_LISTING_TYPE,
  MERCATINO_REAL_ESTATE_TYPE,
  MERCATINO_OBJECT_TYPE,
} from '@/lib/utils/constants';

export interface WizardStep1Data {
  listingType: 'real_estate' | 'objects';
  realEstateType?: 'rent' | 'sale' | null;
  objectType?: 'sale' | 'gift' | null;
}

interface WizardStep1Props {
  data?: Partial<WizardStep1Data>;
  onChange: (data: Partial<WizardStep1Data>) => void;
}

// Listing type options
const LISTING_TYPE_OPTIONS = [
  {
    value: MERCATINO_LISTING_TYPE.OBJECTS,
    label: 'Oggetto',
    description: 'Vendi o regala oggetti, mobili, elettronica, abbigliamento e altro',
    icon: Package,
    color: 'emerald',
  },
  {
    value: MERCATINO_LISTING_TYPE.REAL_ESTATE,
    label: 'Immobile',
    description: 'Affitta o vendi appartamenti, case, garage, terreni',
    icon: Home,
    color: 'blue',
  },
] as const;

// Object type options
const OBJECT_TYPE_OPTIONS = [
  {
    value: MERCATINO_OBJECT_TYPE.SALE,
    label: 'Vendita',
    description: 'Metti in vendita il tuo oggetto',
    icon: Tag,
    color: 'emerald',
  },
  {
    value: MERCATINO_OBJECT_TYPE.GIFT,
    label: 'Regalo',
    description: 'Dona gratuitamente a chi ne ha bisogno',
    icon: Gift,
    color: 'amber',
  },
] as const;

// Real estate type options
const REAL_ESTATE_TYPE_OPTIONS = [
  {
    value: MERCATINO_REAL_ESTATE_TYPE.RENT,
    label: 'Affitto',
    description: 'Affitta il tuo immobile',
    icon: Key,
    color: 'blue',
  },
  {
    value: MERCATINO_REAL_ESTATE_TYPE.SALE,
    label: 'Vendita',
    description: 'Vendi il tuo immobile',
    icon: ShoppingBag,
    color: 'violet',
  },
] as const;

export function WizardStep1({ data, onChange }: WizardStep1Props) {
  const listingType = data?.listingType || 'objects';
  const objectType = data?.objectType;
  const realEstateType = data?.realEstateType;

  // Handle listing type change
  const handleListingTypeChange = (value: string) => {
    onChange({
      listingType: value as 'real_estate' | 'objects',
      // Reset sub-type when changing main type
      realEstateType: value === 'real_estate' ? undefined : null,
      objectType: value === 'objects' ? undefined : null,
    });
  };

  // Handle sub-type change
  const handleSubTypeChange = (value: string) => {
    if (listingType === 'real_estate') {
      onChange({ realEstateType: value as 'rent' | 'sale' });
    } else {
      onChange({ objectType: value as 'sale' | 'gift' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Main Listing Type Selection */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Cosa vuoi pubblicare?
        </Label>

        <div className="grid grid-cols-2 gap-4">
          {LISTING_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = listingType === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleListingTypeChange(option.value)}
                className={cn(
                  "relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all",
                  "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2",
                  isSelected
                    ? option.color === 'emerald'
                      ? "border-emerald-500 bg-emerald-50 ring-emerald-500"
                      : "border-blue-500 bg-blue-50 ring-blue-500"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div
                    className={cn(
                      "absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center",
                      option.color === 'emerald' ? "bg-emerald-500" : "bg-blue-500"
                    )}
                  >
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-3",
                    isSelected
                      ? option.color === 'emerald'
                        ? "bg-emerald-500 text-white"
                        : "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  <Icon className="w-7 h-7" />
                </div>

                <h3 className="font-semibold text-slate-900 mb-1">
                  {option.label}
                </h3>
                <p className="text-xs text-slate-500 text-center">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-type Selection */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          {listingType === 'real_estate'
            ? 'Tipo di annuncio immobiliare'
            : 'Tipo di annuncio'}
        </Label>

        <div className="grid grid-cols-2 gap-4">
          {(listingType === 'real_estate'
            ? REAL_ESTATE_TYPE_OPTIONS
            : OBJECT_TYPE_OPTIONS
          ).map((option) => {
            const Icon = option.icon;
            const currentValue =
              listingType === 'real_estate' ? realEstateType : objectType;
            const isSelected = currentValue === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSubTypeChange(option.value)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                  "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2",
                  isSelected
                    ? option.color === 'emerald'
                      ? "border-emerald-500 bg-emerald-50 ring-emerald-500"
                      : option.color === 'amber'
                        ? "border-amber-500 bg-amber-50 ring-amber-500"
                        : option.color === 'blue'
                          ? "border-blue-500 bg-blue-50 ring-blue-500"
                          : "border-violet-500 bg-violet-50 ring-violet-500"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    isSelected
                      ? option.color === 'emerald'
                        ? "bg-emerald-500 text-white"
                        : option.color === 'amber'
                          ? "bg-amber-500 text-white"
                          : option.color === 'blue'
                            ? "bg-blue-500 text-white"
                            : "bg-violet-500 text-white"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div>
                  <h4 className="font-medium text-slate-900">{option.label}</h4>
                  <p className="text-xs text-slate-500">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4">
          <p className="text-sm text-slate-600">
            {listingType === 'real_estate' ? (
              <>
                <strong>Suggerimento:</strong> Per gli immobili, potrai aggiungere
                dettagli come metratura, numero di locali, piano e altro ancora.
              </>
            ) : objectType === 'gift' ? (
              <>
                <strong>Fantastico!</strong> Regalando oggetti aiuti la comunità
                e contribuisci a ridurre gli sprechi. 💚
              </>
            ) : (
              <>
                <strong>Suggerimento:</strong> Puoi anche donare una percentuale
                della vendita al Comitato di Prato Rinaldo!
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
