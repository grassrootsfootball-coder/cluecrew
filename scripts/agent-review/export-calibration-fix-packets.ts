/**
 * PACKETS FOR THE ROWS A CALIBRATION RETURN WOULD NOT SIGN (R1031).
 *
 * Reads the return and the key, takes every card the machine SIGNED that the calibration reviewer held
 * or refused, and writes one packet per district. Each row carries the reviewer's finding VERBATIM (R25),
 * never a summary of it.
 *   - English: `english-rewrite/calibration/`. It sits under english-rewrite so landing writes the
 *     changeset that returns English text to the authoring store.
 *   - Maths and VR: `calibration-fix/<district>/`.
 *
 *   tsx scripts/agent-review/export-calibration-fix-packets.ts --return=<file> [--sample=01]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

const REPO = pjoin(__dirname, '..', '..');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const SAMPLE = arg('sample') ?? '01';
const RET = arg('return');
if (!RET) throw new Error('--return=<file> is required');
const CAL = pjoin(REPO, 'content', 'agent-review', 'calibration', SAMPLE);

async function main() {
  const key = JSON.parse(readFileSync(pjoin(CAL, 'key.json'), 'utf8')) as { cardsDigest: string; key: Array<{ card: number; itemId: string; kind: string; district: string }> };
  const ret = JSON.parse(readFileSync(RET!, 'utf8')) as { cardsDigest: string; reviewer: string; verdicts: Array<{ card: number; verdict: string; faultAt: string[]; reason: string | null }> };
  if (ret.cardsDigest !== key.cardsDigest) throw new Error(`return digest ${ret.cardsDigest} is not this sample's ${key.cardsDigest}`);
  const flagged = key.key.filter((k) => k.kind === 'SIGNED' && ret.verdicts.find((v) => v.card === k.card)?.verdict !== 'SIGN');
  requirePopulation('calibration-fix', { 'machine-signed rows the calibration reviewer did not sign': flagged.length });
  const doorOf: Record<string, string> = { ENGLISH: 'english-rewrite/calibration', MATHS: 'calibration-fix/maths', VR: 'calibration-fix/vr' };
  const prefix: Record<string, (id: string) => boolean> = { ENGLISH: (id) => id.startsWith('en-'), MATHS: (id) => id.startsWith('maths-'), VR: (id) => /^vr/.test(id) };
  for (const district of ['ENGLISH', 'MATHS', 'VR']) {
    const rows = flagged.filter((k) => k.district === district);
    if (!rows.length) { console.log(`  ${district}: none flagged`); continue; }
    const entries = (await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: { in: ['reviewer:rev-0001', 'reviewer:rev-agent-01'] } }, select: { id: true, description: true, childHint: true } }))
      .filter((e) => prefix[district]!(e.id));
    const passages: Record<string, unknown> = {}; const out: unknown[] = [];
    for (const k of rows) {
      const r = await prisma.item.findUniqueOrThrow({ where: { id: k.itemId }, select: { id: true, status: true, questionTypeId: true, stem: true, lineRefs: true, explanation: true,
        options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
      if (r.status !== 'LIVE') throw new Error(`${r.id} is ${r.status}, not LIVE — the card was drawn from LIVE rows`);
      const ref = (r.stem as { passageRef?: string }).passageRef;
      if (ref) {
        const f = pjoin(REPO, 'content', 'passages', `${ref}.json`);
        if (!existsSync(f)) throw new Error(`${r.id}: passage ${ref} missing`);
        passages[ref] ??= { numberedLines: JSON.parse(readFileSync(f, 'utf8')).numberedLines };
      }
      const v = ret.verdicts.find((x) => x.card === k.card)!;
      out.push({ itemId: r.id, questionType: r.questionTypeId, passageRef: ref ?? null, stem: r.stem, lineRefs: r.lineRefs, explanation: r.explanation,
        finding: { from: ret.reviewer, card: k.card, verdict: v.verdict, faultAt: v.faultAt, reason: v.reason },
        options: r.options.map((o) => ({ optionId: o.id, value: (o.content as { value?: unknown })?.value, isKey: o.isCorrect, tag: o.misconceptionId, execution: o.misconceptionExecution?.trim() || null })) });
    }
    const dir = pjoin(REPO, 'content', 'agent-review', doorOf[district]!); mkdirSync(dir, { recursive: true });
    writeFileSync(pjoin(dir, 'packet.json'), JSON.stringify({ door: doorOf[district], questionType: district.toLowerCase(), ruling: 'R1031',
      entries: Object.fromEntries(entries.map((e) => [e.id, { description: e.description, childHint: e.childHint }])), passages, rows: out }, null, 1));
    console.log(`  ${doorOf[district]}: ${out.length} rows, ${entries.length} entries offered`);
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
