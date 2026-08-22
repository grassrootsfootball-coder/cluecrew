/**
 * HER FIVE CONVERSIONS, LANDED WITH THEIR STRIKES COMPLETED (ninety-third return; David's item 2).
 *
 * **A COMPLETED STRIKE IS A CITATION, AND A GUESSED CITATION IS THE LINE-13 CLASS AT BIRTH.** So:
 * a PENDING-BYTES claim naming locatable content, with the passage present, has its span CUT FROM
 * THE PASSAGE BYTES, verbatim-checked, and the READING carried on the landing artefact for her to
 * check. An absence clause takes ABSENCE-CLAIM-NO-SPAN per her black-beauty split. Anything the
 * lander cannot confidently locate REFUSES TO HER with the candidate lines quoted — never a guess.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentFlags } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const RETURN = '/Users/davidb/Downloads/annie-ninetythird-return.md';
const EXPECTED = '39a2ad57497ec6fa4e989028c7dda3f3defa8079863a34d9387cd84ea7f11b46';

const sha = createHash('sha256').update(readFileSync(RETURN)).digest('hex');
if (sha !== EXPECTED) throw new Error(`ABORTED — return digest ${sha}.`);
const body = readFileSync(RETURN, 'utf8');
const authored = [...body.matchAll(/^\s+authored: (\{.*\})$/gm)].map((m) => JSON.parse(m[1] as string) as Record<string, unknown>);
const targets = [...body.matchAll(/^\s+target: passage:([a-z0-9-]+):contentFlags$/gm)].map((m) => m[1] as string);
if (authored.length !== 5 || targets.length !== 5) throw new Error(`ABORTED — parsed ${authored.length} objects / ${targets.length} targets, expected 5/5.`);

/**
 * THE STRIKE COMPLETIONS — each a READING, carried for her check. The span is cut from THIS
 * store's extract bytes at landing (the railway precedent), never typed here.
 */
const COMPLETIONS: Record<string, { kind: 'ABSENCE' | 'LOCATE'; anchor?: string; reading: string }> = {
  'the rabbit is unhurt': {
    kind: 'ABSENCE',
    reading: 'HER OWN black-beauty split names "nobody is hurt" an absence claim; "the rabbit is unhurt" is the same clause about one rabbit. Unstrikeable, so ABSENCE-CLAIM-NO-SPAN.',
  },
  'the narrative immediately vindicates the horse': {
    kind: 'LOCATE',
    anchor: 'The bridge is broken in the middle',
    reading: '"IMMEDIATELY" is what selects this span: the toll-man\'s revelation follows the refusal within lines and is what proves the horse right on the spot. The runner-up — the master\'s closing "wiser than we were" — supports the SHAMING clause of her reason, which is not the strike\'s claim. Hers to check.',
  },
  'the episode ends safely at home': {
    kind: 'LOCATE',
    anchor: 'We saw a light at the hall-door',
    reading: 'One candidate: the arrival at the hall-door with the mistress\'s "Are you really safe, my dear?". Hers to check.',
  },
};

const landedReadings: Array<Record<string, unknown>> = [];
const perPassage = new Map<string, Array<Record<string, unknown>>>();

