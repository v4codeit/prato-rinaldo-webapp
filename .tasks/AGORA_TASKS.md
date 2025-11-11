# AGORÀ - Sistema Proposte Civiche | Task List Completa

## 📊 OVERVIEW

**Feature:** Sistema di proposte civiche ispirato a FeatureBase per permettere ai residenti verificati di proporre iniziative, votarle e seguirne l'implementazione.

**Stato Attuale:** 60% completo
- ✅ Backend completo (database, RLS, server actions - 859 righe)
- ✅ Componenti UI base (ProposalCard, ProposalFilters, ProposalVoteWidget)
- ✅ Pagina lista proposte con filtri
- ❌ **3 pagine su 4 sono placeholder** ("Coming Soon")
- ❌ Form creazione proposta NON implementato
- ❌ Pagina dettaglio proposta NON implementata
- ❌ Sistema commenti NON implementato
- ❌ Pagina roadmap NON implementata
- ❌ Paginazione non funzionante (buttons hardcoded disabled)

**Priorità Generale:** ⚠️ **ALTA** - Feature core per lancio piattaforma

**Problemi Critici:** 5
**Feature Mancanti:** 7
**Miglioramenti Opzionali:** 4

---

## 🚨 PROBLEMI CRITICI DA RISOLVERE SUBITO

### ❌ PROBLEMA 1: Paginazione Non Funzionante
**File:** `app/(private)/agora/page.tsx` (riga 145-150)
**Gravità:** Media
**Descrizione:** Buttons "Precedente" e "Successivo" sono hardcoded con `disabled`

**Impatto:** Con più di 12 proposte, utenti non possono navigare le pagine successive

### ❌ PROBLEMA 2: Form Creazione Assente
**File:** `app/(private)/agora/new/page.tsx`
**Gravità:** CRITICA
**Descrizione:** Pagina è solo placeholder "Coming Soon"

**Impatto:** Utenti NON possono creare proposte, feature completamente inutilizzabile

### ❌ PROBLEMA 3: Pagina Dettaglio Assente
**File:** `app/(private)/agora/[id]/page.tsx`
**Gravità:** CRITICA
**Descrizione:** Pagina è solo placeholder "Coming Soon"

**Impatto:** Utenti non possono vedere dettagli proposte, votare, commentare

### ❌ PROBLEMA 4: Roadmap Assente
**File:** `app/(private)/agora/roadmap/page.tsx`
**Gravità:** Alta
**Descrizione:** Pagina è solo placeholder "Coming Soon"

**Impatto:** Feature promessa non disponibile, manca visibilità su proposte approvate

---

## 📋 TASK GROUPS

---

## GROUP 1: Fix Paginazione

**Priorità:** 🟡 P1 (Alta)
**Dipendenze:** Nessuna
**Stima Complessità:** ⚡ Bassa (1-2 ore)
**File Coinvolti:**
- `app/(private)/agora/page.tsx`

### Task 1.1: Implementare Logica Paginazione

#### Subtask 1.1.1: Calcolare stato paginazione
- [ ] Leggere `page` param da `useSearchParams()` (default = 1)
- [ ] Calcolare `totalPages = Math.ceil(total / 12)`
- [ ] Calcolare `hasPrevious = page > 1`
- [ ] Calcolare `hasNext = page < totalPages`

#### Subtask 1.1.2: Implementare funzioni navigazione
- [ ] Creare `handlePreviousPage()` → aggiorna URL con `page - 1`
- [ ] Creare `handleNextPage()` → aggiorna URL con `page + 1`
- [ ] Usare `router.push()` per aggiornare search params

#### Subtask 1.1.3: Aggiornare UI buttons
- [ ] Rimuovere `disabled` hardcoded
- [ ] Disabilitare "Precedente" se `!hasPrevious`
- [ ] Disabilitare "Successivo" se `!hasNext`
- [ ] Aggiungere indicatore "Pagina X di Y"

