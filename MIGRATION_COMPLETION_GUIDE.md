# 🚀 Guida Completamento Migrazione Supabase

Questa guida descrive i passi finali per completare la migrazione a Supabase e mettere in produzione la nuova architettura.

---

## Fase 1: Backup File Originali

Prima di sostituire i file, creare un backup:

```bash
mkdir -p backup_drizzle
cp server/_core/context.ts backup_drizzle/
cp server/_core/trpc.ts backup_drizzle/
cp server/routers.ts backup_drizzle/
cp server/index.ts backup_drizzle/
```

---

## Fase 2: Sostituire File Core

### 2.1 Context

```bash
# Rinomina il vecchio context
mv server/_core/context.ts server/_core/context.drizzle.ts

# Rinomina il nuovo context
mv server/_core/context.supabase.ts server/_core/context.ts
```

### 2.2 tRPC Setup

```bash
# Rinomina il vecchio trpc
mv server/_core/trpc.ts server/_core/trpc.drizzle.ts

# Rinomina il nuovo trpc
mv server/_core/trpc.supabase.ts server/_core/trpc.ts
```

### 2.3 Routers

```bash
# Rinomina il vecchio routers
mv server/routers.ts server/routers.drizzle.ts

# Crea il nuovo file routers.ts dal index
cp server/routers/index.supabase.ts server/routers.ts
```

### 2.4 Aggiorna server/index.ts

Modifica il file `server/index.ts` per importare il nuovo router:

```typescript
// Prima (vecchio):
import { appRouter } from "./routers";

// Dopo (nuovo):
import { appRouter } from "./routers";
// oppure
import { appRouter } from "./routers/index.supabase";
```

---

## Fase 3: Aggiornare Variabili Ambiente

Assicurati che il file `.env` contenga le credenziali Supabase:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kyrliitlqshmwbzaaout.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANTE**: Non committare il file `.env` su GitHub! Aggiungi al `.gitignore`:

```
.env
.env.local
.env.production
```

---

## Fase 4: Fixare Tipi TypeScript

### 4.1 Generare Tipi Completi

Usa il CLI di Supabase per generare i tipi completi:

```bash
# Installa Supabase CLI (se non già installato)
npm install -g supabase

# Login a Supabase
supabase login

# Genera i tipi
supabase gen types typescript --project-id kyrliitlqshmwbzaaout > lib/supabase/database.types.generated.ts
```

### 4.2 Aggiornare database.types.ts

Sostituisci il contenuto di `lib/supabase/database.types.ts` con quello generato.

### 4.3 Rimuovere @ts-ignore

Dopo aver aggiornato i tipi, rimuovi i commenti `@ts-ignore` dai router e verifica che non ci siano errori TypeScript:

```bash
pnpm tsc --noEmit
```

---

## Fase 5: Testing Locale

### 5.1 Avvia il Server

```bash
pnpm dev
```

### 5.2 Test Checklist

- [ ] **Autenticazione**
  - [ ] Login funziona
  - [ ] Logout funziona
  - [ ] Registrazione nuovo utente
  - [ ] Session persistence

- [ ] **Articles**
  - [ ] Lista articoli pubblici
  - [ ] Visualizza articolo singolo
  - [ ] Crea nuovo articolo (admin)
  - [ ] Modifica articolo (admin)
  - [ ] Elimina articolo (admin)

- [ ] **Events**
  - [ ] Lista eventi pubblici
  - [ ] Lista eventi privati (autenticato)
  - [ ] Visualizza evento singolo
  - [ ] RSVP a evento
  - [ ] Lista RSVP

- [ ] **Marketplace**
  - [ ] Lista items
  - [ ] Visualizza item singolo
  - [ ] Crea nuovo item
  - [ ] Modifica item
  - [ ] Elimina item

- [ ] **Professional Profiles**
  - [ ] Lista professionisti
  - [ ] Visualizza profilo
  - [ ] Crea/aggiorna profilo
  - [ ] Disattiva profilo

- [ ] **Forum**
  - [ ] Lista categorie
  - [ ] Lista thread
  - [ ] Lista post
  - [ ] Crea thread
  - [ ] Crea post
  - [ ] Elimina post

