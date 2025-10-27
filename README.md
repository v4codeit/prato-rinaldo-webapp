# Prato Rinaldo - Piattaforma Community

Piattaforma digitale multi-tenant per il Comitato Cittadini di Prato Rinaldo, frazione divisa tra i comuni di San Cesareo e Zagarolo (Roma).

## 🎯 Caratteristiche Principali

### Area Pubblica
- **Homepage** con hero section e feature grid
- **Notizie & Articoli** con sistema di pubblicazione
- **Eventi** pubblici e privati con RSVP
- **Marketplace dell'usato** con donazione al comitato
- **Professionisti** - bacheca professionalità con recensioni
- **Risorse** - documenti e tutorial pubblici

### Area Privata (Solo Residenti Verificati)
- **Profilo Utente** completo con 3 tab (Profilo, Badge, Attività)
- **Forum** interno per discussioni tra residenti con Realtime
- **Eventi Privati** esclusivi per residenti
- **Gamification** - sistema badge, punti e leaderboard
- **Marketplace Privato** con moderazione

### Pannello Amministrazione
- **Dashboard** con statistiche real-time
- **Gestione Utenti** con verifica residenza e assegnazione ruoli
- **Moderazione Centralizzata** - Approval Hub per tutti i contenuti
- **Gestione Contenuti** - articoli, eventi, marketplace, forum

## 🏗️ Architettura Multi-Tenant

La piattaforma è progettata per supportare più comitati/community con:
- Database isolato per tenant (Row Level Security)
- Configurazione personalizzabile (branding, colori, funzionalità)
- Sistema di billing integrato (ready for SaaS)

## 🛠️ Stack Tecnologico