**Dettagli Tecnici:**
```typescript
// In app/(private)/agora/page.tsx
const searchParams = useSearchParams();
const router = useRouter();
const page = parseInt(searchParams.get('page') || '1');
const totalPages = Math.ceil(total / 12);

const handlePreviousPage = () => {
  const params = new URLSearchParams(searchParams);
  params.set('page', (page - 1).toString());
  router.push(`?${params.toString()}`);
};

const handleNextPage = () => {
  const params = new URLSearchParams(searchParams);
  params.set('page', (page + 1).toString());
  router.push(`?${params.toString()}`);
};
```

**Acceptance Criteria:**
- [ ] Paginazione funziona correttamente con filtri
- [ ] URL riflette pagina corrente
- [ ] Buttons disabled agli estremi
- [ ] Indicatore pagina corrente visibile
- [ ] Navigazione indietro/avanti mantiene filtri

---

## GROUP 2: Form Creazione Proposta

**Priorità:** 🔴 P0 (CRITICA)
**Dipendenze:** Nessuna
**Stima Complessità:** 🔥 Alta (8-12 ore)
**File Coinvolti:**
- `app/(private)/agora/new/page.tsx` (sostituire completamente)
- `components/organisms/proposal-form.tsx` (NUOVO)
- `lib/schemas/proposal.ts` (NUOVO - opzionale, può restare in validators.ts)

### Task 2.1: Creare Componente ProposalForm

#### Subtask 2.1.1: Setup form base
- [ ] Creare file `components/organisms/proposal-form.tsx`
- [ ] Importare shadcn Form components
- [ ] Definire interface `ProposalFormData`
- [ ] Setup `useForm` con `zodResolver`

#### Subtask 2.1.2: Implementare campi form
- [ ] Campo **Titolo** (Input)
  - Label: "Titolo della Proposta *"
  - Placeholder: "Es: Installare rastrelliere bici in piazza"
  - Validazione: min 10, max 500 caratteri
  - Error message custom

- [ ] Campo **Descrizione** (Textarea)
  - Label: "Descrizione Completa *"
  - Placeholder: "Descrivi la tua proposta in dettaglio..."
  - Rows: 8
  - Validazione: min 50 caratteri
  - Helper text: "Spiega perché questa proposta è importante per la comunità"

- [ ] Campo **Categoria** (Select)
  - Label: "Categoria *"
  - Carica categorie da `getProposalCategories()`
  - Usa `useEffect` per fetch
  - Mostra loading state
  - Mostra icona + nome categoria nelle options

#### Subtask 2.1.3: Implementare submit logic
- [ ] Handler `onSubmit` con `useTransition`
- [ ] Chiamare `createProposal(formData)` server action
- [ ] Gestire loading state (disable form durante submit)
- [ ] Gestire errori con `toast.error()`
- [ ] Gestire successo con `toast.success("Proposta creata!")`
- [ ] Redirect a `/agora` dopo successo

#### Subtask 2.1.4: Implementare preview proposta (opzionale)
- [ ] Aggiungere tab "Anteprima"
- [ ] Mostrare card proposta come apparirà
- [ ] Sincronizzare con valori form

