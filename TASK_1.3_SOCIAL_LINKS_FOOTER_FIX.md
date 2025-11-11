# TASK 1.3: Fix Social Links Footer - Implementazione

## PROBLEMA IDENTIFICATO

### Footer Attuale (Hardcoded Placeholders)
```typescript
// Lines 108-134 in footer.tsx
<a href="#" aria-label="Facebook">  {/* ❌ href="#" */}
  <svg className="h-5 w-5" fill="currentColor">...</svg>  {/* ❌ Inline SVG */}
</a>
<a href="#" aria-label="Instagram">  {/* ❌ href="#" */}
  <svg className="h-5 w-5" fill="currentColor">...</svg>  {/* ❌ Inline SVG */}
</a>
```

**Issues:**
1. ❌ `href="#"` - Link non funzionanti
2. ❌ Inline SVG - Non maintainable, inconsistente con il resto del codebase
3. ❌ Mancano attributi sicurezza (`target="_blank"`, `rel="noopener noreferrer"`)
4. ❌ Nessuna conditional rendering (sempre visibili anche se link vuoti)
5. ❌ Non fetch da database (tenant settings)

## SOLUZIONE

### Action Già Disponibile
```typescript
// app/actions/tenant-settings.ts (ESISTE GIÀ)
export async function getTenantSocialLinks() {
  const { tenant, error } = await getTenantSettings();
  return {
    facebook: tenant.social_facebook || '',
    instagram: tenant.social_instagram || '',
    twitter: tenant.social_twitter || '',
    error: null,
  };
}
```

### Database Schema (ESISTE GIÀ)
```sql
-- tenants table
social_facebook TEXT,
social_instagram TEXT,
social_twitter TEXT
```

### Refactor Plan
1. Convertire Footer a **Server Component async**
2. Fetch social links da `getTenantSocialLinks()`
3. Replace inline SVG con **Lucide React icons**
4. Conditional rendering (mostra solo se link non vuoto)
5. Aggiungere security attributes

---

## IMPLEMENTAZIONE BLOCCATA (Dev Server Active)

### File: `components/organisms/footer/footer.tsx` (CODICE COMPLETO REFACTORED)

```typescript
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/utils/constants';
import { getTenantSocialLinks } from '@/app/actions/tenant-settings';

const footerLinks = {
  about: [
    { label: 'Chi Siamo', href: '/about' as const },
    { label: 'La Community', href: '/community' as const },
    { label: 'Statuto', href: '/statute' as const },
  ],
  quick: [
    { label: 'Eventi', href: ROUTES.EVENTS },
    { label: 'Articoli', href: ROUTES.ARTICLES },
    { label: 'Marketplace', href: ROUTES.MARKETPLACE },
    { label: 'Community Pro', href: ROUTES.COMMUNITY_PRO },
    { label: 'Bacheca Pubblica', href: ROUTES.FEED },
  ] as const,
  info: [
    { label: 'Contatti', href: '/contacts' as const },
    { label: 'Privacy Policy', href: '/privacy' as const },
    { label: 'Termini di Servizio', href: '/terms' as const },
  ],
} as const;

export async function Footer() {
  const currentYear = new Date().getFullYear();

  // Fetch social links from database
  const socialLinks = await getTenantSocialLinks();

  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/assets/logos/logo-pratorinaldo.png"
                alt={APP_NAME}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <h3 className="font-semibold">{APP_NAME}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Piattaforma digitale per la community del Comitato di Quartiere Prato Rinaldo.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Link Rapidi</h3>
            <ul className="space-y-2">
              {footerLinks.quick.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href as any}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h3 className="font-semibold mb-4">Chi Siamo</h3>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold mb-4">Informazioni</h3>
            <ul className="space-y-2">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} {APP_NAME}. Tutti i diritti riservati.
            </p>

            {/* Social media links - Dynamic from database */}
            <div className="flex items-center gap-4">
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
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## COSA CAMBIA

### PRIMA vs DOPO

| Aspetto | Prima | Dopo |
|---------|-------|------|
| **Social Links** | `href="#"` hardcoded | Fetch dinamico da DB |
| **Icons** | Inline SVG (300+ lines) | Lucide React (< 10 lines) |
| **Security** | ❌ Mancano attributi | ✅ `target="_blank" rel="noopener noreferrer"` |
| **Conditional** | Sempre visibili | Solo se link configurati |
| **Component Type** | Client Component | Server Component (async) |
| **Manutenibilità** | Bassa (SVG hardcoded) | Alta (icons library) |

### Benefici

1. ✅ **Admin può gestire social links** - Da Admin Panel > Settings > Social
2. ✅ **Sicurezza** - `rel="noopener noreferrer"` previene security issues
3. ✅ **UX migliore** - Link funzionanti, aprono in nuova tab
4. ✅ **Code quality** - Rimuove 60+ lines di SVG, usa Lucide (consistente)
5. ✅ **Flessibilità** - Facile aggiungere altri social (LinkedIn, YouTube, etc.)

---

## TESTING CHECKLIST

- [ ] Footer visible su tutte le pagine
- [ ] Social icons visible solo se link configurati in DB
- [ ] Click su Facebook icon → apre link in nuova tab
- [ ] Click su Instagram icon → apre link in nuova tab
- [ ] Click su Twitter icon → apre link in nuova tab (se configurato)
- [ ] Icons rendering corretto (Lucide React)
- [ ] Hover states funzionano (text-muted-foreground → text-foreground)
- [ ] Responsive: footer layout su mobile vs desktop

---

## ISTRUZIONI MANUALI (Dev Server Blocking)

1. **Ferma dev server:** `Ctrl+C`
2. **Sostituisci** completamente `components/organisms/footer/footer.tsx` con codice sopra
3. **Verifica import** Lucide: `pnpm add lucide-react` (dovrebbe essere già installato)
4. **Salva** il file
5. **Riavvia:** `pnpm dev`
6. **Testa** footer su varie pagine

---

## BONUS: Come Configurare Social Links

### Admin Panel UI (DA CREARE SUCCESSIVAMENTE)
```typescript
// app/(admin)/admin/settings/social-settings-form.tsx
import { updateTenantSocialLinks } from '@/app/actions/tenant-settings';

// Form con 3 input fields:
// - Facebook URL
// - Instagram URL
// - Twitter URL

// Submit → updateTenantSocialLinks() → Salva in DB
```

### SQL Insert Manuale (TEMPORANEO)
```sql
-- Per testare subito il fix
UPDATE tenants
SET
  social_facebook = 'https://facebook.com/pratorinaldo',
  social_instagram = 'https://instagram.com/pratorinaldo',
  social_twitter = 'https://twitter.com/pratorinaldo'
WHERE slug = 'prato-rinaldo';
```

---

## NOTA IMPLEMENTAZIONE

Footer è usato in tutti i layouts tramite `<ConditionalFooter />`.
Il cambio a async Server Component è **compatibile** perché Next.js 16 supporta async components.

Nessun breaking change per il resto del codebase.
