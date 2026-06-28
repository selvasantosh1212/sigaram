// Renders every page of every question-bank PDF to a PNG image.
// Must run on Node >=22 (process.getBuiltinModule dependency in pdfjs-dist's Node canvas factory).
// Usage: <node22> scripts/ocr/render-pages.mjs
import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
import { writeFileSync, promises as fsp } from 'fs';
import path from 'path';

globalThis.DOMMatrix = DOMMatrix;
globalThis.ImageData = ImageData;
globalThis.Path2D = Path2D;

const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

const QUESTION_BANK_DIR = path.resolve(import.meta.dirname, '../../../question bank');
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../../tools/page-images');
const SCALE = 2.0;

async function renderFile(filename) {
  const filePath = path.join(QUESTION_BANK_DIR, filename);
  const data = new Uint8Array(await fsp.readFile(filePath));
  const doc = await pdfjsLib.getDocument({ data, disableFontFace: true }).promise;

  const baseName = filename.replace(/\.pdf$/i, '');
  const outDir = path.join(OUTPUT_DIR, baseName);
  await fsp.mkdir(outDir, { recursive: true });

  console.log(`${filename}: ${doc.numPages} pages`);

  for (let i = 1; i <= doc.numPages; i++) {
    const outPath = path.join(outDir, `page-${String(i).padStart(3, '0')}.png`);
    try {
      await fsp.access(outPath);
      continue; // already rendered, skip (idempotent reruns)
    } catch {
      // doesn't exist yet, render it
    }
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: SCALE });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    writeFileSync(outPath, canvas.toBuffer('image/png'));
    page.cleanup();
  }
  await doc.destroy();
  console.log(`  -> rendered to ${outDir}`);
}

const files = (await fsp.readdir(QUESTION_BANK_DIR)).filter((f) => f.toLowerCase().endsWith('.pdf'));
for (const f of files) {
  await renderFile(f);
}
console.log('Done.');
