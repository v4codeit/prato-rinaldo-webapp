# 📋 Task Lists - Prato Rinaldo Platform

Questa cartella contiene i task list ultra-dettagliati per le 3 feature principali della piattaforma, pronte per il lancio.

---

## 📁 File Disponibili

### 1. `AGORA_TASKS.md` - Sistema Proposte Civiche
**Stato:** 60% completo | **Priorità:** Alta
**Tempo Stimato:** 26-37 ore (MVP-Complete)

Sistema stile FeatureBase per proposte della community con votazioni, commenti e roadmap.

**Cosa manca:**
- Form creazione proposta
- Pagina dettaglio con commenti
- Pagina roadmap
- Paginazione funzionante

---

### 2. `COMMUNITY_PRO_TASKS.md` - Profili Professionali
**Stato:** 40% completo | **Priorità:** ⚡ MASSIMA (Ha bug bloccanti)
**Tempo Stimato:** 29-56 ore (Fix Critici-Complete)

Profili professionisti/volontari con recensioni, portfolio e contatti.

**🚨 PROBLEMI CRITICI:**
- Mismatch schema database vs codice
- Bug recensioni (colonna errata)
- Form incompleto
- Upload logo/portfolio mancante

---

### 3. `MARKETPLACE_TASKS.md` - Annunci Compravendita
**Stato:** 60% completo | **Priorità:** Alta
**Tempo Stimato:** 23-54 ore (MVP-Complete)

Marketplace annunci con categorie, moderazione e contatti.

**Cosa manca:**
- Upload immagini UI (storage esiste ma form non implementato)
- Sistema contatti venditore
- Pagina edit annuncio
- Ricerca e filtri

---

## 🎯 Approccio Suggerito

### Opzione A: Sequenziale per Feature
Completa una feature alla volta prima di passare alla successiva.

**Ordine raccomandato:**
1. **COMMUNITY PRO** (fix critici + MVP) - ~29 ore
2. **MARKETPLACE** (upload + contatti + edit) - ~39 ore
3. **AGORÀ** (form + dettaglio + roadmap) - ~37 ore

**Totale:** ~105 ore (~13 giorni lavorativi)

---

### Opzione B: Priorità per Gravità
Risolvi prima i problemi bloccanti, poi completa le feature.

**Fase 1 - Fix Critici (6 ore):**
- COMMUNITY PRO: Migration schema database + fix bug recensioni

**Fase 2 - Feature Core (78 ore):**
- COMMUNITY PRO: Form completo + upload logo/portfolio (20 ore)
- MARKETPLACE: Upload immagini + galleria + contatti (20 ore)
- AGORÀ: Form creazione + dettaglio + commenti (26 ore)
- MARKETPLACE: Edit + dashboard venditori (12 ore)

**Fase 3 - Feature Complete (30 ore):**
- AGORÀ: Roadmap page (10 ore)
- MARKETPLACE: Ricerca + filtri + paginazione (10 ore)
- COMMUNITY PRO: Dashboard + filtri (10 ore)

**Totale:** ~114 ore (~14 giorni lavorativi)

---

## 📊 Matrice Decisionale

| Feature | Stato | Problemi Critici | Tempo MVP | Valore Business | Priorità |
|---------|-------|------------------|-----------|-----------------|----------|
| **Community Pro** | 40% | 🔴🔴🔴🔴 (4) | 29h | Alto | 1️⃣ |
| **Marketplace** | 60% | 🔴🔴 (2) | 23h | Alto | 2️⃣ |
| **Agorà** | 60% | 🟡 (0 critici) | 26h | Medio | 3️⃣ |

---

## 🔥 Task Groups Critici (P0) da Fare Subito

### COMMUNITY PRO
- [ ] **GROUP 1**: Migration fix schema database (3-4h)
- [ ] **GROUP 2**: Fix server actions recensioni (2-3h)
- [ ] **GROUP 3**: Completare form creazione (8-10h)
- [ ] **GROUP 4**: Upload logo + portfolio max 6 foto (12-16h)

### MARKETPLACE
- [ ] **GROUP 1**: Upload max 6 immagini con UI (8-10h)
- [ ] **GROUP 2**: Galleria immagini + lightbox (6-8h)
- [ ] **GROUP 3**: Sistema contatti venditore (6-8h)

### AGORÀ
- [ ] **GROUP 2**: Form creazione proposta (8-12h)
- [ ] **GROUP 3**: Pagina dettaglio + commenti (16-20h)

---

## 📖 Struttura File Task

Ogni file segue questo formato standardizzato:

```markdown
# NOME FEATURE - Task List Completa

## 📊 OVERVIEW
Stato, problemi, priorità

## 🚨 PROBLEMI CRITICI
Lista problemi bloccanti

## 📋 TASK GROUPS

### GROUP N: Nome Gruppo
**Priorità:** P0/P1/P2/P3
**Dipendenze:** ...
**Stima:** ore

#### Task N.1: Titolo
- [ ] Subtask atomico
- [ ] Subtask atomico

**Dettagli Tecnici:**
Code snippets, validazioni, note

**Acceptance Criteria:**
- [ ] Criterio 1
- [ ] Criterio 2

## 🎯 ROADMAP SUGGERITA
Fasi di implementazione

## 📝 NOTES
Decisioni, sicurezza, performance

## 🏁 CONCLUSIONE
Summary e stime totali
```

