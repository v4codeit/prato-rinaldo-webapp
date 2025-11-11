# COMMUNITY PRO - Profili Professionali e Volontari | Task List Completa

## 📊 OVERVIEW

**Feature:** Sistema di profili professionali e volontari per la community, con recensioni, portfolio e contatti.

**Stato Attuale:** 40% completo - **GRAVI PROBLEMI SCHEMA DATABASE**
- 🔴 **MISMATCH CRITICO** tra schema SQL e codice TypeScript
- 🔴 **BUG RECENSIONI** - nome colonna errato impedisce salvataggio
- ⚠️ Form creazione incompleto (mancano 5 campi su 10)
- ❌ Upload logo/portfolio NON implementato
- ❌ Pagina modifica profilo NON esistente
- ❌ Dashboard personale NON esistente
- ❌ Filtri/ricerca NON implementati

**Priorità Generale:** 🚨 **MASSIMA** - App NON funziona nello stato attuale

**Problemi Critici Bloccanti:** 4
**Bug da Fixare:** 7
**Feature Mancanti:** 8
**Miglioramenti Richiesti:** 5

---

## 🚨 PROBLEMI CRITICI BLOCCANTI (DA RISOLVERE IMMEDIATAMENTE)

### 🔴 PROBLEMA 1: Mismatch Schema Database vs Codice
**Gravità:** ⚡ BLOCCA APP
**Descrizione:**
Lo schema SQL originale (`00000_initial_schema.sql`) definisce la tabella `professional_profiles` (poi rinominata `service_profiles`) con campi limitati, MA il codice TypeScript usa campi che NON ESISTONO nel database:

**Campi nel DB (schema originale):**
- `title`, `description`, `category`, `is_volunteer`

**Campi usati nel codice ma ASSENTI in DB:**
- `business_name` ❌
- `services` (array) ❌
- `certifications` (array) ❌
- `address` ❌
- `rate_or_reimbursement` (aggiunto in migration 00010) ⚠️

**Conseguenze:**
- Form invia dati che non possono essere salvati
- Query SELECT falliscono su colonne inesistenti
- **L'app probabilmente CRASHA in produzione**

**File Coinvolti:**
- `supabase/migrations/00000_initial_schema.sql`
- `app/actions/service-profiles.ts`
- `lib/utils/validators.ts`

---

### 🔴 PROBLEMA 2: Nome Colonna Reviews Errato
**Gravità:** ⚡ BLOCCA RECENSIONI
**Descrizione:**
La tabella `reviews` ha la colonna `professional_profile_id`, ma il codice inserisce dati con chiave `professional_id`:

```typescript
// In createReview() - ERRATO
await supabase.from('reviews').insert({
  professional_id: professionalId,  // ❌ Colonna NON esiste!
  // Dovrebbe essere: service_profile_id (dopo rename) o professional_profile_id
})
```

**Conseguenze:**
- Le recensioni NON vengono salvate
- Errore PostgreSQL: `column "professional_id" does not exist`
- Sistema recensioni completamente rotto

**File Coinvolti:**
- `app/actions/service-profiles.ts` (riga 345)
- `supabase/migrations/00000_initial_schema.sql`

---

### 🔴 PROBLEMA 3: Constraint UNIQUE Mancante su Reviews
**Gravità:** 🟡 Alta
**Descrizione:**
Il codice controlla duplicati recensioni con query applicativa, ma NON c'è constraint UNIQUE nel database:

```typescript
// Check duplicati - Race condition possibile!
const existing = await supabase
  .from('reviews')
  .select('id')
  .eq('professional_id', professionalId)
  .eq('reviewer_id', user.id)
```

**Conseguenze:**
- Race condition: utente può creare recensioni duplicate
- Integrità dati non garantita a livello DB

**Fix Necessario:**
```sql
ALTER TABLE reviews
ADD CONSTRAINT reviews_unique_per_user_service
UNIQUE (service_profile_id, reviewer_id);
```

---

### 🔴 PROBLEMA 4: Campo tenant_id Mancante in Reviews
**Gravità:** 🟡 Media
**Descrizione:**
Lo schema SQL originale di `reviews` non include `tenant_id`, ma il codice prova ad inserirlo:

```typescript
await supabase.from('reviews').insert({
  tenant_id: profile.tenant_id,  // ❌ Colonna NON esiste!
})
```

**Conseguenze:**
- Errore su insert recensioni
- Multi-tenancy non funzionante per reviews

---

## 📋 TASK GROUPS

---

## GROUP 1: Fix Schema Database (MASSIMA PRIORITÀ)

**Priorità:** 🔴 P0 (BLOCCA TUTTO)
**Dipendenze:** Nessuna
**Stima Complessità:** 🔥 Media (3-4 ore)
**File Coinvolti:**
- `supabase/migrations/00017_fix_service_profiles_complete.sql` (NUOVO)

### Task 1.1: Creare Migration Completa Fix Schema

