# Deployment Guide - Prato Rinaldo

Guida completa per il deployment della piattaforma Prato Rinaldo Next.js 16 + Supabase.

## 📋 Prerequisiti

- **Docker** 24.0+ e **Docker Compose** 2.20+
- **Supabase Project** configurato
- **Domain** (opzionale per produzione)
- **SSL Certificate** (per HTTPS)

## 🚀 Quick Start con Docker

### 1. Setup Variabili Ambiente

Crea un file `.env` nella root del progetto:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NODE_ENV=production
```

### 2. Build e Avvio con Docker Compose

```bash
# Build immagine
docker-compose build

# Avvia servizi
docker-compose up -d

# Verifica logs
docker-compose logs -f app

# Verifica stato
docker-compose ps
```

L'applicazione sarà disponibile su:
- **HTTP**: http://localhost:3000
- **HTTPS (con Nginx)**: https://localhost (se configurato SSL)

### 3. Health Check

```bash
curl http://localhost:3000/api/health
```

## 🚀 Deploying Edge Functions

La piattaforma utilizza 4 Supabase Edge Functions che devono essere deployate separatamente.

### Prerequisiti Edge Functions

```bash
# Installa Supabase CLI (se non già installato)
npm install -g supabase

# Login a Supabase
supabase login

# Link al progetto
supabase link --project-ref YOUR_PROJECT_REF
```

### Passo 1: Setup Secrets

Configura le variabili d'ambiente segrete in Supabase:

```bash
# Per email-notifications (richiede Resend API key)
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Per email-notifications (webhook security)
supabase secrets set WEBHOOK_SECRET=$(openssl rand -base64 32)

# URL dell'applicazione (per link nelle email)
supabase secrets set APP_URL=https://pratorinaldo.it

# Verifica secrets
supabase secrets list
```

**Come ottenere Resend API Key:**
1. Vai su https://resend.com
2. Crea account gratuito (100 email/giorno gratis)
3. Vai su API Keys > Create API Key
4. Copia la chiave e usala nel comando sopra

### Passo 2: Deploy Functions

```bash
# Deploy tutte le 4 Edge Functions
cd supabase/functions

# 1. Badge Calculation (scheduled)
supabase functions deploy calculate-badges

# 2. Email Notifications (webhook)
supabase functions deploy email-notifications

# 3. Cleanup Sessions (scheduled)
supabase functions deploy cleanup-sessions

# 4. Stats Aggregation (scheduled)
supabase functions deploy aggregate-stats

# Verifica deployment
supabase functions list
```

### Passo 3: Setup Database Components

#### 3.1 Run Migration per Stats Aggregation

```bash
# Applica migration per aggregated_stats table
supabase db push

# O manualmente via Supabase Dashboard > SQL Editor
# Esegui: supabase/migrations/00005_aggregated_stats_table.sql
```

#### 3.2 Setup Cron Jobs

Vai su **Supabase Dashboard > Database > Cron Jobs** e crea:

**Badge Calculation (Hourly)**
```sql
SELECT cron.schedule(
  'calculate-badges-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

**Cleanup Sessions (Daily at 2 AM)**
```sql
SELECT cron.schedule(
  'cleanup-sessions-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-sessions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"force": true}'::jsonb
  ) as request_id;
  $$
);
```

**Stats Aggregation (Every 6 hours)**
```sql
SELECT cron.schedule(
  'aggregate-stats-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/aggregate-stats',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

#### 3.3 Setup Database Webhook per Email

Vai su **Supabase Dashboard > Database > Webhooks** e crea:

**Name**: `moderation-email-notifications`
**Table**: `moderation_queue`
**Events**: `UPDATE`
**HTTP Request**:
- **Method**: POST
- **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/email-notifications`
- **HTTP Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY",
    "X-Webhook-Secret": "YOUR_WEBHOOK_SECRET"
  }
  ```

### Passo 4: Verifica Deployment

#### Test Badge Calculation
```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-badges' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

#### Test Stats Aggregation
```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/aggregate-stats' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

#### Test Cleanup (Dry Run)
```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-sessions?dry_run=true' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

#### Verifica Cron Jobs
```sql
-- Query per verificare cron jobs attivi
SELECT * FROM cron.job ORDER BY jobname;

-- Query per verificare esecuzioni recenti
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

#### Verifica Database Webhook
Vai su **Supabase Dashboard > Database > Webhooks** e verifica che il webhook sia attivo.

### Passo 5: Monitoring

#### Logs delle Edge Functions
```bash
# Logs in real-time
supabase functions logs calculate-badges --follow
supabase functions logs email-notifications --follow
supabase functions logs cleanup-sessions --follow
supabase functions logs aggregate-stats --follow
```

#### Verifica Badge Awards
```sql
SELECT b.name, COUNT(*) as count, MAX(ub.earned_at) as last_awarded
FROM user_badges ub
JOIN badges b ON ub.badge_id = b.id
GROUP BY b.name
ORDER BY count DESC;
```

#### Verifica Stats Aggregation
```sql
SELECT stat_key, stat_value, updated_at
FROM aggregated_stats
ORDER BY updated_at DESC;
```

### Troubleshooting Edge Functions

#### Function non risponde
```bash
# Verifica deployment
supabase functions list

# Re-deploy
supabase functions deploy FUNCTION_NAME

