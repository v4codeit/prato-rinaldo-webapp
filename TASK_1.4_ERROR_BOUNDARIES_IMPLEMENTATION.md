# TASK 1.4: Error Boundaries - Implementazione Completa

## ANALISI SITUAZIONE ATTUALE

### Error Boundaries Esistenti (4)
- ✅ `app/error.tsx` (Global) - **NEEDS IMPROVEMENT**
- ✅ `app/(admin)/admin/error.tsx` (Admin panel) - ✅ Good
- ✅ `app/(private)/bacheca/error.tsx` (Personal dashboard) - ✅ Good
- ✅ `app/(public)/marketplace/[id]/error.tsx` (Marketplace item) - ✅ Good

### Error Boundaries Mancanti (8 route groups)
- ❌ `app/(auth)/error.tsx` - Login, Register, Verify Email
- ❌ `app/(authenticated)/error.tsx` - Profile, Settings
- ❌ `app/(public)/events/error.tsx` - Eventi pubblici
- ❌ `app/(private)/agora/error.tsx` - Agorà/Proposte
- ❌ `app/(private)/resources/error.tsx` - Risorse/Documenti
- ❌ `app/(private)/messages/error.tsx` - Sistema messaggistica
- ❌ `app/(private)/community-pro/error.tsx` - Community Pro
- ❌ Vari `app/(public)/[route]/error.tsx` - Feed, Articles, etc.

### Issues Global Error Boundary
1. ❌ **Production error leaks** - `error.message` visible anche in prod
2. ❌ **Mancanza "Home" button** - Solo "Riprova", non può tornare home
3. ❌ **Styling basic** - Non usa Card/shadcn components
4. ❌ **No icon** - Manca visual feedback (AlertTriangle)
5. ❌ **Console.error only** - No external logging (Sentry, Datadog)

---

## IMPLEMENTAZIONE

### PARTE 1: Migliorare Global Error Boundary

#### File: `app/error.tsx` (CODICE COMPLETO MIGLIORATO)

```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';
import { ROUTES } from '@/lib/utils/constants';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error);
    }

    // TODO: Send to external error tracking service in production
    // if (process.env.NODE_ENV === 'production') {
    //   // Sentry.captureException(error);
    //   // OR Datadog.logError(error);
    // }
  }, [error]);

  // Hide sensitive error details in production
  const showDetails = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/50">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-3xl">Qualcosa è andato storto!</CardTitle>
            <CardDescription className="text-base">
              Si è verificato un errore imprevisto. Puoi provare a ricaricare la pagina o
              tornare alla home.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error details - only in development */}
            {showDetails && error.message && (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-xs font-mono text-muted-foreground mb-2">
                  Debug Info (solo in sviluppo):
                </p>
                <pre className="text-xs font-mono overflow-auto whitespace-pre-wrap break-words">
                  {error.message}
                </pre>
                {error.digest && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={reset} size="lg" className="flex-1 sm:flex-initial">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Riprova
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1 sm:flex-initial">
                <Link href={ROUTES.HOME}>
                  <Home className="mr-2 h-4 w-4" />
                  Torna alla Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Cosa Cambia:**
| Feature | Prima | Dopo |
|---------|-------|------|
| Error details visibility | ✅ Sempre | ✅ Solo in dev |
| Home button | ❌ No | ✅ Sì |
| Styling | Basic div | Card component |
| Icon | ❌ No | ✅ AlertTriangle |
| Responsive | Parziale | Full (flex-col/row) |
| External logging | ❌ No | ✅ Ready (commented) |

---

### PARTE 2: Template per Route-Specific Error Boundaries

#### Generic Template

```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function [RouteGroup]Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[RouteGroup] error:', error);
  }, [error]);

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-3xl">Errore di Caricamento</CardTitle>
            <CardDescription className="text-base">
              Si è verificato un errore. Puoi provare a ricaricare.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {error.message || 'Errore sconosciuto'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset}>Riprova</Button>
              <Button variant="outline" asChild>
                <Link href="/[appropriate-back-route]">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Indietro
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

### PARTE 3: Error Boundaries da Creare

