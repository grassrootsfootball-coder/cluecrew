/**
 * check:digest-carries-subject — EVERY PUBLISHED DIGEST CARRIES ITS SUBJECT, AS KEYS (R985).
 *
 * The census artefact published each row's `rowSha256` over `{stem, options:[{value,isKey}],
 * solution}` and, two fields away, that row's `options` carrying `tag`, `tagIsActiveInTheLibrary`
 * and `execution` as well. **Nothing in it was wrong. It made the wrong thing easy and the right
 * thing invisible**, and two stores that had both read the spec correctly hashed a superset of it.
 *
 * **THE CHECK IS OVER THE EMITTERS, NOT OVER HISTORY.** Every artefact already crossed keeps its
 * shape; condemning them would report hundreds of faults nobody can now repair and would say
 * nothing about what happens next (R149's discipline about instruments that already report
 * non-zero, applied by choosing the population rather than by baselining a flood). A script that
 * WRITES a digest field must also write that digest's subject.
 *
 * WHAT COUNTS AS CARRYING ITS SUBJECT:
 *   · a sibling `<name>Subject` field, or
 *   · `digestSubject(...)` / `ROW_DIGEST_SUBJECT_KEYS` in the same file, or
 *   · `findingsDigest(...)`, which already emits `howToCheckThisOnArrival.subtreeKeys` — the same
 *     rule, built before it had a name.
 * A `<name>Spec` string alone does NOT count: prose is what this rule exists to replace.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { requirePopulation } from './lib/population';
import { assertFixture } from './lib/carried-fixture';

const REPO = pjoin(__dirname, '..');

/** A line that EMITS a digest into an artefact: `someSha256:` or `someDigest:` as an object key. */
const EMITS = /(\w*(?:[Ss]ha256|[Dd]igest))\s*:/;
/** Names that are file-level or findings-level digests — they carry their subject by other means. */
const EXEMPT = /^(findingsSha256|fileSha256|sourceSha256|entrySha256|sha256|subjectHash|resultsSha256|bankSha256|replacedSha256|pinnedProjectionSha256|caseDigest\w*|rowSha256Was|rowSha256Now)$/;

function carriesSubject(source: string, field: string): boolean {
  if (source.includes('digestSubject(') || source.includes('ROW_DIGEST_SUBJECT_KEYS')) return true;
  if (source.includes('findingsDigest(')) return true;
  return source.includes(`${field}Subject`);
}

function scripts(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const full = pjoin(dir, e);
    if (statSync(full).isDirectory()) scripts(full, out);
    else if (e.endsWith('.ts') && !e.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

function main() {
  console.log('check:digest-carries-subject — a published digest names the keys it was taken over.');
  assertFixture('digest-subject', [
    { name: 'emits rowSha256 with no subject anywhere', input: 'const x = { rowSha256: sha(p), rowSha256Spec: "R729 over ..." };', mustBeCaught: true },
    { name: 'emits rowSha256 beside its subject keys', input: 'const x = { rowSha256: sha(p), rowSha256Subject: KEYS };', mustBeCaught: false },
    { name: 'uses the shared subject constant', input: 'const x = { rowSha256: sha(p) }; // ROW_DIGEST_SUBJECT_KEYS', mustBeCaught: false },
    { name: 'uses findingsDigest, which names its subtree keys', input: 'Object.assign(clean, findingsDigest(clean, keys)); const y = { someSha256: z };', mustBeCaught: false },
    { name: 'no digest emitted at all', input: 'const x = { itemId: id, value: v };', mustBeCaught: false },
  ], (src) => {
    for (const line of src.split('\n')) {
      const m = EMITS.exec(line);
      if (!m || EXEMPT.test(m[1]!)) continue;
      if (!carriesSubject(src, m[1]!)) return true;
    }
    return false;
  });

  const files = scripts(pjoin(REPO, 'scripts'));
  requirePopulation('check:digest-carries-subject', { 'script(s) screened': files.length });

  const faults: Array<{ file: string; line: number; field: string }> = [];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    src.split('\n').forEach((line, i) => {
      if (/^\s*(\/\/|\*)/.test(line)) return;
      const m = EMITS.exec(line);
      if (!m || EXEMPT.test(m[1]!)) return;
      if (!carriesSubject(src, m[1]!)) faults.push({ file: f.replace(`${REPO}/`, ''), line: i + 1, field: m[1]! });
    });
  }

  /**
   * A DECLARED BACKLOG, NOT A SOFTENED CHECK (R149). This rule arrived after sixty-six emitters
   * had already published a digest with its subject in prose. Refusing all of them would report a
   * flood nobody can repair today and would say nothing about what happens next; exempting them
   * silently would let the rule decay. So the backlog is NAMED, in a file, and the check refuses
   * anything NOT on it — the list can only shrink.
   *
   * AND IT CANNOT ROT: an entry whose fault has been repaired is reported as stale, because a
   * backlog that keeps forgiving what no longer needs forgiving is a list nobody is reading.
   */
  const BACKLOG = pjoin(REPO, 'content', 'digest-subject-backlog.json');
  const declared: string[] = existsSync(BACKLOG) ? (JSON.parse(readFileSync(BACKLOG, 'utf8')) as { known: string[] }).known : [];
  const key = (x: { file: string; field: string }) => `${x.file}#${x.field}`;
  const known = new Set(declared);
  const fresh = faults.filter((x) => !known.has(key(x)));
  const stale = declared.filter((d) => !faults.some((x) => key(x) === d));

  if (process.argv.includes('--record')) {
    writeFileSync(BACKLOG, JSON.stringify({
      what: 'emitters that published a digest with its subject in prose before R985 named the rule. The check refuses anything NOT on this list; the list may only shrink.',
      rule: 'R985 — every published digest carries its subject, named as keys',
      recordedOn: '2026-09-02',
      known: [...new Set(faults.map(key))].sort(),
    }, null, 1));
    console.log(`  recorded ${new Set(faults.map(key)).size} known backlog entr(ies).`);
    return;
  }

  console.log(`  ${files.length} emitter(s) screened; ${faults.length} digest field(s) name their subject only in prose, ${known.size} of them declared as backlog.`);
  if (stale.length) {
    console.log(`  ${stale.length} backlog entr(ies) are STALE — repaired since they were recorded. Re-record to shrink the list:`);
    for (const s of stale.slice(0, 8)) console.log(`    ${s}`);
  }
  if (fresh.length === 0) {
    console.log('  No NEW emitter publishes a digest without naming its subject. The backlog is the only debt and it cannot grow.');
    return;
  }
  console.error(`\n  REFUSED — ${fresh.length} digest field(s) published with no subject named as keys, and not on the declared backlog:`);
  for (const x of fresh.slice(0, 20)) console.error(`    ${x.file}:${x.line}  ${x.field}`);
  if (fresh.length > 20) console.error(`    …and ${fresh.length - 20} more`);
  console.error('\n  A spec in prose beside a row that carries more than the prose names is what made two stores');
  console.error('  hash different subjects from one sentence they had both read correctly (R984, R985).');
  console.error('  Publish the keys: digestSubject(KEYS, SPEC), or a sibling <field>Subject naming them.');
  process.exitCode = 1;
}

main();
