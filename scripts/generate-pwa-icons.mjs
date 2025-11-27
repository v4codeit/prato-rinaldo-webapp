// Script per generare le icone PWA
// Run: node scripts/generate-pwa-icons.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const LOGO_PATH = path.join(projectRoot, 'public/assets/logos/logo-pratorinaldo.png');
const OUTPUT_DIR = path.join(projectRoot, 'public/icons');

// Icon sizes to generate
const STANDARD_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

async function generateIcons() {
  // Dynamic import for sharp (ESM)
  const sharp = (await import('sharp')).default;

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Generating PWA icons from:', LOGO_PATH);
  console.log('Output directory:', OUTPUT_DIR);

  // Generate standard icons
  for (const size of STANDARD_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    await sharp(LOGO_PATH)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent background
      })
      .png()
      .toFile(outputPath);
    console.log(`Created: icon-${size}x${size}.png`);
  }

  // Generate maskable icons (with padding for safe area)
  for (const size of MASKABLE_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-maskable-${size}.png`);
    // Maskable icons need 20% padding (safe zone)
    const innerSize = Math.round(size * 0.6); // 60% of total size = logo

    await sharp(LOGO_PATH)
      .resize(innerSize, innerSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .extend({
        top: Math.round((size - innerSize) / 2),
        bottom: Math.round((size - innerSize) / 2),
        left: Math.round((size - innerSize) / 2),
        right: Math.round((size - innerSize) / 2),
        background: { r: 8, g: 145, b: 178, alpha: 1 }, // #0891b2 theme color
      })
      .png()
      .toFile(outputPath);
    console.log(`Created: icon-maskable-${size}.png`);
  }

  // Generate Apple Touch Icon (180x180)
  const appleTouchPath = path.join(OUTPUT_DIR, 'apple-touch-icon.png');
  await sharp(LOGO_PATH)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(appleTouchPath);
  console.log('Created: apple-touch-icon.png');

  // Generate favicon.ico (copy 32x32 as ico)
  const favicon32Path = path.join(OUTPUT_DIR, 'favicon-32x32.png');
  await sharp(LOGO_PATH)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(favicon32Path);
  console.log('Created: favicon-32x32.png');

  const favicon16Path = path.join(OUTPUT_DIR, 'favicon-16x16.png');
  await sharp(LOGO_PATH)
    .resize(16, 16, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(favicon16Path);
  console.log('Created: favicon-16x16.png');

  console.log('\nDone! All PWA icons generated.');
}

generateIcons().catch(console.error);
