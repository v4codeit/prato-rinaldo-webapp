# MARKETPLACE - Sistema Annunci Compravendita | Task List Completa

## 📊 OVERVIEW

**Feature:** Marketplace di annunci per compravendita tra residenti, con categorie dinamiche, moderazione e visibilità pubblica/privata.

**Stato Attuale:** 60% completo - FUNZIONALE MA INCOMPLETO
- ✅ Lista e dettaglio annunci funzionanti
- ✅ Sistema categorie dinamiche da DB
- ✅ Sistema moderazione pre-pubblicazione
- ✅ Visibilità pubblica/privata
- ✅ Storage bucket configurato
- ❌ **Upload immagini UI completamente ASSENTE**
- ❌ Sistema contatti venditore NON implementato
- ❌ Pagina edit annuncio NON esistente
- ❌ Dashboard "I Miei Annunci" NON esistente
- ❌ Ricerca e filtri NON implementati
- ❌ Paginazione NON implementata

**Priorità Generale:** 🟡 **ALTA** - Feature funzionante ma incompleta

**Problemi Critici:** 2
**Feature Mancanti:** 7
**Miglioramenti Richiesti:** 6

---

## 🚨 PROBLEMI CRITICI DA RISOLVERE

### 🔴 PROBLEMA 1: Upload Immagini UI Completamente Assente
**Gravità:** ⚡ BLOCCA FEATURE
**Descrizione:**
Il form `/marketplace/new` NON ha campo per upload immagini. Lo storage bucket esiste e funziona, ma:
- Nessun input file nel form
- Campo `images` è JSON parse ma nessuno lo popola
- **Risultato:** Tutti gli annunci sono SENZA IMMAGINI

**Conseguenze:**
- Marketplace inutilizzabile per venditori
- Nessuna foto prodotto = nessuna fiducia buyer
- Feature core completamente mancante

**File Coinvolti:**
- `app/(private)/marketplace/new/page.tsx`
- Form non ha MultiImageUpload component

---

### 🟡 PROBLEMA 2: Policy RLS is_private Incompleta
**Gravità:** 🟡 Media - Sicurezza
**Descrizione:**
La policy `marketplace_select_approved` ignora il campo `is_private`:

```sql
-- Policy attuale (INCOMPLETA)
CREATE POLICY "marketplace_select_approved"
ON marketplace_items FOR SELECT
USING (status = 'approved');
```

Il controllo `is_private` è solo a livello applicazione in `getApprovedItems()`, ma:
- **Bypass possibile** se si usa Supabase client direttamente
- Utenti non verificati potrebbero vedere annunci privati

**Fix Necessario:**
```sql
-- Policy corretta (CON CHECK is_private)
CREATE POLICY "marketplace_select_approved"
ON marketplace_items FOR SELECT
USING (
  status = 'approved' AND (
    is_private = false OR
    (is_private = true AND is_verified())
  )
);
```

---

## 📋 TASK GROUPS

---

## GROUP 1: Upload Immagini (MASSIMA PRIORITÀ)

**Priorità:** 🔴 P0 (CRITICA)
**Dipendenze:** Nessuna (riutilizza MultiImageUpload da Community Pro)
**Stima Complessità:** 🔥 Alta (8-10 ore)
**File Coinvolti:**
- `app/(private)/marketplace/new/page.tsx`
- `components/organisms/multi-image-upload.tsx` (riutilizzare)
- `app/actions/marketplace.ts`
- `lib/utils/validators.ts`

### Task 1.1: Aggiornare Validator Zod

#### Subtask 1.1.1: Validare array immagini
- [ ] Modificare `createMarketplaceItemSchema`
- [ ] Campo `images`: array di URL (min 1, max 6)
- [ ] Validare formato URL
- [ ] Error messages chiari