### Frontend & Backend
- **Framework**: Next.js 16 (App Router, React 19, Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui (Radix UI)
- **Forms**: Server Actions (zero-config API)
- **Validation**: Zod

### Database & Backend Services
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (OAuth, Magic Link, Email/Password)
- **Storage**: Supabase Storage (S3-compatible)
- **Realtime**: Supabase Realtime (WebSockets)
- **Security**: Row Level Security (RLS)

### Deployment
- **Container**: Docker + Docker Compose
- **Reverse Proxy**: Nginx (optional)
- **SSL**: Let's Encrypt
- **Hosting**: Self-hosted VPS or any Docker-compatible platform

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **Supabase Account** (free tier available)

### Installation

```bash
# Clone repository
git clone https://github.com/v4codeit/prato-rinaldo-webapp.git
cd prato-rinaldo-webapp

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run Supabase migrations
# (Access Supabase Dashboard > SQL Editor and run files in supabase/migrations/)

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📁 Struttura Progetto

```
prato-rinaldo-webapp/
├── app/                          # Next.js 16 App Router
│   ├── (auth)/                  # Auth pages (login, register, etc.)
│   ├── (public)/                # Public pages (home, events, etc.)
│   ├── (protected)/             # Protected pages (profile, forum, etc.)
│   ├── (admin)/                 # Admin pages (dashboard, moderation)
│   ├── actions/                 # Server Actions (API layer)
│   ├── api/                     # API Routes (health check, webhooks)
│   └── layout.tsx               # Root layout
├── components/
│   ├── atoms/                   # Atomic components (button, input, etc.)
│   ├── molecules/               # Molecule components (form-field, stat-card, etc.)
│   └── organisms/               # Organism components (header, footer)
├── lib/
│   ├── supabase/                # Supabase clients (browser, server, admin)
│   └── utils/                   # Utilities (constants, validators, helpers)
├── supabase/
│   └── migrations/              # Database migrations (SQL)
├── public/                      # Static assets
├── middleware.ts                # Auth & routing middleware
└── docker-compose.yml           # Docker orchestration
```

## 👥 Sistema Ruoli

### Ruoli Amministrativi
- **Super Admin** - accesso completo alla piattaforma
- **Admin** - gestione contenuti e utenti
- **Moderator** - moderazione contenuti

### Ruoli Comitato
- **Presidente** - Board member
- **Vice Presidente** - Board member
- **Segretario** - Board member
- **Tesoriere** - Board member
- **Consigliere** - Assemblea Generale

### Membership Types
- **Resident** - Residente
- **Domiciled** - Domiciliato
- **Landowner** - Proprietario

## 🎨 Design System

- **Palette Colori**: Teal (primario) + Arancione (secondario)
- **Tema**: Light/Dark mode support
- **Componenti**: shadcn/ui con personalizzazioni
- **Tipografia**: System fonts ottimizzati (Inter)
- **Pattern**: Atomic Design (Atoms → Molecules → Organisms)

## 📝 Funzionalità Implementate

- ✅ Autenticazione Supabase con onboarding a 2 step
- ✅ Verifica residenza (indirizzo + nucleo familiare)
- ✅ Sistema moderazione centralizzato
- ✅ Marketplace con donazione percentuale
- ✅ Eventi con RSVP e gestione partecipanti
- ✅ Forum con categorie e Realtime subscriptions
- ✅ Sistema gamification con badge e leaderboard
- ✅ Profilo utente completo
- ✅ Pannello admin con dashboard
- ✅ Multi-tenant ready (RLS policies)
- ✅ Docker deployment ready
- ✅ 4 Supabase Edge Functions (badge calculation, email notifications, cleanup, stats aggregation)
- ✅ Cron jobs schedulati (hourly, daily, every 6h)
- ✅ Database webhooks per email automatiche

## 🚀 Supabase Edge Functions

La piattaforma utilizza **4 Edge Functions** per logica complessa, schedulata e webhook-triggered:

### 1. Badge Calculation (Scheduled)
- **Trigger**: Cron ogni ora (`0 * * * *`)
- **Scopo**: Calcola e assegna automaticamente badge agli utenti verificati
- **Badge supportati**: Benvenuto (10pts), Primo Post (20pts), Venditore (30pts), Partecipante Attivo (50pts), Contributore (75pts), Volontario (100pts)
- **Location**: `supabase/functions/calculate-badges/`
- **Docs**: 15 files, deployment guide completa, migration SQL, seed data

### 2. Email Notifications (Webhook)
- **Trigger**: Database webhook su `moderation_queue` table changes
- **Scopo**: Invia email professionali agli utenti su azioni di moderazione
- **Templates**: 5 HTML email (marketplace approved/rejected, professional approved/rejected, user verification)
- **Provider**: Resend API
- **Location**: `supabase/functions/email-notifications/`
- **Docs**: 14 files, test scripts (bash + PowerShell), setup webhooks SQL

### 3. Cleanup Sessions (Scheduled)
- **Trigger**: Cron daily alle 2 AM (`0 2 * * *`)
- **Scopo**: Pulizia automatica di dati scaduti e temporanei
- **Operazioni**: Cleanup auth sessions (30+ giorni), temp files (7+ giorni), event RSVPs scaduti (30+ giorni), moderation rejected (90+ giorni)
- **Safety**: Dry-run mode, force flag required
- **Location**: `supabase/functions/cleanup-sessions/`
- **Docs**: 12 files, architecture docs, CI/CD workflow

### 4. Stats Aggregation (Scheduled)
- **Trigger**: Cron ogni 6 ore (`0 */6 * * *`)
- **Scopo**: Pre-calcola 20+ statistiche per dashboard admin (instant display)
- **Tabella**: `aggregated_stats` (migration 00005)
- **Stats**: Users, events, marketplace, forum, professional profiles, moderation queue
- **Performance**: Dashboard carica 10-100x più veloce
- **Location**: `supabase/functions/aggregate-stats/`
- **Docs**: 11 files, tRPC example, Drizzle schema

### Deployment Edge Functions

```bash
# Deploy tutte le functions
supabase functions deploy calculate-badges
supabase functions deploy email-notifications
supabase functions deploy cleanup-sessions
supabase functions deploy aggregate-stats

# Setup secrets
supabase secrets set RESEND_API_KEY=re_your_key
supabase secrets set WEBHOOK_SECRET=$(openssl rand -base64 32)

# Verifica deployment
supabase functions list
```

Vedi [DEPLOYMENT.md](./DEPLOYMENT.md) per la guida completa al deployment delle Edge Functions.

## 🔐 Sicurezza

- ✅ Supabase Auth (OAuth2 + JWT)
- ✅ Row Level Security (RLS) per tenant isolation
- ✅ Server-side validation con Zod
- ✅ CORS configurato
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ Rate limiting ready (Supabase Edge Functions)

## 🚢 Deployment

### Docker Deployment

```bash
# Build and run
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Health check
curl http://localhost:3000/api/health
```

Per una guida completa, vedi [DEPLOYMENT.md](./DEPLOYMENT.md)

### Platform-specific

- **Vercel**: Ready (remove `output: 'standalone'` from next.config.ts)
- **Docker VPS**: Fully supported (see DEPLOYMENT.md)
- **Railway**: Compatible
- **Fly.io**: Compatible

## 📊 Performance

- **Core Web Vitals**: Ottimizzati
- **Caching**: Static assets (1 year), Images (7 days)
- **Compression**: Gzip/Brotli enabled
- **CDN**: Compatible con qualsiasi CDN
- **Database**: Connection pooling via Supabase

## 🧪 Development

```bash
# Start dev server (with Turbopack)
pnpm dev

# Type check
pnpm type-check

# Lint
pnpm lint

# Format
pnpm format

# Build for production
pnpm build

# Start production server
pnpm start
```

## 📚 Database Schema

Il database è completamente gestito da Supabase. Le migration SQL sono in `supabase/migrations/`:

- `00000_initial_schema.sql` - Schema completo (21 tabelle, 17 ENUM types)
- `00001_rls_policies.sql` - Row Level Security policies
- `00002_storage_buckets.sql` - Storage buckets configuration
- `00003_realtime_config.sql` - Realtime publication setup
- `00004_seed_data.sql` - Dati iniziali (tenant, badges, categories)

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines first.

## 📄 Licenza

MIT License

## 👨‍💻 Autore

Sviluppato per il Comitato Cittadini di Prato Rinaldo

## 🔗 Links

- **Repository**: https://github.com/v4codeit/prato-rinaldo-webapp
- **Supabase**: https://supabase.com
- **Next.js**: https://nextjs.org

---

**Versione**: 2.0.0 (Next.js 16 + Supabase)
**Ultimo aggiornamento**: Gennaio 2025
