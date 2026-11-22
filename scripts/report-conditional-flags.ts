/**
 * WHICH CONTENT FLAGS CARRY A CONDITION, AND WHERE DOES THAT CONDITION LIVE? (David, 2026-08-20.)
 *
 * A flag saying "keep" is a verdict. A flag saying "keep, AND do not let any question ask pupils to
 * state the reason" is a verdict **plus a mitigation**, and the mitigation is the half that has to
 * reach an author. **The population of conditional flags is a different thing from the population
 * of flags**, and it is the one where a verdict shipped and its condition did not.
 *
 * `stream-a-03-wind-in-willows` is the instance: *"a teacher note could point out that the Mole is
 * being cheeky, not admirable"* — a condition never met, on a passage behind **22 LIVE items**, and
 * nothing noticed because **no field holds it and no code reads it.**
 *
 * **THIS REPORTS. IT IS NOT A GATE AND MUST NOT BECOME ONE HERE** — the standard these flags are
 * judged against does not exist yet, and a gate would be enforcing a rule nobody has written.
 *
 * **WHAT IT CANNOT DO, stated** (R60): recommendations are PROSE, so conditionality is detected by
 * keyword. That over-calls (a clause after "keep" that merely explains) and under-calls (a
 * condition phrased without any marker). **The count below is a floor, not a census**, and the
 * correct repair is not a better regex — it is a recommendation being a FIELD with a condition slot
 * rather than a sentence. That is a governance decision and nothing here takes it.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../packages/db/src/index';
import { deliver } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGES = join(REPO_ROOT, 'content/passages');

/**
 * Markers that turn a verdict into a verdict-plus-obligation. Deliberately the DIRECTIVE ones —
 * words that tell a later reader to do or not do something — rather than every subordinate clause.
 */
const DIRECTIVE = [
  /\bdo not\b/i, /\bdon't\b/i, /\bshould\b/i, /\bmust\b/i, /\bneeds? to\b/i,
  /\bteacher note\b/i, /\bmark scheme/i, /\bwith the reason stated\b/i,
  /\bprovided\b/i, /\bas long as\b/i, /\bonly (?:to|if)\b/i, /\bavoid\b/i,
  /\breviewer (?:aware|scanning)\b/i, /\bcould point out\b/i, /\bwish to note\b/i,
];

interface Row {
  passage: string;
  flagIndex: number;
  recommendation: string;
  condition: string;
  markers: string[];
}

function recommendationOf(flag: unknown): { rec: string; whole: string } | null {
  if (typeof flag === 'string') {
    const m = flag.match(/Recommendation:\s*(.*)$/is);
    return m ? { rec: m[1]!.trim(), whole: flag } : null;
  }
  if (flag && typeof flag === 'object') {
    const f = flag as Record<string, unknown>;
    const rec = typeof f.recommendation === 'string' ? f.recommendation : '';
    const reason = typeof f.reason === 'string' ? f.reason : '';
    if (rec === '' && reason === '') return null;
    return { rec: `${rec}${reason ? ` — ${reason}` : ''}`.trim(), whole: JSON.stringify(flag) };
  }
  return null;
}