#### Subtask 1.1.1: Aggiungere colonne mancanti a service_profiles
- [ ] `business_name VARCHAR(255)` - Nome attività/professionista
- [ ] `services TEXT[]` - Array servizi offerti
- [ ] `certifications TEXT[]` - Array certificazioni
- [ ] `address TEXT` - Indirizzo studio/attività
- [ ] `logo_url TEXT` - URL logo da storage
- [ ] `portfolio_images JSONB DEFAULT '[]'` - Array URL foto portfolio (max 6)

#### Subtask 1.1.2: Fix tabella reviews
- [ ] Rinominare colonna `professional_profile_id` → `service_profile_id`
- [ ] Aggiungere colonna `tenant_id UUID NOT NULL REFERENCES tenants(id)`
- [ ] Aggiungere constraint `UNIQUE (service_profile_id, reviewer_id)`
- [ ] Aggiornare indici esistenti

#### Subtask 1.1.3: Creare bucket storage per loghi e portfolio
- [ ] Bucket `service-logos` (pubblico, 5MB, immagini)
- [ ] Bucket `service-portfolio` (pubblico, 10MB, max 6 immagini)
- [ ] RLS policies per upload (owner), read (public), delete (owner)

#### Subtask 1.1.4: Aggiungere indici ottimizzati
- [ ] Indice fulltext search: `to_tsvector('italian', business_name || description)`
- [ ] Indice su `(tenant_id, profile_type, category)` per filtri
- [ ] Indice su `reviews(service_profile_id, tenant_id)`

**Dettagli Tecnici - Migration Completa:**
```sql
-- =====================================================
-- Migration: Fix Service Profiles Schema Completo
-- =====================================================

-- STEP 1: Aggiungere colonne mancanti a service_profiles
ALTER TABLE service_profiles
  ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_images JSONB DEFAULT '[]';

-- STEP 2: Migrare dati esistenti (se necessario)
-- Se c'era campo 'title', copiarlo in business_name
UPDATE service_profiles
SET business_name = title
WHERE business_name IS NULL AND title IS NOT NULL;

-- STEP 3: Fix tabella reviews
-- Rinominare colonna
ALTER TABLE reviews
  RENAME COLUMN professional_profile_id TO service_profile_id;

-- Aggiungere tenant_id
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Popolare tenant_id da service_profiles (se dati esistono)
UPDATE reviews r
SET tenant_id = sp.tenant_id
FROM service_profiles sp
WHERE r.service_profile_id = sp.id AND r.tenant_id IS NULL;

-- Rendere tenant_id NOT NULL dopo popolamento
ALTER TABLE reviews
  ALTER COLUMN tenant_id SET NOT NULL;

-- Aggiungere constraint unique
ALTER TABLE reviews
  ADD CONSTRAINT reviews_unique_per_user_service
  UNIQUE (service_profile_id, reviewer_id);

-- STEP 4: Aggiornare indici
DROP INDEX IF EXISTS idx_reviews_profile;
CREATE INDEX idx_reviews_service_profile ON reviews(service_profile_id);
CREATE INDEX idx_reviews_tenant ON reviews(tenant_id);

-- Indice per ricerca fulltext
CREATE INDEX IF NOT EXISTS idx_service_profiles_search
  ON service_profiles USING gin(to_tsvector('italian',
    coalesce(business_name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(category, '')
  ));

-- Indice per filtri comuni
CREATE INDEX IF NOT EXISTS idx_service_profiles_filters
  ON service_profiles(tenant_id, profile_type, category, status);

-- STEP 5: Storage buckets per loghi e portfolio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('service-logos', 'service-logos', true, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('service-portfolio', 'service-portfolio', true, 10485760,
   ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- STEP 6: RLS policies per storage

-- Service logos - Upload owner
CREATE POLICY "Service logo upload own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service logo update own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service logo delete own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service logo read public"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-logos');

-- Service portfolio - Upload owner
CREATE POLICY "Service portfolio upload own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service portfolio update own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service portfolio delete own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service portfolio read public"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-portfolio');

-- STEP 7: Commenti per documentazione
COMMENT ON COLUMN service_profiles.business_name IS 'Nome attività professionale o nome professionista';
COMMENT ON COLUMN service_profiles.services IS 'Array servizi offerti dal professionista';
COMMENT ON COLUMN service_profiles.certifications IS 'Array certificazioni e qualifiche';
COMMENT ON COLUMN service_profiles.logo_url IS 'URL logo professionale da storage bucket';
COMMENT ON COLUMN service_profiles.portfolio_images IS 'Array max 6 URL immagini portfolio';
COMMENT ON COLUMN reviews.service_profile_id IS 'FK al profilo servizio recensito';
COMMENT ON COLUMN reviews.tenant_id IS 'Tenant di appartenenza (multi-tenancy)';

-- STEP 8: Aggiornare trigger (se necessario)
-- Trigger updated_at già esistente, nessuna modifica

-- Fine migration
```

