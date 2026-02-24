/**
 * Generate Service Worker with build version
 *
 * This script reads scripts/sw-template.js, injects a unique build version,
 * and writes the output to public/sw.js and public/version.json.
 *
 * Run: node scripts/generate-sw.mjs
 * Automatically runs before `next build` via package.json scripts.
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Generate version info
const timestamp = new Date().toISOString();
const buildId = Date.now().toString(36); // Short unique ID (e.g., "m1abc2d")

let gitHash = 'unknown';
try {
  gitHash = execSync('git rev-parse --short HEAD', { cwd: rootDir })
    .toString()
    .trim();
} catch {
  // Not in a git repo or git not available
}

const BUILD_VERSION = `${buildId}-${gitHash}`;

// Read the template
const templatePath = resolve(__dirname, 'sw-template.js');
const template = readFileSync(templatePath, 'utf-8');

// Replace all placeholders
const output = template.replace(/__BUILD_VERSION__/g, BUILD_VERSION).replace(/__BUILD_TIMESTAMP__/g, timestamp);

// Write public/sw.js
const swPath = resolve(rootDir, 'public', 'sw.js');
writeFileSync(swPath, output, 'utf-8');

// Write public/version.json (for client-side polling)
const versionData = {
  version: BUILD_VERSION,
  buildTimestamp: timestamp,
  gitHash,
};
const versionPath = resolve(rootDir, 'public', 'version.json');
writeFileSync(versionPath, JSON.stringify(versionData, null, 2), 'utf-8');

console.log(`[generate-sw] Build version: ${BUILD_VERSION}`);
console.log(`[generate-sw] Timestamp: ${timestamp}`);
console.log(`[generate-sw] Git hash: ${gitHash}`);
console.log(`[generate-sw] Written: public/sw.js`);
console.log(`[generate-sw] Written: public/version.json`);