**Dettagli Tecnici:**
```typescript
// components/organisms/proposal-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProposalSchema } from '@/lib/utils/validators';
import { createProposal } from '@/app/actions/proposals';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';

export function ProposalForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState([]);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      const { categories } = await getProposalCategories();
      setCategories(categories);
    }
    loadCategories();
  }, []);

  const form = useForm({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
    },
  });

  const onSubmit = (data) => {
    startTransition(async () => {
      const result = await createProposal(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Proposta creata con successo! Sarà visibile dopo la revisione.');
        router.push('/agora');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Campo Titolo */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titolo della Proposta *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Es: Installare rastrelliere bici in piazza"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Descrizione */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrizione Completa *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrivi la tua proposta in dettaglio..."
                  rows={8}
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <p className="text-sm text-muted-foreground">
                Spiega perché questa proposta è importante per la comunità (minimo 50 caratteri)
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Categoria */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona una categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon && <span className="mr-2">{category.icon}</span>}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Annulla
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creazione in corso...' : 'Crea Proposta'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

**Acceptance Criteria:**
- [ ] Form visivamente coerente con design app
- [ ] Validazione real-time funzionante
- [ ] Error messages chiari e in italiano
- [ ] Loading state disabilita form
- [ ] Toast notifications visibili
- [ ] Redirect automatico dopo successo
- [ ] Categorie caricate dinamicamente
- [ ] Form accessibile (label, aria-*)

### Task 2.2: Aggiornare Page /agora/new

#### Subtask 2.2.1: Sostituire placeholder
- [ ] Rimuovere tutto il contenuto "Coming Soon"
- [ ] Importare `ProposalForm` component
- [ ] Mantenere check autenticazione e verifica
- [ ] Aggiungere Card container con header

#### Subtask 2.2.2: Aggiungere breadcrumb/navigation
- [ ] Button "Torna all'Agorà" con icona ArrowLeft
- [ ] Titolo pagina "Nuova Proposta"
- [ ] Descrizione esplicativa

**Dettagli Tecnici:**
```typescript
// app/(private)/agora/new/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ProposalForm } from '@/components/organisms/proposal-form';

export const metadata = {
  title: 'Nuova Proposta - Agorà',
  description: 'Crea una nuova proposta per la comunità',
};