# Check logs per errori
supabase functions logs FUNCTION_NAME --tail 50
```

#### Email non vengono inviate
1. Verifica Resend API key: `supabase secrets list`
2. Check webhook è attivo in Supabase Dashboard
3. Verifica logs: `supabase functions logs email-notifications`
4. Test manuale con curl

#### Cron job non eseguono
1. Verifica cron job esistono: `SELECT * FROM cron.job;`
2. Check extension pg_cron abilitata
3. Verifica PROJECT_REF e ANON_KEY nei cron SQL
4. Check logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Note Importanti

- **Secrets** sono gestiti da Supabase Vault (non in .env)
- **Cron jobs** usano pg_cron extension (built-in Supabase)
- **Edge Functions** auto-scale e sono serverless
- **Cold start** può richiedere 200-500ms al primo invoke
- **Free tier** include 500K function invocations/mese
- **Resend free tier** include 3,000 email/mese (100/giorno)

## 🏗️ Deployment su VPS Self-Hosted

### Passo 1: Preparazione Server

```bash
# Update sistema
sudo apt update && sudo apt upgrade -y

# Installa Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installa Docker Compose
sudo apt install docker-compose-plugin -y

# Verifica installazione
docker --version
docker compose version
```

### Passo 2: Setup Progetto

```bash
# Clone repository
git clone https://github.com/v4codeit/prato-rinaldo-webapp.git
cd prato-rinaldo-webapp

# Crea file .env
nano .env
# (Inserisci le variabili ambiente)

# Setup SSL (Let's Encrypt)
sudo apt install certbot -y
sudo certbot certonly --standalone -d pratorinaldo.it -d www.pratorinaldo.it

# Copia certificati in ./ssl
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/pratorinaldo.it/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/pratorinaldo.it/privkey.pem ./ssl/key.pem
sudo chmod 644 ./ssl/*
```

### Passo 3: Deploy

```bash
# Build e avvio
docker-compose up -d --build

# Verifica stato
docker-compose ps
docker-compose logs -f
```

### Passo 4: Configurazione Firewall

```bash
# Abilita firewall
sudo ufw enable

# Apri porte necessarie
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Verifica stato
sudo ufw status
```

## 🔄 Aggiornamenti e Manutenzione

### Deploy Nuova Versione

```bash
# Pull ultime modifiche
git pull origin main

# Rebuild e restart
docker-compose down
docker-compose up -d --build

# Verifica deployment
docker-compose logs -f app
```

### Backup Database (Supabase)

Supabase gestisce automaticamente i backup. Per backup manuali:

```bash
# Esporta schema e dati via Supabase Dashboard
# Database > Backups > Download Backup
```

### Monitoring e Logs

```bash
# Logs in tempo reale
docker-compose logs -f

# Logs di un servizio specifico
docker-compose logs -f app

# Ultimi 100 log
docker-compose logs --tail=100 app

# Statistiche container
docker stats
```

### Restart Servizi

```bash
# Restart app
docker-compose restart app

# Restart nginx
docker-compose restart nginx

# Restart tutti i servizi
docker-compose restart
```

## 🔐 Sicurezza

### SSL/TLS

L'applicazione supporta HTTPS tramite Nginx reverse proxy con certificati Let's Encrypt.

#### Rinnovo Certificati SSL

```bash
# Test rinnovo
sudo certbot renew --dry-run

# Rinnovo effettivo
sudo certbot renew

# Copia nuovi certificati
sudo cp /etc/letsencrypt/live/pratorinaldo.it/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/pratorinaldo.it/privkey.pem ./ssl/key.pem

# Restart nginx
docker-compose restart nginx
```

### Security Headers

L'applicazione include security headers configurati in:
- `next.config.ts` (App-level)
- `nginx.conf` (Proxy-level)

Headers implementati:
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-XSS-Protection`
- `Referrer-Policy`

## 📊 Performance Optimization

### Caching

- **Static Assets**: Cache 1 anno (`_next/static`)
- **Images**: Cache 7 giorni (`_next/image`)
- **Public Files**: Cache 1 ora

### Compression

Gzip abilitato per:
- HTML/CSS/JS
- JSON/XML
- Fonts
- SVG

## 🐛 Troubleshooting

### App non risponde

```bash
# Verifica container
docker-compose ps

# Restart app
docker-compose restart app

# Check logs errori
docker-compose logs app | grep -i error
```

### Errori Supabase

```bash
# Verifica variabili ambiente
docker-compose config | grep SUPABASE

# Test connessione Supabase
curl https://your-project.supabase.co/rest/v1/
```

### Problemi SSL

```bash
# Verifica certificati
sudo certbot certificates

# Test configurazione nginx
docker-compose exec nginx nginx -t

# Reload configurazione
docker-compose restart nginx
```

### Out of Memory

```bash
# Aumenta memoria Docker
# Modifica docker-compose.yml:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

## 📝 Environment Variables

### Required

```bash
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key (admin)
```

### Optional

```bash
NODE_ENV=production               # Environment
PORT=3000                         # App port
HOSTNAME=0.0.0.0                 # Host binding
```

### Edge Functions Secrets (Supabase Vault)

Le seguenti variabili sono gestite tramite Supabase Secrets (non in .env locale):

```bash
RESEND_API_KEY=                   # Resend API key per email notifications
WEBHOOK_SECRET=                   # Webhook secret per sicurezza
APP_URL=                          # URL base applicazione (es: https://pratorinaldo.it)
```

Configurale con: `supabase secrets set VARIABLE_NAME=value`

## 🔗 Links Utili

- **Supabase Dashboard**: https://app.supabase.com
- **Next.js Docs**: https://nextjs.org/docs
- **Docker Docs**: https://docs.docker.com

## 📞 Support

Per problemi o domande:
- **GitHub Issues**: https://github.com/v4codeit/prato-rinaldo-webapp/issues
- **Email**: info@pratorinaldo.it
