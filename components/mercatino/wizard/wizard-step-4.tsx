'use client';

import * as React from 'react';
import { Phone, Mail, MessageCircle, Send, Info, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import {
  MERCATINO_CONTACT_METHOD,
  MERCATINO_CONTACT_METHOD_LABELS,
} from '@/lib/utils/constants';

type ContactMethodType = typeof MERCATINO_CONTACT_METHOD[keyof typeof MERCATINO_CONTACT_METHOD];

interface ContactMethod {
  method: ContactMethodType;
  value: string;
}

export interface WizardStep4Data {
  contactMethods: ContactMethod[];
}

interface WizardStep4Props {
  data?: Partial<WizardStep4Data>;
  onChange: (data: Partial<WizardStep4Data>) => void;
}

// Contact method configuration
const CONTACT_OPTIONS = [
  {
    method: MERCATINO_CONTACT_METHOD.WHATSAPP,
    label: MERCATINO_CONTACT_METHOD_LABELS.whatsapp,
    icon: MessageCircle,
    placeholder: '+39 333 1234567',
    color: 'bg-[#25D366] text-white',
    description: 'Numero WhatsApp (con prefisso)',
    validation: (v: string) => /^\+?\d{8,15}$/.test(v.replace(/\s/g, '')),
  },
  {
    method: MERCATINO_CONTACT_METHOD.EMAIL,
    label: MERCATINO_CONTACT_METHOD_LABELS.email,
    icon: Mail,
    placeholder: 'mario.rossi@email.it',
    color: 'bg-blue-500 text-white',
    description: 'Indirizzo email',
    validation: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  },
  {
    method: MERCATINO_CONTACT_METHOD.TELEGRAM,
    label: MERCATINO_CONTACT_METHOD_LABELS.telegram,
    icon: Send,
    placeholder: '@username',
    color: 'bg-[#0088cc] text-white',
    description: 'Username Telegram (con @)',
    validation: (v: string) => /^@?[\w\d_]{5,32}$/.test(v),
  },
  {
    method: MERCATINO_CONTACT_METHOD.PHONE,
    label: MERCATINO_CONTACT_METHOD_LABELS.phone,
    icon: Phone,
    placeholder: '+39 06 1234567',
    color: 'bg-emerald-600 text-white',
    description: 'Numero di telefono',
    validation: (v: string) => /^\+?\d{8,15}$/.test(v.replace(/\s/g, '')),
  },
] as const;

export function WizardStep4({ data, onChange }: WizardStep4Props) {
  const [selectedMethods, setSelectedMethods] = React.useState<Set<ContactMethodType>>(
    new Set(data?.contactMethods?.map((c) => c.method) || [])
  );

  const [values, setValues] = React.useState<Partial<Record<ContactMethodType, string>>>(
    data?.contactMethods?.reduce(
      (acc, c) => ({ ...acc, [c.method]: c.value }),
      {} as Partial<Record<ContactMethodType, string>>
    ) || {}
  );

  const [errors, setErrors] = React.useState<Partial<Record<ContactMethodType, string>>>({});

  // Track previous contactMethods to avoid unnecessary onChange calls
  const prevContactMethodsRef = React.useRef<string>('');

  // Update parent when values change (with deep comparison to prevent infinite loops)
  React.useEffect(() => {
    const contactMethods: ContactMethod[] = [];

    selectedMethods.forEach((method) => {
      const value = values[method];
      if (value) {
        contactMethods.push({ method, value });
      }
    });

    // Deep compare to avoid unnecessary parent updates
    const newContactMethodsJson = JSON.stringify(contactMethods);
    if (newContactMethodsJson !== prevContactMethodsRef.current) {
      prevContactMethodsRef.current = newContactMethodsJson;
      onChange({ contactMethods });
    }
  }, [selectedMethods, values, onChange]);

  // Toggle contact method selection
  const toggleMethod = (method: ContactMethodType) => {
    setSelectedMethods((prev) => {
      const next = new Set(prev);
      if (next.has(method)) {
        next.delete(method);
        // Clear value and error
        setValues((v) => ({ ...v, [method]: '' }));
        setErrors((e) => ({ ...e, [method]: '' }));
      } else {
        next.add(method);
      }
      return next;
    });
  };

  // Update value
  const updateValue = (method: ContactMethodType, value: string) => {
    setValues((prev) => ({ ...prev, [method]: value }));

    // Validate
    const option = CONTACT_OPTIONS.find((o) => o.method === method);
    if (option && value) {
      const isValid = option.validation(value);
      setErrors((prev) => ({
        ...prev,
        [method]: isValid ? '' : `${option.label} non valido`,
      }));
    } else {
      setErrors((prev) => ({ ...prev, [method]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Label className="text-base font-semibold">
          Come vuoi essere contattato?
        </Label>
        <p className="text-sm text-slate-500 mt-1">
          Seleziona almeno un metodo di contatto. I tuoi dati non saranno mai visibili pubblicamente.
        </p>
      </div>

      {/* Contact Method Cards */}
      <div className="space-y-4">
        {CONTACT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedMethods.has(option.method);
          const value = values[option.method] || '';
          const error = errors[option.method];

          return (
            <Card
              key={option.method}
              className={cn(
                "transition-all",
                isSelected
                  ? "ring-2 ring-emerald-500 border-emerald-200"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <CardContent className="p-4">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => toggleMethod(option.method)}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        isSelected ? option.color : "bg-slate-100 text-slate-600"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-900">{option.label}</p>
                      <p className="text-xs text-slate-500">{option.description}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleMethod(option.method)}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    )}
                  >
                    {isSelected ? (
                      <svg
                        className="w-4 h-4"
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
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Input Field (shown when selected) */}
                {isSelected && (
                  <div className="space-y-2">
                    <Input
                      value={value}
                      onChange={(e) => updateValue(option.method, e.target.value)}
                      placeholder={option.placeholder}
                      className={cn(
                        "rounded-xl",
                        error && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                    {error && (
                      <p className="text-xs text-red-500">{error}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Privacy Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>I tuoi dati sono protetti</strong>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              I metodi di contatto non vengono mai mostrati pubblicamente.
              Gli interessati potranno contattarti solo cliccando sui bottoni
              dedicati, che aprono l'app corrispondente (WhatsApp, email, ecc.)
              senza rivelare i tuoi dati.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Validation Message */}
      {selectedMethods.size === 0 && (
        <p className="text-sm text-amber-600">
          ⚠️ Seleziona almeno un metodo di contatto per continuare
        </p>
      )}

      {/* Check for empty values */}
      {selectedMethods.size > 0 &&
        Array.from(selectedMethods).some((m) => !values[m]) && (
          <p className="text-sm text-amber-600">
            ⚠️ Compila tutti i metodi di contatto selezionati
          </p>
        )}
    </div>
  );
}
