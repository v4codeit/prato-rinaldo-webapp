'use client';

import { useState, useEffect } from 'react';
import { useUI } from '@/lib/context/ui-context';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Info,
  MessageCircle,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MioCondominioClientProps {
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  adminWhatsApp?: string;
}

export function MioCondominioClient({
  contactEmail,
  contactPhone,
  contactAddress,
  adminWhatsApp = '+393331234567', // Default placeholder
}: MioCondominioClientProps) {
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const { isCondominioFullscreen, setCondominioFullscreen } = useUI();

  // MioCondominio iframe URL with PID
  const iframeSrc = 'https://amm.miocondominio.eu/?NODEMO=1&ForcePID=6738';

  // WhatsApp message for requesting credentials
  const whatsAppMessage = encodeURIComponent(
    'Salve, sono un residente di Prato Rinaldo. Vorrei richiedere le credenziali di accesso per il portale MioCondominio. Grazie!'
  );
  const whatsAppLink = `https://wa.me/${adminWhatsApp.replace(/\D/g, '')}?text=${whatsAppMessage}`;

  // Cleanup fullscreen state on unmount
  useEffect(() => {
    return () => {
      setCondominioFullscreen(false);
    };
  }, [setCondominioFullscreen]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setCondominioFullscreen(!isCondominioFullscreen);
  };

  // Exit fullscreen and go back
  const handleBack = () => {
    setCondominioFullscreen(false);
    window.history.back();
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-white',
        isCondominioFullscreen
          ? 'fixed inset-0 z-[100]'
          : 'h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]'
      )}
    >
      {/* Compact Header - Always visible for navigation */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm',
          isCondominioFullscreen ? 'sticky top-0 z-10' : ''
        )}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Mio Condominio</h1>
            {!isCondominioFullscreen && (
              <p className="text-xs text-muted-foreground">
                Gestione condominiale online
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setShowInfo(!showInfo)}
            title="Info e contatti"
          >
            <Info className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={toggleFullscreen}
            title={isCondominioFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
          >
            {isCondominioFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Info Alert Banner - Collapsible */}
      {showInfo && !isCondominioFullscreen && (
        <div className="p-4 space-y-3 bg-slate-50 border-b">
          {/* External Service Warning */}
          <Alert className="bg-amber-50 border-amber-200">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Servizio esterno:</strong> Questo portale è gestito da{' '}
              <a
                href="https://www.miocondominio.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-900"
              >
                MioCondominio.eu
              </a>
              . Prato Rinaldo non è responsabile dei contenuti e della gestione del servizio.
            </AlertDescription>
          </Alert>

          {/* Credentials Request */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Non hai le credenziali?</strong> Contatta l&apos;amministratore del condominio per
              richiedere l&apos;accesso al portale.
            </AlertDescription>
          </Alert>

          {/* Contact Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 rounded-full"
              asChild
            >
              <a href={whatsAppLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                Richiedi credenziali via WhatsApp
              </a>
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <a href={`mailto:${contactEmail}`}>
                Scrivi Email
              </a>
            </Button>
            {contactPhone && (
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <a href={`tel:${contactPhone}`}>
                  Chiama
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Iframe Container */}
      <div className="flex-1 relative bg-white">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium text-slate-900">Caricamento portale...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Connessione a MioCondominio.eu in corso
                </p>
              </div>
            </div>
          </div>
        )}

        <iframe
          src={iframeSrc}
          className="w-full h-full border-0"
          title="MioCondominio Portal"
          onLoad={() => setLoading(false)}
          allow="fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>

      {/* Mini Footer - Only in non-fullscreen */}
      {!isCondominioFullscreen && (
        <div className="bg-slate-50 border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            Portale gestito da{' '}
            <a
              href="https://www.miocondominio.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              MioCondominio.eu
              <ExternalLink className="h-3 w-3" />
            </a>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-auto py-1"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-3 w-3 mr-1" />
            Espandi
          </Button>
        </div>
      )}
    </div>
  );
}
