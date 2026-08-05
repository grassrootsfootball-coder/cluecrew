/**
 * THE PRINTED REVIEWER PACK — shared format.
 *
 * Extracted when the VR pack was written, because two packs that look
 * different are two packs a reviewer has to learn. The rules below were
 * decided for the English pack and hold for every district:
 *
 *   · serif at 11pt — print resolution carries it, a screen does not;
 *   · black on white — `cream` is a SCREEN rule (D1/D4) about backlit glare,
 *     and paper has none. Printing cream wastes toner and reads worse;
 *   · every block kept whole across a page break, because a question split
 *     over two pages gets annotated twice or not at all;
 *   · ruled space sized in mm to be written in with a pen, not decoration.
 */
import { join } from 'node:path';

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Ruled lines to write on. Sized in mm so it is the same on every printer. */
export function writingSpace(lines: number, label = ''): string {
  return `<div class="write">${label ? `<span class="write-label">${esc(label)}</span>` : ''}${
    '<div class="rule"></div>'.repeat(lines)
  }</div>`;
}

export const DECISION_BOXES = `<div class="boxes">
  <span class="box">☐ approve</span>
  <span class="box">☐ reject</span>
  <span class="box">☐ amend (write below)</span>
</div>`;

export const PRINT_CSS = `  /* PRINT FIRST. Cream is a screen rule (backlit glare); paper has none, so
     this is ink on white, which is also what a printer will actually do. */
  @page { size: A4; margin: 18mm 16mm 20mm 16mm; }
  html { font-size: 11pt; }
  body { font-family: Georgia, "Times New Roman", serif; color: #000; background: #fff;
         line-height: 1.45; margin: 0; }
  h1 { font-size: 20pt; margin: 0 0 2mm; }
  h2 { font-size: 15pt; border-bottom: 1.5pt solid #000; padding-bottom: 2mm;
       margin: 0 0 5mm; page-break-after: avoid; }
  .cover { page-break-after: always; }
  .cover dl { margin-top: 8mm; }
  .cover dt { font-weight: bold; margin-top: 3mm; }
  section { page-break-before: always; }
  /* A block split across a page gets annotated twice or not at all. */
  .block { page-break-inside: avoid; border: 0.6pt solid #000; border-radius: 2mm;
           padding: 4mm 4mm 2mm; margin: 0 0 5mm; }
  .block-head { display: flex; gap: 3mm; align-items: baseline; flex-wrap: wrap;
                border-bottom: 0.4pt dotted #666; padding-bottom: 1.5mm; margin-bottom: 2.5mm; }
  .num { font-weight: bold; }
  code { font-family: "SF Mono", Menlo, monospace; font-size: 9pt; }
  .tag { font-family: Helvetica, Arial, sans-serif; font-size: 8pt; text-transform: uppercase;
         letter-spacing: 0.4pt; border: 0.4pt solid #000; padding: 0.3mm 1.2mm; border-radius: 1mm; }
  .desc { font-size: 12pt; margin: 0 0 2mm; }
  .hint, .types, .passage { margin: 0 0 1.5mm; }
  .stem { font-size: 12pt; margin: 2mm 0 3mm; }
  .options { list-style: none; padding: 0; margin: 0 0 3mm; }
  .options li { display: flex; gap: 2mm; align-items: baseline; padding: 1mm 0;
                border-bottom: 0.3pt dotted #bbb; }
  .options li.correct { font-weight: bold; }
  .mark { width: 5mm; }
  .opt { min-width: 40mm; }
  .mis { font-size: 9pt; color: #333; }
  .walk { border-left: 2pt solid #000; padding-left: 3mm; margin: 0 0 3mm; }
  .flagged { border-width: 2pt; }
  .flag { font-family: Helvetica, Arial, sans-serif; font-weight: bold; font-size: 9pt;
          border: 1.2pt solid #000; padding: 0.6mm 2mm; }
  .boxes { display: flex; gap: 6mm; font-family: Helvetica, Arial, sans-serif;
           font-size: 10pt; margin: 2mm 0 1mm; }
  .box { white-space: nowrap; }
  /* Ruled space sized to be written in with a pen, not decorative. */
  .write { margin: 1mm 0 2mm; }
  .write-label { font-family: Helvetica, Arial, sans-serif; font-size: 8pt;
                 text-transform: uppercase; letter-spacing: 0.4pt; color: #555; }
  .rule { border-bottom: 0.4pt solid #999; height: 8mm; }
  .empty { border: 0.6pt dashed #000; padding: 5mm; }
  .muted { color: #555; font-size: 10pt; }
  .decision { page-break-inside: avoid; margin-bottom: 7mm; }
  @media screen { body { max-width: 190mm; margin: 0 auto; padding: 10mm; } }`;

/**
 * A real PDF when Chromium is present; the HTML prints identically if not.
 * Playwright is a devDependency of apps/web, so it is resolved from there
 * rather than from wherever the calling script happens to run.
 */
export async function renderPdf(html: string, outDir: string, base: string, root: string): Promise<string | null> {
  try {
    const { createRequire } = await import('node:module');
    const requireFromWeb = createRequire(join(root, 'apps/web/package.json'));
    const { chromium } = requireFromWeb('playwright') as typeof import('@playwright/test');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfPath = join(outDir, `${base}.pdf`);
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    await browser.close();
    return pdfPath;
  } catch (error) {
    console.log(`  (no PDF: ${(error as Error).message.split('\n')[0]} — print the HTML instead)`);
    return null;
  }
}
