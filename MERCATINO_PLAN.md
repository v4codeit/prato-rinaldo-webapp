# MERCATINO - Piano di Sviluppo Completo

> **Refactoring completo del Marketplace → Mercatino**
> Versione: 1.0.0 | Data: Dicembre 2025

---

## Sommario Esecutivo

### Obiettivi Principali

1. **Rinominare** Marketplace → **Mercatino** in tutta la codebase
2. **Rifattorizzare graficamente** secondo lo stile demo (`app/demo/redesign/` + `components/demo/`)
3. **Nuove tipologie annunci**: Immobili (Affitto/Vendita), Oggetti (Vendita/Regalo)
4. **Contatti esterni**: WhatsApp, Email, Telegram, Telefono (NO chat interna)
5. **Statistiche visualizzazioni**: Fingerprint-based per visite uniche
6. **Donazioni "Supporta il Comitato"**: Stripe Checkout min. 1€
7. **Wizard a step** per creazione annunci
8. **UX semplificata** per tutte le età

### Decisioni Architetturali Confermate

| Aspetto | Decisione |
|---------|-----------|
| Messaggistica | Solo esterni (WhatsApp, Email, Telegram, Telefono) |
| Tipologie | Tipi + Sottocategorie (Immobili→Affitto/Vendita, Oggetti→Vendita/Regalo) |
| Tracking visite | Fingerprint browser + user_id per loggati |
| Donazioni | Stripe Checkout, minimo 1€ |
| Contatti | WhatsApp, Email, Telegram, Telefono (utente sceglie quali) |
| Campi immobili | mq, locali, piano, ascensore, garage, anno costruzione |
| Form UX | Wizard a step (5 step) |
| Badge donazione | Card lista + Pagina dettaglio |

---

## Analisi File Coinvolti (48 file totali)

### 1. Pagine da Modificare (6 file)

| File | Azione | Priorità |
|------|--------|----------|
| `app/(main)/marketplace/page.tsx` | Rinominare route, applicare nuovo stile | Alta |
| `app/(main)/marketplace/new/page.tsx` | Sostituire con Wizard a step | Alta |
| `app/(main)/marketplace/[id]/page.tsx` | Ridisegnare dettaglio, aggiungere contatti | Alta |
| `app/(main)/marketplace/[id]/loading.tsx` | Aggiornare skeleton | Media |
| `app/(main)/marketplace/[id]/error.tsx` | Aggiornare stile errore | Bassa |
| `app/(main)/bacheca/bacheca-client.tsx` | Integrare nuova sezione Mercatino | Media |

### 2. Componenti da Ricreare (9 file)

| File Attuale | Nuovo Nome | Azione |
|--------------|------------|--------|
| `components/marketplace/marketplace-card.tsx` | `mercatino-card.tsx` | Ridisegnare completamente |
| `components/bacheca/marketplace/marketplace-section.tsx` | `mercatino-section.tsx` | Ridisegnare con nuovo stile |
| `components/bacheca/marketplace/marketplace-item-card.tsx` | `mercatino-item-card.tsx` | Ridisegnare |
| `components/bacheca/marketplace/marketplace-filters.tsx` | `mercatino-filters.tsx` | Aggiungere filtri per tipo |
| `components/bacheca/marketplace/index.tsx` | `index.tsx` | Aggiornare export |
| - | `components/mercatino/contact-methods.tsx` | **NUOVO** - Pulsanti contatto |
| - | `components/mercatino/donation-badge.tsx` | **NUOVO** - Badge donazione |
| - | `components/mercatino/view-counter.tsx` | **NUOVO** - Visualizzazioni |
| - | `components/mercatino/wizard/` | **NUOVO** - Wizard 5 step |

### 3. Server Actions da Modificare (2 file)

| File | Modifiche |
|------|-----------|
| `app/actions/marketplace.ts` | Rinominare → `mercatino.ts`, aggiungere campi immobiliari, tracking visite |
| `app/actions/storage.ts` | Aggiornare bucket name se necessario |

### 4. Database (3 migrazioni nuove)

