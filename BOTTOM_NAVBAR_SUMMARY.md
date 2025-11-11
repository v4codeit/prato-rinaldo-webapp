# BOTTOM NAVBAR MOBILE - SOMMARIO ESECUTIVO

## Documenti Creati

1. BOTTOM_NAVBAR_GUIDE.md
2. BOTTOM_NAVBAR_CODE_EXAMPLES.md

## ANALISI FORNITA

✓ Struttura tipica bottom navbar (4-5 icone)
✓ Link mapping da ROUTES
✓ Azioni dirette vs menu
✓ Best practices mobile (sempre visibile, z-index 40)
✓ Pattern integrazione drawer (NO duplicazioni)
✓ Architettura componenti
✓ State management (Zustand)
✓ Shared configuration
✓ Layout integration (4 layouts)
✓ Responsive behavior (md breakpoint)
✓ Checklist implementazione (4 phases)
✓ Code examples pronti

## STRUTTURA FINALE

BOTTOM NAVBAR (5 elementi):
[Home] [Bacheca] [Eventi] [Community] [Menu ≡]

DRAWER (aperto da Menu ≡):
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

## COMPONENTI DA CREARE

1. hooks/use-mobile-navigation.ts
   └─ Zustand store per drawer state

2. lib/navigation/mobile-navigation-config.ts
   └─ Navigation config centralizzato

3. components/organisms/bottom-navbar/bottom-navbar.tsx
   └─ Bottom navbar component (5 buttons)

4. components/organisms/bottom-navbar/bottom-navbar-item.tsx
   └─ Singolo item component

## MODIFICHE EXISTING

1. app/(public)/layout.tsx
   └─ Aggiungere <BottomNavbar user={user} />
   └─ Aggiungere pb-20 md:pb-0 a main

2. app/(authenticated)/layout.tsx
   └─ Stessa modifica

3. app/(private)/layout.tsx
   └─ Stessa modifica

4. app/(admin)/admin/layout.tsx
   └─ Stessa modifica

## CHECKLIST IMPLEMENTAZIONE

Phase 1 (30 min): Setup
- [ ] hooks/use-mobile-navigation.ts
- [ ] lib/navigation/mobile-navigation-config.ts

Phase 2 (1-2h): Components
- [ ] bottom-navbar.tsx
- [ ] bottom-navbar-item.tsx

Phase 3 (1h): Integration
- [ ] Import in 4 layouts
- [ ] Add pb-20 md:pb-0

Phase 4 (1-2h): Testing
- [ ] Responsive
- [ ] Active states
- [ ] Accessibility
- [ ] Dark mode

## KEY POINTS

✓ UN drawer (reusato da 2 trigger)
✓ UN config (centralizzato)
✓ UN state (Zustand hook)
✓ NO duplicazioni
✓ Responsive (< 768px visible)
✓ Z-index: 40 (sotto modals z-50)
✓ Sempre visibile (best practice)
✓ Best practices (Instagram, TikTok, Twitter)