**Codice Fix:**
```typescript
// In lib/utils/validators.ts

export const createMarketplaceItemSchema = z.object({
  title: z.string()
    .min(5, 'Il titolo deve contenere almeno 5 caratteri')
    .max(500),

  description: z.string()
    .min(20, 'La descrizione deve contenere almeno 20 caratteri')
    .max(5000),

  price: z.number().int()
    .min(0, 'Il prezzo deve essere positivo'),

  categoryId: z.string().uuid('Categoria non valida'),

  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),

  isPrivate: z.boolean().default(false),

  committeePercentage: z.number().int()
    .min(0).max(100).default(0),

  // NUOVO: Validazione immagini
  images: z.array(z.string().url('URL immagine non valido'))
    .min(1, 'Carica almeno 1 immagine')
    .max(6, 'Massimo 6 immagini')
    .default([]),
});
```

**Acceptance Criteria:**
- [ ] Validazione min 1 immagine enforced
- [ ] Validazione max 6 immagini enforced
- [ ] Error messages chiari

### Task 1.2: Integrare MultiImageUpload nel Form

#### Subtask 1.2.1: Aggiungere component al form
- [ ] Importare `MultiImageUpload` da organisms
- [ ] Posizionare dopo campo descrizione
- [ ] Props: bucket='marketplace-items', maxImages=6, maxSizeMB=10
- [ ] Salvare array URLs in state

#### Subtask 1.2.2: Implementare state management
- [ ] `const [images, setImages] = useState<string[]>([])`
- [ ] Callback `onImagesChange={setImages}`
- [ ] Validare array prima di submit
- [ ] Convertire a JSON string per FormData

#### Subtask 1.2.3: Aggiornare submit handler
- [ ] Aggiungere `images: JSON.stringify(images)` a FormData
- [ ] Validare con Zod prima di inviare
- [ ] Gestire errori validazione con toast

**Dettagli Tecnici:**
```typescript
// In app/(private)/marketplace/new/page.tsx

'use client';

import { useState, useTransition } from 'react';
import { MultiImageUpload } from '@/components/organisms/multi-image-upload';
import { createMarketplaceItem } from '@/app/actions/marketplace';
import { toast } from 'sonner';

export default function NewMarketplacePage() {
  const [images, setImages] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validazione immagini
    if (images.length === 0) {
      toast.error('Carica almeno 1 immagine del prodotto');
      return;
    }

    if (images.length > 6) {
      toast.error('Massimo 6 immagini permesse');
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append('images', JSON.stringify(images));

    startTransition(async () => {
      const result = await createMarketplaceItem(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Annuncio creato! Sarà visibile dopo la moderazione.');
        router.push('/marketplace');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Altri campi... */}

      {/* Upload Immagini */}
      <div className="space-y-2">
        <Label>Foto Prodotto *</Label>
        <MultiImageUpload
          bucket="marketplace-items"
          currentImages={images}
          onImagesChange={setImages}
          maxImages={6}
          maxSizeMB={10}
          label="Foto Prodotto"
        />
        <p className="text-sm text-muted-foreground">
          Carica da 1 a 6 foto del prodotto. La prima immagine sarà la copertina.
        </p>
      </div>

      {/* Submit buttons... */}
    </form>
  );
}
```

**Acceptance Criteria:**
- [ ] Upload integrato nel form
- [ ] Min 1 immagine enforcement
- [ ] Max 6 immagini enforcement
- [ ] Prima immagine = copertina
- [ ] Validazione funzionante
- [ ] Toast errori/success

### Task 1.3: Aggiornare Server Action createMarketplaceItem

#### Subtask 1.3.1: Processare array immagini
- [ ] Parsare JSON da FormData
- [ ] Validare array con Zod
- [ ] Gestire errori parsing

**Codice Fix:**
```typescript
// In app/actions/marketplace.ts, funzione createMarketplaceItem

export async function createMarketplaceItem(formData: FormData) {
  // ... auth checks ...

  try {
    const parsed = createMarketplaceItemSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      price: formData.get('price') ? parseFloat(formData.get('price') as string) : 0,
      categoryId: formData.get('categoryId'),
      condition: formData.get('condition'),
      isPrivate: formData.get('isPrivate') === 'true',
      committeePercentage: formData.get('committeePercentage')
        ? parseInt(formData.get('committeePercentage') as string)
        : 0,

      // NUOVO: Parse images array
      images: formData.get('images')
        ? JSON.parse(formData.get('images') as string)
        : [],
    });

    if (!parsed.success) {
      return { error: parsed.error.errors[0].message };
    }

    // Insert with images
    const { data: item, error } = await supabase
      .from('marketplace_items')
      .insert({
        ...parsed.data,
        seller_id: user.id,
        tenant_id: profile.tenant_id,
        status: 'pending',
      })
      .select()
      .single();

    // ... resto della logica ...
  } catch (error: any) {
    console.error('Create item error:', error);
    return { error: error.message || 'Errore durante la creazione' };
  }
}
```