| Migrazione | Scopo |
|------------|-------|
| `XXXXXX_mercatino_types.sql` | Aggiungere ENUM per tipi/sottocategorie |
| `XXXXXX_mercatino_fields.sql` | Aggiungere campi immobiliari, contatti, donazioni |
| `XXXXXX_mercatino_views.sql` | Tabella tracking visualizzazioni |

### 5. Tipi e Validatori (4 file)

| File | Modifiche |
|------|-----------|
| `types/bacheca.ts` | Aggiornare interface MarketplaceItem → MercatinoItem |
| `types/feed.ts` | Aggiornare MarketplaceFeedItem → MercatinoFeedItem |
| `lib/utils/validators.ts` | Aggiornare schema Zod con nuovi campi |
| `lib/utils/constants.ts` | Aggiornare ROUTES.MARKETPLACE → ROUTES.MERCATINO |

### 6. Integrazione Feed (2 file)

| File | Modifiche |
|------|-----------|
| `components/organisms/feed/unified-feed-card.tsx` | Supportare nuovo formato mercatino |
| `app/actions/feed.ts` | Aggiornare query per nuovi campi |

### 7. API Route Stripe (1 file nuovo)

| File | Scopo |
|------|-------|
| `app/api/stripe/donation/route.ts` | **NUOVO** - Checkout donazione |

---

## Schema Database Aggiornato

### Nuovi ENUM

```sql
-- Tipo principale annuncio
CREATE TYPE mercatino_listing_type AS ENUM (
  'real_estate',   -- Immobili
  'objects'        -- Oggetti
);

-- Sottotipo immobili
CREATE TYPE mercatino_real_estate_type AS ENUM (
  'rent',          -- Affitto
  'sale'           -- Vendita
);

-- Sottotipo oggetti
CREATE TYPE mercatino_object_type AS ENUM (
  'sale',          -- Vendita
  'gift'           -- Regalo
);
```

### Nuove Colonne `marketplace_items`

```sql
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS
  -- Tipologia
  listing_type mercatino_listing_type NOT NULL DEFAULT 'objects',
  real_estate_type mercatino_real_estate_type,
  object_type mercatino_object_type DEFAULT 'sale',

  -- Campi immobiliari (nullable)
  square_meters INT,
  rooms INT,
  floor INT,
  has_elevator BOOLEAN,
  has_garage BOOLEAN,
  construction_year INT,
  address_zone VARCHAR(255),        -- Solo zona/via, no civico

  -- Metodi contatto (JSON array)
  contact_methods JSONB DEFAULT '[]',
  -- Format: [{"type": "whatsapp", "value": "+39..."},
  --          {"type": "email", "value": "...@..."},
  --          {"type": "telegram", "value": "@username"},
  --          {"type": "phone", "value": "+39..."}]

  -- Donazione
  has_donated BOOLEAN DEFAULT false,
  donation_amount INT DEFAULT 0,    -- In centesimi
  donated_at TIMESTAMPTZ,

  -- Statistiche
  view_count INT DEFAULT 0;
```

### Nuova Tabella `mercatino_views`

```sql
CREATE TABLE mercatino_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  visitor_fingerprint VARCHAR(64) NOT NULL,  -- Hash del browser
  user_id UUID REFERENCES users(id),         -- Se loggato
  viewed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indice unico per evitare duplicati
  UNIQUE(item_id, visitor_fingerprint)
);

-- Trigger per aggiornare view_count
CREATE OR REPLACE FUNCTION update_item_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_items
  SET view_count = (
    SELECT COUNT(*) FROM mercatino_views WHERE item_id = NEW.item_id
  )
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_view_count
AFTER INSERT ON mercatino_views
FOR EACH ROW EXECUTE FUNCTION update_item_view_count();
```

---

## Design System da Applicare

### Palette Colori (da demo)

```
Background pagina:    bg-slate-50/50
Card/Container:       bg-white
Bordi:                border-slate-200
Testo primario:       text-slate-900
Testo secondario:     text-slate-600
Testo terziario:      text-slate-500/400

CTA primaria:         bg-emerald-600 hover:bg-emerald-700
CTA secondaria:       bg-blue-600 hover:bg-blue-700
Accento:              bg-teal-500/600
Notifiche/Heart:      bg-rose-500
```

