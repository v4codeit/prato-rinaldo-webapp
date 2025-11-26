# Guida Completa: Setup Google SSO con Supabase

Questa guida ti accompagna passo-passo nella configurazione di Google OAuth per il login con Supabase.

**Tempo stimato:** 15-20 minuti

---

## Indice

1. [Prerequisiti](#prerequisiti)
2. [Fase 1: Google Cloud Console](#fase-1-google-cloud-console)
3. [Fase 2: Configurazione Supabase](#fase-2-configurazione-supabase)
4. [Fase 3: Configurazione Locale](#fase-3-configurazione-locale)
5. [Fase 4: Test e Verifica](#fase-4-test-e-verifica)
6. [Troubleshooting](#troubleshooting)
7. [Produzione](#produzione)

---

## Prerequisiti

Prima di iniziare, assicurati di avere:

- [ ] Un account Google (per Google Cloud Console)
- [ ] Accesso al dashboard Supabase del progetto
- [ ] Il progetto Next.js funzionante in locale (`pnpm dev`)

---

## Fase 1: Google Cloud Console

### Step 1.1: Accedi a Google Cloud Console

1. Vai su **[Google Cloud Console](https://console.cloud.google.com/)**
2. Effettua il login con il tuo account Google
3. Se non hai un progetto, creane uno nuovo:
   - Clicca su **"Select a project"** → **"New Project"**
   - Nome: `Prato Rinaldo Community` (o altro nome descrittivo)
   - Clicca **"Create"**

### Step 1.2: Abilita le API necessarie

1. Nel menu laterale, vai su **"APIs & Services"** → **"Library"**
2. Cerca **"Google+ API"** e clicca su **"Enable"** (se non già abilitata)
3. Cerca **"Google Identity"** e abilita anche questa

### Step 1.3: Configura OAuth Consent Screen

1. Vai su **"APIs & Services"** → **"OAuth consent screen"**
2. Seleziona **"External"** (per utenti esterni alla tua organizzazione)
3. Clicca **"Create"**

**Compila i campi:**

| Campo | Valore |
|-------|--------|
| **App name** | `Prato Rinaldo Digitale` |
| **User support email** | La tua email |
| **App logo** | (opzionale) Carica il logo |
| **App domain** | `pratorinaldo.it` (dominio produzione) |
| **Authorized domains** | `pratorinaldo.it` |
| **Developer contact** | La tua email |

4. Clicca **"Save and Continue"**

**Scopes (permessi):**
1. Clicca **"Add or Remove Scopes"**
2. Seleziona:
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
   - `openid`
3. Clicca **"Update"** → **"Save and Continue"**

**Test Users (per sviluppo):**
- Aggiungi le email degli utenti di test
- Clicca **"Save and Continue"**

5. Rivedi e clicca **"Back to Dashboard"**

### Step 1.4: Crea le Credenziali OAuth

1. Vai su **"APIs & Services"** → **"Credentials"**
2. Clicca **"+ Create Credentials"** → **"OAuth client ID"**

**Configura:**

| Campo | Valore |
|-------|--------|
| **Application type** | `Web application` |
| **Name** | `Prato Rinaldo - Web Client` |

**Authorized JavaScript origins:**
```
http://localhost:3000
https://pratorinaldo.it
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/callback
https://<TUO-PROJECT-REF>.supabase.co/auth/v1/callback
https://pratorinaldo.it/auth/callback
```

> ⚠️ **IMPORTANTE:** Sostituisci `<TUO-PROJECT-REF>` con il tuo Supabase project reference (es. `kyrliitlqshmwbzaaout`)

3. Clicca **"Create"**

4. **COPIA E SALVA** immediatamente:
   - **Client ID**: `xxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxx`

> ⚠️ Da Giugno 2025, i Client Secret sono visibili SOLO al momento della creazione. Salvali in un posto sicuro!

---

## Fase 2: Configurazione Supabase

### Step 2.1: Accedi al Dashboard Supabase

1. Vai su **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Seleziona il tuo progetto

### Step 2.2: Configura il Provider Google

1. Nel menu laterale, vai su **"Authentication"** → **"Providers"**
2. Trova **"Google"** nella lista e clicca per espandere
3. Abilita il toggle **"Enable Google"**

**Compila i campi:**

| Campo | Valore |
|-------|--------|
| **Client ID** | Il Client ID copiato da Google Console |
| **Client Secret** | Il Client Secret copiato da Google Console |

4. Clicca **"Save"**

### Step 2.3: Verifica Redirect URL

Nella sezione Google provider, troverai il **Callback URL di Supabase**:

```
https://<TUO-PROJECT-REF>.supabase.co/auth/v1/callback
```

**Verifica** che questo URL sia presente nelle **Authorized redirect URIs** di Google Console (Step 1.4).

### Step 2.4: Configura Site URL

1. Vai su **"Authentication"** → **"URL Configuration"**
2. Imposta:

| Campo | Valore Sviluppo | Valore Produzione |
|-------|-----------------|-------------------|
| **Site URL** | `http://localhost:3000` | `https://pratorinaldo.it` |
| **Redirect URLs** | `http://localhost:3000/**` | `https://pratorinaldo.it/**` |

3. Clicca **"Save"**

---

## Fase 3: Configurazione Locale

### Step 3.1: Aggiorna config.toml (Sviluppo Locale)

Se usi Supabase locale, aggiorna `supabase/config.toml`:

```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
```

### Step 3.2: Variabili d'Ambiente

Aggiungi al tuo `.env.local`:

```bash
# Google OAuth (per sviluppo locale con Supabase locale)
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxx
```

> **Nota:** Per il progetto Supabase in cloud, le credenziali Google sono già configurate nel dashboard Supabase (Step 2.2). Le variabili d'ambiente locali servono solo se usi `supabase start` locale.

### Step 3.3: Verifica Configurazione App

L'applicazione è già configurata per supportare Google OAuth:

**File coinvolti:**
- `components/molecules/google-sign-in-button.tsx` - Bottone Google
- `app/(auth)/login/login-form.tsx` - Form login con bottone
- `app/(auth)/register/register-form.tsx` - Form registrazione con bottone
- `app/auth/callback/route.ts` - Handler callback OAuth

---

## Fase 4: Test e Verifica

### Step 4.1: Avvia l'Applicazione

```bash
pnpm dev
```

### Step 4.2: Testa il Login

1. Vai su `http://localhost:3000/login`
2. Clicca su **"Accedi con Google"**
3. Seleziona un account Google
4. Verifica che vieni redirectato correttamente:
   - **Nuovo utente** → `/onboarding`
   - **Utente esistente** → `/bacheca`

### Step 4.3: Testa la Registrazione

1. Vai su `http://localhost:3000/register`
2. Clicca su **"Registrati con Google"**
3. Usa un account Google diverso dal test precedente
4. Verifica redirect a `/onboarding`

### Step 4.4: Verifica Database

Nel dashboard Supabase, vai su **"Table Editor"** → **"users"**:

- L'utente Google dovrebbe avere:
  - `name`: Nome da Google
  - `avatar`: URL foto profilo Google
  - `email`: Email Google

---

## Troubleshooting

### Errore: "redirect_uri_mismatch"

**Causa:** L'URI di redirect non corrisponde a quelli configurati in Google Console.

**Soluzione:**
1. Vai su Google Console → Credentials → OAuth Client
2. Verifica che tutti questi URI siano presenti in **"Authorized redirect URIs"**:
   ```
   http://localhost:3000/auth/callback
   https://<PROJECT-REF>.supabase.co/auth/v1/callback
   ```
3. Attendi 5-30 minuti (Google può avere delay)

### Errore: "access_denied" o "User cancelled"

**Causa:** L'utente ha annullato il consenso.

**Soluzione:** Comportamento normale. L'app redirecta a `/login` con messaggio di errore.

### Errore: "Invalid OAuth client"

**Causa:** Client ID o Secret errati.

**Soluzione:**
1. Verifica Client ID/Secret in Supabase Dashboard
2. Assicurati di non avere spazi extra

### L'utente Google non ha nome/avatar

**Causa:** I metadata OAuth non sono stati processati.

**Soluzione:** Il callback handler (`/auth/callback`) aggiorna automaticamente i campi. Se persistono problemi:
1. Verifica che gli scope `profile` e `email` siano abilitati
2. Controlla i log del server per errori

### "OAuth client not verified" (Warning giallo)

**Causa:** L'app è in modalità "Testing" su Google Console.

**Soluzione per sviluppo:** Ignora, funziona per utenti di test.

**Soluzione per produzione:**
1. Vai su OAuth consent screen → **"Publish App"**
2. Completa la verifica Google (può richiedere giorni)

---

## Produzione

### Checklist Pre-Lancio

- [ ] Pubblica l'OAuth consent screen (`Publish App`)
- [ ] Aggiungi il dominio di produzione in Google Console:
  - Authorized JavaScript origins: `https://pratorinaldo.it`
  - Authorized redirect URIs: `https://pratorinaldo.it/auth/callback`
- [ ] Aggiorna Supabase Site URL a `https://pratorinaldo.it`
- [ ] Rimuovi `http://localhost:3000` dai redirect (opzionale, per sicurezza)
- [ ] Verifica HTTPS funzionante sul dominio

### Flusso OAuth in Produzione

```
1. Utente clicca "Accedi con Google"
2. Redirect a Google consent screen
3. Utente autorizza
4. Google redirect a Supabase callback:
   https://kyrliitlqshmwbzaaout.supabase.co/auth/v1/callback
5. Supabase scambia il code per session
6. Supabase redirect alla tua app:
   https://pratorinaldo.it/auth/callback
7. App callback scambia code per session locale
8. Redirect a /bacheca o /onboarding
```

---

## Risorse Utili

- [Supabase Google OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Web Server Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Supabase PKCE Flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## Supporto

Se riscontri problemi:

1. Controlla i log del browser (Console → Network)
2. Controlla i log di Supabase (Dashboard → Logs)
3. Verifica le configurazioni in questa guida

---

**Ultimo aggiornamento:** Novembre 2025
