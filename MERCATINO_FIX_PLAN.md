# MERCATINO FIX PLAN - Analisi e Correzione Completa

**Data:** Dicembre 2025
**Versione:** 2.0 - Piano di Correzione

---

## SOMMARIO ESECUTIVO

Dopo un'analisi approfondita del codebase e ricerca delle best practices 2025, sono stati identificati **3 problemi critici** nell'implementazione attuale del Mercatino:

| # | Problema | Severità | Impatto |
|---|----------|----------|---------|
| 1 | UI non allineata al Design Demo | ALTA | UX incoerente, aspetto amatoriale |
| 2 | Categorie completamente rimosse | ALTA | Utenti non possono categorizzare annunci |
| 3 | Donazione basata su percentuale invece di importo fisso | ALTA | Logica non conforme ai requisiti |

---

## PARTE 1: ANALISI DETTAGLIATA DEI PROBLEMI

### PROBLEMA 1: UI Non Allineata al Design Demo

#### Situazione Attuale
L'implementazione corrente NON segue i pattern di design definiti in:
- `app/demo/redesign/page.tsx` (orchestratore 17 viste)
- `components/demo/modern-marketplace.tsx` (lista prodotti)
- `components/demo/modern-marketplace-detail.tsx` (dettaglio prodotto)
- `components/demo/modern-marketplace-create.tsx` (form creazione)

#### Pattern Demo da Replicare

**Card Prodotto (Grid View):**
```tsx
// Demo Pattern - modern-marketplace.tsx
<div className="bg-white border rounded-3xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
  <div className="relative aspect-square bg-slate-100">
    <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
    {/* Like button top-right */}
    <Button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm" />
    {/* Price badge bottom-left */}
    <Badge className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm font-bold shadow-sm" />
  </div>
  <div className="p-4">
    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
      <Tag className="h-3 w-3" /> {category}
    </p>
    <h3 className="font-bold text-slate-900 mb-2 line-clamp-1">{title}</h3>
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-slate-500">{seller}</span>
      <span className="text-xs text-slate-400 flex items-center gap-1">
        <Heart className="h-3 w-3" /> {likes}
      </span>
    </div>
  </div>
</div>
```