**Acceptance Criteria:**
- [ ] Migration eseguita senza errori
- [ ] Tutte le colonne presenti in DB
- [ ] Reviews rinominato correttamente
- [ ] Constraint UNIQUE funzionante
- [ ] Bucket storage creati
- [ ] RLS policies attive
- [ ] Indici creati e funzionanti

---

## GROUP 2: Fix Server Actions

**Priorità:** 🔴 P0 (BLOCCA APP)
**Dipendenze:** GROUP 1 completato
**Stima Complessità:** ⚡ Bassa (2-3 ore)
**File Coinvolti:**
- `app/actions/service-profiles.ts`

### Task 2.1: Fix createReview() - Nome Colonna

#### Subtask 2.1.1: Correggere insert reviews
- [ ] Cambiare `professional_id` → `service_profile_id`
- [ ] Verificare che `tenant_id` sia incluso
- [ ] Aggiornare query check duplicati

**Codice Fix:**
```typescript
// In app/actions/service-profiles.ts, funzione createReview()

// PRIMA (ERRATO):
const { data: existing } = await supabase
  .from('reviews')
  .select('id')
  .eq('professional_id', professionalId)  // ❌ Colonna non esiste
  .eq('reviewer_id', user.id)

await supabase.from('reviews').insert({
  professional_id: professionalId,  // ❌ Colonna non esiste
  ...
})

// DOPO (CORRETTO):
const { data: existing } = await supabase
  .from('reviews')
  .select('id')
  .eq('service_profile_id', professionalId)  // ✅ Nome corretto
  .eq('reviewer_id', user.id)
  .maybeSingle();

await supabase.from('reviews').insert({
  service_profile_id: professionalId,  // ✅ Nome corretto
  reviewer_id: user.id,
  tenant_id: profile.tenant_id,  // ✅ Aggiunto
  rating: parsed.data.rating,
  comment: parsed.data.comment,
});
```

**Acceptance Criteria:**
- [ ] Insert recensioni funziona
- [ ] Check duplicati funziona
- [ ] tenant_id salvato correttamente

### Task 2.2: Fix getProfessionalById() - Query Reviews

#### Subtask 2.2.1: Correggere query reviews
- [ ] Cambiare `.eq('professional_id', id)` → `.eq('service_profile_id', id)`

**Codice Fix:**
```typescript
// In app/actions/service-profiles.ts, riga ~98

// PRIMA:
const { data: reviews } = await supabase
  .from('reviews')
  .eq('professional_id', professionalId)  // ❌

// DOPO:
const { data: reviews } = await supabase
  .from('reviews')
  .eq('service_profile_id', professionalId)  // ✅
  .order('created_at', { ascending: false });
```

**Acceptance Criteria:**
- [ ] Query reviews funziona
- [ ] Calcolo avg_rating corretto

---

## GROUP 3: Completare Form Creazione Profilo

**Priorità:** 🔴 P0 (CRITICO)
**Dipendenze:** GROUP 1-2 completati
**Stima Complessità:** 🔥 Alta (8-10 ore)
**File Coinvolti:**
- `app/(private)/professionals/new/page.tsx`
- `lib/utils/validators.ts`

### Task 3.1: Aggiornare Schema Zod Validator

#### Subtask 3.1.1: Fix createProfessionalProfileSchema
- [ ] Rimuovere campo `title` (deprecato, usare business_name)
- [ ] Rendere `businessName` REQUIRED (non optional)
- [ ] Rimuovere campo `isVolunteer` (deprecato, usare profile_type)
- [ ] Aggiungere campo `profileType: z.enum(['volunteer', 'professional'])`
- [ ] Cambiare `services` da array a string (input sarà CSV)
- [ ] Cambiare `certifications` da array a string (input sarà CSV)
- [ ] Aggiungere `rateOrReimbursement: z.number().positive().optional()`
- [ ] Validare `address` con max 500 caratteri

**Codice Fix:**
```typescript
// In lib/utils/validators.ts

export const createProfessionalProfileSchema = z.object({
  // Required fields
  category: z.string().min(2, 'Seleziona una categoria'),

  businessName: z.string()
    .min(2, "Il nome dell'attività deve contenere almeno 2 caratteri")
    .max(255, "Nome troppo lungo"),

  description: z.string()
    .min(50, 'La descrizione deve contenere almeno 50 caratteri')
    .max(2000, 'Descrizione troppo lunga'),

  profileType: z.enum(['volunteer', 'professional'], {
    required_error: 'Seleziona il tipo di profilo',
  }),

  // Servizi - Input come CSV string, trasformato in array
  services: z.string()
    .min(1, 'Inserisci almeno un servizio')
    .transform(str => str.split(',').map(s => s.trim()).filter(Boolean))
    .refine(arr => arr.length >= 1 && arr.length <= 20,
      'Inserisci tra 1 e 20 servizi'),

  // Certificazioni - Input come CSV string, trasformato in array
  certifications: z.string()
    .optional()
    .transform(str => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [])
    .refine(arr => arr.length <= 10, 'Massimo 10 certificazioni'),

  // Contatti - Almeno uno richiesto
  contactEmail: z.string()
    .email('Email non valida')
    .optional(),

  contactPhone: z.string()
    .regex(/^[+]?[\d\s()-]+$/, 'Numero di telefono non valido')
    .optional(),

  website: z.string()
    .url('URL non valido')
    .optional()
    .or(z.literal('')),

  address: z.string()
    .max(500, 'Indirizzo troppo lungo')
    .optional(),

  // Tariffa/Rimborso (opzionale)
  rateOrReimbursement: z.number()
    .positive('La tariffa deve essere positiva')
    .optional()
    .or(z.nan()),  // Permette campo vuoto

}).refine(
  data => data.contactEmail || data.contactPhone,
  {
    message: 'Inserisci almeno un metodo di contatto (email o telefono)',
    path: ['contactEmail'],
  }
);

// Export del tipo
export type CreateProfessionalProfileInput = z.infer<typeof createProfessionalProfileSchema>;
```