async function main() {
  const files = readdirSync(PASSAGES).filter((f) => f.endsWith('.json')).sort();
  const items = await prisma.item.findMany({ select: { stem: true, explanation: true, status: true } });

  const live = new Map<string, number>();
  const total = new Map<string, number>();
  for (const i of items) {
    const seen = new Set<string>();
    for (const c of [i.stem, i.explanation]) {
      const q = (c as { quotes?: unknown })?.quotes;
      if (!Array.isArray(q)) continue;
      for (const e of q) {
        if (e && typeof e === 'object' && typeof (e as { passageRef?: unknown }).passageRef === 'string') {
          seen.add((e as { passageRef: string }).passageRef);
        }
      }
    }
    const pr = (i.stem as { passageRef?: unknown })?.passageRef;
    if (typeof pr === 'string') seen.add(pr);
    for (const r of seen) {
      total.set(r, (total.get(r) ?? 0) + 1);
      if (i.status === 'LIVE') live.set(r, (live.get(r) ?? 0) + 1);
    }
  }

  const conditional: Row[] = [];
  let flagsSeen = 0;
  let passagesWithFlags = 0;

  for (const file of files) {
    const j = JSON.parse(readFileSync(join(PASSAGES, file), 'utf8')) as Record<string, unknown>;
    const flags = j.contentFlags;
    if (!Array.isArray(flags) || flags.length === 0) continue;
    passagesWithFlags++;
    const id = String(j.id);
    flags.forEach((flag, n) => {
      flagsSeen++;
      const parsed = recommendationOf(flag);
      if (parsed === null) return;
      const markers = DIRECTIVE.filter((re) => re.test(parsed.rec)).map((re) => String(re));
      if (markers.length === 0) return;
      const sentences = parsed.rec.split(/(?<=[.;])\s+/).filter((s) => DIRECTIVE.some((re) => re.test(s)));
      conditional.push({
        passage: id,
        flagIndex: n + 1,
        recommendation: parsed.rec,
        condition: sentences.join(' ').trim() || parsed.rec,
        markers,
      });
    });
  }

  requirePopulation('report:conditional-flags', {
    'passage file(s) with flags': passagesWithFlags,
    'flag(s) read': flagsSeen,
  });

  const out: string[] = [
    '# Content flags whose recommendation carries a CONDITION',
    '',
    '**20 August 2026. For Annie and David. A report — not a gate, and not a parser.**',
    '',
    '**A flag saying "keep" is a verdict. A flag saying "keep, AND do not let any question ask pupils',
    'to state the reason" is a verdict PLUS a mitigation** — and the mitigation is the half that has',
    'to reach an author. **This population is a different thing from the population of flags**, and it',
    'is the one where a verdict shipped and its condition did not.',
    '',
    `**${conditional.length} of ${flagsSeen} flags carry a directive**, across ${new Set(conditional.map((c) => c.passage)).size} passages.`,
    '',
    '**Nothing in this store holds a condition, and nothing reads one.** There is no field for it, no',
    'state for met-or-unmet, and no check that could fail. The condition exists only inside the',
    'sentence that states the verdict, which means **a reader who acts on the verdict has already read',
    'past the condition.**',
    '',
    '## What it cannot do, stated',
    '',
    'Recommendations are PROSE, so conditionality is detected by keyword — directive words that tell a',
    'later reader to do or not do something. That **over-calls** (a clause after "keep" that merely',
    'explains) and **under-calls** (a condition phrased with no marker at all). **The count is a floor,',
    'not a census.**',
    '',
    '**The correct repair is not a better pattern.** It is a recommendation being a FIELD with a',
    'condition slot and a met/unmet state, rather than a sentence. That is a governance decision, it',
    'belongs with the standard that does not yet exist, and nothing here takes it.',
    '',
    '---',
    '',
  ];

  const byPassage = new Map<string, Row[]>();
  for (const r of conditional) byPassage.set(r.passage, [...(byPassage.get(r.passage) ?? []), r]);

  const ordered = [...byPassage].sort((a, b) => (live.get(b[0]) ?? 0) - (live.get(a[0]) ?? 0));
  for (const [passage, rows] of ordered) {
    const l = live.get(passage) ?? 0;
    const t = total.get(passage) ?? 0;
    out.push(`## \`${passage}\``, '');
    out.push(
      l > 0
        ? `**REACHABLE — ${l} LIVE item${l === 1 ? '' : 's'} behind it** (${t} total). A child meets this passage today.`
        : `Not reachable — ${t} item${t === 1 ? '' : 's'}, none LIVE.`,
      '',
    );
    for (const r of rows) {
      out.push(`**Flag ${r.flagIndex}** — the condition:`, '');
      out.push(`> ${r.condition}`, '');
      out.push('<details><summary>full recommendation</summary>', '', `> ${r.recommendation}`, '', '</details>', '');
    }
    out.push('---', '');
  }

  out.push('## The one that prompted this', '');
  out.push(
    '`stream-a-03-wind-in-willows` sits behind **22 LIVE items** — the most reachable passage in the',
    'store — and its single flag ends *"a teacher note could point out that the Mole is being cheeky,',
    'not admirable."* **No teacher note exists.** The condition was never met, and nothing noticed,',
    'because nothing reads the field.',
    '',
    '**A conditional recommendation whose condition is never met is not a kept passage. It is an',
    'unkept one that reads as kept**, and it reads that way to everyone downstream including the',
    'person who wrote the condition.',
    '',
  );

  const path = join(REPO_ROOT, 'content/exports/CONDITIONAL-FLAG-RECOMMENDATIONS.md');
  writeFileSync(path, out.join('\n'));
  deliver(path);
  console.log(`\n${conditional.length} conditional of ${flagsSeen} flags read.`);
  await prisma.$disconnect();
}

void main();
