# BOTTOM NAVBAR MOBILE - BEST PRACTICES GUIDE

## SITUAZIONE ATTUALE
- Header sticky top con menu button
- Mobile drawer dal basso (vaul)
- NO bottom navbar

## 1. NUMERO E TIPOLOGIA ICONE (4-5)

Raccomandazione:
1. Home (/)
2. Bacheca (/feed)
3. Eventi (/events)
4. Community Pro (/community-pro)
5. Menu (≡) - apre drawer

Perché 4-5:
- Comfort ergonomico del pollice
- Pattern noto (Instagram, TikTok, Twitter)
- Evita scroll orizzontale
- Spazio sufficiente per icone

## 2. AZIONI DIRETTE vs MENU

BOTTOM NAVBAR (4 link):
- Home, Bacheca, Eventi, Community Pro

DRAWER MENU (aperto da ≡):
MAIN SECTION:
  - Agorà (verified only)
  - Risorse (verified only)
USER SECTION:
  - Profilo & Badge (auth only)
  - Impostazioni (auth only)
ADMIN SECTION (admin only):
  - Dashboard, Utenti, Moderazione, Articoli, Annunci, Impostazioni
AUTH SECTION:
  - Logout (auth) / Login (anonimo)

## 3. LINK MAPPING

Da lib/utils/constants.ts - ROUTES:
- ROUTES.HOME: '/'
- ROUTES.FEED: '/feed'
- ROUTES.EVENTS: '/events'
- ROUTES.COMMUNITY_PRO: '/community-pro'
- ROUTES.AGORA: '/agora' (verified)
- ROUTES.RESOURCES: '/resources' (verified)
- ROUTES.BACHECA: '/bacheca' (auth)
- ROUTES.SETTINGS: '/settings' (auth)
- ROUTES.ADMIN: '/admin' (admin)

## 4. BEST PRACTICES

POSIZIONAMENTO:
- Fixed bottom, z-index: 40
- height: 80px
- Sempre visibile

ICONE:
- Solo icone + label piccolo
- Lucide-react: Home, Newspaper, Calendar, Star, MoreVertical

ACTIVE STATE:
- Colore primario + underline

## 5. INTEGRAZIONE DRAWER

ARCHITETTURA (NO DUPLICAZIONE):

components/organisms/
├── header/
│   ├── header.tsx
│   ├── mobile-header-content.tsx (TRIGGER 1)
│   └── mobile-menu-drawer.tsx (DRAWER SHARED)
└── bottom-navbar/ (NEW)
    ├── bottom-navbar.tsx
    └── bottom-navbar-item.tsx

hooks/ (NEW)
└── use-mobile-navigation.ts (SHARED state)

lib/navigation/ (NEW)
└── mobile-navigation-config.ts (SHARED config)

KEY: UN SOLO DRAWER, DUE TRIGGER

## 6. STRUTTURA FINALE

BOTTOM NAVBAR:
[Home] [Bacheca] [Eventi] [Community] [Menu≡]

DRAWER (dal Menu button):
- Agorà (verified)
- Risorse (verified)
- Profilo & Badge (auth)
- Impostazioni (auth)
- Dashboard Admin (admin)
- Utenti (admin)
- Moderazione (admin)
- Articoli (admin)
- Annunci (admin)
- Impostazioni Admin (admin)
- Logout (auth) / Login (anonimo)

## 7. LAYOUT INTEGRATION

app/(public)/layout.tsx
app/(authenticated)/layout.tsx
app/(private)/layout.tsx
app/(admin)/admin/layout.tsx

Tutte importano:
<BottomNavbar user={user} />

## 8. EVITARE DUPLICAZIONI

✓ UN drawer (mobile-menu-drawer.tsx)
✓ UN config (mobile-navigation-config.ts)
✓ UN hook state (use-mobile-navigation.ts)
✓ DUE trigger → STESSO drawer
✓ No logic duplicata

## 9. Z-INDEX

z-50: Header, Modals
z-40: Bottom navbar
z-30: Drawer overlay
< 30: Content

## 10. RESPONSIVE

< 768px: bottom navbar VISIBLE
>= 768px: bottom navbar HIDDEN

## 11. CHECKLIST IMPLEMENTAZIONE

Phase 1 (30 min):
- [ ] hooks/use-mobile-navigation.ts
- [ ] lib/navigation/mobile-navigation-config.ts

Phase 2 (1-2h):
- [ ] components/organisms/bottom-navbar/bottom-navbar.tsx
- [ ] components/organisms/bottom-navbar/bottom-navbar-item.tsx

Phase 3 (1h):
- [ ] Import in 4 layouts
- [ ] Add pb-20 md:pb-0 to main

Phase 4 (1-2h):
- [ ] Test responsive
- [ ] Test active states
- [ ] Accessibility
- [ ] Dark mode

## CONCLUSIONE

Bottom navbar:
- Best practices (Instagram, TikTok, Twitter)
- Ottimizzata per community (Prato Rinaldo)
- Zero duplicazioni (riusa drawer)
- Responsive + Accessible

Prossimo passo: Implementare Phase 1