**Acceptance Criteria:**
- [ ] Schema valida tutti i campi richiesti
- [ ] Trasformazione CSV → array funziona
- [ ] Validazione contatti funziona
- [ ] Error messages chiari in italiano

### Task 3.2: Aggiungere Campi Mancanti al Form

#### Subtask 3.2.1: Campo Tipo Profilo (Volunteer vs Professional)
- [ ] Radio group o Select
- [ ] Opzioni: "Professionista" (default) / "Volontario"
- [ ] Tooltip spiegazione differenze

```typescript
<div className="space-y-2">
  <Label htmlFor="profileType">Tipo Profilo *</Label>
  <select
    id="profileType"
    name="profileType"
    required
    className="flex h-10 w-full rounded-md border border-input bg-background px-3"
  >
    <option value="professional">Professionista (servizio a pagamento)</option>
    <option value="volunteer">Volontario (servizio gratuito o rimborso spese)</option>
  </select>
  <p className="text-sm text-muted-foreground">
    I volontari offrono servizi gratuitamente o con rimborso spese.
    I professionisti forniscono servizi a pagamento.
  </p>
</div>
```

#### Subtask 3.2.2: Campo Servizi Offerti (Array)
- [ ] Textarea con istruzioni "Separa i servizi con virgola"
- [ ] Placeholder: "Es: Consulenza legale, Redazione contratti, Assistenza cause civili"
- [ ] Helper text con esempi
- [ ] Validazione client: min 1 servizio

```typescript
<div className="space-y-2">
  <Label htmlFor="services">Servizi Offerti *</Label>
  <Textarea
    id="services"
    name="services"
    placeholder="Es: Consulenza legale, Redazione contratti, Assistenza cause civili"
    rows={3}
    required
  />
  <p className="text-sm text-muted-foreground">
    Separa i servizi con una virgola. Sii specifico per aiutare gli utenti a trovarti.
  </p>
</div>
```

#### Subtask 3.2.3: Campo Certificazioni (Array)
- [ ] Textarea opzionale
- [ ] Placeholder: "Es: Abilitazione Ordine Avvocati, Master in Diritto Civile"
- [ ] Helper text: "Opzionale - separa con virgola"

```typescript
<div className="space-y-2">
  <Label htmlFor="certifications">Certificazioni e Qualifiche</Label>
  <Textarea
    id="certifications"
    name="certifications"
    placeholder="Es: Abilitazione Ordine Avvocati, Master in Diritto Civile, ISO 9001"
    rows={2}
  />
  <p className="text-sm text-muted-foreground">
    Opzionale - Elenca certificazioni, abilitazioni o qualifiche professionali.
  </p>
</div>
```

#### Subtask 3.2.4: Campo Tariffa/Rimborso
- [ ] Input number con step 0.01
- [ ] Label condizionale: "Tariffa Oraria (€/h)" per professional, "Rimborso Spese (€/h)" per volunteer
- [ ] Placeholder: "Es: 50.00"
- [ ] Opzionale

```typescript
<div className="space-y-2">
  <Label htmlFor="rate">
    {formData.profileType === 'professional'
      ? 'Tariffa Oraria (€/h)'
      : 'Rimborso Spese (€/h)'}
  </Label>
  <Input
    id="rate"
    name="rateOrReimbursement"
    type="number"
    step="0.01"
    min="0"
    placeholder="Es: 50.00"
  />
  <p className="text-sm text-muted-foreground">
    {formData.profileType === 'professional'
      ? 'Indicativo - Puoi specificare meglio nella descrizione'
      : 'Opzionale - Solo se richiedi rimborsi per materiali/spostamenti'}
  </p>
</div>
```

#### Subtask 3.2.5: Rendere businessName richiesto
- [ ] Cambiare label: "Nome Attività o Nome Completo *"
- [ ] Placeholder: "Es: Studio Legale Rossi o Mario Rossi"
- [ ] Required attribute

**Acceptance Criteria:**
- [ ] Tutti i 5 campi aggiunti al form
- [ ] Label e placeholder chiari
- [ ] Helper text esplicativi
- [ ] Validazione HTML5 funzionante