- [ ] **RLS Policies**
  - [ ] Utente vede solo dati del proprio tenant
  - [ ] Admin può modificare contenuti
  - [ ] User normale non può modificare contenuti altrui

- [ ] **Storage**
  - [ ] Upload immagine profilo
  - [ ] Upload immagine marketplace
  - [ ] Upload immagine evento
  - [ ] Upload documento (admin)

---

## Fase 6: Cleanup Codice Obsoleto

### 6.1 Rimuovi File Drizzle

```bash
# Rimuovi cartella drizzle
rm -rf drizzle/

# Rimuovi file db.ts
rm server/db.ts

# Rimuovi file backup (dopo aver verificato che tutto funziona)
rm -rf backup_drizzle/
rm server/_core/context.drizzle.ts
rm server/_core/trpc.drizzle.ts
rm server/routers.drizzle.ts
```

### 6.2 Rimuovi Dipendenze Obsolete

Modifica `package.json` e rimuovi:

```json
{
  "dependencies": {
    "drizzle-orm": "...",
    "drizzle-kit": "...",
    "@libsql/client": "..."
  }
}
```

Poi esegui:

```bash
pnpm install
```

---

## Fase 7: Deploy Produzione

### 7.1 Variabili Ambiente Produzione

Configura le variabili ambiente su Vercel/hosting:

```
NEXT_PUBLIC_SUPABASE_URL=https://kyrliitlqshmwbzaaout.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 7.2 Deploy

```bash
# Se usi Vercel
vercel --prod

# Oppure push su GitHub (se hai auto-deploy configurato)
git add .
git commit -m "feat: migrate to Supabase"
git push origin main
```

### 7.3 Verifica Produzione

Dopo il deploy, verifica che:

- [ ] Login/logout funziona
- [ ] Dati vengono caricati correttamente
- [ ] RLS policies funzionano (multi-tenant isolation)
- [ ] Storage funziona per upload file

---

## Fase 8: Monitoring e Ottimizzazione

### 8.1 Monitoring Supabase

Monitora le performance su Supabase Dashboard:

- **Database**: https://supabase.com/dashboard/project/kyrliitlqshmwbzaaout/database
- **API Logs**: https://supabase.com/dashboard/project/kyrliitlqshmwbzaaout/logs/api-logs
- **Storage**: https://supabase.com/dashboard/project/kyrliitlqshmwbzaaout/storage/usage

### 8.2 Ottimizzazioni

- [ ] Aggiungi indici su colonne frequentemente filtrate
- [ ] Ottimizza query complesse con RPC functions
- [ ] Configura caching per query frequenti
- [ ] Monitora slow queries

---

## Troubleshooting

### Errore: "User is not authenticated"

Verifica che:
1. Le credenziali Supabase siano corrette
2. Il cookie handler funzioni correttamente
3. La session venga passata correttamente al context

### Errore: "Row Level Security policy violation"

Verifica che:
1. Le RLS policies siano applicate correttamente
2. L'utente abbia il `tenant_id` corretto
3. Le funzioni helper (`get_user_tenant_id`, etc.) funzionino

### Errore TypeScript

Verifica che:
1. I tipi siano stati generati correttamente
2. Il file `database.types.ts` sia aggiornato
3. Non ci siano import circolari

---

## Rollback (se necessario)

Se qualcosa va storto, puoi fare rollback:

```bash
# Ripristina i file originali
cp backup_drizzle/context.ts server/_core/context.ts
cp backup_drizzle/trpc.ts server/_core/trpc.ts
cp backup_drizzle/routers.ts server/routers.ts

# Reinstalla dipendenze Drizzle
pnpm install drizzle-orm drizzle-kit @libsql/client

# Riavvia il server
pnpm dev
```

---

## Checklist Finale

Prima di considerare la migrazione completata:

- [ ] Tutti i test passano
- [ ] Nessun errore TypeScript
- [ ] RLS policies funzionano correttamente
- [ ] Storage funziona
- [ ] Deploy in produzione riuscito
- [ ] Monitoring configurato
- [ ] Documentazione aggiornata
- [ ] Team informato delle modifiche

---

**Autore**: Manus AI  
**Data**: 2025-10-17  
**Versione**: 1.0