### Border Radius

```
Card:         rounded-3xl (24px)
Input:        rounded-2xl (16px)
Button:       rounded-xl (12px) o rounded-full (pill)
Badge:        rounded-full
Thumbnail:    rounded-2xl
```

### Spacing

```
Padding interno card:   p-4, p-6
Gap elementi:           gap-4, gap-6
Sezioni:                space-y-6
Bottom padding mobile:  pb-24 (per bottom nav)
```

### Shadows

```
Default:      shadow-sm
Hover:        hover:shadow-lg
Button CTA:   shadow-lg shadow-emerald-600/20
Mobile nav:   shadow-2xl shadow-slate-900/20
```

---

## Architettura Componenti

### Struttura Wizard (5 Step)

```
components/mercatino/wizard/
├── index.tsx                      # Wrapper principale
├── wizard-context.tsx             # Context per stato wizard
├── wizard-progress.tsx            # Barra progresso
├── steps/
│   ├── step-1-type.tsx           # Scelta tipo (Immobile/Oggetto)
│   ├── step-2-details.tsx        # Dettagli (form adattivo)
│   ├── step-3-photos.tsx         # Upload foto
│   ├── step-4-contacts.tsx       # Metodi contatto
│   └── step-5-confirm.tsx        # Riepilogo + donazione opzionale
└── field-groups/
    ├── real-estate-fields.tsx    # Campi immobiliari
    └── object-fields.tsx         # Campi oggetti
```

### Step 1 - Scelta Tipo

```
┌─────────────────────────────────────────────┐
│  Cosa vuoi pubblicare?                      │
│                                             │
│  ┌───────────────┐   ┌───────────────┐     │
│  │  🏠           │   │  📦           │     │
│  │  IMMOBILE     │   │  OGGETTO      │     │
│  │               │   │               │     │
│  │  Affitto o    │   │  Vendi o      │     │
│  │  Vendita      │   │  Regala       │     │
│  └───────────────┘   └───────────────┘     │
│                                             │
│  Poi scegli:                               │
│  ○ Affitto  ○ Vendita    (se Immobile)    │
│  ○ Vendita  ○ Regalo     (se Oggetto)     │
│                                             │
│                        [Avanti →]           │
└─────────────────────────────────────────────┘
```

### Step 2 - Dettagli (Form Adattivo)

**Per Immobili:**
- Titolo
- Prezzo (€/mese se affitto, € se vendita)
- Descrizione
- Zona/Via (senza civico)
- mq, Locali, Piano
- Ascensore (sì/no)
- Garage (sì/no)
- Anno costruzione

**Per Oggetti:**
- Titolo
- Prezzo (€, o 0 se regalo)
- Descrizione
- Condizione (Nuovo, Come nuovo, Buono, Discreto, Da riparare)
- Categoria (Arredamento, Elettronica, Sport, etc.)

### Step 3 - Foto

```
┌─────────────────────────────────────────────┐
│  Aggiungi foto (1-6)                        │
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │              │  │     + 📷     │        │
│  │   FOTO 1     │  │              │        │
│  │   (main)     │  │   Aggiungi   │        │
│  │              │  │              │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
│  ℹ️ La prima foto sarà quella principale   │
│                                             │
│  [← Indietro]              [Avanti →]      │
└─────────────────────────────────────────────┘
```

### Step 4 - Contatti

```
┌─────────────────────────────────────────────┐
│  Come vuoi essere contattato?               │
│                                             │
│  Seleziona almeno un metodo:                │
│                                             │
│  ☑️ WhatsApp    [+39 333 1234567]           │
│  ☑️ Email       [mario@example.com]         │
│  ☐ Telegram    [@username]                  │
│  ☐ Telefono    [+39 06 1234567]             │
│                                             │
│  ⚠️ I tuoi contatti NON saranno visibili   │
│     pubblicamente. Gli interessati          │
│     cliccheranno un pulsante per            │
│     contattarti direttamente.               │
│                                             │
│  [← Indietro]              [Avanti →]      │
└─────────────────────────────────────────────┘
```

### Step 5 - Conferma + Donazione

