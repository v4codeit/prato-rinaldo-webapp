# Configurazione Variabili Ambiente Supabase

## 🔑 Credenziali Supabase Richieste

Per completare il deploy dell'applicazione con Supabase, è necessario configurare le seguenti variabili ambiente:

### Variabili Pubbliche (Frontend)

```env
NEXT_PUBLIC_SUPABASE_URL=https://kyrliitlqshmwbzaaout.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5cmxpaXRscXNobXdiemFhb3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjI2MDcsImV4cCI6MjA3NjE5ODYwN30.XJYx5i7yFv-x1GsUqN-F1vuMF8eO3Y2VTkIsR06CygM
```

### Variabili Private (Backend) - Opzionali

```env
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_se_necessario>
```

## 📝 Come Configurare

### Metodo 1: Interfaccia Web Manus (Raccomandato)

1. Vai alle impostazioni del progetto web
2. Sezione "Environment Variables" o "Secrets"
3. Aggiungi le variabili sopra indicate
4. Salva e riavvia l'applicazione

### Metodo 2: File .env Locale (Solo per sviluppo)

Se stai lavorando in locale, crea un file `.env` nella root del progetto:

```bash
cd /home/ubuntu/prato-rinaldo-webapp
cat > .env << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://kyrliitlqshmwbzaaout.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5cmxpaXRscXNobXdiemFhb3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjI2MDcsImV4cCI6MjA3NjE5ODYwN30.XJYx5i7yFv-x1GsUqN-F1vuMF8eO3Y2VTkIsR06CygM
EOF
```

## 🚀 Dopo la Configurazione

Una volta configurate le variabili ambiente, esegui:

```bash
# 1. Rebuild del frontend
pnpm build

# 2. Restart del server
pnpm dev:server
```

## ✅ Verifica

Per verificare che le variabili siano configurate correttamente:

```bash
# Verifica variabili ambiente
env | grep SUPABASE

# Output atteso:
# NEXT_PUBLIC_SUPABASE_URL=https://kyrliitlqshmwbzaaout.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## 📚 Riferimenti

- **Supabase Project URL:** https://kyrliitlqshmwbzaaout.supabase.co
- **Supabase Dashboard:** https://supabase.com/dashboard/project/kyrliitlqshmwbzaaout
- **Documentazione Completa:** `SUPABASE_CREDENTIALS.md`

---

**Nota:** Le chiavi `ANON_KEY` sono pubbliche e sicure da esporre nel frontend. La `SERVICE_ROLE_KEY` (se necessaria) deve essere mantenuta privata e usata solo nel backend.

