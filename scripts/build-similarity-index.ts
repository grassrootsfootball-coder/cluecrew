/**
 * Builds the Addendum E §3 similarity index from the corpus papers — hashed
 * fingerprints ONLY, written to PRIVATE storage outside the repo. Source
 * text exists in memory transiently and never lands anywhere; ids are
 * inventory citations. Scanned papers pdftotext cannot read are listed as
 * skipped (OCR pass owed).
 *
 * Run: pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/build-similarity-index.ts <papersRoot> <outFile>
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fingerprintItem } from '@cluecrew/core';

function collectPdfs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'corpus') continue; // outputs folder, not papers
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectPdfs(full));
    else if (/\.pdf$/i.test(entry)) out.push(full);
  }
  return out;
}

/** Split extracted text into question-sized chunks for fingerprinting. */
function chunks(text: string): string[] {
  const byQuestion = text.split(/\n\s*(?=\d{1,2}[.)]\s)/g).filter((part) => part.trim().length > 60);
  if (byQuestion.length >= 5) return byQuestion;
  const out: string[] = [];
  for (let index = 0; index < text.length; index += 350) {
    const window = text.slice(index, index + 500);
    if (window.trim().length > 60) out.push(window);
  }
  return out;
}

function main(): void {
  const [papersRoot, outFile] = process.argv.slice(2);
  if (!papersRoot || !outFile) {
    console.error('usage: … <papersRoot> <outFile>');
    process.exit(1);
  }
  const pdfs = collectPdfs(papersRoot);
  const fingerprints: Array<{ id: string; ngramHashes: string[]; structuralHash: string }> = [];
  const skipped: string[] = [];
  for (const pdf of pdfs) {
    let text = '';
    try {
      text = execFileSync('/opt/homebrew/bin/pdftotext', [pdf, '-'], {
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
      });
    } catch {
      skipped.push(basename(pdf));
      continue;
    }
    if (text.replace(/\s+/g, '').length < 400) {
      skipped.push(`${basename(pdf)} (image-only — OCR owed)`);
      continue;
    }
    const parts = chunks(text);
    parts.forEach((part, index) => {
      const print = fingerprintItem({ stem: part, optionContents: [] });
      fingerprints.push({
        id: `${basename(pdf).replace(/\.pdf$/i, '')}#${index + 1}`,
        ngramHashes: print.ngramHashes,
        structuralHash: print.structuralHash,
      });
    });
  }
  writeFileSync(
    outFile,
    JSON.stringify({ kind: 'similarity-index', ngramSize: 3, fingerprints }),
  );
  console.log(
    `Index built: ${fingerprints.length} fingerprints from ${pdfs.length - skipped.length} of ${pdfs.length} papers → ${outFile}`,
  );
  if (skipped.length > 0) {
    console.log(`Skipped (${skipped.length}): ${skipped.join(' · ')}`);
  }
}

main();
