# TASK 1.2: Fix Register Redirect Loop - Analisi e Soluzione

## PROBLEMA IDENTIFICATO

### Scenario Attuale (Confusione UX)
1. Utente si registra su `/register`
2. `signUp()` crea account Supabase + sessione attiva
3. Redirect a `/verify-email` (email NON ancora verificata)
4. Utente clicca "Back" o va manualmente a `/register`
5. `redirectIfAuthenticated()` lo manda a HOME (confusione!)

### Root Cause
```typescript
// register/page.tsx line 16
await redirectIfAuthenticated(); // Troppo aggressivo

// redirectIfAuthenticated() in dal.ts
export async function redirectIfAuthenticated(): Promise<void> {
  const user = await getSession();
  if (user) {
    redirect(ROUTES.HOME); // Non considera stato email verification
  }
}
```

## SOLUZIONE PROPOSTA

### Opzione A: Migliorare redirectIfAuthenticated()
Controllare anche lo stato di email verification:

```typescript
// lib/auth/dal.ts - MIGLIORAMENTO
export async function redirectIfAuthenticated(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return; // Non autenticato, OK per auth pages

  // Se email NON verificata, permetti accesso a register/login
  // (per eventuale re-invio email o correzione)
  if (!user.email_confirmed_at) {
    return; // Email non verificata, lascia accedere
  }

  // Email verificata → redirect appropriato
  const profile = await getUserProfile(user.id);

  if (profile && !profile.onboarding_completed) {
    redirect(ROUTES.ONBOARDING);
  } else {
    redirect(ROUTES.HOME);
  }
}
```

### Opzione B (PIÙ SEMPLICE): Migliorare verify-email page
Aggiungere controllo intelligente:

```typescript
// app/(auth)/verify-email/page.tsx - NUOVO
import { getSession } from '@/lib/auth/dal';
import { getUserProfile } from '@/lib/auth/dal';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/utils/constants';

export default async function VerifyEmailPage() {
  const user = await getSession();

  // Se utente è autenticato E email già verificata
  if (user?.email_confirmed_at) {
    const profile = await getUserProfile(user.id);

    // Redirect a onboarding se non completato
    if (profile && !profile.onboarding_completed) {
      redirect(ROUTES.ONBOARDING);
    }

    // Altrimenti a home
    redirect(ROUTES.HOME);
  }

  // Se NON autenticato O email non verificata, mostra pagina
  return <VerifyEmailCard />;
}
```

## DECISIONE: Opzione B + Piccolo Fix Opzione A

### IMPLEMENTAZIONE

**File 1:** `app/(auth)/verify-email/page.tsx` (refactor completo)

**File 2:** `lib/auth/dal.ts` - Aggiungere helper:
```typescript
export async function isEmailVerified(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user?.email_confirmed_at;
}
```

**File 3:** Opzionale - Migliorare `redirectIfAuthenticated()` per casi edge

## TESTING CHECKLIST

- [ ] Utente NON autenticato può accedere a `/register`
- [ ] Utente si registra → redirect a `/verify-email` → vede messaggio
- [ ] Da `/verify-email`, se user clicca "Vai al Login" → funziona
- [ ] Se user con email NON verificata va a `/register` → vede form (o redirect intelligente)
- [ ] Se user con email VERIFICATA va a `/register` → redirect a HOME
- [ ] Se user con email VERIFICATA va a `/verify-email` → redirect a ONBOARDING o HOME
- [ ] Nessun redirect loop in nessuno scenario

## NOTA IMPORTANTE

Il QA report dice "utenti NON loggati vengono redirezionati" ma questo è IPOTESI.
Il codice attuale (`redirectIfAuthenticated`) NON redirige utenti non autenticati.

Il problema REALE è:
- Utenti autenticati con email non verificata vengono redirezionati da /register (corretto ma confuso)
- Manca gestione intelligente dello stato "email pending verification"

---

## IMPLEMENTAZIONE BLOCCATA (Dev Server Active)

### SOLUZIONE APPLICATA: Opzione B

### File: `app/(auth)/verify-email/page.tsx` (CODICE COMPLETO)

```typescript
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ROUTES } from '@/lib/utils/constants';
import { Mail } from 'lucide-react';
import { getSession } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Verifica Email',
  description: 'Verifica il tuo indirizzo email',
};

export default async function VerifyEmailPage() {
  // Check if user is authenticated and email already verified
  const user = await getSession();

  if (user) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // If email is already verified, redirect to appropriate page
    if (authUser?.email_confirmed_at) {
      // Check if onboarding is completed
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

  // User is not authenticated OR email not verified yet - show page
  return (
    <Card>
      <CardHeader>
        <div className="mx-auto mb-4 rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-center">Verifica la tua Email</CardTitle>
        <CardDescription className="text-center">
          Controlla la tua casella di posta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <p className="text-sm">
            Ti abbiamo inviato un'email con un link di verifica. Clicca sul link per
            completare la registrazione e attivare il tuo account.
          </p>
        </Alert>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Non hai ricevuto l'email?</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Controlla la cartella spam o posta indesiderata</li>
            <li>Assicurati di aver inserito l'email corretta</li>
            <li>Attendi qualche minuto e ricontrolla</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button asChild className="w-full">
          <Link href={ROUTES.LOGIN}>Vai al Login</Link>
        </Button>
        <Button variant="ghost" className="w-full">
          Invia Nuovamente Email
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### ISTRUZIONI MANUALI (Dev Server Blocking File Edits)

1. **Ferma il dev server:** `Ctrl+C` nel terminale
2. **Sostituisci completamente** il contenuto di `app/(auth)/verify-email/page.tsx` con il codice sopra
3. **Salva** il file
4. **Riavvia:** `pnpm dev`
5. **Testa** tutti gli scenari nella checklist

### COSA CAMBIA

**PRIMA:**
- verify-email era una pagina "stupida" (nessun controllo auth)
- Utenti con email già verificata potevano accedere e vedere messaggio inutile

**DOPO:**
- verify-email è "intelligente"
- Se email già verificata → redirect a onboarding o home
- Se email NON verificata → mostra messaggio (corretto)
- Fix del confusing UX flow