export default async function NewProposalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Check verification
  const { data: profile } = await supabase
    .from('users')
    .select('verification_status')
    .eq('id', user.id)
    .single();

  if (profile?.verification_status !== 'approved') {
    redirect('/agora'); // Redirect back with message
  }

  return (
    <div className="container py-8 max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/agora">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna all'Agorà
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Crea una Nuova Proposta</CardTitle>
          <CardDescription>
            Le proposte verranno revisionate dalla comunità e potranno essere
            approvate per l'implementazione. Assicurati di descrivere chiaramente
            la tua idea e i benefici per la comunità.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProposalForm />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Redirect utenti non verificati
- [ ] Form centrato e responsive
- [ ] Navigation intuitiva
- [ ] Metadata corretti

---

## GROUP 3: Pagina Dettaglio Proposta

**Priorità:** 🔴 P0 (CRITICA)
**Dipendenze:** GROUP 2 (Form)
**Stima Complessità:** 🔥🔥 Molto Alta (16-20 ore)
**File Coinvolti:**
- `app/(private)/agora/[id]/page.tsx` (sostituire completamente)
- `components/organisms/proposal-detail.tsx` (NUOVO)
- `components/organisms/comment-section.tsx` (NUOVO)
- `components/molecules/comment-card.tsx` (NUOVO)
- `components/molecules/comment-form.tsx` (NUOVO)
- `components/organisms/admin-status-form.tsx` (NUOVO - opzionale per admin)

### Task 3.1: Implementare Header Proposta

#### Subtask 3.1.1: Creare layout principale
- [ ] Layout 2 colonne desktop: sidebar (widget voto) + main content
- [ ] Layout 1 colonna mobile: stack verticale
- [ ] Usare Grid con breakpoints responsive

#### Subtask 3.1.2: Implementare header info
- [ ] Badge categoria (con colore custom e icona)
- [ ] Badge status proposta
- [ ] Titolo (h1, font-bold text-3xl)
- [ ] Info autore con avatar
  - Avatar (48x48)
  - Nome autore + link a profilo utente
  - Data creazione (formato relativo: "2 giorni fa")
  - View count con icona Eye

#### Subtask 3.1.3: Implementare descrizione completa
- [ ] Contenitore con whitespace-pre-wrap
- [ ] Se descrizione > 1000 caratteri, aggiungi "Leggi tutto"
- [ ] Rendering markdown (opzionale)

**Dettagli Tecnici:**
```typescript
// components/organisms/proposal-detail.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { ProposalStatusBadge } from '@/components/atoms/proposal-status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface ProposalDetailProps {
  proposal: {
    id: string;
    title: string;
    description: string;
    status: ProposalStatus;
    view_count: number;
    created_at: string;
    author: { id: string; name: string; avatar?: string };
    category: { name: string; icon?: string; color?: string };
  };
}

export function ProposalDetail({ proposal }: ProposalDetailProps) {
  return (
    <div className="space-y-6">
      {/* Badges */}
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          style={{
            borderColor: proposal.category.color,
            color: proposal.category.color,
          }}
        >
          {proposal.category.icon && <span className="mr-1">{proposal.category.icon}</span>}
          {proposal.category.name}
        </Badge>
        <ProposalStatusBadge status={proposal.status} />
      </div>

      {/* Titolo */}
      <h1 className="text-3xl font-bold">{proposal.title}</h1>

      {/* Info Autore */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={proposal.author.avatar} />
            <AvatarFallback>{proposal.author.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{proposal.author.name}</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(proposal.created_at), {
                  addSuffix: true,
                  locale: it,
                })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {proposal.view_count} visualizzazioni
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Descrizione */}
      <Card>
        <CardContent className="pt-6">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {proposal.description}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Layout responsive perfetto
- [ ] Badge categoria con colore custom
- [ ] Avatar con fallback iniziale
- [ ] Data in formato relativo italiano
- [ ] View count visibile
- [ ] Testo formattato correttamente

### Task 3.2: Integrare Widget Votazione

#### Subtask 3.2.1: Posizionare ProposalVoteWidget
- [ ] Sidebar fissa su desktop (sticky top-24)
- [ ] Top della pagina su mobile
- [ ] Passare props: proposalId, upvotes, downvotes, userVote

#### Subtask 3.2.2: Caricare voto utente corrente
- [ ] Chiamare `getUserVote(proposalId)` in page
- [ ] Passare risultato a widget
- [ ] Gestire stato non autenticato (disable buttons)

**Acceptance Criteria:**
- [ ] Widget funziona correttamente
- [ ] Voto utente evidenziato
- [ ] Optimistic updates smooth
- [ ] Errori gestiti con toast

### Task 3.3: Implementare Sezione Commenti

#### Subtask 3.3.1: Creare CommentSection component
- [ ] Creare `components/organisms/comment-section.tsx`
- [ ] Header: "Commenti (N)" + ordinamento
- [ ] Lista commenti con paginazione
- [ ] Form nuovo commento (solo autenticati)
- [ ] Empty state "Nessun commento"

#### Subtask 3.3.2: Creare CommentCard component
- [ ] Avatar commentatore (40x40)
- [ ] Nome + data (formato relativo)
- [ ] Testo commento (whitespace-pre-wrap)
- [ ] Bottone delete (solo owner o admin)
  - Icon Trash2
  - Conferma con Dialog
  - Loading state
  - Toast success/error

#### Subtask 3.3.3: Creare CommentForm component
- [ ] Textarea con label "Scrivi un commento"
- [ ] Placeholder: "Condividi la tua opinione..."
- [ ] Character counter (max 1000)
- [ ] Button "Pubblica Commento"
- [ ] Validazione: min 10 caratteri
- [ ] Loading state durante submit
- [ ] Reset form dopo successo

#### Subtask 3.3.4: Implementare paginazione commenti
- [ ] "Carica altri commenti" button
- [ ] Limit 10 commenti per caricamento
- [ ] Loading state
- [ ] Nascondere button se non ci sono più commenti

**Dettagli Tecnici:**
```typescript
// components/organisms/comment-section.tsx
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CommentCard } from '@/components/molecules/comment-card';
import { CommentForm } from '@/components/molecules/comment-form';
import { getProposalComments } from '@/app/actions/proposals';
import { Loader2 } from 'lucide-react';

interface CommentSectionProps {
  proposalId: string;
  initialComments: Comment[];
  isAuthenticated: boolean;
}

