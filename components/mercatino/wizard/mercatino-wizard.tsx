'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/utils/constants';
import type { Route } from 'next';

// Import wizard steps
import { WizardStep1, type WizardStep1Data } from './wizard-step-1';
import { WizardStep2Object, WizardStep2RealEstate, type WizardStep2ObjectData, type WizardStep2RealEstateData } from './wizard-step-2';
import { WizardStep3, type WizardStep3Data } from './wizard-step-3';
import { WizardStep4, type WizardStep4Data } from './wizard-step-4';
import { WizardStep5, type WizardStep5Data } from './wizard-step-5';

// Combined wizard data type
export interface MercatinoWizardData {
  step1: WizardStep1Data;
  step2: WizardStep2ObjectData | WizardStep2RealEstateData;
  step3: WizardStep3Data;
  step4: WizardStep4Data;
  step5: WizardStep5Data;
}

export interface MercatinoWizardProps {
  /** Initial data for editing an existing item */
  initialData?: Partial<MercatinoWizardData>;
  /** Item ID if editing */
  itemId?: string;
  /** Callback on successful submission */
  onSuccess?: (itemId: string) => void;
  /** Callback on cancel */
  onCancel?: () => void;
}

// Step configuration
const STEPS = [
  { id: 1, title: 'Tipo', description: 'Cosa vuoi pubblicare?' },
  { id: 2, title: 'Dettagli', description: 'Descrivi il tuo annuncio' },
  { id: 3, title: 'Foto', description: 'Aggiungi le immagini' },
  { id: 4, title: 'Contatti', description: 'Come vuoi essere contattato?' },
  { id: 5, title: 'Conferma', description: 'Rivedi e pubblica' },
] as const;

// Animation variants
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

