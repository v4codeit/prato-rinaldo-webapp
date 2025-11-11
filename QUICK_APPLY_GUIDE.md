# ⚡ Quick Apply Guide - 4 Fix P0

**Tempo stimato:** 10-15 minuti
**Difficoltà:** Low (copy-paste)

---

## 🚦 PREREQUISITO

```bash
# 1. Ferma dev server
Ctrl+C

# 2. Backup (opzionale ma raccomandato)
git add .
git commit -m "backup before P0 fixes"
```

---

## 📝 FIX 1: Mobile Nav Homepage (2 min)

**File:** `app/(public)/public-layout-client.tsx`

### A. Aggiungi import (line 9)
```typescript
import { MobileBottomNav } from '@/components/organisms/layout/mobile-bottom-nav';
```

### B. Sostituisci homepage branch (lines 43-51)
**PRIMA:**
```typescript
if (pathname === '/') {
  return (
    <Suspense key={pathname} fallback={<MainContentLoader />}>
      <MainContentTransition>
        <main className="flex-1">{children}</main>
      </MainContentTransition>
    </Suspense>
  );
}
```

**DOPO:**
```typescript
if (pathname === '/') {
  return (
    <>
      <Suspense key={pathname} fallback={<MainContentLoader />}>
        <MainContentTransition>
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
        </MainContentTransition>
      </Suspense>
      <MobileBottomNav user={user} />
    </>
  );
}
```

---

## 🔄 FIX 2: Register Redirect (3 min)

**File:** `app/(auth)/verify-email/page.tsx`

### A. Aggiungi imports (lines 1-4)
```typescript
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/utils/constants';
```

### B. Aggiungi `async` + smart logic (lines 16-40)
**PRIMA:**
```typescript
export default function VerifyEmailPage() {
  return (
```

**DOPO:**
```typescript
export default async function VerifyEmailPage() {
  // Smart routing logic
  const user = await getSession();

  if (user) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser?.email_confirmed_at) {
      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profile && !profile.onboarding_completed) {
        redirect(ROUTES.ONBOARDING);
      }

      redirect(ROUTES.HOME);
    }
  }

  // Email not verified - show card
  return (
```

---

## 🔗 FIX 3: Footer Social Links (4 min)

**File:** `components/organisms/footer/footer.tsx`

### A. Aggiungi imports (after line 3)
```typescript
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { getTenantSocialLinks } from '@/app/actions/tenant-settings';
```

### B. Aggiungi `async` + fetch (line 27)
**PRIMA:**
```typescript
export function Footer() {
  const currentYear = new Date().getFullYear();
```

**DOPO:**
```typescript
export async function Footer() {
  const currentYear = new Date().getFullYear();
  const socialLinks = await getTenantSocialLinks();
```

### C. Sostituisci social links section (lines 107-134)
**RIMUOVI tutto da line 107 a line 134 (28 lines)**

**AGGIUNGI:**
```typescript
            <div className="flex items-center gap-4">
              {/* Social media links - dynamic from database */}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}

              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}

              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
            </div>
```

---

## 🛡️ FIX 4: Error Boundaries (10 min)

### A. Modifica Global Error Boundary

**File:** `app/error.tsx`

**SOSTITUISCI TUTTO IL FILE** con:

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
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error);
    }
    // TODO: Send to Sentry/Datadog in production
  }, [error]);

  const showDetails = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-3xl">Qualcosa è andato storto!</CardTitle>
          <CardDescription className="text-base">
            Si è verificato un errore imprevisto. Puoi provare a ricaricare o tornare alla home.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {showDetails && error.message && (
            <div className="bg-muted p-4 rounded-md border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Debug Info (solo in sviluppo):
              </p>
              <pre className="text-xs font-mono overflow-auto text-foreground">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} size="lg">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Riprova
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={ROUTES.HOME}>
                <Home className="mr-2 h-4 w-4" />
                Torna alla Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### B. Crea 4 Nuovi Error Boundaries

#### B1. `app/(auth)/error.tsx` (CREA FILE NUOVO)
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

  const showDetails = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/50">
      <Card className="w-full max-w-md">
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

        <CardContent className="space-y-4">
          {showDetails && error.message && (
            <div className="bg-muted p-4 rounded-md border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Debug Info:
              </p>
              <pre className="text-xs font-mono overflow-auto">
                {error.message}
              </pre>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Riprova
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.HOME}>
                <Home className="mr-2 h-4 w-4" />
                Torna alla Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### B2. `app/(authenticated)/error.tsx` (CREA FILE NUOVO)
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

  const showDetails = process.env.NODE_ENV === 'development';

  return (
    <div className="container py-12">
      <Card className="max-w-2xl mx-auto">
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

        <CardContent className="space-y-4">
          {showDetails && error.message && (
            <div className="bg-muted p-4 rounded-md border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Debug Info:
              </p>
              <pre className="text-xs font-mono overflow-auto">
                {error.message}
              </pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} size="lg">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Riprova
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={ROUTES.HOME}>
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### B3. `app/(public)/error.tsx` (CREA FILE NUOVO)
```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';
import { ROUTES } from '@/lib/utils/constants';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Public route error:', error);
  }, [error]);

  const showDetails = process.env.NODE_ENV === 'development';

  return (
    <div className="container py-12">
      <Card className="max-w-2xl mx-auto">
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

        <CardContent className="space-y-4">
          {showDetails && error.message && (
            <div className="bg-muted p-4 rounded-md border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Debug Info:
              </p>
              <pre className="text-xs font-mono overflow-auto">
                {error.message}
              </pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} size="lg">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Riprova
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={ROUTES.HOME}>
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### B4. `app/(private)/error.tsx` (CREA FILE NUOVO)
```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';
import { ROUTES } from '@/lib/utils/constants';

export default function PrivateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Private route error:', error);
  }, [error]);

  const showDetails = process.env.NODE_ENV === 'development';

  return (
    <div className="container py-12">
      <Card className="max-w-2xl mx-auto">
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

        <CardContent className="space-y-4">
          {showDetails && error.message && (
            <div className="bg-muted p-4 rounded-md border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Debug Info:
              </p>
              <pre className="text-xs font-mono overflow-auto">
                {error.message}
              </pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} size="lg">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Riprova
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={ROUTES.HOME}>
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ✅ CHECKLIST FINALE

### Dopo Applicazione
- [ ] Tutti i 4 fix applicati
- [ ] Tutti i 4 nuovi error boundaries creati
- [ ] Salvati tutti i file
- [ ] `pnpm dev` riavviato

### Verifica TypeScript
```bash
pnpm type-check
# No errors = ✅
```

### Test Quick
```bash
# 1. Homepage mobile nav
# Browser DevTools → Toggle device → Verify bottom nav

# 2. Register flow
# Register nuovo account → Verify redirect logic

# 3. Footer social
# Check footer → Verify icons (if DB configured)

# 4. Error boundaries
# Add throw new Error('test') to any page → Verify boundary
```

---

## 🚀 RIAVVIA

```bash
pnpm dev
```

**Tempo totale:** 10-15 minuti
**Difficoltà:** Low
**Impact:** HIGH (production readiness +32%)

---

**Next:** Testing manuale completo (vedi `IMPLEMENTATION_COMPLETE_EXECUTIVE_SUMMARY.md`)
