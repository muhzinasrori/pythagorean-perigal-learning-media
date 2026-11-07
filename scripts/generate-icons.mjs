/**
 * One-shot generator for the app icon set, rendered from src/app/icon.svg.
 *
 *   bun scripts/generate-icons.mjs
 *
 * Outputs:
 *   public/icons/icon-192.png   (PWA manifest)
 *   public/icons/icon-512.png   (PWA manifest)
 *   src/app/apple-icon.png      (apple-touch-icon, 180×180)
 *   src/app/favicon.ico         (32×32 legacy favicon, replaces the old one)
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'src/app/icon.svg'));

mkdirSync(join(root, 'public/icons'), { recursive: true });

for (const size of [192, 512]) {
  await sharp(svg, { density: 512 })
    .resize(size, size)
    .png()
    .toFile(join(root, `public/icons/icon-${size}.png`));
  console.log(`✓ public/icons/icon-${size}.png`);
}

await sharp(svg, { density: 512 })
  .resize(180, 180)
  .png()
  .toFile(join(root, 'src/app/apple-icon.png'));
console.log('✓ src/app/apple-icon.png');

await sharp(svg, { density: 512 }).resize(32, 32).png().toFile('/tmp/icon-32.png');
console.log('✓ /tmp/icon-32.png (converted to .ico separately)');
