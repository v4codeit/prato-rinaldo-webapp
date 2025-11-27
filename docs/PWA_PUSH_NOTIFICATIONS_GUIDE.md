# PWA Push Notifications - Setup Guide

Questa guida spiega come configurare e deployare le notifiche push PWA per Community Prato Rinaldo.

## Overview

Il sistema utilizza:
- **Web Push API** con chiavi VAPID (no Firebase SDK)
- **Supabase Edge Functions** per l'invio delle notifiche
- **Service Worker** per la ricezione e visualizzazione
- **PWA manifest** per l'installazione su dispositivi mobili

## Prerequisiti

- Account Supabase con progetto attivo
- Node.js 18+ installato
- Supabase CLI installato (`pnpm add -g supabase`)

## Step 1: Generare le Chiavi VAPID

Le chiavi VAPID sono necessarie per autenticare le notifiche push.

```bash
# Usando web-push npm package
npx web-push generate-vapid-keys

# Output esempio:
# Public Key: BNxv...abc
# Private Key: 7x2K...xyz
```

## Step 2: Configurare le Variabili d'Ambiente

### 2.1 Ambiente Locale (.env.local)

```bash
# PWA Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNxv...la-tua-chiave-pubblica
VAPID_PRIVATE_KEY=7x2K...la-tua-chiave-privata
VAPID_SUBJECT=mailto:noreply@pratorinaldo.it
```

### 2.2 Supabase Edge Functions Secrets

```bash
# Configura i secrets per le Edge Functions
pnpm exec supabase secrets set VAPID_PUBLIC_KEY=BNxv...la-tua-chiave-pubblica
pnpm exec supabase secrets set VAPID_PRIVATE_KEY=7x2K...la-tua-chiave-privata
pnpm exec supabase secrets set VAPID_SUBJECT=mailto:noreply@pratorinaldo.it
```

### 2.3 Vercel/Hosting Environment

Aggiungi le stesse variabili nella dashboard del tuo hosting:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

## Step 3: Eseguire le Migrazioni Database

Le migrazioni creano le tabelle necessarie:

```bash
# Push delle migrazioni al database Supabase
pnpm exec supabase db push
```

Tabelle create:
- `push_subscriptions` - Sottoscrizioni push degli utenti
- `user_notification_preferences` - Preferenze notifica per utente
- `push_notification_logs` - Log delle notifiche inviate

## Step 4: Deployare la Edge Function

```bash
# Deploy della funzione send-push-notification
pnpm exec supabase functions deploy send-push-notification
```

## Step 5: Attivare il Webhook (Opzione A - Supabase Dashboard)

1. Vai su **Supabase Dashboard → Database → Webhooks**
2. Clicca **Create a new hook**
3. Configura:
   - **Name**: `send_push_on_new_message`
   - **Table**: `topic_messages`
   - **Events**: `INSERT`
   - **Type**: `Supabase Edge Function`
   - **Edge Function**: `send-push-notification`
   - **Method**: POST
   - **HTTP Headers**: `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`

## Step 5 (Alternativa B): Webhook via SQL Trigger

Se preferisci usare un trigger SQL (già nella migrazione 00039):

```sql
-- Verifica che pg_net sia abilitato
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Il trigger è già nella migrazione 00039_push_notification_webhook.sql
-- Decommentalo se vuoi usare questo approccio invece del webhook dashboard
```

## Step 6: Generare le Icone PWA

Le icone devono essere presenti in `public/icons/`. Puoi generarle da un'immagine sorgente:

### Opzione A: Online Generator