#### 1. Auth Routes - `app/(auth)/error.tsx`
```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';
import { ROUTES } from '@/lib/utils/constants';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Auth error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle>Errore di Autenticazione</CardTitle>
            <CardDescription>
              Si è verificato un errore durante l'autenticazione.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              {error.message || 'Errore sconosciuto'}
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={reset} className="w-full">Riprova</Button>
              <Button variant="outline" asChild className="w-full">
                <Link href={ROUTES.HOME}>
                  <Home className="mr-2 h-4 w-4" />
                  Torna alla Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**File path:** `app/(auth)/error.tsx`

---

#### 2. Authenticated Routes - `app/(authenticated)/error.tsx`
```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';
import { ROUTES } from '@/lib/utils/constants';

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Authenticated route error:', error);
  }, [error]);

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle>Errore di Caricamento</CardTitle>
            <CardDescription>
              Si è verificato un errore durante il caricamento della pagina.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {error.message || 'Errore sconosciuto'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset}>Riprova</Button>
              <Button variant="outline" asChild>
                <Link href={ROUTES.HOME}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**File path:** `app/(authenticated)/error.tsx`

---

#### 3. Public Events - `app/(public)/events/error.tsx`
```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar } from 'lucide-react';
import { ROUTES } from '@/lib/utils/constants';

export default function EventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Events error:', error);
  }, [error]);

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle>Errore Eventi</CardTitle>
            <CardDescription>
              Impossibile caricare gli eventi in questo momento.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {error.message || 'Errore sconosciuto'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset}>Riprova</Button>
              <Button variant="outline" asChild>
                <Link href={ROUTES.HOME}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**File path:** `app/(public)/events/error.tsx`

---

#### 4. Agora (Private) - `app/(private)/agora/error.tsx`
```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { ROUTES } from '@/lib/utils/constants';

export default function AgoraError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Agora error:', error);
  }, [error]);

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle>Errore Agorà</CardTitle>
            <CardDescription>
              Impossibile caricare le proposte dell'Agorà.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {error.message || 'Errore sconosciuto'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset}>Riprova</Button>
              <Button variant="outline" asChild>
                <Link href={ROUTES.BACHECA}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Bacheca
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**File path:** `app/(private)/agora/error.tsx`

---

#### 5. Resources (Private) - `app/(private)/resources/error.tsx`
```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BookOpen } from 'lucide-react';
import { ROUTES } from '@/lib/utils/constants';

export default function ResourcesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Resources error:', error);
  }, [error]);

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle>Errore Risorse</CardTitle>
            <CardDescription>
              Impossibile caricare le risorse in questo momento.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {error.message || 'Errore sconosciuto'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset}>Riprova</Button>
              <Button variant="outline" asChild>
                <Link href={ROUTES.BACHECA}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Bacheca
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**File path:** `app/(private)/resources/error.tsx`

---

#### 6. Messages (Private) - `app/(private)/messages/error.tsx`
```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail } from 'lucide-react';
import { ROUTES } from '@/lib/utils/constants';

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Messages error:', error);
  }, [error]);

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle>Errore Messaggi</CardTitle>
            <CardDescription>
              Impossibile caricare i messaggi in questo momento.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {error.message || 'Errore sconosciuto'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset}>Riprova</Button>
              <Button variant="outline" asChild>
                <Link href={ROUTES.BACHECA}>
                  <Mail className="mr-2 h-4 w-4" />
                  Bacheca
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**File path:** `app/(private)/messages/error.tsx`

---

