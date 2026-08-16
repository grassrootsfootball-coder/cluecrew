/**
 * WRITES REVIEWED CONTENT UNGUARDED. A HUMAN RULING SUPPLIED EVERY VALUE HERE (R63).
 *
 * Applies Annie's approval-batch return of 2026-08-16: all nine entries approved, two with hints she
 * rewrote. She signs entries 7 and 8 **subject to the rewritten hints being READ FROM HER FILE
 * rather than retyped**, which is the ENG-028 discipline and the reason `en-vocab-dominant-sense`
 * survived the drift that caught everything else.
 *
 * SO THE HINTS ARE EXTRACTED BY DOCUMENT STRUCTURE AND NEVER APPEAR AS A LITERAL IN THIS FILE.
 * A retyped string that happens to be correct is indistinguishable from one that is not, and the
 * whole of R108 is that nobody can tell the difference afterwards.
 *
 * TWO DEPARTURES FROM THE INSTRUCTION AS GIVEN, both flagged rather than made quietly:
 *
 * 1. THE ARTEFACT FOR THE SIX APPROVALS IS THIS RETURN, NOT THE ENG-028 RETURN. The instruction
 *    said to record `annie-eng028-return.md` as the artefact. That document is about
 *    `en-vocab-dominant-sense` and does not mention these six entries — pointing a provenance record
 *    at a document that does not contain the claim is precisely the fault of the last two days, one
 *    more time. `annie-approval-batch-return.md` DOES contain it, in her words, in section 1: "I
 *    read them, tested the boundary clauses, and approved the hints." That is the artefact, and its
 *    sha256 is recorded with it.
 *
 * 2. ENTRIES 7 AND 8 BECOME PERSON/ANNIE, NOT AGENT. The ruling set AGENT authorship for entries
 *    1-6 and said nothing about 7 and 8, but she REWROTE both hints in her own file, so those two
 *    sentences are hers by exactly the test that makes `en-vocab-dominant-sense` hers. Recording
 *    them as the drafting side's would re-introduce the error being corrected, in the same run.
 *    Her section 1 says dominant-sense is "the only hint in the English library that is" hers; her
 *    own section 3 makes that three. Sequence, not contradiction.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Prisma, prisma } from '../packages/db/src/index';

const RETURN_FILE = '/Users/davidb/Downloads/annie-approval-batch-return.md';
const RULED_ON = '2026-08-16';
const REVIEWER_ID = 'rev-0001';
const DRAFTING_SIDE = 'ai-draft:cowork-okafor-v1';

/** Entries 1-6: drafted by the authoring side, approved by her. Her words: "Known, and not mine." */
const DRAFTED_AND_APPROVED = [
  'en-within-span-wrong-element', 'en-negation-dropped', 'en-vocab-neighbouring-sense',
  'en-vocab-form-lookalike', 'en-whole-text-absence-asserted', 'en-coordination-wrong-conjunct',
] as const;

/** Entries 7-8: she rejected the drafted hint and wrote a replacement, in the file. */
const REWRITTEN = ['en-determiner-omitted', 'en-narrator-voice-as-fact'] as const;
const ALL_NINE = [...DRAFTED_AND_APPROVED, ...REWRITTEN, 'en-relative-pronoun-choice'] as const;

/**
 * Pull each rewritten hint out of her document BY STRUCTURE — the line after its entry heading's
 * `**childHint (rewritten):**` marker. Never a literal. If the shape is not found the run stops:
 * a hint this cannot locate is one it would silently leave at the drafted wording she rejected.
 */
function readRewrittenHints(markdown: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const id of REWRITTEN) {
    const section = markdown.split(new RegExp(`^### \\d+\\. \`${id}\``, 'm'))[1];
    if (!section) throw new Error(`no section for ${id} in her return — nothing written`);
    const after = section.split('**childHint (rewritten):**')[1];
    if (!after) throw new Error(`${id}: no rewritten-hint marker in her section — nothing written`);
    const line = after.split('\n').map((l) => l.trim()).find((l) => l.length > 0);
    if (!line) throw new Error(`${id}: marker present but no hint line follows — nothing written`);
    out.set(id, line);
  }
  return out;
}