**Schema Colori Demo:**
| Sezione | Colore Primario | Utilizzo |
|---------|-----------------|----------|
| Mercatino | Emerald (#10b981) | Bottoni, badge, shadow |
| Eventi | Blue (#2563eb) | Bottoni primari |
| Agorà | Violet (#8b5cf6) | Gradients, badges |
| Neutri | Slate (900/600/400) | Testi, bordi |

**Form Input Pattern:**
```tsx
// Demo Pattern
<Input className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" />
<Select>
  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
    <SelectValue placeholder="Seleziona" />
  </SelectTrigger>
</Select>
```

#### Discrepanze Identificate

| Elemento | Demo | Implementazione Attuale |
|----------|------|-------------------------|
| Card border-radius | `rounded-3xl` (24px) | `rounded-lg` (8px) |
| Card hover | `hover:shadow-lg` + scale immagine | Solo shadow |
| Price badge | Overlay su immagine bottom-left | Testo sotto immagine |
| Category display | Con icona `<Tag>` + text-xs | Non presente |
| Input fields | `bg-slate-50 focus:bg-white` | Default shadcn |
| Buttons | `rounded-full` con colored shadow | `rounded-md` standard |
| Category filter | Chips orizzontali scrollabili | Non implementato |

---

### PROBLEMA 2: Categorie Completamente Rimosse

#### Sistema Categorie Esistente (Database)

Il database ha GIÀ un sistema categorie funzionante:

**Tabella `categories`:**
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  item_type VARCHAR(50) NOT NULL,  -- 'event' | 'marketplace_item'
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  tenant_id UUID REFERENCES tenants(id)
);
```

**Categorie Marketplace Seedate (7):**
1. Elettronica
2. Casa e Giardino
3. Abbigliamento
4. Sport e Tempo Libero
5. Libri e Riviste
6. Mobili
7. Altro

**Server Actions Esistenti (`app/actions/categories.ts`):**
- `getCategories('marketplace_item')` - Ottiene categorie attive
- `getAllCategories()` - Tutte le categorie
- `getCategoryById(id)` - Singola categoria

#### Problema nell'Implementazione

**wizard-step-2.tsx (Linee 18-41):**
```tsx
interface WizardStep2ObjectData {
  categoryId?: string;  // ← Campo ESISTE ma OPZIONALE
  // ...
}
```

**MA:** Nessun selector di categoria è visibile nell'UI!

Il wizard Step 2 mostra solo:
- Titolo
- Descrizione
- Prezzo
- Condizione

**MANCANTE:** Dropdown/chips per selezionare la categoria.

#### Struttura Corretta da Implementare

```
MACRO TIPO (Step 1)
├── Oggetti
│   ├── Vendita
│   └── Regalo
└── Immobili
    ├── Vendita
    └── Affitto

CATEGORIA (Step 2 - SOLO per Oggetti)
├── Elettronica
├── Casa e Giardino
├── Abbigliamento
├── Sport e Tempo Libero
├── Libri e Riviste
├── Mobili
└── Altro

NOTA: Per Immobili usare Tipologia specifica (Appartamento, Villa, ecc.)
```

---

### PROBLEMA 3: Donazione Basata su Percentuale

#### Requisito Originale
> "La donazione non deve essere in percentuale! deve essere un importo fisso a partire da 1€!"

#### Implementazione Attuale (ERRATA)

**wizard-step-5.tsx:**
```tsx
export interface WizardStep5Data {
  agreeToTerms: boolean;
  committeePercentage: number;  // ← PERCENTUALE (0-100)
}

// Calcolo:
const donationAmount = (price * percentage) / 100;
```

**Server Action (mercatino.ts linee 430-440):**
```tsx
const donationAmount = step5Parsed.success ? step5Parsed.data.donationAmount : 0;
if (donationAmount && donationAmount >= 100) {  // Cents? Percentage? Ambiguo!
  return { requiresDonation: true, donationAmount };
}
```

**Problemi:**
1. `committeePercentage` implica percentuale
2. Server usa `donationAmount` (nome diverso)
3. Check `>= 100` non ha senso per percentuali (0-100)
4. Nessun flusso di pagamento Stripe implementato
5. Badge mostra importo ma campo è percentuale

#### Modello Corretto da Implementare

**Importo Fisso con Preset:**
```tsx
// Best Practice 2025: Preset amounts con opzione custom
const DONATION_PRESETS = [
  { value: 100, label: '1€' },      // In centesimi
  { value: 200, label: '2€' },
  { value: 500, label: '5€' },
  { value: 1000, label: '10€' },
  { value: 'custom', label: 'Altro' },
];

// Minimo: 100 centesimi = 1€
// Massimo: Nessun limite
// Default: 0 (nessuna donazione)
```

**Logica:**
1. Utente sceglie se vuole donare (toggle)
2. Se sì, seleziona preset o inserisce importo custom
3. Importo salvato in centesimi nel database
4. Badge "Supporta il Comitato" mostrato dopo pagamento confermato

---

## PARTE 2: BEST PRACTICES 2025 (Ricerca Online)

### Donation UX ([Kalamuna](https://www.kalamuna.com/blog/donation-page-best-practices), [Fluent](https://this.isfluent.com/blog/2024/engage-trust-donate-ux-strategies-for-effective-online-donations))

1. **Semplicità:** Rimuovere distrazioni, form minimali
2. **Preset Amounts:** Offrire importi predefiniti (es. 1€, 2€, 5€, 10€)
3. **Impatto:** Mostrare cosa la donazione supporta
4. **Trust Signals:** Badge sicurezza, trasparenza uso fondi
5. **Mobile-First:** Form ottimizzati per touch

### Category Hierarchy ([Cobbleweb](https://www.cobbleweb.co.uk/how-to-design-a-winning-marketplace-category-structure/), [UX Magazine](https://uxmag.com/articles/case-study-category-hierarchy))

1. **Chips/Badges:** Meglio di dropdown per categorie principali
2. **Scroll Orizzontale:** Per liste lunghe su mobile
3. **Breadcrumbs:** Per navigazione gerarchica
4. **Max 2 Livelli:** Macro → Categoria (non più profondo)
5. **Icone:** Aiutano riconoscimento rapido

### Wizard Form UX ([Eleken](https://www.eleken.co/blog-posts/wizard-ui-pattern-explained), [IxDF](https://www.interaction-design.org/literature/article/ui-form-design))

1. **Progressive Disclosure:** Un concetto per step
2. **Progress Indicator:** Barra o step numerati
3. **Validation Inline:** Errori mostrati subito
4. **Touch Targets:** Minimo 44x44px
5. **Thumb Zone:** Azioni principali in basso su mobile

### Mobile Marketplace ([Baymard](https://baymard.com/blog/mobile-ux-ecommerce), [Webstacks](https://www.webstacks.com/blog/mobile-ux-design))

1. **Grid 2 Colonne:** Standard per prodotti su mobile
2. **Card Compatte:** Immagine dominante, info essenziali
3. **Swipe Gestures:** Per gallery immagini
4. **Fixed Bottom CTA:** Per azioni principali
5. **Keyboard Appropriate:** Numerico per prezzi

---

## PARTE 3: FILE DA MODIFICARE

### Analisi Dipendenze

```
COMPONENTI MERCATINO
├── components/mercatino/
│   ├── mercatino-card.tsx          ← FIX 1: Allineare a demo
│   ├── donation-badge.tsx          ← FIX 3: Importo fisso
│   ├── contact-buttons.tsx         ✓ OK (ben fatto)
│   └── wizard/
│       ├── mercatino-wizard.tsx    ← FIX 1: Styling
│       ├── wizard-step-1.tsx       ✓ OK (macro tipi)
│       ├── wizard-step-2.tsx       ← FIX 2: Aggiungere categorie
│       ├── wizard-step-3.tsx       ← FIX 1: Styling upload
│       ├── wizard-step-4.tsx       ✓ OK (contatti)
│       └── wizard-step-5.tsx       ← FIX 3: Donazione fissa

PAGINE MERCATINO
├── app/(main)/mercatino/
│   ├── page.tsx                    ← FIX 1: Aggiungere filtri categorie
│   ├── loading.tsx                 ✓ OK
│   ├── new/page.tsx                ✓ OK
│   └── [id]/
│       ├── page.tsx                ← FIX 1: Layout demo
│       ├── loading.tsx             ✓ OK
│       ├── error.tsx               ✓ OK
│       └── edit/page.tsx           ✓ OK

SERVER ACTIONS
├── app/actions/
│   ├── mercatino.ts                ← FIX 3: donationAmount logic
│   └── categories.ts               ✓ OK (già funzionante)

VALIDATORS
├── lib/utils/
│   └── validators.ts               ← FIX 3: Schema donazione

TYPES
├── types/
│   └── mercatino.ts                ← Creare file tipi dedicato

CONSTANTS
├── lib/utils/
│   └── constants.ts                ← Aggiungere costanti Mercatino
```

---

## PARTE 4: PIANO DI SVILUPPO DETTAGLIATO

### FASE 1: Preparazione Types e Constants

**Obiettivo:** Centralizzare tipi e costanti prima delle modifiche UI.

#### 1.1 Creare `types/mercatino.ts`

```typescript
// types/mercatino.ts

// ============ ENUMS & CONSTANTS ============

export const MERCATINO_LISTING_TYPES = ['objects', 'real_estate'] as const;
export type MercatinoListingType = typeof MERCATINO_LISTING_TYPES[number];

export const MERCATINO_OBJECT_TYPES = ['sale', 'gift'] as const;
export type MercatinoObjectType = typeof MERCATINO_OBJECT_TYPES[number];

export const MERCATINO_REAL_ESTATE_TYPES = ['sale', 'rent'] as const;
export type MercatinoRealEstateType = typeof MERCATINO_REAL_ESTATE_TYPES[number];

export const MERCATINO_CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'] as const;
export type MercatinoCondition = typeof MERCATINO_CONDITIONS[number];

export const MERCATINO_CONTACT_METHODS = ['whatsapp', 'email', 'telegram', 'phone'] as const;
export type MercatinoContactMethod = typeof MERCATINO_CONTACT_METHODS[number];

// ============ DONATION PRESETS ============

export const DONATION_PRESETS = [
  { value: 100, label: '1€', cents: 100 },
  { value: 200, label: '2€', cents: 200 },
  { value: 500, label: '5€', cents: 500 },
  { value: 1000, label: '10€', cents: 1000 },
] as const;

export const MIN_DONATION_CENTS = 100; // 1€
export const MAX_IMAGES = 6;
export const MAX_FILE_SIZE_MB = 10;

// ============ WIZARD DATA TYPES ============

export interface WizardStep1Data {
  listingType: MercatinoListingType;
  objectType?: MercatinoObjectType;
  realEstateType?: MercatinoRealEstateType;
}

export interface WizardStep2BaseData {
  title: string;
  description: string;
  price: number;
  images?: string[];
}

export interface WizardStep2ObjectData extends WizardStep2BaseData {
  categoryId: string;  // OBBLIGATORIO per oggetti
  condition: MercatinoCondition;
}

export interface WizardStep2RealEstateData extends WizardStep2BaseData {
  propertyType: string;
  squareMeters: number;
  rooms: number;
  bathrooms?: number;
  floor?: number;
  hasGarden?: boolean;
  hasGarage?: boolean;
  hasBalcony?: boolean;
  energyClass?: string;
  address?: string;
}

export interface WizardStep3Data {
  images: string[];
}

export interface WizardStep4Data {
  contactMethods: Array<{
    method: MercatinoContactMethod;
    value: string;
  }>;
}

export interface WizardStep5Data {
  agreeToTerms: boolean;
  wantsToDonate: boolean;
  donationAmountCents: number; // In centesimi (100 = 1€)
}

export interface MercatinoWizardData {
  step1: WizardStep1Data;
  step2: WizardStep2ObjectData | WizardStep2RealEstateData;
  step3: WizardStep3Data;
  step4: WizardStep4Data;
  step5: WizardStep5Data;
}

// ============ DATABASE/API TYPES ============

export interface MercatinoItem {
  id: string;
  title: string;
  description: string;
  price: number;
  listing_type: MercatinoListingType;
  object_type?: MercatinoObjectType;
  real_estate_type?: MercatinoRealEstateType;
  category_id?: string;
  condition?: MercatinoCondition;
  images: string[];
  contact_methods: Array<{
    method: MercatinoContactMethod;
    value: string;
  }>;
  seller_id: string;
  tenant_id: string;
  status: 'pending' | 'approved' | 'rejected';
  is_sold: boolean;
  has_donated: boolean;
  donation_amount_cents?: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface MercatinoCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  display_order: number;
}
```

#### 1.2 Aggiornare `lib/utils/constants.ts`

```typescript
// Aggiungere a constants.ts

// ============ MERCATINO CONSTANTS ============

export const MERCATINO_CONDITION_LABELS: Record<string, string> = {
  new: 'Nuovo',
  like_new: 'Come nuovo',
  good: 'Buono',
  fair: 'Discreto',
  poor: 'Da riparare',
};

export const MERCATINO_LISTING_TYPE_LABELS: Record<string, string> = {
  objects: 'Oggetti',
  real_estate: 'Immobili',
};

export const MERCATINO_OBJECT_TYPE_LABELS: Record<string, string> = {
  sale: 'Vendita',
  gift: 'Regalo',
};

export const MERCATINO_REAL_ESTATE_TYPE_LABELS: Record<string, string> = {
  sale: 'Vendita',
  rent: 'Affitto',
};

export const MERCATINO_DEFAULT_IMAGE = '/assets/images/placeholder-product.png';
```

---

### FASE 2: Fix UI - Allineare al Design Demo

**Obiettivo:** Applicare lo stile del design demo a tutti i componenti Mercatino.

#### 2.1 Aggiornare `mercatino-card.tsx`

**Modifiche principali:**

```tsx
// PRIMA (attuale)
<div className="rounded-lg border bg-card overflow-hidden">

// DOPO (demo style)
<div className="bg-white border rounded-3xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
```

**Elementi da aggiungere:**
- Image hover scale: `group-hover:scale-110 transition-transform duration-500`
- Like button overlay: `absolute top-3 right-3`
- Price badge overlay: `absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm`
- Category con icona: `<Tag className="h-3 w-3" /> {category}`
- Colore primario: Emerald per badges/buttons

#### 2.2 Aggiornare Wizard Steps Styling

**Input fields (tutti gli step):**
```tsx
// PRIMA
<Input />

// DOPO
<Input className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" />
```

**Buttons:**
```tsx
// PRIMA
<Button>Avanti</Button>

// DOPO
<Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
  Avanti
</Button>
```

#### 2.3 Aggiornare Lista Mercatino (`page.tsx`)

**Aggiungere filtro categorie orizzontale:**
```tsx
// Category filter chips (scrollable)
<div className="flex gap-2 overflow-x-auto pb-2 demo-no-scrollbar">
  <Badge
    className={cn(
      "rounded-full px-4 py-2 text-sm cursor-pointer whitespace-nowrap",
      selectedCategory === 'all'
        ? "bg-slate-900 text-white"
        : "bg-white border hover:bg-slate-50"
    )}
    onClick={() => setSelectedCategory('all')}
  >
    Tutti
  </Badge>
  {categories.map(cat => (
    <Badge
      key={cat.id}
      className={cn(
        "rounded-full px-4 py-2 text-sm cursor-pointer whitespace-nowrap",
        selectedCategory === cat.id
          ? "bg-slate-900 text-white"
          : "bg-white border hover:bg-slate-50"
      )}
      onClick={() => setSelectedCategory(cat.id)}
    >
      {cat.name}
    </Badge>
  ))}
</div>
```

---

### FASE 3: Fix Categorie

**Obiettivo:** Integrare il sistema categorie esistente nel wizard.

#### 3.1 Modificare `wizard-step-2.tsx`

**Aggiungere selector categoria per tipo "objects":**

```tsx
// Fetch categorie
const [categories, setCategories] = useState<MercatinoCategory[]>([]);

useEffect(() => {
  if (listingType === 'objects') {
    getCategories('marketplace_item').then(({ categories }) => {
      setCategories(categories || []);
    });
  }
}, [listingType]);

// UI - Categoria selector (solo per oggetti)
{listingType === 'objects' && (
  <div className="space-y-3">
    <Label>Categoria *</Label>
    <div className="flex flex-wrap gap-2">
      {categories.map(cat => (
        <Badge
          key={cat.id}
          className={cn(
            "rounded-full px-4 py-2 cursor-pointer transition-all",
            data.categoryId === cat.id
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          )}
          onClick={() => onChange({ ...data, categoryId: cat.id })}
        >
          {cat.icon && <span className="mr-1">{cat.icon}</span>}
          {cat.name}
        </Badge>
      ))}
    </div>
    {!data.categoryId && (
      <p className="text-xs text-destructive">Seleziona una categoria</p>
    )}
  </div>
)}
```

#### 3.2 Aggiornare Validazione

```typescript
// validators.ts - Rendere categoryId obbligatorio per oggetti
export const mercatinoWizardStep2ObjectSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  price: z.number().min(0),
  categoryId: z.string().uuid('Seleziona una categoria'),  // OBBLIGATORIO
  condition: mercatinoConditionEnum,
});
```

---

### FASE 4: Fix Sistema Donazione

**Obiettivo:** Cambiare da percentuale a importo fisso con preset.

#### 4.1 Modificare `wizard-step-5.tsx`

```tsx
// Nuovo UI per donazione