```
┌─────────────────────────────────────────────┐
│  Riepilogo annuncio                         │
│                                             │
│  [Preview Card Annuncio]                    │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  💚 Vuoi supportare il Comitato?            │
│                                             │
│  Con una piccola donazione aiuti il         │
│  Comitato e il tuo annuncio mostrerà        │
│  il badge "Supporta il Comitato".           │
│                                             │
│  [  1€  ] [  2€  ] [  5€  ] [ Altro ]       │
│                                             │
│  ☐ Salta, pubblica senza donazione          │
│                                             │
│  [← Indietro]    [✓ Pubblica Annuncio]     │
└─────────────────────────────────────────────┘
```

---

## Pagina Dettaglio Annuncio

### Layout Desktop (2 colonne)

```
┌──────────────────────┬───────────────────────┐
│                      │  Categoria • Tipo      │
│   [Foto Gallery]     │                        │
│                      │  TITOLO ANNUNCIO       │
│   ┌──┐ ┌──┐ ┌──┐    │                        │
│   │1 │ │2 │ │3 │    │  € 150.000             │
│   └──┘ └──┘ └──┘    │  o  €800/mese          │
│                      │                        │
│                      │  💚 Supporta il        │
│                      │     Comitato           │
│                      │                        │
│                      │  ───────────────────   │
│                      │                        │
│                      │  Descrizione...        │
│                      │  Lorem ipsum dolor     │
│                      │  sit amet...           │
│                      │                        │
├──────────────────────┤  ───────────────────   │
│                      │                        │
│  📊 42 visualizzaz.  │  Caratteristiche       │
│                      │  • 120 mq              │
│                      │  • 4 locali            │
│                      │  • Piano 2             │
│                      │  • Ascensore: Sì       │
│                      │                        │
│                      │  ───────────────────   │
│                      │                        │
│                      │  👤 Mario R.           │
│                      │     Iscritto da 2023   │
│                      │                        │
│                      │  [📱 WhatsApp]         │
│                      │  [✉️ Email]            │
│                      │  [📞 Chiama]           │
│                      │                        │
└──────────────────────┴───────────────────────┘
```

### Pulsanti Contatto (Comportamento)

| Metodo | Comportamento |
|--------|---------------|
| WhatsApp | `window.open('https://wa.me/39XXXXXXXXXX?text=Ciao, sono interessato al tuo annuncio "TITOLO" su Mercatino Prato Rinaldo')` |
| Email | `window.location.href = 'mailto:email@example.com?subject=Interesse per annuncio "TITOLO"&body=...'` |
| Telegram | `window.open('https://t.me/username')` |
| Telefono | `window.location.href = 'tel:+39XXXXXXXXXX'` |

---

## Tracking Visualizzazioni

### Implementazione Fingerprint (Client-Side)

```typescript
// lib/fingerprint.ts
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<{ visitorId: string }> | null = null;

export async function getVisitorFingerprint(): Promise<string> {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load().then(fp => fp.get());
  }
  const result = await fpPromise;
  return result.visitorId;
}
```

### Server Action per Track View

```typescript
// app/actions/mercatino.ts
export async function trackItemView(itemId: string, fingerprint: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Upsert: se esiste già (stesso item + fingerprint), non fa nulla
  await supabase
    .from('mercatino_views')
    .upsert({
      item_id: itemId,
      visitor_fingerprint: fingerprint,
      user_id: user?.id || null,
    }, {
      onConflict: 'item_id,visitor_fingerprint',
      ignoreDuplicates: true,
    });
}
```

### GDPR Compliance

**Nota importante:** Il fingerprinting richiede consenso GDPR. Implementeremo:

1. **Banner cookie** con opzione "Accetta statistiche"
2. **Se rifiutato**: non tracciamo visualizzazioni
3. **Se accettato**: tracciamo con fingerprint
4. **Privacy policy** aggiornata con spiegazione

---

## Integrazione Stripe Donazioni

### API Route