async function main(): Promise<void> {
  const raw = readFileSync(RETURN_FILE, 'utf8');
  const fileHash = createHash('sha256').update(raw).digest('hex');
  const artefact = { file: RETURN_FILE.split('/').pop()!, sha256: fileHash };
  console.log(`Her return: ${artefact.file}  sha256 ${fileHash}\n`);

  const hints = readRewrittenHints(raw);
  const rows = await prisma.misconception.findMany({ where: { id: { in: [...ALL_NINE] } } });
  if (rows.length !== ALL_NINE.length) throw new Error(`expected 9 entries, found ${rows.length} — nothing written`);
  const proposed = rows.filter((r) => r.status !== 'PROPOSED');
  if (proposed.length) {
    throw new Error(`${proposed.map((p) => `${p.id}=${p.status}`).join(', ')} — not PROPOSED, so not in `
      + 'the state the ruling was made about. Nothing written. R87.');
  }

  console.log('HER REWRITTEN HINTS, read from her file and byte-compared against what is stored:');
  for (const [id, hint] of hints) {
    const before = rows.find((r) => r.id === id)!.childHint ?? '';
    console.log(`  ${id}`);
    console.log(`    was (${before.length} ch, ${createHash('sha256').update(before).digest('hex').slice(0, 12)}): ${JSON.stringify(before)}`);
    console.log(`    now (${hint.length} ch, ${createHash('sha256').update(hint).digest('hex').slice(0, 12)}): ${JSON.stringify(hint)}`);
    if (before === hint) throw new Error(`${id}: her rewrite is identical to what is stored — either the `
      + 'extraction found the wrong line or this has already been applied. Nothing written.');
  }
  console.log();

  const approvalProvenance = {
    approvalAuthorKind: 'PERSON',
    approvedByPerson: 'Annie',
    approvalArtefact: artefact,
    approvalArtefactNote:
      'Her approval-batch return, section 1: she read the drafted proposals, tested the boundary '
      + 'clauses, rejected two first drafts and approved the redrafts. This is the FIRST artefact '
      + 'evidencing these approvals — her own note says the approvals were real and given in the '
      + 'review conversation, and that what was missing was a document channel, not a decision. '
      + 'Recorded against THIS return and not the ENG-028 one, which does not mention these entries.',
    approvalAuthorshipRuledOn: RULED_ON,
  };

  await prisma.$transaction(async (tx) => {
    for (const id of DRAFTED_AND_APPROVED) {
      const prior = (rows.find((r) => r.id === id)!.textProvenance ?? {}) as Record<string, unknown>;
      await tx.misconception.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          approvedBy: `reviewer:${REVIEWER_ID}`,
          textProvenance: {
            ...prior,
            // KNOWN, AND NOT HERS. Both halves are the finding; UNKNOWN was right to hold and is
            // wrong to keep once she has settled it.
            hintAuthorKind: 'AGENT',
            hintAuthoredBy: DRAFTING_SIDE,
            hintAuthorshipNote:
              'SETTLED BY THE REVIEWER, 2026-08-16. She confirms "her proposals" meant proposals '
              + 'written TO her: these hints were drafted by the authoring side and she approved '
              + 'them, rejecting a first draft on two and amending one before approving. Her words: '
              + '"Not authorship unknown. Known, and not mine."',
            hintAuthorshipPriorState: 'UNKNOWN (R108) — held pending her ruling, settled by it',
            ...approvalProvenance,
          } as Prisma.InputJsonValue,
        },
      });
      console.log(`  ${id.padEnd(32)} PROPOSED -> ACTIVE · hint AGENT/${DRAFTING_SIDE} · approval PERSON/Annie`);
    }

    for (const id of REWRITTEN) {
      const prior = (rows.find((r) => r.id === id)!.textProvenance ?? {}) as Record<string, unknown>;
      await tx.misconception.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          approvedBy: `reviewer:${REVIEWER_ID}`,
          childHint: hints.get(id)!,
          textProvenance: {
            ...prior,
            // HERS, by the same test that makes en-vocab-dominant-sense hers: she rejected the
            // draft and wrote a replacement, in a document she authored.
            hintAuthorKind: 'PERSON',
            hintAuthoredBy: 'Annie',
            hintSource: `rewritten by the reviewer in ${artefact.file}, read from the file and not retyped`,
            hintArtefact: artefact,
            hintAuthorshipNote:
              'SHE REWROTE THIS HINT. The drafted wording was rejected with a reason — the '
              + 'determiner hint told a child to read aloud in a room where she cannot, and the '
              + 'narrator-voice hint coached the key in its third sentence. Extracted from her file '
              + 'by document structure and never retyped, per her condition of signature.',
            ...approvalProvenance,
          } as Prisma.InputJsonValue,
        },
      });
      console.log(`  ${id.padEnd(32)} PROPOSED -> ACTIVE · hint PERSON/Annie (rewritten) · approval PERSON/Annie`);
    }

    const prior = (rows.find((r) => r.id === 'en-relative-pronoun-choice')!.textProvenance ?? {}) as Record<string, unknown>;
    await tx.misconception.update({
      where: { id: 'en-relative-pronoun-choice' },
      data: {
        status: 'ACTIVE',
        approvedBy: `reviewer:${REVIEWER_ID}`,
        textProvenance: {
          ...prior,
          hintAuthorKind: 'AGENT',
          hintAuthoredBy: DRAFTING_SIDE,
          // HER NOTE TRAVELS WITH THE ENTRY, not just into the log. It is a condition on future
          // use, and a condition nobody reads at the point of use is not a condition.
          reviewerNote:
            'APPROVED WITH A NOTE (Annie, 2026-08-16): the description covers four errors — which '
            + 'for people, whose for who, whom in a subject slot — and the hint reaches three. '
            + 'Nothing in "a person, a thing, or something belonging to someone" helps a child '
            + 'choosing whom where who belongs, because that is a CASE error and not a REFERENCE '
            + 'error. Not a blocker at one item. IF THIS ENTRY EVER CARRIES A *WHOM* DISTRACTOR it '
            + 'needs a second clause or a second entry.',
          ...approvalProvenance,
        } as Prisma.InputJsonValue,
      },
    });
    console.log(`  ${'en-relative-pronoun-choice'.padEnd(32)} PROPOSED -> ACTIVE · approved with a standing note`);
  });

  // RE-READ EVERYTHING CLAIMED. Including the two hints, byte for byte against her file.
  const after = await prisma.misconception.findMany({ where: { id: { in: [...ALL_NINE] } } });
  const notActive = after.filter((r) => r.status !== 'ACTIVE');
  if (notActive.length) throw new Error(`not ACTIVE: ${notActive.map((r) => r.id).join(', ')}`);
  for (const [id, hint] of hints) {
    const stored = after.find((r) => r.id === id)!.childHint ?? '';
    if (stored !== hint) throw new Error(`${id}: stored hint does not match her file byte for byte`);
    console.log(`\n  ${id}: stored hint === her file, ${hint.length} chars, verified after write.`);
  }
  console.log(`\nVerified by re-reading: ${after.length} of 9 ACTIVE.`);
  await prisma.$disconnect();
}

void main();
