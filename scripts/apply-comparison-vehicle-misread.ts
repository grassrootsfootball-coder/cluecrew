/**
 * WRITES REVIEWED CONTENT UNGUARDED — a one-shot ruling-applier (R63).
 *
 * **ANNIE'S REPLACEMENT FOR `en-comparison-vehicle-misread`, TAKEN FROM HER FILE.** Not from a
 * message: the string is parsed out of `annie-fifteenth-return.md` at run time, and the file's
 * sha256 is asserted against the digest Cowork independently computed over the same bytes
 * (`6f7fdd87…`). **Three stores agree on one artefact before a word is written.** Cowork reports the
 * row BOTH-PRESENT-AND-MATCHED — she carried the string she replaced as well as the one she wrote,
 * so the transition is provable against her own file rather than against either store's memory.
 *
 * **THE REFUSAL SHE MADE, RECORDED AS THE REASON.** The stored hint's first sentence is right; the
 * second — *"The meaning belongs to the first thing"* — is **false whenever the comparison is
 * inverted.** In *her voice was like gravel* it works; in *like gravel, her voice scraped at him*
 * it sends the child to gravel, **which is the exact error the entry exists to block.** An
 * entry-level hint asserting a POSITIONAL rule, where the property is which thing is being
 * described.
 *
 * **AND IT IS A REPAIR, NOT A CORRECTION** — `ENG-001-WIW-14` is LIVE behind `case-en-02`, so a
 * paying child can meet the wrong hint today (R281). The second carrier is DRAFT behind a FREE
 * door, so writing this now also closes a wider exposure before it opens.
 *
 * **THE APPROVED-REDRAFT PATH (R257).** The replacement is shorter than the text it supersedes, so
 * the anti-trim guard would refuse it as a machine trim. It is declared as the approver's own
 * redraft, carrying her identity and an authority containing the file digest — the guard checks the
 * shape, not a boolean.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const ID = 'en-comparison-vehicle-misread';
const RETURN_FILE = '/Users/davidb/Downloads/annie-fifteenth-return.md';
const COWORK_DIGEST = '6f7fdd870d04ac803fe98ed9b465c1bf10bb937d19771c4ef6e143197d8b7f67';
const ANNIE = 'reviewer:rev-0001';

async function main() {
  const raw = readFileSync(RETURN_FILE, 'utf8');
  const digest = createHash('sha256').update(raw).digest('hex');
  if (digest !== COWORK_DIGEST) {
    throw new Error(`REFUSED: her return hashes ${digest} here and Cowork computed ${COWORK_DIGEST}. The two stores do not hold the same bytes.`);
  }

  // Parsed from the file, never retyped — a retyped string is a new string with an old string's
  // authority (R222). The bold markers are hers; the line wraps in the source.
  const match = /Authored replacement:\s*\*\*([\s\S]*?)\*\*/.exec(raw);
  if (!match) throw new Error('REFUSED: no "Authored replacement" in her return — the shape changed, report rather than adapt.');
  const replacement = match[1]!.replace(/\s+/g, ' ').trim();

  const row = await prisma.misconception.findUniqueOrThrow({ where: { id: ID } });
  if (row.childHint === replacement) { console.log('already written'); await prisma.$disconnect(); return; }

  const faults = checkChildFacingText({ role: 'hint', label: `misconception:${ID}`, text: replacement }).filter(isBlocking);
  if (faults.length > 0) throw new Error(`REFUSED: her replacement fails the gate — ${faults.map((f) => `${f.rule}: ${f.detail}`).join(' | ')}`);

  const authority = `Annie's fifteenth return §3, read from ${RETURN_FILE.split('/').pop()}, sha256 ${digest}; Cowork reports the row BOTH-PRESENT-AND-MATCHED against the same file`;

  await prisma.misconception.update({
    where: { id: ID },
    data: {
      childHint: replacement,
      approvedBy: ANNIE,
      approvalMethod: 'refused on content and replaced by her authored string, fifteenth return, 2026-08-19',
      textProvenance: {
        ...((row.textProvenance ?? {}) as Record<string, unknown>),
        state: 'RECORDED',
        servingText: replacement,
        approvedByPerson: ANNIE,
        authority,
        supersededText: {
          text: row.childHint,
          whyRefused:
            'The second sentence asserts a POSITIONAL rule and is false whenever the comparison is inverted. In "like gravel, her voice scraped at him" it sends the child to gravel — the exact error this entry exists to block. The property is which thing is being described, not which comes first.',
        },
        reachabilityAtTimeOfWrite: {
          'ENG-001-WIW-14': 'LIVE, case-en-02 (paid) — REACHABLE(paid). A child could meet the refused hint.',
          'ENG-004-AGG-07': 'DRAFT, case-en-04 (FREE) — not reachable yet; becomes free-tier reachable when ENG-004 publishes.',
          soThisIs: 'A REPAIR, not a correction.',
        },
        signatureDefectOnThisRow: {
          priorApprovedBy: 'current-reviewer',
          resolvesTo: 'rev-0001 — AN ACCOUNT, NOT A PERSON (her own forward ruling)',
          note: 'Her defect ruling was sitting on the row she was repairing. The new value names the reviewer row; the account/person question stands open (R271) and is not closed by this write.',
        },
        recordedAt: '2026-08-19',
      },
    },
  });

  const back = await prisma.misconception.findUniqueOrThrow({ where: { id: ID } });
  console.log(`read back : ${back.childHint}`);
  console.log(`matches   : ${back.childHint === replacement}`);
  console.log(`approvedBy: ${row.approvedBy} -> ${back.approvedBy}`);
  console.log(`authority : ${authority}`);
  await prisma.$disconnect();
}

main();