for (let n = 0; n < 5; n++) {
  const flag = { ...authored[n]! };
  const strike = flag.strike;
  if (typeof strike === 'string' && strike.startsWith('PENDING-BYTES')) {
    const claim = Object.keys(COMPLETIONS).find((c) => strike.includes(c));
    if (!claim) throw new Error(`REFUSED TO HER — pending strike carries no claim this lander recognises: ${JSON.stringify(strike)}. Never a guessed span.`);
    const c = COMPLETIONS[claim]!;
    if (c.kind === 'ABSENCE') {
      flag.strike = 'ABSENCE-CLAIM-NO-SPAN';
      flag.strikeNote = `completed as an absence at landing: ${strike.replace(/^PENDING-BYTES:\s*/, '')}`;
      landedReadings.push({ passage: targets[n], claim, completedAs: 'ABSENCE-CLAIM-NO-SPAN', reading: c.reading });
    } else {
      const p = JSON.parse(readFileSync(join(REPO, `content/passages/${targets[n]}.json`), 'utf8')) as { extract: string; numberedLines?: Array<{ n: number; text: string }> };
      const at = p.extract.indexOf(c.anchor!);
      if (at === -1) throw new Error(`REFUSED TO HER — anchor for "${claim}" not in ${targets[n]}'s bytes.`);
      const end = p.extract.indexOf('\n', at);
      const span = p.extract.slice(at, end === -1 ? undefined : end);
      const lines = (p.numberedLines ?? []).filter((l) => span.includes(l.text) || l.text.includes(span.slice(0, 60))).map((l) => l.n);
      flag.strike = { span, lines };
      landedReadings.push({ passage: targets[n], claim, completedAs: 'VERBATIM SPAN', span, lines, reading: c.reading });
    }
  }
  perPassage.set(targets[n]!, [...(perPassage.get(targets[n]!) ?? []), flag]);
}

for (const [pid, flags] of perPassage) {
  const path = join(REPO, `content/passages/${pid}.json`);
  const passage = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  /**
   * **THE IDEMPOTENCE GUARD THIS LANDER SHIPPED WITHOUT (R631).** Its first version was run a
   * second time as an "idempotence check" — which was not a check but a second WRITE, and it
   * duplicated every flag on three rows. A check reads; a lander refuses to land what is already
   * landed, and says so.
   */
  const existing = new Set(((passage.contentFlags as unknown[]) ?? [])
    .filter((f) => f && typeof f === 'object')
    .map((f) => JSON.stringify(Object.entries(f as object).sort())));
  const already = flags.filter((f) => existing.has(JSON.stringify(Object.entries(f).sort())));
  if (already.length > 0) {
    console.log(`${pid}: ALREADY LANDED — ${already.length} of ${flags.length} object(s) present; nothing written.`);
    continue;
  }
  const legacy = (passage.contentFlags as unknown[]).filter((f) => typeof f === 'string');
  // Byte-guard: every displaced legacy string must be quoted verbatim in a landing sourceProse.
  const proses = flags.map((f) => String(f.sourceProse));
  const displaced: unknown[] = legacy.filter((s) => proses.includes(String(s)));
  const kept = (passage.contentFlags as unknown[]).filter((f) => !displaced.includes(f));
  const wouldBe = {
    ...passage,
    contentFlags: [...kept, ...flags],
    _displacedLegacyFlags: {
      ...((passage._displacedLegacyFlags as object) ?? {}),
      [`ninetythird`]: { displaced, by: `annie-ninetythird-return.md, sha256 ${sha}` },
    },
  };
  const report = readContentFlags(wouldBe, { enforceUse: true });
  if (report.refusals.length > 0) {
    console.error(`THE DOOR REFUSES ${pid} — nothing written:`);
    for (const r of report.refusals) console.error(`  ${r.code}  ${r.detail}`);
    process.exitCode = 1;
  } else {
    writeFileSync(path, JSON.stringify(wouldBe, null, 1));
    console.log(`${pid}: landed ${flags.length}, displaced ${displaced.length} legacy string(s)`);
  }
}

const payload = {
  what: 'The strike readings taken at the ninety-third landing, for her check. A completed strike is a citation; each reading says why its span (or absence) was chosen, and a claim the lander could not place would have refused with candidates, never guessed.',
  authority: `annie-ninetythird-return.md, sha256 ${sha}`,
  readings: landedReadings,
};
const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
  'strike completions at the ninety-third landing, each reading carried for her check',
  ['what', 'authority', 'readings']);
const out = join(REPO, 'content/exports', stampedName('ninetythird-strike-readings', stamp.sourceHash, 'json'));
writeFileSync(out, JSON.stringify({ stamp, ...payload }, null, 2));
deliver(out, 'ninetythird-strike-readings');
