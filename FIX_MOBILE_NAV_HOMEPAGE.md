# Fix Mobile Navigation Homepage - Istruzioni Manuali

**Status:** Dev server blocca modifiche automatiche
**Soluzione:** Applicare modifiche manualmente

---

## ⚠️ PROBLEMA DEV SERVER

Dev server (pnpm dev) con file watchers attivi sta bloccando Edit/Write tools.

**Per procedere:**
1. Ferma dev server: `Ctrl+C` nel terminale
2. Applica modifiche sotto manualmente
3. Salva file
4. Riavvia: `pnpm dev`

---

## 📝 FILE DA MODIFICARE

**File:** `app/(public)/public-layout-client.tsx`

---

## 🔧 MODIFICA 1: Aggiungere Import

**Dopo line 8** (dopo `import { MainContentLoader }...`), aggiungere:

```typescript
import { MobileBottomNav } from '@/components/organisms/layout/mobile-bottom-nav';
```

**Sezione import completa (lines 1-9):**
```typescript
'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { PageLayout } from '@/components/organisms/layout/page-layout';
import { PublicSubHeader } from '@/components/organisms/layout/public-sub-header';
import { MainContentTransition } from '@/components/organisms/layout/main-content-transition';
import { MainContentLoader } from '@/components/organisms/layout/main-content-loader';
import { MobileBottomNav } from '@/components/organisms/layout/mobile-bottom-nav'; // ✅ NUOVO
```

---

## 🔧 MODIFICA 2: Aggiornare Homepage Branch

**Sostituire lines 43-50** con:

```typescript
  // Home page: no PageLayout (no sidebar/sub-header), but with transition and mobile nav
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

**Cosa cambia:**
1. ✅ **Line 44:** Return statement wrappato in fragment `<>...</>`
2. ✅ **Line 47:** Aggiunto `pb-16 md:pb-0` alla className di main (padding bottom per clearance mobile nav)
3. ✅ **Line 50:** Aggiunto `<MobileBottomNav user={user} />` dopo Suspense

---

## 📄 FILE COMPLETO (Reference)

```typescript
'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { PageLayout } from '@/components/organisms/layout/page-layout';
import { PublicSubHeader } from '@/components/organisms/layout/public-sub-header';
import { MainContentTransition } from '@/components/organisms/layout/main-content-transition';
import { MainContentLoader } from '@/components/organisms/layout/main-content-loader';
import { MobileBottomNav } from '@/components/organisms/layout/mobile-bottom-nav';

interface PublicLayoutClientProps {
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    verification_status?: string;
    role?: string;
  } | null;
  children: React.ReactNode;
}

// Map pathname to page title
const getPageTitle = (pathname: string): { title: string; description?: string } => {
  if (pathname.startsWith('/feed')) return { title: 'Bacheca Pubblica', description: 'Rimani aggiornato sulle ultime novità della community' };
  if (pathname.startsWith('/events')) return { title: 'Eventi', description: 'Scopri tutti gli eventi della community' };
  if (pathname.startsWith('/marketplace')) return { title: 'Marketplace', description: 'Annunci e offerte della community' };
  if (pathname.startsWith('/about')) return { title: 'Chi Siamo', description: 'Scopri la nostra community' };
  if (pathname.startsWith('/contacts')) return { title: 'Contatti' };
  if (pathname.startsWith('/privacy')) return { title: 'Privacy Policy' };
  if (pathname.startsWith('/terms')) return { title: 'Termini di Servizio' };
  if (pathname.startsWith('/statute')) return { title: 'Statuto' };
  if (pathname.startsWith('/community')) return { title: 'La Community' };
  return { title: 'Prato Rinaldo' };
};