```typescript
// app/api/stripe/donation/route.ts
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const { itemId, amount } = await request.json();

  // Minimo 1€ = 100 centesimi
  if (amount < 100) {
    return NextResponse.json({ error: 'Importo minimo 1€' }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: 'Donazione Comitato Prato Rinaldo',
          description: `Supporto per annuncio #${itemId.slice(0, 8)}`,
        },
        unit_amount: amount,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/mercatino/${itemId}?donation=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/mercatino/${itemId}?donation=cancelled`,
    metadata: {
      item_id: itemId,
      type: 'mercatino_donation',
    },
  });

  return NextResponse.json({ url: session.url });
}
```

### Webhook per Conferma

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.type === 'mercatino_donation') {
      const supabase = createAdminClient();
      await supabase
        .from('marketplace_items')
        .update({
          has_donated: true,
          donation_amount: session.amount_total,
          donated_at: new Date().toISOString(),
        })
        .eq('id', session.metadata.item_id);

      // Aggiungi punti gamification
      await supabase.rpc('add_user_points', {
        p_user_id: session.metadata.user_id,
        p_points: 50,
        p_reason: 'mercatino_donation',
      });
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## Fasi di Implementazione

### FASE 1: Database & Tipi (2-3 ore)

1. [ ] Creare migrazione `XXXXXX_mercatino_types.sql` con nuovi ENUM
2. [ ] Creare migrazione `XXXXXX_mercatino_fields.sql` con nuove colonne
3. [ ] Creare migrazione `XXXXXX_mercatino_views.sql` per tracking
4. [ ] Aggiornare `lib/supabase/database.types.ts` (o rigenerare)
5. [ ] Aggiornare `types/bacheca.ts` con `MercatinoItem`
6. [ ] Aggiornare `types/feed.ts` con `MercatinoFeedItem`
7. [ ] Aggiornare `lib/utils/validators.ts` con nuovi schema Zod
8. [ ] Aggiornare `lib/utils/constants.ts` (ROUTES, ENUM)

### FASE 2: Server Actions (2-3 ore)

1. [ ] Rinominare `app/actions/marketplace.ts` → `app/actions/mercatino.ts`
2. [ ] Aggiornare tutte le funzioni con nuovi campi
3. [ ] Aggiungere `trackItemView()` action
4. [ ] Aggiungere `createDonation()` action
5. [ ] Aggiornare RLS policies se necessario

### FASE 3: Componenti Mercatino (6-8 ore)

1. [ ] Creare `components/mercatino/mercatino-card.tsx`
2. [ ] Creare `components/mercatino/contact-methods.tsx`
3. [ ] Creare `components/mercatino/donation-badge.tsx`
4. [ ] Creare `components/mercatino/view-counter.tsx`
5. [ ] Creare Wizard completo:
   - [ ] `wizard/index.tsx`
   - [ ] `wizard/wizard-context.tsx`
   - [ ] `wizard/wizard-progress.tsx`
   - [ ] `wizard/steps/step-1-type.tsx`
   - [ ] `wizard/steps/step-2-details.tsx`
   - [ ] `wizard/steps/step-3-photos.tsx`
   - [ ] `wizard/steps/step-4-contacts.tsx`
   - [ ] `wizard/steps/step-5-confirm.tsx`
   - [ ] `wizard/field-groups/real-estate-fields.tsx`
   - [ ] `wizard/field-groups/object-fields.tsx`

### FASE 4: Pagine Mercatino (4-5 ore)

1. [ ] Rinominare route `app/(main)/marketplace/` → `app/(main)/mercatino/`
2. [ ] Ridisegnare `page.tsx` (lista) con nuovo stile demo
3. [ ] Sostituire `new/page.tsx` con Wizard
4. [ ] Ridisegnare `[id]/page.tsx` (dettaglio) con nuovo stile
5. [ ] Aggiornare `[id]/loading.tsx` skeleton
6. [ ] Aggiornare `[id]/error.tsx`

### FASE 5: Integrazioni (3-4 ore)

1. [ ] Creare `app/api/stripe/donation/route.ts`
2. [ ] Aggiungere webhook handler per Stripe
3. [ ] Installare `@fingerprintjs/fingerprintjs`
4. [ ] Creare `lib/fingerprint.ts`
5. [ ] Aggiornare `unified-feed-card.tsx` per nuovo formato
6. [ ] Aggiornare `app/actions/feed.ts`

### FASE 6: Bacheca Integration (2-3 ore)

1. [ ] Rinominare `components/bacheca/marketplace/` → `components/bacheca/mercatino/`
2. [ ] Aggiornare `mercatino-section.tsx` con nuovo stile
3. [ ] Aggiornare `mercatino-item-card.tsx`
4. [ ] Aggiornare `mercatino-filters.tsx` con filtri tipo
5. [ ] Aggiornare `bacheca-client.tsx`

### FASE 7: Cleanup & Polish (2-3 ore)

1. [ ] Aggiornare tutti i riferimenti "marketplace" → "mercatino"
2. [ ] Aggiornare traduzioni/testi italiani
3. [ ] Verificare responsive design
4. [ ] Aggiornare CLAUDE.md con nuova documentazione

---

## Stima Tempo Totale

| Fase | Ore Stimate |
|------|-------------|
| FASE 1: Database & Tipi | 2-3 ore |
| FASE 2: Server Actions | 2-3 ore |
| FASE 3: Componenti Mercatino | 6-8 ore |
| FASE 4: Pagine Mercatino | 4-5 ore |
| FASE 5: Integrazioni | 3-4 ore |
| FASE 6: Bacheca Integration | 2-3 ore |
| FASE 7: Cleanup & Polish | 2-3 ore |
| **TOTALE** | **21-29 ore** |

---

## Dipendenze da Installare

```bash
pnpm add @fingerprintjs/fingerprintjs stripe @stripe/stripe-js
```

---

## Note Importanti

### GDPR & Privacy

1. **Fingerprint tracking** richiede consenso esplicito
2. Aggiungere opzione nel banner cookie
3. Aggiornare Privacy Policy
4. NON tracciare se utente rifiuta

### Sicurezza Contatti

1. I contatti **NON** sono mai esposti in chiaro
2. I pulsanti generano link dinamici
3. Solo cliccando il pulsante si accede al contatto
4. Log degli accessi ai contatti (opzionale, per tracciabilità)

### Stripe

1. Testare in modalità sandbox prima di produzione
2. Configurare webhook endpoint in Stripe Dashboard
3. Minimo donazione: 1€ (100 centesimi)
4. Badge visibile solo DOPO conferma webhook

### Moderazione

1. Gli annunci continuano a passare dalla moderazione
2. La donazione NON salta la coda moderazione
3. Il badge appare solo dopo approvazione + pagamento confermato

---

## Riferimenti

### Best Practices UX 2025

- [Mobile App Design Best Practices 2025 - Wezom](https://wezom.com/blog/mobile-app-design-best-practices-in-2025)
- [Marketplace UI/UX Design - Qubstudio](https://qubstudio.com/blog/marketplace-ui-ux-design-best-practices-and-features/)
- [Marketplace UX Design: 9 Best Practices - Excited Agency](https://excited.agency/blog/marketplace-ux-design)

### Stripe Integration

- [Stripe Checkout with Next.js - MTechZilla](https://www.mtechzilla.com/blogs/integrate-stripe-checkout-with-nextjs)
- [Stripe Checkout Next.js 15 (2025) - Medium](https://medium.com/@gragson.john/stripe-checkout-and-webhook-in-a-next-js-15-2025-925d7529855e)
- [GitHub: stripe-donations](https://github.com/cristovalmartinez/stripe-donations)

### Fingerprinting & GDPR

- [Browser Fingerprinting and GDPR - legalweb.io](https://legalweb.io/en/news-en/browser-fingerprinting-and-the-gdpr/)
- [Fingerprint.com Privacy & Compliance](https://dev.fingerprint.com/docs/privacy-and-compliance)
- [Device Fingerprinting Post-GDPR - Piwik PRO](https://piwik.pro/blog/device-fingerprint-tracking-in-the-post-gdpr-era/)

---

## Checklist Pre-Sviluppo

- [ ] Confermare struttura database con team
- [ ] Creare account Stripe (se non esistente)
- [ ] Configurare Stripe webhook URL
- [ ] Pianificare banner cookie per fingerprinting
- [ ] Approvare design mockup wizard

---

**Documento creato:** Dicembre 2025
**Autore:** Claude Code
**Stato:** Pronto per implementazione
