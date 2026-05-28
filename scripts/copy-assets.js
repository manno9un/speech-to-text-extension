/**
 * Post-build asset copier.
 * Vite bundles JS/CSS but does not know about our manifest or icons, and it
 * nests popup.html/options.html under dist/src/... by default. This script:
 *   1. Copies src/manifest.json -> dist/manifest.json
 *   2. Copies public/icons -> dist/icons
 *   3. Moves the generated HTML files to the dist root so the manifest paths
 *      (popup.html, options.html) resolve correctly.
 *
 * Run automatically as part of `npm run build`.
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync, renameSync, rmSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = join(root, 'dist');

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// 1. Copy manifest.json
function copyManifest() {
  const src = join(root, 'src', 'manifest.json');
  const dest = join(dist, 'manifest.json');
  if (!existsSync(src)) {
    console.error('ERROR: src/manifest.json not found.');
    process.exit(1);
  }
  copyFileSync(src, dest);
  console.log('Copied manifest.json');
}

// 2. Copy icons
function copyIcons() {
  const src = join(root, 'public', 'icons');
  const dest = join(dist, 'icons');
  if (!existsSync(src)) {
    console.warn('WARNING: public/icons not found; skipping icon copy.');
    return;
  }
  ensureDir(dest);
  for (const file of readdirSync(src)) {
    copyFileSync(join(src, file), join(dest, file));
  }
  console.log('Copied icons');
}

// 3. Flatten HTML files from dist/src/popup/popup.html -> dist/popup.html
//    (background no longer has an HTML entry; it builds as a standalone worker.)
function flattenHtml() {
  const candidates = [
    ['src/popup/popup.html', 'popup.html'],
    ['src/options/options.html', 'options.html'],
  ];

  for (const [from, to] of candidates) {
    const fromPath = join(dist, from);
    const toPath = join(dist, to);
    if (existsSync(fromPath)) {
      renameSync(fromPath, toPath);
      console.log(`Moved ${from} -> ${to}`);
    }
  }

  // Remove the now-empty dist/src directory if present.
  const distSrc = join(dist, 'src');
  if (existsSync(distSrc)) {
    rmSync(distSrc, { recursive: true, force: true });
    console.log('Cleaned up dist/src');
  }
}

console.log('Running post-build asset copy...');
ensureDir(dist);
copyManifest();
copyIcons();
flattenHtml();
console.log('Post-build complete.');