export function PublicLayoutClient({
  user,
  children,
}: PublicLayoutClientProps) {
  const pathname = usePathname();

  // Home page: no PageLayout (no sidebar/sub-header), but with transition and mobile nav
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

  // Get page info from pathname
  const { title, description } = getPageTitle(pathname);

  // Other public pages: with PageLayout (sidebar + sub-header enabled)
  return (
    <PageLayout
      user={user}
      subHeader={<PublicSubHeader title={title} description={description} />}
    >
      {children}
    </PageLayout>
  );
}
```

---

## ✅ TESTING CHECKLIST

Dopo aver applicato le modifiche e riavviato dev server:

### Mobile (< 768px)
- [ ] Homepage `/`: Bottom nav visible (fixed bottom)
- [ ] Homepage `/`: Bottom nav mostra 5 items (Home, Bacheca, Eventi, Community, Menu)
- [ ] Homepage `/`: Click "Home" icon → Rimane su `/`
- [ ] Homepage `/`: Click "Bacheca" icon → Naviga a `/feed`
- [ ] Homepage `/`: Click "Eventi" icon → Naviga a `/events`
- [ ] Homepage `/`: Click "Community" icon → Naviga a `/community-pro`
- [ ] Homepage `/`: Click "Menu" button → MobileMenuDrawer si apre
- [ ] Homepage `/`: Content non sovrapposto (padding bottom `pb-16` funziona)

### Desktop (>= 768px)
- [ ] Homepage `/`: Bottom nav NASCOSTA (`md:hidden` funziona)
- [ ] Homepage `/`: No layout changes vs prima

### Altre Pagine (Regression Test)
- [ ] Feed `/feed`: Bottom nav visible (come prima)
- [ ] Eventi `/events`: Bottom nav visible (come prima)
- [ ] Marketplace `/marketplace`: Bottom nav visible (come prima)
- [ ] Nessuna regressione su altre route

---

## 🎯 RISULTATO ATTESO

**PRIMA:**
```
Homepage Mobile (< 768px):
┌─────────────────────────┐
│ Header (logo + nome)    │
├─────────────────────────┤
│ Hero Section            │
│ Features                │
│ CTA Buttons             │
│                         │
│ ❌ NO NAVIGATION        │
└─────────────────────────┘
```

**DOPO:**
```
Homepage Mobile (< 768px):
┌─────────────────────────┐
│ Header (logo + nome)    │
├─────────────────────────┤
│ Hero Section            │
│ Features                │
│ CTA Buttons             │
│                         │
│ [space pb-16]           │
├─────────────────────────┤
│ ✅ [⌂] [📋] [📅] [👥] [☰] │ ← Fixed Bottom Nav
└─────────────────────────┘
```

---

## 📊 SUMMARY CHANGES

| Aspetto | BEFORE | AFTER |
|---------|--------|-------|
| **Import** | 4 imports | 5 imports (+MobileBottomNav) |
| **Homepage return** | Suspense only | Fragment + Suspense + MobileBottomNav |
| **Main padding** | `flex-1` | `flex-1 pb-16 md:pb-0` |
| **Mobile Nav** | ❌ MISSING | ✅ PRESENT |
| **Lines changed** | - | 5 lines |
| **Files modified** | - | 1 file |

---

## 🚀 QUICK APPLY (Copy-Paste)

### Step 1: Stop Dev Server
```bash
# Nel terminale
Ctrl+C
```

### Step 2: Open File
```bash
code app/(public)/public-layout-client.tsx
```

### Step 3: Apply Changes
1. Line 9: Aggiungi import `MobileBottomNav`
2. Lines 43-50: Sostituisci con nuovo branch homepage (vedi sopra)

### Step 4: Save & Restart
```bash
# Save file: Ctrl+S
# Restart dev server
pnpm dev
```

### Step 5: Test
- Browser: http://localhost:3000
- DevTools (F12): Toggle device toolbar
- Mobile view: Verifica bottom nav visible

---

## 💡 NOTE

### Perché `pb-16 md:pb-0`?
- `pb-16` = 64px padding bottom (mobile)
- Mobile nav height = ~64px
- Serve per evitare che content sia nascosto sotto nav
- `md:pb-0` = Remove padding on desktop (nav hidden)

### Perché Fragment `<>...</>`?
- React richiede single root element in return
- Fragment permette di wrappare Suspense + MobileBottomNav senza aggiungere extra DOM node

### Perché NO PageLayout?
- Homepage design richiede full-width layout (no sidebar)
- PageLayout include sidebar/subheader (non voluti su homepage)
- Ma vogliamo mobile nav (quindi lo aggiungiamo manualmente)

---

**Tempo stimato:** 2-3 minuti
**Difficoltà:** Trivial (copy-paste)
**Impact:** HIGH (fix mobile UX homepage)
