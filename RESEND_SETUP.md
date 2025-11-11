# Configurazione Resend per Notifiche Email

## Setup Iniziale

### 1. Creare un account Resend

1. Vai su [https://resend.com](https://resend.com)
2. Crea un account o effettua il login
3. Verifica il tuo indirizzo email

### 2. Aggiungere e verificare il dominio

1. Vai alla dashboard di Resend
2. Clicca su "Domains" nel menu laterale
3. Aggiungi il tuo dominio (es. `pratorinaldo.it`)
4. Aggiungi i record DNS richiesti al tuo provider DNS:
   - Record SPF (TXT)
   - Record DKIM (TXT)
   - Record DMARC (TXT) - opzionale ma raccomandato
5. Attendi la verifica (può richiedere fino a 48 ore)

### 3. Ottenere la API Key

1. Nella dashboard di Resend, vai su "API Keys"
2. Clicca su "Create API Key"
3. Dai un nome alla chiave (es. "Production - Prato Rinaldo")
4. Seleziona i permessi necessari:
   - ✅ Send emails
5. Copia la chiave API (inizia con `re_`)

### 4. Configurare le variabili d'ambiente

Aggiungi la chiave API al file `.env.local`:

```env
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here

# Site URL per i link nelle email
NEXT_PUBLIC_SITE_URL=https://pratorinaldo.it
```

**Importante:** Non committare mai il file `.env.local` nel repository!

### 5. Aggiornare l'indirizzo email mittente

Nel file `app/actions/email-notifications.ts`, aggiorna il campo `from`:

```typescript
from: 'Prato Rinaldo <noreply@pratorinaldo.it>', // Cambia con il tuo dominio verificato
```

## Testing in Sviluppo

Durante lo sviluppo, puoi usare l'indirizzo email di test fornito da Resend:

```typescript
from: 'onboarding@resend.dev', // Solo per testing
```

## Funzionalità Implementate

### Notifica Nuovo Messaggio

Quando un utente riceve un nuovo messaggio:

- ✅ Email HTML responsiva e ben formattata
- ✅ Anteprima del messaggio (primi 100 caratteri)
- ✅ Link diretto alla conversazione
- ✅ Informazioni sul mittente e sull'annuncio
- ✅ Versione testo plain per client email semplici
- ✅ Gestione errori non bloccante (se l'email fallisce, il messaggio viene comunque inviato)

## Template Email

Il template include:

- **Header** con titolo e informazioni base
- **Anteprima messaggio** con stile evidenziato
- **CTA button** per rispondere al messaggio
- **Suggerimenti** per mantenere l'engagement
- **Footer** con link alle impostazioni
- **Versione plain text** completa

## Troubleshooting

### L'email non viene inviata

1. Verifica che `RESEND_API_KEY` sia configurata correttamente
2. Controlla i log del server per errori:
   ```bash
   pnpm dev
   ```
3. Verifica che il dominio sia verificato su Resend
4. Controlla i log nella dashboard di Resend

### Le email finiscono nello spam

1. Assicurati che tutti i record DNS siano configurati correttamente
2. Aggiungi un record DMARC se non l'hai già fatto
3. Evita parole spam nel subject e nel contenuto
4. Usa un dominio verificato (non `@resend.dev`)

### Rate Limits

- **Free tier:** 100 email/giorno, 3,000 email/mese
- **Pro tier:** illimitate con limiti ragionevoli
- Le email fallite per rate limit vengono loggati ma non bloccano l'invio dei messaggi

## Prossimi Sviluppi

### Notifiche Opzionali per Utente

In futuro, puoi aggiungere una preferenza utente per disabilitare le notifiche email:

```typescript
// Nella tabella users
email_notifications: boolean DEFAULT true

// Nel codice
if (recipient.email_notifications === false) {
  return { success: false, error: 'User has disabled email notifications' };
}
```

### Digest Email

Invece di inviare un'email per ogni messaggio, potresti implementare un digest giornaliero:

- Raggruppa tutti i nuovi messaggi
- Invia una sola email con il sommario
- Risparmia sui costi e riduce lo spam

### Altri Tipi di Notifiche

Template email aggiuntivi che potresti voler implementare:

- ✉️ Nuovo commento su Agorà
- ✉️ Evento in arrivo (reminder)
- ✉️ Verifica identità approvata
- ✉️ Annuncio marketplace approvato
- ✉️ Profilo professionale approvato
- ✉️ Nuovo follower / badge guadagnato

## Risorse Utili

- [Documentazione Resend](https://resend.com/docs)
- [React Email (per template avanzati)](https://react.email/)
- [Best Practices Email](https://resend.com/docs/knowledge-base/best-practices)
- [Testing Emails](https://resend.com/docs/dashboard/emails/send-test-emails)

## Costi

### Free Tier (Gratis)
- 100 email/giorno
- 3,000 email/mese
- Perfetto per iniziare

### Pro Tier ($20/mese)
- 50,000 email/mese incluse
- $1 per ogni 1,000 email aggiuntive
- Supporto prioritario
- Webhook per tracking

**Stima per Prato Rinaldo:**
- 500 utenti attivi
- 10 messaggi/utente/mese in media
- ~5,000 email/mese
- **Costo:** Free tier sufficiente, eventualmente Pro tier se crescita rapida

## Note di Sicurezza

⚠️ **Importante:**
- Non esporre mai la `RESEND_API_KEY` nel codice client
- Usa sempre server actions o Edge Functions
- Valida sempre l'input prima di inviare email
- Implementa rate limiting per prevenire abusi
- Monitora l'utilizzo nella dashboard Resend