export function CommentSection({ proposalId, initialComments, isAuthenticated }: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialComments.length >= 10);
  const [isPending, startTransition] = useTransition();

  const loadMore = () => {
    startTransition(async () => {
      const { comments: newComments } = await getProposalComments(proposalId, page + 1, 10);
      setComments([...comments, ...newComments]);
      setPage(page + 1);
      setHasMore(newComments.length >= 10);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commenti ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAuthenticated && (
          <CommentForm proposalId={proposalId} onSuccess={(newComment) => {
            setComments([newComment, ...comments]);
          }} />
        )}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nessun commento ancora. Sii il primo a commentare!
            </p>
          ) : (
            comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onDelete={(id) => {
                  setComments(comments.filter(c => c.id !== id));
                }}
              />
            ))
          )}
        </div>

        {hasMore && (
          <Button
            variant="outline"
            className="w-full"
            onClick={loadMore}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Caricamento...
              </>
            ) : (
              'Carica altri commenti'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

```typescript
// components/molecules/comment-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createComment } from '@/app/actions/proposals';
import { toast } from 'sonner';

interface CommentFormProps {
  proposalId: string;
  onSuccess: (comment: Comment) => void;
}

export function CommentForm({ proposalId, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (content.trim().length < 10) {
      toast.error('Il commento deve contenere almeno 10 caratteri');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('content', content);

      const result = await createComment(proposalId, formData);

      if (result.error) {
        toast.error(result.error);
      } else if (result.comment) {
        toast.success('Commento pubblicato!');
        setContent('');
        onSuccess(result.comment);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Condividi la tua opinione su questa proposta..."
          rows={4}
          disabled={isPending}
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {content.length} / 1000 caratteri
          </p>
          <Button type="submit" disabled={isPending || content.trim().length < 10}>
            {isPending ? 'Pubblicazione...' : 'Pubblica Commento'}
          </Button>
        </div>
      </div>
    </form>
  );
}
```

**Acceptance Criteria:**
- [ ] Commenti ordinati per data (DESC)
- [ ] Form solo per utenti autenticati
- [ ] Validazione min 10 caratteri funziona
- [ ] Character counter real-time
- [ ] Delete solo per owner/admin
- [ ] Conferma eliminazione con Dialog
- [ ] Paginazione "Load More" funziona
- [ ] Empty state chiaro
- [ ] Toast notifications appropriate

### Task 3.4: Form Cambio Status (Solo Admin/Board)

#### Subtask 3.4.1: Verificare permessi utente
- [ ] Controllare se user è admin/super_admin/moderator o in board
- [ ] Se non autorizzato, nascondere form completamente

#### Subtask 3.4.2: Creare AdminStatusForm component
- [ ] Select nuovo status (enum completo)
- [ ] Textarea motivo (obbligatorio se declined)
- [ ] DatePicker planned_date (se approved)
- [ ] DatePicker completed_date (se completed)
- [ ] Button "Aggiorna Status"

#### Subtask 3.4.3: Integrare in pagina dettaglio
- [ ] Posizionare dopo descrizione, prima commenti
- [ ] Card con Alert info: "Gestione Status (Solo Admin)"
- [ ] Chiamare `updateProposalStatus()` action
- [ ] Refresh page dopo successo

**Dettagli Tecnici:**
```typescript
// components/organisms/admin-status-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { updateProposalStatus } from '@/app/actions/proposals';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = [
  { value: 'proposed', label: 'Proposta' },
  { value: 'under_review', label: 'In Valutazione' },
  { value: 'approved', label: 'Approvata' },
  { value: 'in_progress', label: 'In Corso' },
  { value: 'completed', label: 'Completata' },
  { value: 'declined', label: 'Respinta' },
];

interface AdminStatusFormProps {
  proposalId: string;
  currentStatus: string;
}

export function AdminStatusForm({ proposalId, currentStatus }: AdminStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (status === 'declined' && !reason.trim()) {
      toast.error('Il motivo è obbligatorio per le proposte respinte');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('status', status);
      if (reason) formData.append('reason', reason);
      if (plannedDate) formData.append('plannedDate', plannedDate);
      if (completedDate) formData.append('completedDate', completedDate);

      const result = await updateProposalStatus(proposalId, formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Status aggiornato con successo');
        router.refresh();
      }
    });
  };

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <CardTitle>Gestione Status (Solo Admin)</CardTitle>
        <CardDescription>
          Modifica lo status della proposta e aggiungi note sul progresso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nuovo Status</Label>
            <Select value={status} onValueChange={setStatus} disabled={isPending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === 'declined' && (
            <div className="space-y-2">
              <Label>Motivo Rifiuto *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Spiega perché questa proposta è stata respinta..."
                rows={3}
                disabled={isPending}
              />
            </div>
          )}

          {status === 'approved' && (
            <div className="space-y-2">
              <Label>Data Pianificata</Label>
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                disabled={isPending}
              />
            </div>
          )}

          {status === 'completed' && (
            <div className="space-y-2">
              <Label>Data Completamento</Label>
              <input
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                disabled={isPending}
              />
            </div>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Aggiornamento...' : 'Aggiorna Status'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Acceptance Criteria:**
- [ ] Visibile solo ad admin/board members
- [ ] Select status funzionante
- [ ] Campo motivo obbligatorio per declined
- [ ] DatePicker per planned/completed dates
- [ ] Validation funzionante
- [ ] Page refresh dopo update
- [ ] Toast success/error

### Task 3.5: Aggiornare Page /agora/[id]

#### Subtask 3.5.1: Sostituire placeholder
- [ ] Rimuovere contenuto "Coming Soon"
- [ ] Caricare proposta con `getProposalById(id)`
- [ ] Caricare voto utente con `getUserVote(id)`
- [ ] Caricare commenti con `getProposalComments(id)`
- [ ] Verificare permessi admin

#### Subtask 3.5.2: Implementare layout finale
- [ ] Grid 2 colonne (sidebar + main)
- [ ] Sidebar: ProposalVoteWidget sticky
- [ ] Main: ProposalDetail + AdminStatusForm (se admin) + CommentSection
- [ ] Responsive: stack su mobile

#### Subtask 3.5.3: Gestire caso proposta non trovata
- [ ] Redirect a `/agora` con toast error
- [ ] O mostrare 404 page

#### Subtask 3.5.4: Implementare metadata dinamici
- [ ] Title: `{proposal.title} - Agorà`
- [ ] Description: primi 160 caratteri di description
- [ ] OpenGraph image (se implementato upload immagini)

**Acceptance Criteria:**
- [ ] Layout responsive perfetto
- [ ] Tutti i componenti integrati correttamente
- [ ] Permessi admin verificati
- [ ] Metadata dinamici corretti
- [ ] 404 gestito elegantemente

---

## GROUP 4: Pagina Roadmap

**Priorità:** 🟡 P1 (Alta)
**Dipendenze:** GROUP 3 (Dettaglio Proposta)
**Stima Complessità:** 🔥 Alta (10-12 ore)
**File Coinvolti:**
- `app/(private)/agora/roadmap/page.tsx` (sostituire)
- `components/organisms/roadmap-board.tsx` (NUOVO)
- `components/molecules/roadmap-card.tsx` (NUOVO)

### Task 4.1: Decidere Layout Roadmap

#### Subtask 4.1.1: Scegliere tra 2 opzioni
**Opzione A: Kanban Board (3 colonne)**
- Colonna 1: Approvate (status: approved)
- Colonna 2: In Corso (status: in_progress)
- Colonna 3: Completate (status: completed)
- Pro: Visuale immediata, familiare
- Contro: Occupa spazio orizzontale

**Opzione B: Timeline Verticale**
- Milestone con date
- Card proposte sotto ogni milestone
- Pro: Mostra progressione temporale
- Contro: Più complesso da implementare

**Decisione suggerita:** Opzione A (Kanban) per semplicità

### Task 4.2: Implementare Kanban Board

#### Subtask 4.2.1: Creare RoadmapBoard component
- [ ] 3 colonne responsive
- [ ] Grid layout: `grid-cols-1 md:grid-cols-3`
- [ ] Header colonna con count proposte
- [ ] Empty state per colonne vuote

#### Subtask 4.2.2: Creare RoadmapCard component
- [ ] Layout compatto rispetto a ProposalCard
- [ ] Titolo (line-clamp-2)
- [ ] Badge categoria
- [ ] Score voti
- [ ] Data pianificata (se approved)
- [ ] Data completamento (se completed)
- [ ] Link a dettaglio proposta

#### Subtask 4.2.3: Implementare filtri
- [ ] Filtro per categoria
- [ ] Filtro per anno
- [ ] Ordinamento (score, data)

**Dettagli Tecnici:**
```typescript
// components/organisms/roadmap-board.tsx
interface RoadmapBoardProps {
  approved: Proposal[];
  inProgress: Proposal[];
  completed: Proposal[];
}

export function RoadmapBoard({ approved, inProgress, completed }: RoadmapBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Colonna Approvate */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Approvate</h2>
          <Badge variant="secondary">{approved.length}</Badge>
        </div>
        <div className="space-y-3">
          {approved.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nessuna proposta approvata
            </p>
          ) : (
            approved.map((proposal) => (
              <RoadmapCard key={proposal.id} proposal={proposal} />
            ))
          )}
        </div>
      </div>

      {/* Colonna In Corso */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">In Corso</h2>
          <Badge variant="default">{inProgress.length}</Badge>
        </div>
        <div className="space-y-3">
          {inProgress.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nessuna proposta in corso
            </p>
          ) : (
            inProgress.map((proposal) => (
              <RoadmapCard key={proposal.id} proposal={proposal} />
            ))
          )}
        </div>
      </div>

      {/* Colonna Completate */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Completate</h2>
          <Badge variant="outline">{completed.length}</Badge>
        </div>
        <div className="space-y-3">
          {completed.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nessuna proposta completata
            </p>
          ) : (
            completed.map((proposal) => (
              <RoadmapCard key={proposal.id} proposal={proposal} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Layout 3 colonne responsive
- [ ] Card visivamente coerenti
- [ ] Empty state per colonne vuote
- [ ] Count proposte visibile
- [ ] Link a dettaglio funzionanti
- [ ] Filtri funzionanti

### Task 4.3: Aggiornare Page /agora/roadmap

#### Subtask 4.3.1: Implementare page
- [ ] Caricare proposte con `getRoadmapProposals()`
- [ ] Separare per status
- [ ] Passare a RoadmapBoard
- [ ] Aggiungere header con descrizione

#### Subtask 4.3.2: Aggiungere call-to-action
- [ ] Link "Proponi una nuova idea" se utente verificato
- [ ] Descrizione scopo roadmap

**Acceptance Criteria:**
- [ ] Roadmap visibile e funzionante
- [ ] Proposte raggruppate correttamente
- [ ] CTA visibile
- [ ] Responsive perfetto

---

## GROUP 5: Miglioramenti Opzionali

**Priorità:** 🟢 P3 (Bassa)
**Dipendenze:** GROUP 1-4 completati
**Stima Complessità:** Variabile

### Task 5.1: Upload Immagini nelle Proposte (Opzionale)

#### Subtask 5.1.1: Creare bucket storage
- [ ] Migration per bucket `proposal-images`
- [ ] RLS policies (upload verified, read public)
- [ ] Limit: 10MB, 3 immagini max

#### Subtask 5.1.2: Aggiungere campo images a proposals
- [ ] Migration: `ALTER TABLE proposals ADD COLUMN images JSONB DEFAULT '[]'`

#### Subtask 5.1.3: Integrare nel form
- [ ] Usare componente ImageUpload riutilizzabile
- [ ] Max 3 immagini
- [ ] Preview thumbs
- [ ] Salvare array URL in JSON

#### Subtask 5.1.4: Visualizzare in dettaglio
- [ ] Galleria immagini dopo descrizione
- [ ] Lightbox per full-view

**Stima:** 6-8 ore

### Task 5.2: Rich Text Editor Markdown (Opzionale)

#### Subtask 5.2.1: Integrare Tiptap o SimpleMDE
- [ ] Installare dipendenza
- [ ] Creare wrapper component
- [ ] Toolbar essenziale: bold, italic, link, lists

#### Subtask 5.2.2: Rendering markdown in visualizzazione
- [ ] Usare libreria react-markdown
- [ ] Sanitize HTML
- [ ] Styling prose

**Stima:** 4-6 ore

### Task 5.3: Notifiche Cambio Status (Opzionale)

#### Subtask 5.3.1: Creare sistema notifiche base
- [ ] Tabella notifications (se non esiste)
- [ ] Server action per creare notifica

#### Subtask 5.3.2: Inviare notifica on status change
- [ ] Trigger o action che notifica autore
- [ ] Tipo: "La tua proposta è stata approvata!"

**Stima:** 4-6 ore

### Task 5.4: Tags/Labels Custom (Opzionale)

#### Subtask 5.4.1: Tabella proposal_tags
- [ ] Migration nuova tabella
- [ ] Many-to-many con proposals

#### Subtask 5.4.2: UI gestione tags
- [ ] Input tags nel form
- [ ] Filter per tag nella lista

**Stima:** 6-8 ore

---

## 🎯 ROADMAP SUGGERITA

### FASE 1 - MVP Funzionante (P0) - 24-30 ore
**Obiettivo:** Rendere Agorà utilizzabile per utenti finali

1. ✅ GROUP 2: Form Creazione Proposta (8-12 ore)
2. ✅ GROUP 3: Pagina Dettaglio + Commenti (16-20 ore)
3. ✅ GROUP 1: Fix Paginazione (1-2 ore)

**Deliverable:** Utenti possono creare, vedere, votare e commentare proposte

---

### FASE 2 - Feature Complete (P1) - 10-12 ore
**Obiettivo:** Implementare tutte le feature promesse

4. ✅ GROUP 4: Pagina Roadmap (10-12 ore)

**Deliverable:** Roadmap visibile con proposte approvate/in corso/completate

---

### FASE 3 - Miglioramenti (P2-P3) - Opzionale
**Obiettivo:** Aggiungere funzionalità extra

5. 🔧 Upload immagini (6-8 ore)
6. 🔧 Rich text editor (4-6 ore)
7. 🔧 Notifiche (4-6 ore)
8. 🔧 Tags custom (6-8 ore)

---

## 📝 NOTES IMPORTANTI

### Decisioni Architetturali
- **Server Components dove possibile** per performance
- **Client Components solo per interattività** (form, voting)
- **Optimistic Updates** per votazioni (UX migliore)
- **Toast Notifications** per tutti i feedback (successo/errore)

### Sicurezza
- ✅ RLS policies già implementate e robuste
- ✅ Validazione Zod sia client che server
- ✅ Solo residenti verificati possono creare proposte
- ✅ Solo autenticati possono commentare
- ✅ Solo admin/board cambiano status

### Performance
- Proposte limitate a 20 per pagina (paginazione)
- Commenti caricati in batch da 10
- View count incrementato in background
- Indici database ottimizzati

### Accessibilità
- Tutti i form con label corretti
- Keyboard navigation funzionante
- Aria-labels dove necessario
- Color contrast WCAG AA compliant

### Testing Manuale Checklist
Dopo ogni GROUP completato:
- [ ] Test create proposta (tutti i campi)
- [ ] Test validazione form (errori)
- [ ] Test votazione (up/down/toggle)
- [ ] Test commenti (create/delete)
- [ ] Test paginazione (prev/next)
- [ ] Test filtri (categoria/status/sort)
- [ ] Test responsive (mobile/tablet/desktop)
- [ ] Test permessi (non verificato/verificato/admin)
- [ ] Test edge cases (proposte senza voti, senza commenti)

---

## 🏁 CONCLUSIONE

Con questo task file, l'implementazione di Agorà è mappata in modo completo e atomico. Ogni task è indipendente e testabile. La priorità P0-P1 copre il 90% della feature funzionale.

**Tempo stimato totale:**
- MVP (FASE 1): ~26 ore
- Complete (FASE 2): ~37 ore
- Con opzionali (FASE 3): ~57 ore

**Ready to start!** 🚀
