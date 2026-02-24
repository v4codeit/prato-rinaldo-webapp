'use client';

import * as React from 'react';
import { Phone, Mail, MessageCircle, Send, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils/cn';
import { MERCATINO_CONTACT_METHOD, MERCATINO_CONTACT_METHOD_LABELS } from '@/lib/utils/constants';

// Contact method type from constants
type ContactMethodType = typeof MERCATINO_CONTACT_METHOD[keyof typeof MERCATINO_CONTACT_METHOD];

export interface ContactInfo {
  method: ContactMethodType;
  value: string;
}

export interface ContactButtonsProps {
  /** Array of available contact methods */
  contacts: ContactInfo[];
  /** Seller name for personalized messages */
  sellerName?: string;
  /** Item title for reference in messages */
  itemTitle?: string;
  /** Item ID for tracking */
  itemId?: string;
  /** Callback when contact is initiated (for analytics) */
  onContact?: (method: ContactMethodType) => void;
  /** Display variant */
  variant?: 'buttons' | 'list' | 'compact';
  /** Additional className */
  className?: string;
}

// Icon mapping for contact methods
const CONTACT_ICONS: Record<ContactMethodType, React.ReactNode> = {
  whatsapp: <MessageCircle className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  telegram: <Send className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
};

// Color mapping for contact methods
const CONTACT_COLORS: Record<ContactMethodType, string> = {
  whatsapp: 'bg-[#25D366] hover:bg-[#20BD5A] text-white',
  email: 'bg-blue-500 hover:bg-blue-600 text-white',
  telegram: 'bg-[#0088cc] hover:bg-[#0077B5] text-white',
  phone: 'bg-emerald-600 hover:bg-emerald-700 text-white',
};

// Generate contact URL
function getContactUrl(
  method: ContactMethodType,
  value: string,
  itemTitle?: string,
  sellerName?: string
): string {
  const encodedMessage = encodeURIComponent(
    `Ciao${sellerName ? ` ${sellerName}` : ''}! Sono interessato all'annuncio "${itemTitle || 'sul Mercatino'}" su Prato Rinaldo.`
  );

  switch (method) {
    case 'whatsapp':
      // WhatsApp deep link - assumes value is phone number
      const whatsappNumber = value.replace(/\D/g, ''); // Remove non-digits
      return `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    case 'email':
      return `mailto:${value}?subject=${encodeURIComponent(`Interesse per: ${itemTitle || 'Annuncio Mercatino'}`)}&body=${encodedMessage}`;

    case 'telegram':
      // Telegram deep link - assumes value is username (with or without @)
      const username = value.startsWith('@') ? value.slice(1) : value;
      return `https://t.me/${username}`;

    case 'phone':
      return `tel:${value}`;

    default:
      return '#';
  }
}

// Format contact value for display (hide full info)
function formatContactForDisplay(method: ContactMethodType, value: string): string {
  switch (method) {
    case 'phone':
    case 'whatsapp':
      // Show only last 4 digits
      const digits = value.replace(/\D/g, '');
      return `***${digits.slice(-4)}`;

    case 'email':
      // Show first 2 chars and domain
      const [local, domain] = value.split('@');
      return `${local.slice(0, 2)}***@${domain}`;

    case 'telegram':
      // Show username
      return value.startsWith('@') ? value : `@${value}`;

    default:
      return '***';
  }
}

/**
 * Contact buttons for Mercatino items
 * Opens external apps (WhatsApp, Telegram) or native handlers (email, phone)
 * Never exposes full contact info publicly
 */
export function ContactButtons({
  contacts,
  sellerName,
  itemTitle,
  itemId,
  onContact,
  variant = 'buttons',
  className,
}: ContactButtonsProps) {
  const [copiedMethod, setCopiedMethod] = React.useState<ContactMethodType | null>(null);

  // Handle contact click
  const handleContact = (contact: ContactInfo) => {
    onContact?.(contact.method);

    const url = getContactUrl(contact.method, contact.value, itemTitle, sellerName);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Copy contact value
  const handleCopy = async (contact: ContactInfo) => {
    try {
      await navigator.clipboard.writeText(contact.value);
      setCopiedMethod(contact.method);
      setTimeout(() => setCopiedMethod(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (contacts.length === 0) {
    return null;
  }

  // Buttons variant (primary display)
  if (variant === 'buttons') {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {contacts.map((contact) => (
          <Button
            key={contact.method}
            onClick={() => handleContact(contact)}
            className={cn(
              "rounded-full shadow-sm transition-all",
              CONTACT_COLORS[contact.method]
            )}
            size="lg"
          >
            {CONTACT_ICONS[contact.method]}
            <span className="ml-2">{MERCATINO_CONTACT_METHOD_LABELS[contact.method]}</span>
            <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
          </Button>
        ))}
      </div>
    );
  }

  // List variant (with copy option)
  if (variant === 'list') {
    return (
      <div className={cn("space-y-2", className)}>
        {contacts.map((contact) => (
          <div
            key={contact.method}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                CONTACT_COLORS[contact.method]
              )}>
                {CONTACT_ICONS[contact.method]}
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {MERCATINO_CONTACT_METHOD_LABELS[contact.method]}
                </p>
                <p className="text-sm text-slate-500">
                  {formatContactForDisplay(contact.method, contact.value)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(contact)}
                className="h-8 w-8"
              >
                {copiedMethod === contact.method ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleContact(contact)}
                className={cn("rounded-full", CONTACT_COLORS[contact.method])}
              >
                Contatta
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Compact variant (icon buttons only)
  return (
    <div className={cn("flex gap-1", className)}>
      {contacts.map((contact) => (
        <Button
          key={contact.method}
          variant="ghost"
          size="icon"
          onClick={() => handleContact(contact)}
          className={cn(
            "h-9 w-9 rounded-full transition-colors",
            "hover:text-white",
            `hover:${CONTACT_COLORS[contact.method].split(' ')[0]}`
          )}
          title={MERCATINO_CONTACT_METHOD_LABELS[contact.method]}
        >
          {CONTACT_ICONS[contact.method]}
        </Button>
      ))}
    </div>
  );
}

/**
 * Contact dialog for when user needs to see full contact options
 * Used in detail page before revealing contacts
 */
export function ContactDialog({
  contacts,
  sellerName,
  itemTitle,
  itemId,
  onContact,
  trigger,
  className,
}: ContactButtonsProps & {
  trigger?: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700">
            <MessageCircle className="h-4 w-4 mr-2" />
            Contatta il venditore
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contatta {sellerName || 'il venditore'}</DialogTitle>
          <DialogDescription>
            Scegli come vuoi contattare il venditore per "{itemTitle || 'questo annuncio'}".
            I contatti si apriranno nell'app corrispondente.
          </DialogDescription>
        </DialogHeader>

        <ContactButtons
          contacts={contacts}
          sellerName={sellerName}
          itemTitle={itemTitle}
          itemId={itemId}
          onContact={onContact}
          variant="list"
          className="mt-4"
        />

        <p className="text-xs text-slate-500 mt-4 text-center">
          I tuoi dati di contatto non vengono mai condivisi pubblicamente
        </p>
      </DialogContent>
    </Dialog>
  );
}
