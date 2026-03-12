#!/usr/bin/env node
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'public', 'kstay-logo.svg');
const pngPath = join(root, 'public', 'kstay-logo.png');

const size = 176; // 44*4 for crisp @2x etc.

const svg = readFileSync(svgPath, 'utf8');
await sharp(Buffer.from(svg))
  .resize(size, size)
  .png()
  .toFile(pngPath);

console.log('Exported:', pngPath);