const [wantsToDonate, setWantsToDonate] = useState(false);
const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(DONATION_PRESETS[0].cents);
const [customAmount, setCustomAmount] = useState('');

// Calcola importo finale
const donationAmountCents = useMemo(() => {
  if (!wantsToDonate) return 0;
  if (selectedPreset === 'custom') {
    const parsed = parseFloat(customAmount);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100);
  }
  return selectedPreset;
}, [wantsToDonate, selectedPreset, customAmount]);

// UI
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-medium">Supporta il Comitato</h4>
      <p className="text-sm text-muted-foreground">
        Una piccola donazione per supportare le attività della comunità
      </p>
    </div>
    <Switch
      checked={wantsToDonate}
      onCheckedChange={setWantsToDonate}
    />
  </div>

  {wantsToDonate && (
    <div className="space-y-3 pt-2">
      <Label>Seleziona importo</Label>
      <div className="flex flex-wrap gap-2">
        {DONATION_PRESETS.map(preset => (
          <Badge
            key={preset.cents}
            className={cn(
              "rounded-full px-4 py-2 cursor-pointer text-base",
              selectedPreset === preset.cents
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
            onClick={() => setSelectedPreset(preset.cents)}
          >
            {preset.label}
          </Badge>
        ))}
        <Badge
          className={cn(
            "rounded-full px-4 py-2 cursor-pointer",
            selectedPreset === 'custom'
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          )}
          onClick={() => setSelectedPreset('custom')}
        >
          Altro
        </Badge>
      </div>

      {selectedPreset === 'custom' && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
          <Input
            type="number"
            min="1"
            step="0.01"
            placeholder="Inserisci importo"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="pl-8 h-12 rounded-xl bg-slate-50 border-slate-200"
          />
        </div>
      )}

      {donationAmountCents >= MIN_DONATION_CENTS && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <Heart className="h-5 w-5 text-emerald-600" />
          <p className="text-sm text-emerald-800">
            Donerai <strong>€{(donationAmountCents / 100).toFixed(2)}</strong> al Comitato di Prato Rinaldo
          </p>
        </div>
      )}
    </div>
  )}
