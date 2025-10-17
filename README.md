# Prato Rinaldo - Piattaforma Comitato Cittadini

Piattaforma digitale multi-tenant per il Comitato Cittadini di Prato Rinaldo, frazione divisa tra i comuni di San Cesareo e Zagarolo (Roma).

## 🎯 Caratteristiche Principali

### Area Pubblica
- **Homepage** con hero section e feature grid
- **Notizie & Articoli** con sistema di pubblicazione
- **Eventi** pubblici e privati con RSVP
- **Marketplace dell'usato** con donazione al comitato
- **Professionisti** - bacheca professionalità e volontariato

### Area Privata (Solo Residenti Verificati)
- **Profilo Utente** completo con 5 tab (Panoramica, Info, Badge, Attività, Impostazioni)
- **Forum** interno per discussioni tra residenti
- **Risorse** - documenti e tutorial per servizi digitali
- **Gamification** - sistema badge e punti
- **Eventi Privati** con raccolta fondi

### Pannello Amministrazione
- **Dashboard** con statistiche real-time
- **Gestione Utenti** con verifica residenza e assegnazione ruoli
- **Moderazione Centralizzata** - Approval Hub per tutti i contenuti
- **Configurazione Tenant** - logo, colori, contatti, social
- **Gestione Contenuti** - articoli, eventi, marketplace, forum

## 🏗️ Architettura Multi-Tenant

La piattaforma è progettata per supportare più comitati/comunità con:
- Database isolato per tenant
- Configurazione personalizzabile (branding, colori, funzionalità)
- Sistema di billing integrato (ready for SaaS)

## 🛠️ Stack Tecnologico

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Express 4, tRPC 11, Drizzle ORM
- **Database**: MySQL/TiDB
- **Auth**: Manus OAuth
- **Storage**: S3-compatible
- **Deployment**: Ready for Vercel/Railway/Docker

## 🚀 Quick Start

```bash
# Installa dipendenze
pnpm install

# Configura variabili ambiente (vedi documentazione)

# Esegui migrations
pnpm db:push

# Popola database con dati di esempio
pnpm seed

# Avvia dev server
pnpm dev
```

## 📁 Struttura Progetto

```
prato-rinaldo-webapp/
├── client/              # Frontend React
│   ├── src/
│   │   ├── pages/      # Pagine applicazione
│   │   ├── components/ # Componenti riutilizzabili
│   │   └── lib/        # Utilities e tRPC client
├── server/             # Backend Express + tRPC
│   ├── routers.ts      # API endpoints
│   ├── db.ts           # Query helpers
│   └── _core/          # Framework core
├── drizzle/            # Database schema
├── scripts/            # Utility scripts
└── shared/             # Codice condiviso
```

## 👥 Sistema Ruoli

### Ruoli Amministrativi
- **Super Admin** - accesso completo
- **Admin** - gestione contenuti e utenti
- **Moderator** - moderazione contenuti

### Ruoli Comitato
- **Presidente** - Board member
- **Vice Presidente** - Board member
- **Segretario** - Board member
- **Tesoriere** - Board member
- **Consigliere** - Assemblea Generale

## 🎨 Design System

- **Palette Colori**: Teal (primario) + Arancione (secondario)
- **Tema**: Light/Dark mode support
- **Componenti**: shadcn/ui con personalizzazioni
- **Tipografia**: System fonts ottimizzati
- **Pattern**: World-class UI/UX 2025/2026

## 📝 Funzionalità Implementate

- ✅ Autenticazione OAuth con onboarding a 2 step
- ✅ Verifica residenza (indirizzo + nucleo familiare)
- ✅ Sistema moderazione centralizzato
- ✅ Marketplace con donazione percentuale
- ✅ Eventi con RSVP e raccolta fondi
- ✅ Forum con categorie
- ✅ Sistema gamification con badge
- ✅ Profilo utente completo
- ✅ Pannello admin avanzato
- ✅ Multi-tenant ready

## 🔐 Sicurezza

- Autenticazione OAuth2
- Session management con JWT
- Row-level security per tenant
- Input validation con Zod
- CORS configurato
- Rate limiting ready

## 📄 Licenza

MIT License

## 👨‍💻 Autore

Sviluppato per il Comitato Cittadini di Prato Rinaldo

---

**Repository**: https://github.com/v4codeit/prato-rinaldo-webapp

