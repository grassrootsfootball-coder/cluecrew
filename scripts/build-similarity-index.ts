/**
 * Builds the Addendum E §3 similarity index from the corpus papers — hashed
 * fingerprints ONLY, written to PRIVATE storage outside the repo. Source
 * text exists in memory transiently and never lands anywhere; ids are
 * inventory citations.
 *
 * Papers pdftotext cannot read (scans) fall back to LOCAL OCR: pdftoppm
 * rasterises each page and macOS Vision recognises the text through
 * scripts/ocr-page.swift. Nothing leaves this machine, no third-party
 * service is involved, and the recognised text is fingerprinted in memory
 * and discarded with the temp images. This closes the OCR gap the first
 * index build recorded as owed.
 *
 * Alongside the index it writes a COVERAGE sidecar — which papers were
 * indexed, which by OCR, which are still missing and why. Filenames are
 * bibliographic facts, not content; the previous build only console-logged
 * its skip list, so the gap was unauditable once the terminal scrolled.
 *
 * Run: pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/build-similarity-index.ts <papersRoot> <outFile>
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename, dirname } from 'node:path';
import { fingerprintItem } from '@cluecrew/core';

const PDFTOTEXT = '/opt/homebrew/bin/pdftotext';
const PDFTOPPM = '/opt/homebrew/bin/pdftoppm';
const OCR_SOURCE = join(import.meta.dirname, 'ocr-page.swift');
/** Below this much extracted text, a PDF is a scan rather than a text layer. */
const TEXT_FLOOR = 400;

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

/** Compile the Vision helper once; per-invocation `swift` compiles are slow. */
function buildOcrBinary(workDir: string): string | null {
  const binary = join(workDir, 'ocr-page');
  try {
    execFileSync('swiftc', ['-O', '-o', binary, OCR_SOURCE], { stdio: 'pipe' });
    return binary;
  } catch (error) {
    console.warn(`  ! OCR unavailable (swiftc failed): ${(error as Error).message.split('\n')[0]}`);
    return null;
  }
}

function ocrPdf(pdf: string, binary: string, workDir: string): string {
  const pageDir = mkdtempSync(join(workDir, 'pages-'));
  try {
    execFileSync(PDFTOPPM, ['-png', '-r', '150', pdf, join(pageDir, 'page')], {
      stdio: 'pipe',
      maxBuffer: 64 * 1024 * 1024,
    });
    const pages = readdirSync(pageDir)
      .filter((entry) => entry.endsWith('.png'))
      .sort()
      .map((entry) => join(pageDir, entry));
    if (pages.length === 0) return '';
    return execFileSync(binary, pages, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return '';
  } finally {
    rmSync(pageDir, { recursive: true, force: true });
  }
}

function main(): void {
  const [papersRoot, outFile] = process.argv.slice(2);
  if (!papersRoot || !outFile) {
    console.error('usage: … <papersRoot> <outFile>');
    process.exit(1);
  }
  const workDir = mkdtempSync(join(tmpdir(), 'cluecrew-index-'));
  const ocrBinary = buildOcrBinary(workDir);

  const pdfs = collectPdfs(papersRoot);
  const fingerprints: Array<{ id: string; ngramHashes: string[]; structuralHash: string }> = [];
  const indexed: Array<{ paper: string; source: 'text' | 'ocr'; fingerprints: number }> = [];
  const missing: Array<{ paper: string; reason: string }> = [];

  try {
    for (const pdf of pdfs) {
      const paper = basename(pdf).replace(/\.pdf$/i, '');
      let text = '';
      let source: 'text' | 'ocr' = 'text';
      try {
        text = execFileSync(PDFTOTEXT, [pdf, '-'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
      } catch {
        text = '';
      }
      if (text.replace(/\s+/g, '').length < TEXT_FLOOR) {
        if (!ocrBinary) {
          missing.push({ paper, reason: 'image-only and OCR unavailable on this machine' });
          continue;
        }
        process.stdout.write(`  … OCR ${paper}\n`);
        text = ocrPdf(pdf, ocrBinary, workDir);
        source = 'ocr';
        if (text.replace(/\s+/g, '').length < TEXT_FLOOR) {
          missing.push({ paper, reason: 'no recoverable text even after OCR' });
          continue;
        }
      }
      const parts = chunks(text);
      parts.forEach((part, index) => {
        const print = fingerprintItem({ stem: part, optionContents: [] });
        fingerprints.push({
          id: `${paper}#${index + 1}`,
          ngramHashes: print.ngramHashes,
          structuralHash: print.structuralHash,
        });
      });
      indexed.push({ paper, source, fingerprints: parts.length });
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }

  writeFileSync(outFile, JSON.stringify({ kind: 'similarity-index', ngramSize: 3, fingerprints }));

  // The coverage record: which papers the gate actually protects against.
  // Hashes and filenames only — no page content, per §2/§5.
  const coveragePath = join(dirname(outFile), 'similarity-index-coverage.json');
  const byOcr = indexed.filter((entry) => entry.source === 'ocr');
  writeFileSync(
    coveragePath,
    JSON.stringify(
      {
        kind: 'similarity-index-coverage',
        builtFrom: papersRoot,
        papersFound: pdfs.length,
        papersIndexed: indexed.length,
        papersIndexedByOcr: byOcr.length,
        papersMissing: missing.length,
        totalFingerprints: fingerprints.length,
        indexed,
        missing,
      },
      null,
      1,
    ),
  );

  console.log(
    `Index built: ${fingerprints.length} fingerprints from ${indexed.length} of ${pdfs.length} papers (${byOcr.length} via OCR) → ${outFile}`,
  );
  console.log(`Coverage record → ${coveragePath}`);
  if (missing.length > 0) {
    console.log(`Still missing (${missing.length}): ${missing.map((entry) => entry.paper).join(' · ')}`);
  }
}

main();