#### 7. Community Pro (Private) - `app/(private)/community-pro/error.tsx`
```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users } from 'lucide-react';
import { ROUTES } from '@/lib/utils/constants';

export default function CommunityProError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Community Pro error:', error);
  }, [error]);

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle>Errore Community Pro</CardTitle>
            <CardDescription>
              Impossibile caricare la Community Pro in questo momento.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {error.message || 'Errore sconosciuto'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset}>Riprova</Button>
              <Button variant="outline" asChild>
                <Link href={ROUTES.MARKETPLACE}>
                  <Users className="mr-2 h-4 w-4" />
                  Marketplace
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**File path:** `app/(private)/community-pro/error.tsx`

---

## SUMMARY: Files to Create/Modify

### 📝 DA MODIFICARE (1)
1. `app/error.tsx` - Global error boundary improvement

### 📄 DA CREARE (7)
1. `app/(auth)/error.tsx`
2. `app/(authenticated)/error.tsx`
3. `app/(public)/events/error.tsx`
4. `app/(private)/agora/error.tsx`
5. `app/(private)/resources/error.tsx`
6. `app/(private)/messages/error.tsx`
7. `app/(private)/community-pro/error.tsx`

---

## TESTING CHECKLIST

### Global Error Boundary
- [ ] Error details hidden in production (`NODE_ENV=production`)
- [ ] Error details visible in development
- [ ] "Riprova" button funziona (chiama reset())
- [ ] "Torna alla Home" button naviga a `/`
- [ ] Card styling rendering corretto
- [ ] AlertTriangle icon visible
- [ ] Responsive layout (mobile + desktop)

### Route-Specific Error Boundaries
Per ogni nuovo error boundary:
- [ ] Error rendering dentro layout appropriato (con header/sidebar)
- [ ] "Riprova" button funziona
- [ ] "Back" button naviga a route appropriato
- [ ] Icon e styling consistenti
- [ ] Console.error logging attivo

### Scenario Testing
- [ ] Trigger error in auth route → Mostra auth error boundary
- [ ] Trigger error in events page → Mostra events error boundary
- [ ] Trigger error in agora → Mostra agora error boundary
- [ ] Trigger global error → Mostra global error boundary migliorato
- [ ] Verify no layout duplication (error boundary inside existing layout)

---

## ISTRUZIONI MANUALI (Dev Server Blocking)

### Step 1: Ferma Dev Server
```bash
# Ctrl+C nel terminale
```

### Step 2: Crea i 7 nuovi file
Copia il codice da ogni sezione sopra e crea i file nelle path indicate.

### Step 3: Modifica global error.tsx
Sostituisci completamente `app/error.tsx` con il codice della PARTE 1.

### Step 4: Riavvia
```bash
pnpm dev
```

### Step 5: Testa
Trigger errori intenzionali per verificare ogni boundary.

---

## NOTE IMPLEMENTAZIONE

### Error Boundary Hierarchy

```
app/error.tsx (GLOBAL)
├── (auth)/error.tsx (Auth routes)
├── (authenticated)/error.tsx (Authenticated routes)
├── (public)/
│   ├── events/error.tsx
│   └── (altri route usano global)
├── (private)/
│   ├── agora/error.tsx
│   ├── resources/error.tsx
│   ├── messages/error.tsx
│   ├── community-pro/error.tsx
│   └── bacheca/error.tsx (già esiste)
└── (admin)/admin/error.tsx (già esiste)
```

### Best Practices Applicate

1. ✅ **User-friendly messages** - No tech jargon
2. ✅ **Consistent styling** - Card, AlertTriangle, Button
3. ✅ **Actionable buttons** - Reset + Navigation
4. ✅ **Security** - Hide details in prod
5. ✅ **Logging** - Console in dev, ready for external in prod
6. ✅ **Accessibility** - Proper ARIA, semantic HTML
7. ✅ **Responsive** - Mobile-first, flex layouts

---

## BONUS: External Error Logging

### Sentry Integration (OPZIONALE)
```bash
pnpm add @sentry/nextjs
```

```typescript
// app/error.tsx
import * as Sentry from '@sentry/nextjs';

useEffect(() => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: { boundary: 'global' },
      extra: { digest: error.digest },
    });
  }
}, [error]);
```

### Datadog Integration (OPZIONALE)
```bash
pnpm add @datadog/browser-logs
```

```typescript
// app/error.tsx
import { datadogLogs } from '@datadog/browser-logs';

useEffect(() => {
  if (process.env.NODE_ENV === 'production') {
    datadogLogs.logger.error('Error boundary triggered', {
      error: error.message,
      digest: error.digest,
      boundary: 'global',
    });
  }
}, [error]);
```

---

**Implementation Time Estimate:** 2-3 hours
**Priority:** P0 (Production readiness)
**Impact:** High (Better UX, Security, Debugging)