export function MercatinoWizard({
  initialData,
  itemId,
  onSuccess,
  onCancel,
}: MercatinoWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [direction, setDirection] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Wizard data state
  const [wizardData, setWizardData] = React.useState<Partial<MercatinoWizardData>>({
    step1: initialData?.step1 || { listingType: 'objects' },
    step2: initialData?.step2,
    step3: initialData?.step3 || { images: [] },
    step4: initialData?.step4 || { contactMethods: [] },
    step5: initialData?.step5 || { agreeToTerms: false, wantsToDonate: false, donationAmountCents: 0 },
  });

  // Determine if listing is real estate
  const isRealEstate = wizardData.step1?.listingType === 'real_estate';

  // Step completion status
  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(wizardData.step1?.listingType);
      case 2: {
        const hasBasicInfo = !!(wizardData.step2?.title && wizardData.step2?.description);
        // For objects, categoryId is required
        if (!isRealEstate) {
          return hasBasicInfo && !!(wizardData.step2 as any)?.categoryId;
        }
        return hasBasicInfo;
      }
      case 3:
        return (wizardData.step3?.images?.length ?? 0) > 0;
      case 4:
        return (wizardData.step4?.contactMethods?.length ?? 0) > 0;
      case 5:
        return wizardData.step5?.agreeToTerms === true;
      default:
        return false;
    }
  };

  // Can proceed to next step
  const canProceed = isStepComplete(currentStep);

  // Progress percentage
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  // Navigation handlers
  const goToStep = (step: number) => {
    if (step < currentStep || isStepComplete(currentStep)) {
      setDirection(step > currentStep ? 1 : -1);
      setCurrentStep(step);
      setError(null);
    }
  };

  const goNext = () => {
    if (canProceed && currentStep < STEPS.length) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
      setError(null);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
      setError(null);
    }
  };

  // Update wizard data for a specific step
  // useCallback stabilizes the function reference to prevent infinite loops in child useEffect
  const updateStepData = React.useCallback(<K extends keyof MercatinoWizardData>(
    step: K,
    data: Partial<MercatinoWizardData[K]>
  ) => {
    setWizardData((prev) => ({
      ...prev,
      [step]: { ...(prev[step] || {}), ...data },
    }));
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    if (!isStepComplete(5)) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Import and call server action
      const { createMercatinoItem, updateMercatinoItem } = await import('@/app/actions/mercatino');

      const isEditing = !!itemId;
      const result = isEditing
        ? await updateMercatinoItem(itemId, wizardData as any)
        : await createMercatinoItem(wizardData as any);

      if ('error' in result && result.error) {
        setError(result.error);
        toast.error('Errore', {
          description: result.error || 'Si è verificato un errore. Riprova.',
          duration: 5000,
        });
        return;
      }

      // Success - extract itemId from result
      const itemIdFromResult = 'itemId' in result ? result.itemId : undefined;

      // Show appropriate toast based on action type and donation status
      const wantsToDonate = wizardData.step5?.wantsToDonate;

      if (wantsToDonate) {
        toast.info('Annuncio creato!', {
          description: 'Completa la donazione per supportare il comitato.',
          duration: 5000,
        });
        // TODO: Redirect to Stripe donation page when implemented
      } else if (isEditing) {
        toast.success('Modifiche salvate!', {
          description: "L'annuncio è stato aggiornato e inviato nuovamente in moderazione.",
          duration: 5000,
        });
      } else {
        toast.success('Annuncio inviato!', {
          description: 'Il tuo annuncio è stato inviato ai moderatori. Riceverai una notifica quando sarà approvato.',
          duration: 5000,
        });
      }

      if (onSuccess && itemIdFromResult) {
        onSuccess(itemIdFromResult);
      } else if (itemIdFromResult) {
        router.push(`${ROUTES.MERCATINO}/${itemIdFromResult}` as Route);
      }
    } catch (err) {
      console.error('Failed to submit:', err);
      setError('Si è verificato un errore. Riprova.');
      toast.error('Errore', {
        description: 'Si è verificato un errore. Riprova.',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push(ROUTES.MERCATINO as Route);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <WizardStep1
            data={wizardData.step1}
            onChange={(data) => updateStepData('step1', data)}
          />
        );

      case 2:
        return isRealEstate ? (
          <WizardStep2RealEstate
            data={wizardData.step2 as WizardStep2RealEstateData}
            realEstateType={wizardData.step1?.realEstateType}
            onChange={(data) => updateStepData('step2', data)}
          />
        ) : (
          <WizardStep2Object
            data={wizardData.step2 as WizardStep2ObjectData}
            objectType={wizardData.step1?.objectType}
            onChange={(data) => updateStepData('step2', data)}
          />
        );

      case 3:
        return (
          <WizardStep3
            data={wizardData.step3}
            onChange={(data) => updateStepData('step3', data)}
          />
        );

      case 4:
        return (
          <WizardStep4
            data={wizardData.step4}
            onChange={(data) => updateStepData('step4', data)}
          />
        );

      case 5:
        return (
          <WizardStep5
            wizardData={wizardData as MercatinoWizardData}
            data={wizardData.step5}
            onChange={(data) => updateStepData('step5', data)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container max-w-2xl mx-auto px-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-14">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>

            <h1 className="font-semibold text-slate-900">
              {itemId ? 'Modifica Annuncio' : 'Nuovo Annuncio'}
            </h1>

            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="h-1 -mb-px" />

          {/* Step Indicators */}
          <div className="flex justify-between py-3">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                disabled={step.id > currentStep && !isStepComplete(currentStep)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-colors",
                  step.id === currentStep
                    ? "text-emerald-600"
                    : step.id < currentStep || isStepComplete(step.id)
                      ? "text-slate-600 cursor-pointer hover:text-emerald-600"
                      : "text-slate-300 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    step.id === currentStep
                      ? "bg-emerald-600 text-white"
                      : step.id < currentStep
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-100 text-slate-400"
                  )}
                >
                  {step.id < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-xs font-medium hidden sm:block">
                  {step.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Step Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {STEPS[currentStep - 1].title}
          </h2>
          <p className="text-slate-600 mt-1">
            {STEPS[currentStep - 1].description}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Animated Step Content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={goBack}
              disabled={currentStep === 1}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>

            {/* Next/Submit Button */}
            {currentStep < STEPS.length ? (
              <Button
                onClick={goNext}
                disabled={!canProceed}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700"
              >
                Avanti
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed || isSubmitting}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Pubblicazione...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Pubblica Annuncio
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
