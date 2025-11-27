# Push Notifications - Deploy Checklist

## Chiavi VAPID Generate

**Le chiavi sono state generate e sono pronte per l'uso.**

```
Public Key:  BDL5e6a27N-ZIsydyWFgOOezbItxzhNhak-lmhsaC6YTN3XT04o-r66GEq0eji45hjTy5UNc_Q0uFWEMj81XXGs
Private Key: HbgVjLpxyB3IIAkTKo4pTwjy1lk63W5iOCjCA-JLVxA
```

## Checklist Deploy

### 1. Configurare Variabili d'Ambiente (TU)

**Frontend (.env.local o Vercel Dashboard):**
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BDL5e6a27N-ZIsydyWFgOOezbItxzhNhak-lmhsaC6YTN3XT04o-r66GEq0eji45hjTy5UNc_Q0uFWEMj81XXGs
```

**Supabase Edge Functions Secrets:**
```bash
pnpm exec supabase secrets set VAPID_PUBLIC_KEY="BDL5e6a27N-ZIsydyWFgOOezbItxzhNhak-lmhsaC6YTN3XT04o-r66GEq0eji45hjTy5UNc_Q0uFWEMj81XXGs"
pnpm exec supabase secrets set VAPID_PRIVATE_KEY="HbgVjLpxyB3IIAkTKo4pTwjy1lk63W5iOCjCA-JLVxA"
pnpm exec supabase secrets set VAPID_SUBJECT="mailto:noreply@pratorinaldo.it"
pnpm exec supabase secrets set APP_URL="https://pratorinaldo.it"
```

### 2. Eseguire Migrazioni Database (TU)

```bash
pnpm exec supabase db push
```

Le migrazioni `00038_push_notifications.sql` e `00039_push_notification_webhook.sql` creano:
- `push_subscriptions` - Sottoscrizioni push utenti
- `user_notification_preferences` - Preferenze notifica
- `push_notification_logs` - Log invii
- Funzioni helper (`should_send_push`, `get_user_push_subscriptions`, etc.)
- RLS policies per sicurezza

### 3. Deploy Edge Function (TU)

```bash
pnpm exec supabase functions deploy send-push-notification
```

### 4. Configurare Webhook (TU)

**Opzione A - Via Supabase Dashboard (Raccomandato):**

1. Vai su **Supabase Dashboard → Database → Webhooks**
2. Clicca **Create a new hook**
3. Configura:
   - **Name**: `push-notification-topic-messages`
   - **Table**: `topic_messages`
   - **Events**: `INSERT`
   - **Type**: `Supabase Edge Function`
   - **Edge Function**: `send-push-notification`

**Opzione B - Via SQL Trigger:**

```sql
-- Abilita pg_net extension (se non già abilitato)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configura URL e chiave nel database
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://TUO_PROJECT_REF.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'TUA_SERVICE_ROLE_KEY';

-- Abilita il trigger
ALTER TABLE topic_messages ENABLE TRIGGER trigger_push_new_topic_message;
```

## File Creati/Modificati

| File | Status |
|------|--------|
| `public/icons/icon-*.png` | ✅ Creati (13 icone) |
| `public/sw.js` | ✅ Già presente |
| `public/manifest.json` | ✅ Già presente |
| `hooks/use-push-notifications.ts` | ✅ Già presente |
| `components/organisms/notifications/push-permission-prompt.tsx` | ✅ Già presente |
| `components/providers/service-worker-provider.tsx` | ✅ Già presente |
| `supabase/functions/send-push-notification/index.ts` | ✅ Già presente |
| `supabase/migrations/00038_push_notifications.sql` | ✅ Già presente |
| `supabase/migrations/00039_push_notification_webhook.sql` | ✅ Già presente |

## Test Rapido

Dopo il deploy, testa:

1. **Vai su /bacheca** (da utente verificato)
2. **Accetta le notifiche** quando richiesto
3. **Verifica in console browser**: `navigator.serviceWorker.ready` deve risolvere
4. **Invia un messaggio in Community** per triggerare una notifica
5. **Controlla i logs**: `pnpm exec supabase functions logs send-push-notification`

## Troubleshooting

- **"VAPID keys not configured"**: Verifica i secrets con `pnpm exec supabase secrets list`
- **Notifiche non arrivano**: Controlla `push_subscriptions` nel DB
- **Service Worker non si registra**: Verifica HTTPS e `/sw.js` accessibile

---

**Generato automaticamente** - Vedi `docs/PWA_PUSH_NOTIFICATIONS_GUIDE.md` per la guida completa.
