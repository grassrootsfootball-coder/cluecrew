/**
 * DOES A RETURN REASON FROM A STRING THAT WAS NEVER IN THE STORE? (David, 2026-08-21 — R407.)
 *
 * The twenty-fourth is the confirmed case: she reasoned about what a child meets on seven carriers
 * from **her own authored wording, which had never been written.** Nine unapplied wordings across six
 * returns is nine chances for that to have recurred, **and only this store can see which — she has no
 * way to check whether the premise under her own conclusion was ever true.**
 *
 * THE TEST, and it is the only one the evidence supports: a return QUOTES a string as being in force
 * (*"the hint reads"*, *"currently serves"*, *"its hint:"*). If that string is an AUTHORED wording
 * from an earlier return, and that wording had not landed by this return's date, **the premise was
 * false when written.**
 *
 * **WHAT SURVIVES AND WHAT DOES NOT** — her own distinction, and the reason a bare list is not the
 * answer: a conclusion resting on THE ERROR survives a false premise, because the error is a fact
 * about the item. A conclusion resting on THE WORDING may not. **This reports the premise; the
 * conclusion is hers to re-read.**
 *
 * BOUNDS (R60): it reads quotation shapes her returns use, and it can only test strings that appear
 * in the authored set. **A premise quoted from the store correctly, or paraphrased, is invisible
 * here.** The count is a floor.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { requirePopulation } from './lib/population';

const RETURNS = '/Users/davidb/Downloads';
/**
 * **BOTH SHAPES.** The first version read only the labelled form and tracked 17 of 33 wordings — so
 * the sweep's INPUT was under half the population while its LOGIC was sound. Those decay
 * differently: a wrong-logic check is wrong forever, a wrong-input check is right about a smaller
 * world and its answer moves when the input is corrected. This is a re-run of the second kind.
 */
const AUTHORED_SHAPES = [
  /^\s*[-*]?\s*(?:authored|Authored|replacement)\s*:\s*\*\*(.+?)\*\*/gm,
  /replacing\s+\*[^*]+\*\s*:\s*\*\*(.+?)\*\*/gms,
];
/** Shapes in which a return quotes a string as CURRENTLY IN FORCE. */
const QUOTED_AS_LIVE = [
  /(?:hint|it|which)\s+(?:I amended\s+)?reads:\s*\*\*(.+?)\*\*/gi,
  /currently serves:?\s*\*?(.+?)\*?\s*(?:\.|$)/gim,
  /its hint:\s*\*(.+?)\*/gi,
  /a child sees(?: today)?(?: is)?:?\s*\*\*(.+?)\*\*/gi,
];

function main() {
  const files = readdirSync(RETURNS).filter((f) => /^annie-.*return.*\.md$/.test(f))
    .map((f) => ({ f, when: statSync(join(RETURNS, f)).mtime }))
    .sort((a, b) => a.when.getTime() - b.when.getTime());

  // Every authored wording, with the return that authored it and when.
  const authored: Array<{ text: string; file: string; when: Date }> = [];
  for (const { f, when } of files) {
    const body = readFileSync(join(RETURNS, f), 'utf8');
    for (const re of AUTHORED_SHAPES) {
      re.lastIndex = 0;
      for (const m of body.matchAll(re)) {
        authored.push({ text: m[1]!.replace(/\s*\n\s*/g, ' ').trim().replace(/\.$/, ''), file: f, when });
      }
    }
  }

  requirePopulation('check:reasoning-premises', {
    'return file(s)': files.length,
    'authored wording(s)': authored.length,
  });

  const findings: string[] = [];
  for (const { f, when } of files) {
    const body = readFileSync(join(RETURNS, f), 'utf8').replace(/\s*\n\s*/g, ' ');
    const quoted = new Set<string>();
    for (const re of QUOTED_AS_LIVE) {
      re.lastIndex = 0;
      for (const m of body.matchAll(re)) {
        const t = m[1]!.trim().replace(/\.$/, '');
        if (t.length > 25 && t.length < 200) quoted.add(t);
      }
    }
    for (const q of quoted) {
      // Was this string AUTHORED in an earlier return? If so it was a proposal, not the store's value.
      const src = authored.find((a) => a.text === q && a.when < when);
      if (src) {
        findings.push(
          `  ${f}\n      quotes as IN FORCE: "${q}"\n` +
          `      but that wording was AUTHORED in ${src.file} and had not landed.\n` +
          '      PREMISE FALSE when written. Conclusions resting on the ERROR survive; on the WORDING, re-read.',
        );
      }
    }
  }

  console.log(`\nreturns swept: ${files.length} · authored wordings tracked: ${authored.length}`);
  if (findings.length === 0) {
    console.log(
      '\n  NO FURTHER INSTANCE FOUND by this test.\n' +
        '  That is NOT "no further instance exists": the test only sees a return quoting a string it\n' +
        '  can match to the authored set, in the quotation shapes her returns use. A premise quoted\n' +
        '  correctly, paraphrased, or reasoned from without quoting is invisible here.',
    );
    return;
  }
  console.log(`\nREASONING FROM A STRING THAT WAS NOT IN THE STORE: ${findings.length}\n`);
  findings.forEach((f) => console.log(f + '\n'));
}

main();