---

## 🛠️ Come Usare i Task Files

### 1. Leggi OVERVIEW e PROBLEMI CRITICI
Capisci lo stato attuale e cosa va fixato subito.

### 2. Identifica Dipendenze
Alcuni GROUP dipendono da altri. Rispetta l'ordine.

### 3. Lavora per Task Atomici
Ogni subtask è indipendente e testabile.

### 4. Segna Completati
Usa checkbox `- [x]` per tracciare progresso.

### 5. Valida con Acceptance Criteria
Ogni task ha criteri di accettazione espliciti.

---

## 🎨 Componenti Riutilizzabili da Creare

Questi componenti saranno condivisi tra le feature:

### Image Upload Components
- **`ImageUpload.tsx`** - Upload singola immagine (logo)
  - Drag & drop
  - Preview
  - Validazione tipo/dimensione
  - Progress bar

- **`MultiImageUpload.tsx`** - Upload multiplo (portfolio, marketplace)
  - Max N immagini configurabile
  - Grid thumbnails
  - Reorder (opzionale)
  - Delete singola

### Form Components
- **`RichTextEditor.tsx`** - Editor markdown (opzionale)
  - Tiptap o SimpleMDE
  - Preview tab
  - Toolbar essenziale

- **`ContactForm.tsx`** - Form contatto generico
  - Validazione
  - Email integration

### Gallery Components
- **`ImageGallery.tsx`** - Galleria con lightbox
  - Grid responsive
  - Navigation
  - Fullscreen modal

---

## 📐 Linee Guida Sviluppo

### ✅ DA FARE
- Riutilizzare componenti esistenti (shadcn/ui)
- Validazione Zod client + server
- Toast notifications (sonner)
- Loading states appropriati
- Next.js Image per tutte le immagini
- Error handling robusto
- Responsive design

### ❌ DA EVITARE
- Duplicazione codice
- Over-engineering
- Creare file senza necessità
- Omettere codice
- Rimuovere file senza autorizzazione
- Testing automatizzato (tutto manuale)
- Emoji (solo se richiesto esplicitamente)

---

## 🔐 Sicurezza Checklist

- [ ] RLS policies implementate per tutte le tabelle
- [ ] Validazione input client + server
- [ ] Sanitizzazione dati user-generated
- [ ] File upload: validazione tipo, dimensione, quantità
- [ ] Rate limiting su azioni sensibili
- [ ] Error messages non rivelano info sensibili
- [ ] SQL injection prevention (Supabase handled)
- [ ] XSS prevention (React handled)

---

## 🧪 Testing Manuale per Feature

### Dopo ogni GROUP completato:
1. **Funzionalità Base**
   - [ ] Feature funziona come specificato
   - [ ] Validazione form corretta
   - [ ] Error handling appropriato
   - [ ] Success feedback visibile

2. **Permessi**
   - [ ] Utenti non autenticati redirected
   - [ ] Utenti non verificati bloccati (dove necessario)
   - [ ] Owner-only actions funzionano
   - [ ] Admin-only actions funzionano

3. **Responsive**
   - [ ] Mobile (375px) ✓
   - [ ] Tablet (768px) ✓
   - [ ] Desktop (1280px+) ✓

4. **Performance**
   - [ ] Caricamento < 3s
   - [ ] Immagini ottimizzate
   - [ ] No memory leaks
   - [ ] Smooth interactions

5. **Accessibilità**
   - [ ] Keyboard navigation
   - [ ] Screen reader friendly
   - [ ] Color contrast WCAG AA
   - [ ] Form labels corretti

---

## 📦 Migrations da Creare

### Per Community Pro:
- `00017_fix_service_profiles_complete.sql`
  - Fix schema tabella
  - Fix reviews colonna
  - Storage buckets
  - Indici ottimizzati

### Per Marketplace (opzionale):
- `00018_fix_marketplace_rls.sql`
  - Fix policy is_private
  - Ottimizzazioni

---

## 📞 Supporto

Per domande o chiarimenti sui task:
1. Leggi attentamente **Dettagli Tecnici** nel task
2. Controlla **Notes** in fondo al file
3. Valida con **Acceptance Criteria**

---

## ✨ Stime Riassuntive

| Feature | Fix Critici | MVP | Complete | + Opzionali |
|---------|-------------|-----|----------|-------------|
| **Agorà** | 0h | 26h | 37h | 57h |
| **Community Pro** | 6h | 29h | 45h | 56h |
| **Marketplace** | 0h | 23h | 39h | 54h |
| **TOTALE** | **6h** | **78h** | **121h** | **167h** |

---

## 🚀 Ready to Start!

Scegli una feature, apri il task file e inizia dal GROUP 1!

**Buon lavoro!** 💪
