# Generazione Tipi TypeScript da Supabase

Documentazione completa su come generare tipi TypeScript dal database Supabase.

---

## Metodo 1: Dashboard Supabase (Più Semplice)

Puoi scaricare i tipi direttamente dalla dashboard Supabase:

1. Vai su: https://supabase.com/dashboard/project/kyrliitlqshmwbzaaout
2. Nella sidebar, vai su **Database** → **API Docs**
3. Scorri fino alla sezione **TypeScript Types**
4. Clicca su **Download Types** o copia il contenuto
5. Salva in `/lib/supabase/database.types.ts`

---

## Metodo 2: Supabase CLI (Raccomandato)

### Installazione CLI

```bash
# Installa Supabase CLI come dev dependency
npm i supabase@">=1.8.1" --save-dev

# Oppure con pnpm
pnpm add -D supabase
```

### Login

```bash
npx supabase login
```

Questo aprirà il browser per autenticarti con il tuo account Supabase.

### Inizializza Progetto

```bash
npx supabase init
```

### Genera Tipi

**Per progetto remoto (produzione):**

```bash
npx supabase gen types typescript --project-id "kyrliitlqshmwbzaaout" --schema public > lib/supabase/database.types.ts
```

**Per sviluppo locale:**

```bash
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

---

## Metodo 3: MCP Supabase (Quello che abbiamo)

Il server MCP Supabase ha un tool `generate_typescript_types` che possiamo usare:

```bash
manus-mcp-cli tool call generate_typescript_types --server supabase --input '{"project_id": "kyrliitlqshmwbzaaout"}'
```

Il problema è che l'output viene restituito in formato JSON escaped, quindi dobbiamo processarlo.

---

## Struttura Tipi Generati

I tipi generati avranno questa struttura:

```typescript
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      movies: {
        Row: {
          // dati attesi da .select()
          id: number
          name: string
          data: Json | null
        }
        Insert: {
          // dati da passare a .insert()
          id?: never // colonne generate non devono essere fornite
          name: string // colonne not null senza default devono essere fornite
          data?: Json | null // colonne nullable possono essere omesse
        }
        Update: {
          // dati da passare a .update()
          id?: never
          name?: string // colonne not null sono opzionali su .update()
          data?: Json | null
        }
      }
    }
  }
}
```

---

## Utilizzo Tipi nel Codice

### Import nel Client Supabase

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
)
```

### Helper Types

```typescript
import { Database, Tables, Enums } from "./database.types"

// Prima 😕
let movie: Database['public']['Tables']['movies']['Row'] = // ...

// Dopo 😍
let movie: Tables<'movies'> = // ...
```

### Query con Tipi Inferiti

```typescript
import { QueryData } from '@supabase/supabase-js'

const countriesWithCitiesQuery = supabase.from('countries').select(`
  id,
  name,
  cities (
    id,
    name
  )
`)

type CountriesWithCities = QueryData<typeof countriesWithCitiesQuery>

const { data, error } = await countriesWithCitiesQuery
if (error) throw error
const countriesWithCities: CountriesWithCities = data
```

---

## Custom JSON Types

Puoi definire tipi custom per campi JSON usando `MergeDeep` da `type-fest`:

```typescript
import { MergeDeep } from 'type-fest'
import { Database as DatabaseGenerated } from './database-generated.types'

type CustomJsonType = {
  foo: string
  bar: { baz: number }
  en: 'ONE' | 'TWO' | 'THREE'
}

export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Tables: {
        your_table: {
          Row: {
            data: CustomJsonType | null
          }
        }
      }
    }
  }
>
```

---

## Aggiornamento Automatico con GitHub Actions

Puoi configurare GitHub Actions per aggiornare i tipi automaticamente:

### 1. Aggiungi script a package.json

```json
{
  "scripts": {
    "update-types": "npx supabase gen types typescript --project-id \"kyrliitlqshmwbzaaout\" --schema public > lib/supabase/database.types.ts"
  }
}
```

### 2. Crea file `.github/workflows/update-types.yml`

```yaml
name: Update database types

on:
  schedule:
    # Esegui ogni notte alle 2 AM
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm run update-types
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add lib/supabase/database.types.ts
          git diff --staged --quiet || git commit -m "Update database types"
          git push
```

### 3. Aggiungi Secret su GitHub

1. Vai su https://github.com/v4codeit/prato-rinaldo-webapp/settings/secrets/actions
2. Aggiungi `SUPABASE_ACCESS_TOKEN` con il tuo Personal Access Token da Supabase

---

## Soluzione Rapida per il Nostro Progetto

Dato che abbiamo già MCP configurato, il modo più veloce è:

### Opzione A: Dashboard (Manuale, 2 minuti)

1. Vai su https://supabase.com/dashboard/project/kyrliitlqshmwbzaaout/api
2. Scroll fino a "TypeScript Types"
3. Copia tutto il contenuto
4. Sostituisci `/lib/supabase/database.types.ts`

### Opzione B: CLI (Automatico, 5 minuti)

```bash
cd /home/ubuntu/prato-rinaldo-webapp

# Installa CLI
pnpm add -D supabase

# Login (aprirà browser)
npx supabase login

# Genera tipi
npx supabase gen types typescript --project-id "kyrliitlqshmwbzaaout" --schema public > lib/supabase/database.types.ts

# Verifica errori TypeScript
pnpm tsc --noEmit
```

### Opzione C: MCP + Script Python (Quello che proveremo)

Creo uno script che usa MCP per generare i tipi e processarli correttamente.

---

## Riferimenti

- **Documentazione ufficiale**: https://supabase.com/docs/guides/api/rest/generating-types
- **CLI Reference**: https://supabase.com/docs/reference/cli/introduction
- **Dashboard progetto**: https://supabase.com/dashboard/project/kyrliitlqshmwbzaaout