### Task 3.3: Aggiornare Submit Handler

#### Subtask 3.3.1: Processare nuovi campi
- [ ] Leggere `profileType` da FormData
- [ ] Processare `services` (string CSV)
- [ ] Processare `certifications` (string CSV)
- [ ] Processare `rateOrReimbursement` (convertire a float)
- [ ] Validare con Zod schema aggiornato

#### Subtask 3.3.2: Gestire errori validazione
- [ ] Mostrare errori Zod in toast
- [ ] Evidenziare campi con errori
- [ ] Scroll al primo errore

**Acceptance Criteria:**
- [ ] Submit invia tutti i campi corretti
- [ ] Validazione server funziona
- [ ] Errori mostrati chiaramente
- [ ] Profilo creato con successo

---

## GROUP 4: Upload Logo e Portfolio Immagini

**Priorità:** 🔴 P0 (RICHIESTO PER LANCIO)
**Dipendenze:** GROUP 1-3 completati
**Stima Complessità:** 🔥🔥 Molto Alta (12-16 ore)
**File Coinvolti:**
- `components/organisms/image-upload.tsx` (NUOVO - riutilizzabile)
- `components/organisms/multi-image-upload.tsx` (NUOVO - riutilizzabile)
- `app/(private)/professionals/new/page.tsx`
- `app/(private)/community-pro/[id]/page.tsx`

### Task 4.1: Creare Componente ImageUpload Singolo (Logo)

#### Subtask 4.1.1: Setup componente base
- [ ] File: `components/organisms/image-upload.tsx`
- [ ] Props: bucket, path, currentImage, onUploadComplete, maxSizeMB
- [ ] State: uploading, preview, error

#### Subtask 4.1.2: Implementare UI
- [ ] Dropzone area (click or drag)
- [ ] Preview immagine corrente
- [ ] Progress bar durante upload
- [ ] Button "Cambia Logo" se immagine presente
- [ ] Button "Rimuovi Logo"
- [ ] Error display

#### Subtask 4.1.3: Implementare upload logic
- [ ] Validare file (tipo, dimensione)
- [ ] Generare filename univoco: `{userId}/{timestamp}-{randomId}.{ext}`
- [ ] Upload a Supabase Storage tramite `supabase.storage.from(bucket).upload()`
- [ ] Ottenere URL pubblico
- [ ] Chiamare callback `onUploadComplete(url)`
- [ ] Gestire errori con toast

#### Subtask 4.1.4: Implementare delete logic
- [ ] Estrarre path da URL
- [ ] Chiamare `supabase.storage.from(bucket).remove([path])`
- [ ] Chiamare callback `onUploadComplete(null)`
- [ ] Conferma delete con Dialog

**Dettagli Tecnici:**
```typescript
// components/organisms/image-upload.tsx
'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { nanoid } from 'nanoid';

interface ImageUploadProps {
  bucket: string;
  currentImage?: string | null;
  onUploadComplete: (url: string | null) => void;
  maxSizeMB?: number;
  label?: string;
  description?: string;
}

export function ImageUpload({
  bucket,
  currentImage,
  onUploadComplete,
  maxSizeMB = 5,
  label = 'Immagine',
  description,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return 'Formato non supportato. Usa JPG, PNG, WebP o SVG.';
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File troppo grande. Dimensione massima: ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleUpload = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Utente non autenticato');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${nanoid(8)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      setPreview(publicUrl);
      onUploadComplete(publicUrl);
      toast.success('Immagine caricata con successo!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Errore durante il caricamento');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!preview) return;

    if (!confirm('Sei sicuro di voler rimuovere questa immagine?')) return;

    try {
      const supabase = createClient();

      // Extract path from URL
      const urlParts = preview.split('/');
      const path = urlParts.slice(urlParts.indexOf(bucket) + 1).join('/');

      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;

      setPreview(null);
      onUploadComplete(null);
      toast.success('Immagine rimossa');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Errore durante la rimozione');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}

      <div className="border-2 border-dashed rounded-lg p-4">
        {preview ? (
          <div className="space-y-4">
            <div className="relative aspect-square max-w-xs mx-auto overflow-hidden rounded-md">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex gap-2">
              <label className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Cambia Immagine
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-muted/50 rounded-md transition">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Clicca per caricare</p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WebP o SVG (max {maxSizeMB}MB)
            </p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        )}

        {uploading && (
          <div className="mt-4 space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-center text-muted-foreground">
              Caricamento in corso...
            </p>
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Upload singolo funzionante
- [ ] Preview immagine visibile
- [ ] Progress bar durante upload
- [ ] Validazione tipo/dimensione
- [ ] Delete con conferma
- [ ] Toast notifications
- [ ] Responsive design

### Task 4.2: Creare Componente MultiImageUpload (Portfolio)

#### Subtask 4.2.1: Setup componente base
- [ ] File: `components/organisms/multi-image-upload.tsx`
- [ ] Props: bucket, currentImages, onImagesChange, maxImages, maxSizeMB
- [ ] State: uploading, images[], error

#### Subtask 4.2.2: Implementare UI
- [ ] Grid immagini (2x3 su desktop, 2x2 su mobile)
- [ ] Dropzone per nuove immagini
- [ ] Preview thumbnail con overlay delete
- [ ] Counter "X / 6 immagini"
- [ ] Indicatore slot vuoti

#### Subtask 4.2.3: Implementare upload multiplo
- [ ] Supportare selezione multipla file
- [ ] Upload sequenziale (uno alla volta)
- [ ] Progress per ogni immagine
- [ ] Validare totale non superi maxImages
- [ ] Aggiornare array images

#### Subtask 4.2.4: Implementare delete singola immagine
- [ ] Overlay con button X su ogni thumb
- [ ] Conferma eliminazione
- [ ] Rimuovere da storage
- [ ] Aggiornare array images

**Dettagli Tecnici:**
```typescript
// components/organisms/multi-image-upload.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, X, Plus } from 'lucide-react';
import Image from 'next/image';
import { nanoid } from 'nanoid';

