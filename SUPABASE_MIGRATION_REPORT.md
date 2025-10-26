# Report Migrazione a Supabase: Prato Rinaldo Web App

**Data:** 2025-10-17
**Autore:** Manus AI
**Stato:** Fasi 1-4 completate. Pronto per il refactoring del backend.

---

## 1. Riepilogo Esecutivo

Questo documento riassume il lavoro svolto per migrare l'infrastruttura backend della web app "Prato Rinaldo" da una stack basata su MySQL, Drizzle ORM e Manus Auth a **Supabase**. L'obiettivo è stato quello di preparare completamente il progetto Supabase, implementare la sicurezza a livello di database (RLS), configurare lo storage per i file e preparare le utility client per la successiva fase di refactoring del codice.

Le fasi 1, 2, 3 e 4 del piano di migrazione sono state completate con successo. Il progetto è ora pronto per la fase 5: il refactoring dei router tRPC per utilizzare il nuovo backend Supabase.

## 2. Stato di Avanzamento per Fase

| Fase | Titolo | Stato | Note e Risultati Chiave |
| :--- | :--- | :--- | :--- |
| 1 | Analisi e Preparazione | ✅ Completata | Analisi dello schema esistente e pianificazione dettagliata della migrazione. |
| 2 | Implementazione RLS Policies | ✅ Completata | **50 RLS policies** create e applicate con successo a tutte le **17 tabelle** del database. Create **3 funzioni SQL helper** per la gestione dei permessi. |
| 3 | Configurazione Auth & Storage | ✅ Completata | Creati **5 bucket di storage** con policy di accesso RLS. Documentate le credenziali API (URL e Anon Key). |
| 4 | Dipendenze e Utility Client | ✅ Completata | Installate le librerie Supabase (`@supabase/ssr`, `@supabase/supabase-js`). Creati i client Supabase per browser e server, un nuovo hook `useSupabaseAuth` e i tipi TypeScript per il database. |
| 5 | Refactoring tRPC Routers | ⏳ **Da Iniziare** | Prossimo passo: sostituire le query Drizzle/MySQL con il client Supabase. |
| 6 | Aggiornamento Autenticazione | ⏳ **Da Iniziare** | Sostituire la logica di Manus Auth con il nuovo `useSupabaseAuth` hook. |
| 7 | Testing e Cleanup | ⏳ **Da Iniziare** | Test end-to-end e rimozione dei file obsoleti (Drizzle, Manus Auth, etc.). |
| 8 | Documentazione Finale | ✅ **In Corso** | Redazione di questo report. |

---

## 3. Dettagli Implementazione Tecnica

### 3.1. Row Level Security (RLS)

La sicurezza è stata implementata direttamente a livello di database per garantire la massima protezione e isolamento dei dati dei tenant.

- **RLS Abilitata**: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` eseguito su tutte le 17 tabelle.
- **Policies Create**: 50 policy `CREATE POLICY` definiscono le regole di accesso (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) per i vari ruoli utente (utente verificato, admin, proprietario del contenuto, etc.).
- **Funzioni Helper**: Sono state create le seguenti funzioni SQL in `public` schema per semplificare le policy:
  - `public.get_user_tenant_id()`: Restituisce il tenant dell'utente autenticato.
  - `public.is_admin()`: Verifica se l'utente ha un ruolo di amministratore.
  - `public.is_verified()`: Verifica se l'utente ha completato il processo di verifica residenza.

### 3.2. Supabase Storage

Sono stati creati 5 bucket per la gestione dei file, ciascuno con specifiche regole di accesso e limiti.

| Nome Bucket | Pubblico | Limite Dimensione | Tipi MIME permessi | Policy RLS Applicate |
| :--- | :--- | :--- | :--- | :--- |
| `marketplace-images` | ✅ Sì | 5 MB | `image/*` | Solo utenti verificati possono caricare. |
| `event-images` | ✅ Sì | 5 MB | `image/*` | Solo utenti verificati possono caricare. |
| `profile-avatars` | ✅ Sì | 2 MB | `image/*` | Ogni utente può caricare/aggiornare il proprio avatar. |
| `tenant-logos` | ✅ Sì | 1 MB | `image/*`, `image/svg+xml` | Solo admin possono caricare. |
| `documents` | ❌ No | 10 MB | `pdf`, `doc`, `docx` | Solo utenti verificati del tenant possono leggere; solo admin possono caricare. |

### 3.3. Utility e Nuovi File

Sono stati creati i seguenti file per supportare l'integrazione con Supabase. Questi file costituiscono la nuova base per l'accesso ai dati e l'autenticazione.

- **`lib/supabase/client.ts`**: Client Supabase per l'utilizzo lato browser (React components).
- **`lib/supabase/server.ts`**: Client Supabase per l'utilizzo lato server (tRPC context), con gestione dei cookie per SSR.
- **`lib/supabase/database.types.ts`**: Tipi TypeScript per il database, per garantire type-safety nelle query.
- **`client/src/hooks/useSupabaseAuth.ts`**: Hook React che sostituisce il precedente `useAuth` e gestisce lo stato di autenticazione con Supabase.
- **`SUPABASE_CREDENTIALS.md`**: Documento di riferimento con URL, chiavi API e dettagli di configurazione del progetto Supabase.

---

## 4. Prossimi Passi (Fase 5 e Successive)

Il progetto è ora pronto per la fase di refactoring del codice dell'applicazione. Le prossime azioni concrete sono:

1.  **Aggiornare il tRPC Context**: Modificare `server/_core/trpc.ts` e `server/_core/context.ts` per utilizzare il nuovo client Supabase (`lib/supabase/server.ts`) e passare l'utente Supabase autenticato nel contesto di tRPC.

2.  **Refactoring dei tRPC Router**: Aprire ogni file in `server/routers/` e sostituire tutte le chiamate al database che usano `db.*` (Drizzle) con le query equivalenti del client Supabase. Esempio:
    ```typescript
    // Vecchio codice (Drizzle)
    const user = await db.query.users.findFirst({ where: eq(users.id, input.id) });

    // Nuovo codice (Supabase)
    const { data: user, error } = await supabase.from("users").select("*").eq("id", input.id).single();
    ```

3.  **Aggiornare l'UI di Autenticazione**: Sostituire le chiamate a `manus` nel frontend con le funzioni del nuovo hook `useSupabaseAuth` (es. `signInWithGoogle`, `signOut`).

4.  **Testare il Flusso di Onboarding**: Verificare che il processo di registrazione e verifica utente funzioni correttamente con Supabase Auth e le nuove tabelle.

5.  **Eseguire il Cleanup**: Una volta che tutte le funzionalità sono state migrate e testate, eliminare i file e le dipendenze obsolete (Drizzle, Manus Auth, vecchi file di migrazione MySQL).

---

## 5. Allegati

- [SUPABASE_CREDENTIALS.md](./SUPABASE_CREDENTIALS.md)
- [apply_rls_policies.py](./apply_rls_policies.py) (Script usato per applicare le RLS policies)
- [create_storage_buckets.py](./create_storage_buckets.py) (Script usato per creare i bucket)

Questo report conclude la fase di setup dell'infrastruttura. Il backend è ora robusto, sicuro e pronto per essere integrato nell'applicazione.