**Acceptance Criteria:**
- [ ] Action salva array immagini correttamente
- [ ] Validazione Zod funziona
- [ ] Errori gestiti con try/catch

---

## GROUP 2: Galleria Immagini con Lightbox

**Priorità:** 🔴 P0 (CRITICA)
**Dipendenze:** GROUP 1 completato
**Stima Complessità:** 🔥 Media (6-8 ore)
**File Coinvolti:**
- `app/(public)/marketplace/[id]/page.tsx`
- `components/organisms/image-gallery.tsx` (NUOVO)
- `components/molecules/lightbox.tsx` (NUOVO - opzionale)

### Task 2.1: Creare Componente ImageGallery

#### Subtask 2.1.1: Implementare UI galleria
- [ ] Immagine principale grande (aspect-square)
- [ ] Grid thumbnail sotto (max 5 + indicatore "più")
- [ ] Click thumbnail cambia immagine principale
- [ ] Indicatore immagine corrente (es: "3 / 6")

#### Subtask 2.1.2: Aggiungere navigazione
- [ ] Frecce prev/next su immagine principale
- [ ] Keyboard navigation (arrow keys)
- [ ] Swipe su mobile (opzionale)

#### Subtask 2.1.3: Click per lightbox (opzionale)
- [ ] Click immagine principale apre lightbox
- [ ] Lightbox fullscreen con navigazione
- [ ] Close con X o ESC
- [ ] Zoom (opzionale)