</div>
```

#### 4.2 Aggiornare Server Action

```typescript
// mercatino.ts - Logica donazione aggiornata

export interface WizardStep5Data {
  agreeToTerms: boolean;
  wantsToDonate: boolean;
  donationAmountCents: number; // In centesimi
}

// Nel createMercatinoItem:
const donationCents = step5Data.wantsToDonate ? step5Data.donationAmountCents : 0;

// Salvare nel database
const insertData = {
  // ... altri campi
  wants_to_donate: step5Data.wantsToDonate,
  donation_amount_cents: donationCents,
  has_donated: false, // Diventa true solo dopo pagamento confermato
};

// Se vuole donare e importo >= 1€
if (donationCents >= MIN_DONATION_CENTS) {
  return {
    success: true,
    itemId,
    requiresDonation: true,
    donationAmountCents: donationCents,
  };
}
```

#### 4.3 Aggiornare `donation-badge.tsx`

```tsx
// Mostrare importo fisso invece di percentuale

interface DonationBadgeProps {
  amountCents?: number;  // In centesimi
  hasDonated: boolean;   // Pagamento confermato
  // ... altri props
}

export function DonationBadge({ amountCents, hasDonated, ...props }) {
  // Mostrare solo se ha effettivamente donato
  if (!hasDonated) return null;

  const amountEuros = amountCents ? (amountCents / 100).toFixed(0) : '0';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <Heart className="h-3 w-3 mr-1 fill-emerald-500" />
            €{amountEuros}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          Ha donato €{amountEuros} al Comitato!
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

## PARTE 5: CHECKLIST IMPLEMENTAZIONE

### Pre-Implementazione
- [ ] Creare backup dei file esistenti (git commit)
- [ ] Verificare che build attuale funzioni (`pnpm build`)

### Fase 1: Types & Constants
- [ ] Creare `types/mercatino.ts` con tutti i tipi
- [ ] Aggiornare `lib/utils/constants.ts` con costanti Mercatino
- [ ] Aggiornare `lib/utils/validators.ts` con nuovi schema
- [ ] Verificare type-check (`pnpm type-check`)

### Fase 2: Fix UI
- [ ] Aggiornare `mercatino-card.tsx` con stile demo
- [ ] Aggiornare `mercatino-wizard.tsx` styling
- [ ] Aggiornare `wizard-step-1.tsx` styling
- [ ] Aggiornare `wizard-step-2.tsx` styling + categorie
- [ ] Aggiornare `wizard-step-3.tsx` styling upload
- [ ] Aggiornare `wizard-step-4.tsx` styling
- [ ] Aggiornare `wizard-step-5.tsx` con nuova donazione
- [ ] Aggiornare `page.tsx` lista con filtri categorie
- [ ] Aggiornare `[id]/page.tsx` dettaglio con stile demo

### Fase 3: Fix Categorie
- [ ] Integrare `getCategories()` in wizard-step-2
- [ ] Aggiungere UI selector categorie
- [ ] Rendere categoryId obbligatorio nella validazione
- [ ] Testare creazione annuncio con categoria

### Fase 4: Fix Donazione
- [ ] Aggiornare interfaccia WizardStep5Data
- [ ] Implementare UI preset importi
- [ ] Aggiornare server action con logica centesimi
- [ ] Aggiornare donation-badge per importo fisso
- [ ] Testare flusso completo donazione

### Post-Implementazione
- [ ] Verificare build (`pnpm build`)
- [ ] Test manuale su mobile
- [ ] Test manuale su desktop
- [ ] Commit con messaggio descrittivo

---

## PARTE 6: NOTE TECNICHE

### CSS Custom Classes (da `demo.css`)

```css
/* Aggiungere a globals.css */

.demo-no-scrollbar::-webkit-scrollbar {
  display: none;
}

.demo-no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

### Touch Targets (Mobile Best Practice)

```tsx
// Tutti i bottoni interattivi: minimo 44x44px
<Button className="h-11 min-w-[44px]" />
<Badge className="px-4 py-2 min-h-[44px]" />
```

### Colori Mercatino (Emerald)

```tsx
// Primari
bg-emerald-600       // #059669
hover:bg-emerald-700 // #047857
text-emerald-600     // Testo accento

// Light/Background
bg-emerald-50        // #ecfdf5
border-emerald-200   // #a7f3d0
text-emerald-700     // Testo su sfondo chiaro

// Shadow colorata
shadow-emerald-600/20 // Ombra con 20% opacity
```

---

## CONCLUSIONE

Questo piano affronta i **3 problemi critici** identificati:

1. **UI Demo** → Applicare stile rounded-3xl, emerald, hover effects
2. **Categorie** → Integrare sistema esistente nel wizard step 2
3. **Donazione** → Cambiare da percentuale a importo fisso (min 1€)

Il piano è stato progettato per:
- ✅ Mantenere coerenza con il codebase esistente
- ✅ Seguire le best practices 2025 per marketplace mobile
- ✅ Non rimuovere file esistenti
- ✅ Non over-engineerare
- ✅ Essere incrementale e testabile

---

**Prossimo Step:** Implementare Fase 1 (Types & Constants)
