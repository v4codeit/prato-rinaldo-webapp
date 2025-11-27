# PWA Icons - Prato Rinaldo

## Icone Richieste

Genera le seguenti icone partendo dal logo `public/assets/logos/logo-pratorinaldo.png`:

### Standard Icons (purpose: "any")
- `icon-72x72.png` - Badge notifiche
- `icon-96x96.png` - Shortcuts
- `icon-128x128.png` - Chrome Web Store
- `icon-144x144.png` - Windows tiles
- `icon-152x152.png` - iOS spotlight
- `icon-192x192.png` - Android install prompt
- `icon-384x384.png` - Splash screen
- `icon-512x512.png` - Android splash

### Maskable Icons (purpose: "maskable")
- `icon-maskable-192.png` - Android adaptive (logo centrato con 20% padding)
- `icon-maskable-512.png` - Android adaptive

### Apple Touch Icon
- `apple-touch-icon.png` - 180x180px per iOS

## Specifiche

### Standard Icons
- Background: trasparente o bianco
- Logo centrato
- Formato: PNG 24-bit

### Maskable Icons
- Background: #0891b2 (theme color) o bianco
- Logo centrato con safe area 20% (padding)
- Il logo deve essere visibile anche se ritagliato in cerchio
- Formato: PNG 24-bit

### Apple Touch Icon
- Background: #0891b2 o bianco
- Dimensione: 180x180px
- Angoli arrotondati automatici da iOS

## Tool Consigliati

1. **PWA Asset Generator**:
   ```bash
   npx pwa-asset-generator ./public/assets/logos/logo-pratorinaldo.png ./public/icons
   ```

2. **RealFaviconGenerator**: https://realfavicongenerator.net

3. **Squoosh** per ottimizzazione: https://squoosh.app

## Verifica

Dopo la creazione, verifica con:
- Chrome DevTools → Application → Manifest
- Lighthouse PWA audit
- https://nicedoc.io/nicedoc/nicedoc.github.io