**Dettagli Tecnici:**
```typescript
// components/organisms/image-gallery.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
        <p className="text-muted-foreground">Nessuna immagine</p>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Immagine Principale */}
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted group">
        <Image
          src={images[currentIndex]}
          alt={`Immagine ${currentIndex + 1}`}
          fill
          className="object-cover cursor-pointer"
          onClick={() => setLightboxOpen(true)}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Indicatore */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={index}
              type="button"
              className={`relative aspect-square overflow-hidden rounded-md border-2 ${
                index === currentIndex
                  ? 'border-primary'
                  : 'border-transparent hover:border-muted-foreground/50'
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              <Image src={image} alt={`Thumb ${index + 1}`} fill className="object-cover" />
            </button>
          ))}

          {/* Indicatore "+ N altre" */}
          {images.length > 5 && (
            <div className="relative aspect-square flex items-center justify-center bg-muted rounded-md border-2 border-dashed">
              <span className="text-sm font-medium">+{images.length - 5}</span>
            </div>
          )}
        </div>
      )}

      {/* Lightbox (opzionale, implementazione base) */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="relative max-w-6xl max-h-[90vh] w-full h-full">
            <Image
              src={images[currentIndex]}
              alt="Fullscreen"
              fill
              className="object-contain"
            />
          </div>

          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Galleria responsive funzionante
- [ ] Navigation prev/next smooth
- [ ] Thumbnail selezionano immagine
- [ ] Indicatore "N / Total" visibile
- [ ] Lightbox funziona (opzionale)
- [ ] Keyboard navigation (opzionale)

### Task 2.2: Integrare Galleria in Dettaglio Annuncio

#### Subtask 2.2.1: Sostituire layout attuale
- [ ] Rimuovere immagine singola + thumbnail
- [ ] Usare `<ImageGallery images={item.images} />`
- [ ] Posizionare a sinistra su desktop, top su mobile

**Acceptance Criteria:**
- [ ] Galleria visibile in dettaglio
- [ ] Layout responsive perfetto
- [ ] Tutte le immagini navigabili

---

## GROUP 3: Sistema Contatti Venditore

**Priorità:** 🔴 P0 (CRITICA)
**Dipendenze:** GROUP 1 completato
**Stima Complessità:** 🔥 Media (6-8 ore)
**File Coinvolti:**
- `app/(public)/marketplace/[id]/page.tsx`
- `components/organisms/contact-seller-form.tsx` (NUOVO)
- `app/actions/contact.ts` (NUOVO)

### Task 3.1: Decidere Sistema Contatti

#### Subtask 3.1.1: Scegliere tra 2 approcci

**Opzione A: Email Indiretta (Raccomandato)**
- Form contatto con messaggio
- Server action invia email a venditore
- Buyer rimane anonimo fino risposta
- Pro: Privacy, no spam
- Contro: Serve servizio email (Resend/SendGrid)

**Opzione B: Mostrare Contatti Diretti**
- Mostrare phone/email venditore dopo click
- Link mailto: o tel:
- Pro: Semplicissimo, nessun backend
- Contro: Zero privacy, spam possibile

**Decisione suggerita:** Opzione A (email) per privacy

### Task 3.2: Implementare Opzione A - Email Indiretta

#### Subtask 3.2.1: Setup servizio email
- [ ] Installare Resend SDK: `pnpm add resend`
- [ ] Creare API key in Resend dashboard
- [ ] Aggiungere `RESEND_API_KEY` in `.env.local`
- [ ] Creare template email

#### Subtask 3.2.2: Creare server action sendContactEmail
- [ ] File: `app/actions/contact.ts`
- [ ] Input: itemId, message, senderEmail (optional)
- [ ] Validazione: message min 20 caratteri
- [ ] Ottenere email venditore da item
- [ ] Inviare email con Resend
- [ ] Rate limiting (max 3 email/ora per item)

**Dettagli Tecnici:**
```typescript
// app/actions/contact.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

const contactSchema = z.object({
  message: z.string()
    .min(20, 'Il messaggio deve contenere almeno 20 caratteri')
    .max(1000, 'Messaggio troppo lungo'),
  senderEmail: z.string().email('Email non valida').optional(),
});

export async function sendContactEmail(itemId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Parse and validate
  const parsed = contactSchema.safeParse({
    message: formData.get('message'),
    senderEmail: formData.get('senderEmail'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    // Get item and seller info
    const { data: item, error: itemError } = await supabase
      .from('marketplace_items')
      .select(`
        *,
        seller:users!seller_id (id, name, email)
      `)
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return { error: 'Annuncio non trovato' };
    }

    if (!item.seller.email) {
      return { error: 'Il venditore non ha un\'email configurata' };
    }

    // TODO: Rate limiting check (Redis o DB table)
    // ...

    // Send email
    const { data, error: emailError } = await resend.emails.send({
      from: 'noreply@tuodominio.com',
      to: item.seller.email,
      replyTo: parsed.data.senderEmail || undefined,
      subject: `Interesse per: ${item.title}`,
      html: `
        <h2>Qualcuno è interessato al tuo annuncio</h2>
        <p><strong>Annuncio:</strong> ${item.title}</p>
        <p><strong>Messaggio:</strong></p>
        <p>${parsed.data.message}</p>
        ${parsed.data.senderEmail ? `<p><strong>Contatto:</strong> ${parsed.data.senderEmail}</p>` : ''}
        <hr />
        <p><a href="https://tuodominio.com/marketplace/${itemId}">Visualizza annuncio</a></p>
      `,
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      return { error: 'Errore durante l\'invio della email' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Contact error:', error);
    return { error: error.message || 'Errore imprevisto' };
  }
}
```

**Acceptance Criteria:**
- [ ] Email inviata correttamente
- [ ] Template email professionale
- [ ] Reply-to funzionante
- [ ] Validazione message funziona
- [ ] Error handling robusto

#### Subtask 3.2.3: Creare ContactSellerForm component
- [ ] Modal o Card con form
- [ ] Textarea messaggio (required, min 20 char)
- [ ] Input email mittente (optional)
- [ ] Button "Invia Messaggio"
- [ ] Loading state
- [ ] Toast success/error

**Dettagli Tecnici:**
```typescript
// components/organisms/contact-seller-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sendContactEmail } from '@/app/actions/contact';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

interface ContactSellerFormProps {
  itemId: string;
  sellerName: string;
}

export function ContactSellerForm({ itemId, sellerName }: ContactSellerFormProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim().length < 20) {
      toast.error('Il messaggio deve contenere almeno 20 caratteri');
      return;
    }

    const formData = new FormData();
    formData.append('message', message);
    if (email) formData.append('senderEmail', email);

    startTransition(async () => {
      const result = await sendContactEmail(itemId, formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Messaggio inviato! Il venditore ti risponderà via email.');
        setMessage('');
        setEmail('');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Contatta {sellerName}
        </CardTitle>
        <CardDescription>
          Invia un messaggio al venditore per informazioni o per organizzare l'acquisto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Messaggio *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ciao! Sono interessato a questo prodotto. Quando posso venire a vederlo?"
              rows={5}
              disabled={isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              {message.length} / 1000 caratteri (minimo 20)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">La Tua Email (opzionale)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuaemail@example.com"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Il venditore potrà risponderti direttamente a questo indirizzo.
            </p>
          </div>

          <Button type="submit" disabled={isPending || message.length < 20}>
            {isPending ? 'Invio in corso...' : 'Invia Messaggio'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Acceptance Criteria:**
- [ ] Form visualmente professionale
- [ ] Validazione funzionante
- [ ] Loading state chiaro
- [ ] Toast feedback visibile
- [ ] Email opzionale funziona

#### Subtask 3.2.4: Integrare nel dettaglio annuncio
- [ ] Sostituire button "Contatta Venditore" con ContactSellerForm
- [ ] Posizionare sotto dettagli prodotto
- [ ] Mostrare solo se annuncio non è del seller corrente

**Acceptance Criteria:**
- [ ] Form visibile in dettaglio
- [ ] Nascosto per seller dell'annuncio
- [ ] Responsive perfetto

---

## GROUP 4: Pagina Edit Annuncio

**Priorità:** 🟡 P1 (Alta)
**Dipendenze:** GROUP 1-2 completati
**Stima Complessità:** 🔥 Alta (8-10 ore)
**File Coinvolti:**
- `app/(private)/marketplace/edit/[id]/page.tsx` (NUOVO)
- `components/organisms/edit-marketplace-form.tsx` (NUOVO)

### Task 4.1: Creare Route Edit

#### Subtask 4.1.1: Verificare ownership
- [ ] Check che user.id === item.seller_id
- [ ] Redirect se non owner
- [ ] Caricare annuncio esistente

#### Subtask 4.1.2: Creare EditMarketplaceForm
- [ ] Form precompilato con dati esistenti
- [ ] Includere MultiImageUpload con immagini correnti
- [ ] Submit chiama `updateMarketplaceItem()`
- [ ] Gestire riordinamento immagini (prima = copertina)

#### Subtask 4.1.3: Implementare logica riordinamento immagini
- [ ] Drag & drop per riordinare (opzionale)
- [ ] Frecce up/down per ordinare
- [ ] Prima immagine evidenziata come "Copertina"

#### Subtask 4.1.4: Button delete annuncio
- [ ] Posizionare in fondo (variant destructive)
- [ ] Dialog conferma con warning
- [ ] Chiamare `deleteMarketplaceItem()`
- [ ] Redirect a `/marketplace` dopo delete

**Acceptance Criteria:**
- [ ] Solo owner può modificare
- [ ] Form precompilato correttamente
- [ ] Upload/delete immagini funziona
- [ ] Riordinamento funziona
- [ ] Update salva modifiche
- [ ] Delete funziona con conferma

---

## GROUP 5: Dashboard "I Miei Annunci"

**Priorità:** 🟡 P1 (Alta)
**Dipendenze:** GROUP 4 completato
**Stima Complessità:** 🔥 Media (6-8 ore)
**File Coinvolti:**
- `app/(private)/profile/my-listings/page.tsx` (NUOVO)
- `components/organisms/my-listings-table.tsx` (NUOVO)

### Task 5.1: Creare Dashboard Page

#### Subtask 5.1.1: Caricare annunci utente
- [ ] Chiamare `getMyItems()` (action già implementata)
- [ ] Includere TUTTI gli status (pending, approved, rejected, sold)
- [ ] Ordinare per created_at DESC

#### Subtask 5.1.2: Implementare tabella annunci
- [ ] Colonne: Immagine, Titolo, Prezzo, Status, Data, Azioni
- [ ] Badge status con colori (pending=giallo, approved=verde, rejected=rosso, sold=grigio)
- [ ] Actions dropdown: Modifica, Segna venduto, Elimina

#### Subtask 5.1.3: Implementare statistiche summary
- [ ] Totale annunci
- [ ] Annunci attivi (approved, non venduti)
- [ ] Annunci in moderazione (pending)
- [ ] Annunci venduti

#### Subtask 5.1.4: Button azioni rapide
- [ ] "Crea Nuovo Annuncio" (link a /marketplace/new)
- [ ] "Segna come Venduto" (solo per approved)
- [ ] "Modifica" (link a /marketplace/edit/[id])
- [ ] "Elimina" (con conferma)

**Dettagli Tecnici:**
```typescript
// components/organisms/my-listings-table.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { markItemAsSold, deleteMarketplaceItem } from '@/app/actions/marketplace';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const STATUS_VARIANTS = {
  pending: { label: 'In Moderazione', variant: 'secondary' as const },
  approved: { label: 'Pubblicato', variant: 'default' as const },
  rejected: { label: 'Rifiutato', variant: 'destructive' as const },
  sold: { label: 'Venduto', variant: 'outline' as const },
};

