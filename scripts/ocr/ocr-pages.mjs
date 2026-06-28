// OCRs every rendered page PNG into a plain-text keyword index (not a source of truth —
// just a fast way to find candidate pages; real content is always verified by viewing
// the page image directly). Safe to run on the default project Node version.
// Usage: node scripts/ocr/ocr-pages.mjs
import { createWorker } from 'tesseract.js';
import { promises as fsp } from 'fs';
import path from 'path';

const IMAGES_DIR = path.resolve(import.meta.dirname, '../../tools/page-images');
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../../tools/ocr-output');

async function main() {
  const worker = await createWorker('eng');
  const folders = await fsp.readdir(IMAGES_DIR);

  for (const folder of folders) {
    const inDir = path.join(IMAGES_DIR, folder);
    const stat = await fsp.stat(inDir);
    if (!stat.isDirectory()) continue;

    const outDir = path.join(OUTPUT_DIR, folder);
    await fsp.mkdir(outDir, { recursive: true });

    const pages = (await fsp.readdir(inDir)).filter((f) => f.endsWith('.png')).sort();
    console.log(`${folder}: ${pages.length} pages`);

    for (const pageFile of pages) {
      const outPath = path.join(outDir, pageFile.replace(/\.png$/, '.txt'));
      try {
        await fsp.access(outPath);
        continue; // already OCR'd
      } catch {}
      const { data } = await worker.recognize(path.join(inDir, pageFile));
      await fsp.writeFile(outPath, data.text);
    }
    console.log(`  -> OCR'd to ${outDir}`);
  }

  await worker.terminate();
  console.log('Done.');
}

main();