interface MultiImageUploadProps {
  bucket: string;
  currentImages?: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  label?: string;
}

export function MultiImageUpload({
  bucket,
  currentImages = [],
  onImagesChange,
  maxImages = 6,
  maxSizeMB = 10,
  label = 'Immagini Portfolio',
}: MultiImageUploadProps) {
  const [images, setImages] = useState<string[]>(currentImages);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;

    if (fileArray.length > remainingSlots) {
      toast.error(`Puoi caricare al massimo ${remainingSlots} immagini`);
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      const uploadedUrls: string[] = [];

      for (const file of fileArray) {
        // Validate
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          toast.error(`${file.name}: formato non supportato`);
          continue;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`${file.name}: file troppo grande`);
          continue;
        }

        // Upload
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${nanoid(8)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      onImagesChange(newImages);

      toast.success(`${uploadedUrls.length} immagini caricate!`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Errore durante il caricamento');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    if (!confirm('Rimuovere questa immagine?')) return;

    try {
      const supabase = createClient();
      const urlParts = url.split('/');
      const path = urlParts.slice(urlParts.indexOf(bucket) + 1).join('/');

      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;

      const newImages = images.filter(img => img !== url);
      setImages(newImages);
      onImagesChange(newImages);

      toast.success('Immagine rimossa');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Errore durante la rimozione');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <span className="text-xs text-muted-foreground">
          {images.length} / {maxImages} immagini
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div key={url} className="relative aspect-square group">
            <Image
              src={url}
              alt={`Portfolio ${index + 1}`}
              fill
              className="object-cover rounded-md"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
              onClick={() => handleDelete(url)}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {images.length < maxImages && (
          <label className="relative aspect-square border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/50 transition">
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                Aggiungi immagine
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Max {maxImages} immagini, {maxSizeMB}MB ciascuna.
        Formato: JPG, PNG o WebP
      </p>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Upload multiplo funzionante
- [ ] Grid responsive
- [ ] Max 6 immagini enforcement
- [ ] Delete singola immagine
- [ ] Progress feedback
- [ ] Counter immagini visibile

### Task 4.3: Integrare Upload nel Form Creazione

#### Subtask 4.3.1: Aggiungere ImageUpload per logo
- [ ] Posizionare dopo campo businessName
- [ ] Label: "Logo Professionale"
- [ ] Description: "Carica il logo della tua attività (opzionale)"
- [ ] Salvare URL in state
- [ ] Inviare in FormData al submit

#### Subtask 4.3.2: Aggiungere MultiImageUpload per portfolio
- [ ] Posizionare dopo descrizione
- [ ] Label: "Immagini Portfolio"
- [ ] Description: "Mostra esempi del tuo lavoro (max 6 immagini)"
- [ ] Salvare array URLs in state
- [ ] Convertire a JSON string per FormData

#### Subtask 4.3.3: Aggiornare createServiceProfile action
- [ ] Aggiungere `logo_url` e `portfolio_images` all'insert
- [ ] Validare che portfolio_images sia array valido
- [ ] Gestire caso logo/portfolio null/vuoti

**Acceptance Criteria:**
- [ ] Upload integrato nel form
- [ ] Logo e portfolio salvati in DB
- [ ] URL storage corretti
- [ ] Profilo creato con immagini

### Task 4.4: Visualizzare Logo e Portfolio in Dettaglio

#### Subtask 4.4.1: Mostrare logo nel header
- [ ] Avatar grande (96x96) con logo se presente
- [ ] Fallback a avatar utente
- [ ] Border e styling professionale

#### Subtask 4.4.2: Aggiungere sezione Portfolio
- [ ] Grid 2x3 immagini
- [ ] Click per aprire lightbox (opzionale)
- [ ] Caption "Portfolio" con count
- [ ] Nascondere se portfolio vuoto

**Acceptance Criteria:**
- [ ] Logo visibile in dettaglio profilo
- [ ] Portfolio grid responsive
- [ ] Immagini caricate correttamente

---

## GROUP 5: Pagina Modifica Profilo

**Priorità:** 🟡 P1 (Alta)
**Dipendenze:** GROUP 4 completato
**Stima Complessità:** 🔥 Alta (8-10 ore)
**File Coinvolti:**
- `app/(private)/community-pro/edit/[id]/page.tsx` (NUOVO)
- `components/organisms/edit-profile-form.tsx` (NUOVO)

### Task 5.1: Creare Route Edit

#### Subtask 5.1.1: Verificare ownership
- [ ] Check che user.id === profile.seller_id
- [ ] Redirect se non owner
- [ ] Caricare profilo esistente

#### Subtask 5.1.2: Creare EditProfileForm component
- [ ] Form precompilato con dati esistenti
- [ ] Stessa struttura di ProposalForm ma con valori iniziali
- [ ] Includere ImageUpload e MultiImageUpload
- [ ] Submit chiama `updateProfessionalProfile()`

#### Subtask 5.1.3: Gestire delete profilo
- [ ] Button "Elimina Profilo" in fondo (variant destructive)
- [ ] Dialog conferma con warning
- [ ] Chiamare `deleteProfessionalProfile()`
- [ ] Redirect a `/community-pro` dopo delete

**Acceptance Criteria:**
- [ ] Solo owner può modificare
- [ ] Form precompilato correttamente
- [ ] Upload logo/portfolio funziona
- [ ] Update salva modifiche
- [ ] Delete funziona con conferma

---

## GROUP 6: Dashboard "Il Mio Profilo"

**Priorità:** 🟡 P1 (Alta)
**Dipendenze:** GROUP 5 completato
**Stima Complessità:** 🔥 Media (6-8 ore)
**File Coinvolti:**
- `app/(private)/profile/my-service-profile/page.tsx` (NUOVO)

### Task 6.1: Creare Dashboard Page

#### Subtask 6.1.1: Caricare profilo utente
- [ ] Chiamare `getMyProfessionalProfile()`
- [ ] Se non esiste, mostrare CTA "Crea profilo"
- [ ] Se esiste, mostrare dashboard

#### Subtask 6.1.2: Implementare statistiche
- [ ] Numero visualizzazioni (se implementato tracking)
- [ ] Numero recensioni
- [ ] Rating medio
- [ ] Data creazione

#### Subtask 6.1.3: Implementare azioni rapide
- [ ] Button "Modifica Profilo" → `/community-pro/edit/[id]`
- [ ] Button "Vedi Profilo Pubblico" → `/community-pro/[id]`
- [ ] Toggle "Attiva/Disattiva" profilo

#### Subtask 6.1.4: Mostrare recensioni ricevute
- [ ] Lista ultimi 5 recensioni
- [ ] Link "Vedi tutte le recensioni"

**Acceptance Criteria:**
- [ ] Dashboard visibile solo per chi ha profilo
- [ ] Statistiche accurate
- [ ] Link funzionanti
- [ ] Toggle attivo/disattivo funziona

---

## GROUP 7: Filtri e Ricerca

**Priorità:** 🟡 P1 (Alta)
**Dipendenze:** GROUP 1-4 completati
**Stima Complessità:** 🔥 Media (6-8 ore)
**File Coinvolti:**
- `app/(private)/community-pro/page.tsx`
- `components/molecules/service-filters.tsx` (NUOVO)

### Task 7.1: Implementare Filtri UI

#### Subtask 7.1.1: Aggiungere search bar
- [ ] Input search full-width
- [ ] Placeholder: "Cerca per nome o servizio..."
- [ ] Icona Search
- [ ] Debounce 300ms

#### Subtask 7.1.2: Aggiungere select filtri
- [ ] Select Categoria (da lista hardcoded)
- [ ] Select Tipo (Tutti / Volontari / Professionisti)
- [ ] Select Ordinamento (Recenti / Nome A-Z / Rating)

#### Subtask 7.1.3: Implementare query filters
- [ ] Aggiornare URL search params
- [ ] Passare filtri a `getApprovedServiceProfiles()`
- [ ] Aggiornare server action per supportare filtri

**Acceptance Criteria:**
- [ ] Search filtra per nome/servizi
- [ ] Filtri categoria/tipo funzionano
- [ ] Ordinamento funziona
- [ ] URL riflette filtri
- [ ] Reset filtri button

---

## GROUP 8: Fix e Miglioramenti Minori

**Priorità:** 🟢 P2 (Media)
**Dipendenze:** Nessuna specifica
**Stima Complessità:** ⚡ Bassa (3-4 ore)

### Task 8.1: Ottimizzare Immagini

#### Subtask 8.1.1: Sostituire tag `<img>` con Next Image
- [ ] File: `app/(private)/community-pro/page.tsx` (riga 83)
- [ ] Usare `import Image from 'next/image'`
- [ ] Specificare width/height
- [ ] Aggiungere placeholder blur

**Acceptance Criteria:**
- [ ] Tutte le immagini usano Next Image
- [ ] Placeholder blur attivo
- [ ] Performance migliorata

### Task 8.2: Aggiungere Update/Delete UI Recensioni

#### Subtask 8.2.1: Button modifica recensione
- [ ] Visibile solo per reviewer
- [ ] Apre form edit inline o modal
- [ ] Salva modifiche

#### Subtask 8.2.2: Button elimina recensione
- [ ] Visibile per reviewer e admin
- [ ] Conferma con Dialog
- [ ] Toast feedback

**Acceptance Criteria:**
- [ ] Update recensione funziona
- [ ] Delete recensione funziona
- [ ] Solo owner/admin possono

### Task 8.3: Fix Campo Title vs businessName

#### Subtask 8.3.1: Decidere strategia
**Opzione A:** Rimuovere completamente campo `title` dal DB
**Opzione B:** Usare `title` come alias di `business_name`

**Raccomandazione:** Opzione A (già in migration GROUP 1)

---

## 🎯 ROADMAP SUGGERITA

### FASE 0 - Fix Critici (PRIORITÀ MASSIMA) - 5-7 ore
**Obiettivo:** Far funzionare l'app base

1. 🔴 GROUP 1: Migration fix schema (3-4 ore)
2. 🔴 GROUP 2: Fix server actions (2-3 ore)

**Deliverable:** App non crasha, recensioni funzionano

---

### FASE 1 - Feature Core (P0) - 20-26 ore
**Obiettivo:** Completare creazione profili con tutte le info

3. 🔴 GROUP 3: Completare form (8-10 ore)
4. 🔴 GROUP 4: Upload logo/portfolio (12-16 ore)

**Deliverable:** Utenti possono creare profili completi con immagini

---

### FASE 2 - Gestione Profili (P1) - 14-18 ore
**Obiettivo:** Permettere modifica e gestione profili

5. 🟡 GROUP 5: Pagina edit profilo (8-10 ore)
6. 🟡 GROUP 6: Dashboard personale (6-8 ore)

**Deliverable:** Utenti gestiscono i propri profili autonomamente

---

### FASE 3 - Usabilità (P1) - 6-8 ore
**Obiettivo:** Migliorare discovery profili

7. 🟡 GROUP 7: Filtri e ricerca (6-8 ore)

**Deliverable:** Utenti trovano facilmente professionisti

---

### FASE 4 - Polish (P2) - 3-4 ore
**Obiettivo:** Fix minori e ottimizzazioni

8. 🟢 GROUP 8: Miglioramenti vari (3-4 ore)

---

## 📝 NOTES IMPORTANTI

### Decisioni Architetturali

**Storage Buckets:**
- `service-logos`: Logo professionali (max 5MB, pubblico)
- `service-portfolio`: Foto lavori (max 10MB, pubblico)

**Multi-tenancy:**
- Tutti i profili e recensioni isolati per tenant
- RLS policies enforced a livello DB

**Validazione:**
- Zod schema sia client che server
- Validazione HTML5 nei form
- Toast per tutti i feedback

### Sicurezza

- ✅ Solo utenti verificati creano profili
- ✅ Solo owner modifica/elimina profilo
- ✅ Solo utenti verificati recensiscono
- ✅ Constraint UNIQUE previene recensioni duplicate
- ✅ File upload validato (tipo, dimensione)

### Performance

- Immagini ottimizzate con Next Image
- Portfolio limitato a 6 immagini (evita sovraccarico)
- Logo max 5MB (dimensione ragionevole)
- Indice fulltext per ricerca veloce

### Accessibilità

- Label su tutti i form fields
- Aria-labels dove necessario
- Keyboard navigation funzionante
- Color contrast WCAG AA

### Testing Manuale Checklist

Dopo ogni GROUP completato:
- [ ] Test creazione profilo (volunteer e professional)
- [ ] Test tutti i campi form (validazione)
- [ ] Test upload logo (successo/errore)
- [ ] Test upload portfolio (multiplo)
- [ ] Test delete immagini
- [ ] Test creazione recensione
- [ ] Test calcolo rating medio
- [ ] Test modifica profilo
- [ ] Test delete profilo
- [ ] Test filtri e ricerca
- [ ] Test responsive (mobile/tablet/desktop)
- [ ] Test permessi (verificato/non verificato)

---

## 🏁 CONCLUSIONE

Community Pro richiede fix critici immediati prima di essere utilizzabile. Una volta risolti i problemi database (GROUP 1-2), l'implementazione delle feature può procedere rapidamente.

**Tempo stimato totale:**
- Fix critici (FASE 0): ~6 ore
- MVP (FASE 1): ~29 ore
- Gestione completa (FASE 2): ~45 ore
- Feature complete (FASE 3): ~52 ore
- Con polish (FASE 4): ~56 ore

**PRIORITÀ ASSOLUTA:** GROUP 1 e GROUP 2 devono essere completati PRIMA di qualsiasi altro sviluppo.

**Ready to fix!** 🔧