interface MyListingsTableProps {
  items: MarketplaceItem[];
}

export function MyListingsTable({ items }: MyListingsTableProps) {
  const router = useRouter();

  const handleMarkSold = async (id: string) => {
    if (!confirm('Segnare questo annuncio come venduto?')) return;

    const result = await markItemAsSold(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Annuncio segnato come venduto!');
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare definitivamente questo annuncio?')) return;

    const result = await deleteMarketplaceItem(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Annuncio eliminato');
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const status = STATUS_VARIANTS[item.status];
        const firstImage = item.images?.[0];

        return (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 border rounded-lg"
          >
            {/* Immagine */}
            <div className="relative w-20 h-20 flex-shrink-0">
              {firstImage ? (
                <Image
                  src={firstImage}
                  alt={item.title}
                  fill
                  className="object-cover rounded-md"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No IMG</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{item.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={status.variant}>{status.label}</Badge>
                <span className="text-sm font-medium">{item.price}€</span>
                {item.is_sold && <Badge variant="outline">Venduto</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Creato il {new Date(item.created_at).toLocaleDateString('it-IT')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {item.status === 'approved' && !item.is_sold && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkSold(item.id)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Venduto
                </Button>
              )}

              <Button variant="ghost" size="icon" asChild>
                <Link href={`/marketplace/edit/${item.id}`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Dashboard mostra tutti gli annunci utente
- [ ] Statistiche corrette
- [ ] Actions funzionanti
- [ ] Badge status colorati
- [ ] Responsive perfetto

---

## GROUP 6: Ricerca e Filtri

**Priorità:** 🟡 P1 (Alta)
**Dipendenze:** GROUP 1 completato
**Stima Complessità:** 🔥 Alta (8-10 ore)
**File Coinvolti:**
- `app/(public)/marketplace/page.tsx`
- `components/organisms/marketplace-filters.tsx` (NUOVO)
- `app/actions/marketplace.ts`

### Task 6.1: Implementare Search Bar

#### Subtask 6.1.1: Aggiungere input search
- [ ] Search bar full-width sopra grid
- [ ] Placeholder: "Cerca per titolo o descrizione..."
- [ ] Icona Search
- [ ] Debounce 300ms

#### Subtask 6.1.2: Implementare fulltext search server
- [ ] Aggiornare `getApprovedItems()` per accettare param `search`
- [ ] Query con `ilike` su title e description
- [ ] O usare indice fulltext (se creato)

**Codice Fix:**
```typescript
// In app/actions/marketplace.ts

export async function getApprovedItems(filters?: {
  search?: string;
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'recent' | 'price_asc' | 'price_desc';
}) {
  const supabase = await createClient();

  let query = supabase
    .from('marketplace_items')
    .select(`
      *,
      category:categories(id, name, slug),
      seller:users!seller_id(id, name, avatar)
    `)
    .eq('status', 'approved')
    .eq('is_sold', false);

  // Search filter
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Category filter
  if (filters?.category) {
    query = query.eq('category_id', filters.category);
  }

  // Condition filter
  if (filters?.condition) {
    query = query.eq('condition', filters.condition);
  }

  // Price range
  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  // Sorting
  switch (filters?.sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Limit
  query = query.limit(50);

  const { data, error } = await query;

  if (error) {
    console.error('Get items error:', error);
    return { items: [] };
  }

  return { items: data || [] };
}
```

**Acceptance Criteria:**
- [ ] Search filtra title e description
- [ ] Debounce evita query eccessive
- [ ] URL search params aggiornati

### Task 6.2: Implementare Filtri Avanzati

#### Subtask 6.2.1: Creare MarketplaceFilters component
- [ ] Select Categoria (carica da DB)
- [ ] Select Condizione (enum: Nuovo, Come Nuovo, Buono, Discreto, Da Sistemare)
- [ ] Range Prezzo (min/max inputs)
- [ ] Select Ordinamento (Recenti, Prezzo ↑, Prezzo ↓)
- [ ] Button "Reset Filtri"

#### Subtask 6.2.2: Integrare nel layout
- [ ] Posizionare sidebar filtri su desktop
- [ ] Dialog/Sheet filtri su mobile
- [ ] Applicare filtri con URL search params

**Acceptance Criteria:**
- [ ] Filtri funzionano correttamente
- [ ] Combinazione filtri possibile
- [ ] Reset filtri funziona
- [ ] URL riflette filtri
- [ ] Responsive perfetto

---

## GROUP 7: Paginazione

**Priorità:** 🟡 P1 (Alta)
**Dipendenze:** Nessuna specifica
**Stima Complessità:** ⚡ Bassa (2-3 ore)
**File Coinvolti:**
- `app/(public)/marketplace/page.tsx`
- `app/actions/marketplace.ts`

### Task 7.1: Implementare Paginazione Backend

#### Subtask 7.1.1: Aggiornare getApprovedItems
- [ ] Aggiungere parametri `page` e `limit`
- [ ] Calcolare offset: `(page - 1) * limit`
- [ ] Usare `.range(from, to)` per paginazione
- [ ] Restituire anche `totalCount`

#### Subtask 7.1.2: Implementare UI paginazione
- [ ] Buttons "Precedente" e "Successivo"
- [ ] Indicatore "Pagina X di Y"
- [ ] Disable buttons agli estremi
- [ ] Aggiornare URL con page param

**Acceptance Criteria:**
- [ ] Paginazione funziona
- [ ] Total count corretto
- [ ] Navigation smooth
- [ ] URL riflette pagina

---

## GROUP 8: Fix e Miglioramenti

**Priorità:** 🟢 P2 (Media)
**Dipendenze:** GROUP 1-7 completati
**Stima Complessità:** ⚡ Bassa (3-4 ore)

### Task 8.1: Fix RLS Policy is_private

#### Subtask 8.1.1: Creare migration fix policy
- [ ] File: `supabase/migrations/00018_fix_marketplace_rls.sql`
- [ ] DROP policy esistente
- [ ] CREATE policy con check is_private

**Codice Migration:**
```sql
-- Fix RLS policy per is_private
DROP POLICY IF EXISTS "marketplace_select_approved" ON marketplace_items;

CREATE POLICY "marketplace_select_approved"
ON marketplace_items FOR SELECT
USING (
  status = 'approved' AND
  is_sold = false AND
  (
    is_private = false OR
    (is_private = true AND is_verified())
  )
);
```

**Acceptance Criteria:**
- [ ] Policy corregge security hole
- [ ] Annunci privati solo per verificati
- [ ] Test con utente non verificato

### Task 8.2: Sistema Preferiti (Opzionale)

#### Subtask 8.2.1: Creare tabella marketplace_favorites
```sql
CREATE TABLE marketplace_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_id)
);
```

#### Subtask 8.2.2: Implementare toggle favorite
- [ ] Heart icon nel card
- [ ] Server action toggle
- [ ] Page "/profile/favorites"

**Stima:** 4-6 ore

### Task 8.3: Notifiche Annuncio Approvato (Opzionale)

#### Subtask 8.3.1: Trigger notification on approve
- [ ] Creare notifica quando status → 'approved'
- [ ] Email opzionale a venditore

**Stima:** 3-4 ore

---

## 🎯 ROADMAP SUGGERITA

### FASE 1 - Feature Core (P0) - 20-26 ore
**Obiettivo:** Marketplace completamente funzionante

1. 🔴 GROUP 1: Upload immagini (8-10 ore)
2. 🔴 GROUP 2: Galleria + lightbox (6-8 ore)
3. 🔴 GROUP 3: Sistema contatti (6-8 ore)

**Deliverable:** Utenti creano annunci con foto e ricevono contatti

---

### FASE 2 - Gestione Annunci (P1) - 14-18 ore
**Obiettivo:** Seller possono gestire annunci

4. 🟡 GROUP 4: Pagina edit (8-10 ore)
5. 🟡 GROUP 5: Dashboard annunci (6-8 ore)

**Deliverable:** Dashboard completo venditori

---

### FASE 3 - Discovery (P1) - 10-13 ore
**Obiettivo:** Migliorare ricerca e navigazione

6. 🟡 GROUP 6: Ricerca + filtri (8-10 ore)
7. 🟡 GROUP 7: Paginazione (2-3 ore)

**Deliverable:** Buyer trovano facilmente prodotti

---

### FASE 4 - Polish (P2) - 3-4 ore
**Obiettivo:** Fix sicurezza e opzionali

8. 🟢 GROUP 8: Fix vari + opzionali (3-4 ore)

---

## 📝 NOTES IMPORTANTI

### Decisioni Architetturali

**Storage:**
- Bucket: `marketplace-items`
- Max 6 immagini per annuncio
- Max 10MB per immagine
- Formati: JPG, PNG, WebP

**Contatti:**
- Sistema email indiretta (privacy)
- Resend come servizio email
- Rate limiting 3 email/ora per item

**Sicurezza:**
- RLS policy corretta per is_private
- Solo owner modifica/elimina annunci
- Moderazione pre-pubblicazione

### Performance

- Paginazione (20 items per pagina)
- Immagini Next Image (ottimizzate)
- Fulltext search con indice DB
- Limit 50 items nelle query

### Accessibilità

- Lightbox con keyboard navigation
- Form con label corretti
- Aria-labels dove necessario
- Color contrast WCAG AA

### Testing Manuale Checklist

- [ ] Test creazione annuncio con 1-6 foto
- [ ] Test galleria navigazione
- [ ] Test lightbox fullscreen
- [ ] Test contatto venditore (email)
- [ ] Test modifica annuncio
- [ ] Test delete annuncio
- [ ] Test dashboard statistiche
- [ ] Test ricerca fulltext
- [ ] Test filtri (categoria, prezzo, condizione)
- [ ] Test paginazione
- [ ] Test responsive completo
- [ ] Test permessi (owner vs altri)

---

## 🏁 CONCLUSIONE

Il Marketplace è funzionale nella struttura base ma richiede l'implementazione delle feature core (upload immagini, contatti) per essere realmente utilizzabile.

**Tempo stimato totale:**
- Feature Core (FASE 1): ~23 ore
- Gestione Completa (FASE 2): ~39 ore
- Discovery (FASE 3): ~50 ore
- Con polish (FASE 4): ~54 ore

**PRIORITÀ:** GROUP 1-2-3 sono critici per lancio.

**Ready to ship!** 🚀