1. Vai su [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
2. Carica il logo (minimo 512x512px)
3. Scarica e estrai in `public/icons/`

### Opzione B: CLI Tool

```bash
# Installa pwa-asset-generator
npm install -g pwa-asset-generator

# Genera icone
pwa-asset-generator public/assets/logos/logo-pratorinaldo.png public/icons/ \
  --type png \
  --manifest-json public/manifest.json \
  --icon-only
```

### Icone Richieste

```
public/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
├── icon-512x512.png
├── icon-maskable-192.png   # Icona con safe zone per adaptive icon
└── icon-maskable-512.png
```

## Step 7: Testare le Notifiche

### 7.1 Test Locale

1. Avvia il server di sviluppo: `pnpm dev`
2. Vai su `/bacheca` e accetta la richiesta di notifiche
3. Verifica la sottoscrizione nella console del browser
4. Invia un messaggio in un topic per triggerare una notifica

### 7.2 Test della Edge Function

```bash
# Test diretto della Edge Function
curl -X POST \
  'https://[PROJECT_REF].supabase.co/functions/v1/send-push-notification' \
  -H 'Authorization: Bearer [SUPABASE_SERVICE_ROLE_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{
    "record": {
      "id": "test-123",
      "topic_id": "[TOPIC_UUID]",
      "user_id": "[SENDER_USER_ID]",
      "content": "Test notification message"
    },
    "type": "INSERT",
    "table": "topic_messages"
  }'
```

### 7.3 Debug

- **Browser Console**: Controlla errori nella registrazione del Service Worker
- **Supabase Logs**: `pnpm exec supabase functions logs send-push-notification`
- **Database**: Controlla `push_notification_logs` per lo storico invii

## Comportamento iOS Safari

Su iOS Safari, le notifiche push richiedono:

1. **PWA installata**: L'utente deve installare l'app su Home Screen
2. **Versione iOS 16.4+**: Versioni precedenti non supportano push PWA
3. **Display standalone**: Il manifest deve avere `"display": "standalone"`
4. **Gesto utente**: La richiesta permesso deve avvenire dopo un tap

Il componente `PushPermissionPrompt` gestisce automaticamente questi requisiti.

## Troubleshooting

### "Push notifications not supported"

- Verifica che il sito sia servito via HTTPS
- Verifica che il Service Worker sia registrato: `navigator.serviceWorker.ready`
- Su iOS: verifica che l'app sia installata come PWA

### "Permission denied"

- L'utente ha bloccato le notifiche nel browser
- Deve riabilitarle manualmente dalle impostazioni del browser/sistema

### Notifiche non arrivano

1. Controlla `push_subscriptions` nel database
2. Verifica i logs della Edge Function
3. Controlla `push_notification_logs` per errori
4. Verifica che VAPID keys siano configurate correttamente

### Service Worker non si aggiorna

```javascript
// Forza l'aggiornamento nel browser console
navigator.serviceWorker.getRegistrations().then(regs =>
  regs.forEach(reg => reg.unregister())
);
// Poi ricarica la pagina
```

## Architettura

```
┌─────────────────┐     ┌──────────────────┐
│  Client (PWA)   │────▶│  Supabase DB     │
│  - SW           │     │  - topic_messages│
│  - Push Hook    │     │  - push_subs     │
└─────────────────┘     └────────┬─────────┘
                                 │ Webhook
                                 ▼
                        ┌──────────────────┐
                        │  Edge Function   │
                        │  send-push-      │
                        │  notification    │
                        └────────┬─────────┘
                                 │ Web Push API
                                 ▼
                        ┌──────────────────┐
                        │  Push Service    │
                        │  (FCM/APNS/etc)  │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  User Device     │
                        │  - Shows notif   │
                        └──────────────────┘
```

## File Creati/Modificati

| File | Descrizione |
|------|-------------|
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service Worker |
| `public/icons/` | Icone PWA |
| `app/offline/page.tsx` | Pagina offline |
| `app/layout.tsx` | Metadata PWA |
| `components/providers/service-worker-provider.tsx` | SW registration |
| `hooks/use-push-notifications.ts` | Hook client-side |
| `components/organisms/notifications/` | UI components |
| `app/(main)/settings/notifications/page.tsx` | Settings page |
| `supabase/migrations/00038_push_notifications.sql` | Schema DB |
| `supabase/migrations/00039_push_notification_webhook.sql` | Webhook SQL |
| `supabase/functions/send-push-notification/` | Edge Function |

## Sicurezza

- Le chiavi VAPID private non sono mai esposte al client
- RLS policies proteggono `push_subscriptions` (solo il proprietario può leggere/scrivere)
- Le preferenze notifica sono per-utente
- I log mantengono tracciabilità per audit

## Performance

- Le notifiche sono inviate in batch parallelo
- Sottoscrizioni fallite vengono disattivate dopo 3 errori
- Cache di base per asset offline
- Service Worker usa strategia network-first con cache fallback

## Prossimi Sviluppi

- [ ] Notifiche per nuovi eventi
- [ ] Notifiche per nuove proposte nell'Agorà
- [ ] Notifiche per messaggi privati
- [ ] Notifiche per approvazione account
- [ ] Rich notifications con immagini
- [ ] Action buttons nelle notifiche
