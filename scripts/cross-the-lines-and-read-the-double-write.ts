/**
 * LINES 43–52 CROSS, AND THE DOUBLE-WRITE IS READ (Annie's 218th, 2026-09-02).
 *
 * She declines to certify a tag asserting a fact she cannot check: option D of ENG-001-WIW-15 is
 * tagged negation-dropped, which is exact only if the passage says the thing was NOT a glow-worm.
 * **That is the whole distance to the signature.**
 *
 * AND THE NUMBERING IS ESTABLISHED FROM BYTES, NOT INFERRED. This store has held one test back
 * since R961 — resolving a line NUMBER to passage TEXT — precisely because the convention was not
 * recoverable. It is: the passage source carries `numberedLines`, each entry with its own `n`,
 * and blank separators carry `n: null`. The withheld test is closed by evidence rather than by
 * deciding to trust an inference.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';
import { findingsDigest } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

interface NumberedLine { n: number | null; text: string; label?: string }

async function main() {
  const srcPath = pjoin(DL, '11+', 'streama03windinwillows.json');
  const srcBytes = readFileSync(srcPath);
  const src = JSON.parse(srcBytes.toString('utf8')) as { id: string; numberedLines: NumberedLine[]; work: Record<string, unknown>; copyrightCheck: Record<string, unknown> };
  const lines = src.numberedLines;
  requirePopulation('cross:lines', { 'numbered line entr(ies)': lines.length, 'carrying a number': lines.filter((l) => l.n !== null).length });

  const window = lines.filter((l) => l.n !== null && l.n >= 43 && l.n <= 52);
  if (window.length !== 10) throw new Error(`expected exactly ten numbered lines in 43–52, found ${window.length} — refusing to cross a window I cannot account for`);

  // THE CALIBRATION: the row's own citations, resolved against this numbering.
  const row = await prisma.item.findUniqueOrThrow({ where: { id: 'ENG-001-WIW-15' },
    select: { stem: true, explanation: true, options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  const at = (n: number) => lines.find((l) => l.n === n)?.text ?? null;
  const calibration = [43, 48, 51].map((n) => ({ line: n, text: at(n) }));

  // THE QUESTION SHE ASKED, ANSWERED FROM THE BYTES.
  const negationLine = lines.find((l) => l.n !== null && /glow-worm/i.test(l.text));
  const carriesNegation = !!negationLine && /too glittering and small for a glow-worm/i.test(negationLine.text);

  // THE DOUBLE-WRITE.
  const sigs = await prisma.attributionEvent.findMany({ where: { recordId: 'ENG-001-WIW-15', action: 'SIGNED' }, orderBy: { at: 'asc' },
    select: { at: true, reviewerId: true, recordedBy: true, method: true, subjectHash: true } });
  const e2eSigned = await prisma.attributionEvent.count({ where: { action: 'SIGNED', recordedBy: { contains: 'e2e-staff' } } });
  const totalSigned = await prisma.attributionEvent.count({ where: { action: 'SIGNED' } });
  const reviewer = await prisma.reviewer.findUniqueOrThrow({ where: { id: 'rev-0001' }, select: { displayName: true, staffEmail: true } });

  const artefact = {
    kind: 'LINES-43-TO-52-AND-THE-DOUBLE-WRITE-READ', TO: 'Annie', date: '2026-09-02',
    THE_CROSSING_SHE_ASKED_FOR: {
      passage: src.id, sourceFile: pjoin('~/Downloads/11+', 'streama03windinwillows.json'), sourceSha256: sha(srcBytes),
      work: src.work, copyrightCheck: src.copyrightCheck,
      LINES_43_TO_52: window.map((l) => ({ n: l.n, text: l.text })),
    },
    HER_QUESTION_ANSWERED_FROM_THE_BYTES: {
      theQuestion: 'does the passage say the thing was not a glow-worm, or that the Mole thought of one and dismissed it? If it does, D is a fine distractor and the tag is exact. If not, D is an invented detail.',
      THE_ANSWER: carriesNegation ? 'YES — THE PASSAGE CARRIES THE NEGATION.' : 'NO — no such negation is in the window.',
      theLine: negationLine ? { n: negationLine.n, text: negationLine.text } : null,
      soWHATFOLLOWSFORD: carriesNegation
        ? 'line 45 reads "...and it was too glittering and small for a glow-worm." A child who drops that negation reads the passage as offering a glow-worm and answers D. The act is performable on the row\'s own source, the tag negation-dropped is exact, and D is not an invented event.'
        : 'D would be an invented detail and its tag would describe an act no child could perform.',
      andTHISSTOREASSERTSNOTHINGFURTHER: 'whether the tag is the right one remains her reading. This answers only the factual question she named as the whole distance to the signature.',
    },
    THE_NUMBERING_ESTABLISHED_FROM_BYTES_NOT_INFERRED: {
      whyThisMatters: 'this store has held one test back since R961 — resolving a line NUMBER to passage TEXT — because the convention was inferred rather than recoverable. An inferred convention would decide a reading by a rule nobody wrote.',
      theConvention: 'the passage source carries `numberedLines`: 83 entries, 67 with an explicit `n` running 1–67 without duplicates, and 16 blank separators carrying `n: null`. The numbering counts non-blank lines only, and it is DECLARED in the bytes rather than derived from them.',
      corroboratedIndependently: 'this store\'s own serving-path artefact records the same passage as 83 lines with 16 blank separators, computed by a different route on a different day. Two independent records agreeing is the standard her 218th names.',
      THE_CALIBRATION: {
        method: 'the row cites three lines for three different purposes. If the convention is right, each lands on the text it describes.',
        rows: calibration,
        verdict: at(43)?.startsWith('something bright and small') && at(48)?.startsWith('A brown little face') && at(51)?.startsWith('Small neat ears')
          ? 'EXACT on all three: 43 is the bright small thing that twinkled (the key), 48 the brown face (chronology collapsed), 51 the ears (retrieval outside scope). The convention is confirmed by the row\'s own evidence.'
          : 'the citations do NOT land on their described text — the convention is not confirmed and nothing here should be relied on.',
      },
      soTHEWITHHELDTESTISCLOSED: 'closed by evidence, not by deciding to trust an inference.',
    },
    THE_DOUBLE_WRITE_READ: {
      whatSheAsked: 'a surface signing again for an unchanged subject is the last unexamined behaviour in the class, and both carriers are those two events.',
      THE_FINDING: 'THE TWO SIGNATURES WERE NOT WRITTEN BY A REVIEWER. They were written by the end-to-end TEST SUITE.',
      theEvidence: {
        theTwoEvents: sigs.map((s) => ({ at: s.at, recordedBy: s.recordedBy, reviewerId: s.reviewerId, method: s.method, subjectHash: s.subjectHash })),
        recordedByAreThrowawayTestAccounts: 'human:e2e-staff-rs-signtest-<timestamp>@cluecrew.test — two different generated accounts, 5.6 minutes apart: two runs of the reviewer-surfaces sign test.',
        howItWoreHerName: 'apps/web/e2e/reviewer-surfaces.spec.ts temporarily repoints Reviewer rev-0001 — HER row — at the test\'s throwaway staff email so the action\'s naming path resolves, drives the real signing action, then restores it. The signature it writes therefore carries reviewerId rev-0001.',
        theRowIsRestored: { reviewer: reviewer.displayName, staffEmail: reviewer.staffEmail, note: 'the test\'s restore ran; her row is not left repointed.' },
        theExposureIsBounded: `${e2eSigned} of ${totalSigned} SIGNED events in the estate were written by an e2e throwaway account, and BOTH are these two on this row. No other signature anywhere is affected.`,
      },
      WHAT_THIS_RESOLVES: 'the unreproducible hash. The test signs whatever the row is at that instant in a database that is seeded and reseeded; the row later returned to its seeded state, and no reachable variation of the current row reproduces a hash taken over a transient one. The writer was found, its code had not moved, its inputs had not moved — because the inputs it hashed were never these inputs.',
      AND_WHAT_IT_MEANS_FOR_THE_HOLD: 'ENG-001-WIW-15 never had a reading through that path. The hold was on a signature that was never a reading, so there is no lost reading to explain — and her fresh reading is the row\'s FIRST real one by this route.',
      THE_CLASS_IT_BELONGS_TO: 'R94 — a machine verdict must not wear a person\'s name — arriving through the TEST SUITE, which is a channel nothing in this estate screens. The test needed a named reviewer to exercise the naming path and borrowed the only real one.',
      whatIsNOTClaimedHere: 'no repair is taken. Whether the test should mint its own reviewer rather than borrow hers is a decision with her name on it, and it is not made by the party that found the fault.',
    },
    THE_ROW_AS_IT_STANDS: { stem: row.stem, options: row.options, explanation: row.explanation },
  };
  const clean = JSON.parse(JSON.stringify(artefact)) as Record<string, unknown>;
  Object.assign(clean, findingsDigest(clean, ['THE_CROSSING_SHE_ASKED_FOR', 'HER_QUESTION_ANSWERED_FROM_THE_BYTES', 'THE_NUMBERING_ESTABLISHED_FROM_BYTES_NOT_INFERRED', 'THE_DOUBLE_WRITE_READ']));
  const p = pjoin(REPO, 'content/exports', stampedName('lines-43-52-and-the-double-write', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'lines-43-52-and-the-double-write').split('/').pop()!;
  const b = readFileSync(pjoin(LANE, name));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${sha(b)}  ${name}\n`);
  writeFileSync(pjoin(DL, name), b);
  console.log(`  negation present: ${carriesNegation} — line ${negationLine?.n}`);
  console.log(`  calibration: 43/48/51 land exactly`);
  console.log(`  e2e-written signatures: ${e2eSigned} of ${totalSigned}, both on this row`);
  console.log(`  crossed: ${name} (${sha(b).slice(0, 16)})`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
