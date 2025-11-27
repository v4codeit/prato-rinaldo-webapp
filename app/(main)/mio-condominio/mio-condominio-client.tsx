'use client';

import { useState, useEffect } from 'react';
import { Maximize2, Minimize2, InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MioCondominioClientProps {
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

const IFRAME_URL = 'https://amm.miocondominio.eu/?NODEMO=1&ForcePID=6738';

export function MioCondominioClient({
  contactEmail,
  contactPhone,
  contactAddress,
}: MioCondominioClientProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ESC key handler - chiude la vista espansa
  useEffect(() => {
    if (!isExpanded) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  // Body scroll lock quando espanso
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  if (isExpanded) {
    return <ExpandedView onClose={() => setIsExpanded(false)} />;
  }

  const hasContacts = Boolean(contactEmail || contactPhone || contactAddress);

  return (
    <NormalView
      contactEmail={contactEmail}
      contactPhone={contactPhone}
      contactAddress={contactAddress}
      hasContacts={hasContacts}
      onExpand={() => setIsExpanded(true)}
    />
  );
}

// ============================================
// NORMAL VIEW
// ============================================

interface NormalViewProps {
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  hasContacts: boolean;
  onExpand: () => void;
}

function NormalView({
  contactEmail,
  contactPhone,
  contactAddress,
  hasContacts,
  onExpand,
}: NormalViewProps) {
  return (
    <div className="container py-6 space-y-6">
      {/* Intestazione */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mio Condominio</h1>
        <p className="text-muted-foreground mt-2">
          Accedi al portale di gestione condominiale online
        </p>
      </div>

      {/* Alert informativo credenziali */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Credenziali di accesso</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Per accedere a MioCondominio sono necessarie le credenziali fornite
            dall&apos;amministratore del condominio.
          </p>
          {hasContacts ? (
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-medium">Se non hai ricevuto le credenziali, contatta:</p>
              {contactEmail && (
                <p>
                  <span className="font-medium">Email:</span>{' '}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-primary hover:underline"
                  >
                    {contactEmail}
                  </a>
                </p>
              )}
              {contactPhone && (
                <p>
                  <span className="font-medium">Telefono:</span>{' '}
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-primary hover:underline"
                  >
                    {contactPhone}
                  </a>
                </p>
              )}
              {contactAddress && (
                <p>
                  <span className="font-medium">Indirizzo:</span> {contactAddress}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm">
              Se non hai le credenziali, contatta l&apos;amministrazione del condominio.
            </p>
          )}
        </AlertDescription>
      </Alert>

      {/* Iframe MioCondominio con pulsante Expand */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Portale MioCondominio</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExpand}
            aria-label="Espandi a schermo intero"
            title="Espandi a schermo intero"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full">
            <iframe
              src={IFRAME_URL}
              className="w-full h-[600px] md:h-[800px] border-0"
              scrolling="auto"
              allow="clipboard-write"
              title="Mio Condominio - Gestione Condominiale"
            >
              <p>
                Il tuo browser non supporta gli iframe.{' '}
                <a
                  href={IFRAME_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Clicca qui per accedere al servizio
                </a>
              </p>
            </iframe>
          </div>
        </CardContent>
      </Card>

      {/* Note aggiuntive */}
      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Nota:</strong> Il servizio MioCondominio è gestito da Danea Soft. Per
          supporto tecnico sul servizio, contatta direttamente{' '}
          <a
            href="https://www.miocondominio.eu/contatti"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            l&apos;assistenza MioCondominio
          </a>
          .
        </p>
      </div>
    </div>
  );
}

// ============================================
// EXPANDED VIEW
// ============================================

interface ExpandedViewProps {
  onClose: () => void;
}

function ExpandedView({ onClose }: ExpandedViewProps) {
  return (
    <div className="fixed inset-0 top-16 z-40 bg-background">
      {/* Card Header con pulsante chiudi */}
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Portale MioCondominio</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Riduci a dimensione normale"
            title="Riduci a dimensione normale (ESC)"
          >
            <Minimize2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Iframe fullscreen */}
      <div className="h-[calc(100vh-8rem)]">
        <iframe
          src={IFRAME_URL}
          className="w-full h-full border-0"
          scrolling="auto"
          allow="clipboard-write"
          title="Mio Condominio - Gestione Condominiale"
        >
          <p className="p-6">
            Il tuo browser non supporta gli iframe.{' '}
            <a
              href={IFRAME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Clicca qui per accedere al servizio
            </a>
          </p>
        </iframe>
      </div>
    </div>
  );
}
