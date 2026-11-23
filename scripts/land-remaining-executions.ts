/**
 * LAND THE 114 — the same verification the nine took, applied per row.
 *
 * The nine were checked against a projection's declared changes before a byte was written. These
 * have no projection, so the equivalent is checked directly: **the row exists, the option resolves
 * by the identity the artefact itself uses, the tag on the seat agrees with the entry the artefact
 * names, and the execution slot is EMPTY.** A seat failing any of those refuses and is reported;
 * **per row, never per batch**, because these arrive from many artefacts and one bad seat must not
 * hold the rest hostage.
 *
 * Landed verbatim and re-read after the write. **None of it is re-derivable** (R922), so the only
 * acceptable outcome is byte-identity or a refusal.
 *
 * **THE 15 DIFFERING ARE NOT TOUCHED.** A landed execution that differs from its crossed original is
 * a question about which is authoritative, and this store overwriting one with the other would
 * answer a question nobody asked it. They cross for a reading with both texts.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const DL = pjoin(homedir(), 'Downloads');
const EXEC_KEYS = ['EXECUTION', 'execution', 'misconceptionExecution', 'theExecution', 'executionText'];

interface Hit { itemId: string; optionValue: unknown; entryId: string | null; text: string; file: string; digest: string }

function* walk(o: unknown, ctx: { itemId?: string }): Generator<Omit<Hit, 'file' | 'digest'>> {
  if (Array.isArray(o)) { for (const v of o) yield* walk(v, ctx); return; }
  if (!o || typeof o !== 'object') return;
  const r = o as Record<string, unknown>;
  const itemId = typeof r.itemId === 'string' ? r.itemId : (typeof r.id === 'string' && Array.isArray(r.options) ? r.id : ctx.itemId);
  for (const k of EXEC_KEYS) {
    const v = r[k];
    if (typeof v === 'string' && v.length > 40 && itemId) {
      const own = r.optionValue !== undefined ? r.optionValue
        : r.content !== undefined ? (typeof r.content === 'object' && r.content !== null && 'value' in (r.content as object) ? (r.content as { value: unknown }).value : r.content)
        : r.value !== undefined ? r.value : r.label;
      yield { itemId, optionValue: own, entryId: typeof r.entryId === 'string' ? r.entryId : (typeof r.misconceptionId === 'string' ? r.misconceptionId : null), text: v };
    }
  }
  for (const v of Object.values(r)) yield* walk(v, { itemId });
}

async function run() {
  assertFixture('land-preconditions', [
    { name: 'an empty slot with a matching tag lands', input: JSON.stringify([null, 'm1', 'm1']), mustBeCaught: true },
    { name: 'an OCCUPIED slot does not land', input: JSON.stringify(['already here', 'm1', 'm1']), mustBeCaught: false },
    { name: 'a tag disagreeing with the artefact does not land', input: JSON.stringify([null, 'm1', 'm2']), mustBeCaught: false },
  ], (raw) => { const [slot, seatTag, artefactTag] = JSON.parse(raw) as [string | null, string, string]; return slot === null && seatTag === artefactTag; });

  const hits = new Map<string, Hit>();
  for (const f of readdirSync(DL).filter((n) => n.endsWith('.json'))) {
    let text: string; let doc: unknown;
    try { text = readFileSync(pjoin(DL, f), 'utf8'); doc = JSON.parse(text); } catch { continue }
    if (!EXEC_KEYS.some((k) => text.includes(`"${k}"`))) continue;
    const digest = sha(text);
    for (const h of walk(doc, {})) hits.set(sha(`${h.itemId}|${canonicalJson(h.optionValue)}|${h.text}`), { ...h, file: f, digest });
  }
  requirePopulation('land:remaining-executions', { 'crossed execution(s)': hits.size });

  const same = (a: unknown, b: unknown) => canonicalJson(a) === canonicalJson(b);
  const plan = [] as Array<{ h: Hit; optionId: string; seatTag: string | null }>;
  const refused = [] as Array<Record<string, unknown>>;
  const differing = [] as Array<Record<string, unknown>>;
  const alreadyIdentical = [] as string[];

  for (const h of hits.values()) {
    const row = await prisma.item.findUnique({ where: { id: h.itemId },
      select: { id: true, questionType: { select: { district: true } }, stem: true,
        options: { orderBy: { id: 'asc' }, select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } } });
    // `undefined` vanishes through JSON.stringify and breaks the recompute guard — omit the key,
    // never set it to undefined (R88, third time this week).
    if (!row) { refused.push({ itemId: h.itemId, optionValue: h.optionValue, file: h.file, why: 'the row is not in this store' }); continue; }
    /**
     * An option identifies itself differently in different artefacts, AND the same value may be a
     * number here and a string there — `7` against `"7"`. Comparing canonical JSON alone refused 180
     * seats on vr-17 for a type difference, which is the matcher-narrowness fault again (R955): the
     * count was concentrated in one question type, and a fault that clusters is a reading failing.
     */
    const asText = (v: unknown) => (v === null || v === undefined ? null : Array.isArray(v) ? v.map(String).join('\u0000') : String(v));
    const opt = row.options.find((o) => {
      const c = o.content as Record<string, unknown>;
      return same(c.value, h.optionValue) || same(c, h.optionValue)
        || (asText(c.value) !== null && asText(c.value) === asText(h.optionValue))
        || (c.label !== undefined && same(c.label, h.optionValue));
    });
    if (!opt) { refused.push({ itemId: h.itemId, optionValue: h.optionValue, file: h.file, why: 'no option on this row resolves to that identity' }); continue; }
    if (opt.misconceptionExecution !== null) {
      if (opt.misconceptionExecution === h.text) { alreadyIdentical.push(h.itemId); continue; }
      differing.push({ itemId: h.itemId, district: row.questionType.district, optionValue: h.optionValue,
        seatTag: opt.misconceptionId, sourceFile: h.file, sourceDigest: h.digest.slice(0, 16),
        THE_TEXT_IN_THESE_ROWS: opt.misconceptionExecution, itsSha256: sha(opt.misconceptionExecution),
        THE_TEXT_IN_THE_CROSSED_ARTEFACT: h.text, itsSha256Crossed: sha(h.text) });
      continue;
    }
    if (h.entryId && opt.misconceptionId && h.entryId !== opt.misconceptionId) {
      refused.push({ itemId: h.itemId, optionValue: h.optionValue, file: h.file,
        why: `the artefact names entry ${h.entryId} and the seat carries ${opt.misconceptionId}` });
      continue;
    }
    plan.push({ h, optionId: opt.id, seatTag: opt.misconceptionId });
  }

  if (APPLY && plan.length) {
    for (const chunk of Array.from({ length: Math.ceil(plan.length / 40) }, (_, i) => plan.slice(i * 40, i * 40 + 40))) {
      await prisma.$transaction(async (tx) => {
        for (const p of chunk) {
          await tx.itemOption.update({ where: { id: p.optionId }, data: { misconceptionExecution: p.h.text } });
          await tx.attributionEvent.create({ data: { recordType: 'item', recordId: p.h.itemId, action: 'AMENDED',
            reviewerId: null, actor: 'Cowork (authored execution)', recordedBy: 'human:david',
            field: 'options[].misconceptionExecution', subjectHash: sha(p.h.text),
            method: `execution landed VERBATIM from the crossed artefact ${p.h.file} (${p.h.digest.slice(0, 16)}…). Verified before writing: the row exists, the option resolves by the artefact's own identity, the seat's tag agrees with the entry named, and the slot was empty.`,
            note: 'the authoring store\'s disk was reclaimed; this execution had ONE holder. Landing it puts it in a database with a migration history. Not re-derivable (R922) — not a character edited.' } });
        }
      });
    }
  }

  // verify after the write
  let identical = 0;
  if (APPLY) for (const p of plan) {
    const o = await prisma.itemOption.findUnique({ where: { id: p.optionId }, select: { misconceptionExecution: true } });
    if (o?.misconceptionExecution === p.h.text) identical += 1;
  }

  const full = {
    kind: 'remaining-executions-landed', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_VERIFICATION: 'the same the nine took, applied per row: the row exists, the option resolves by the identity the artefact itself uses, the seat\'s tag agrees with the entry named, and the slot is empty. Per row and never per batch — these arrive from many artefacts and one bad seat must not hold the rest.',
    counts: { crossedExecutions: hits.size, WOULD_LAND: plan.length, landedAndVerifiedByteIdentical: APPLY ? identical : null,
      alreadyPresentAndIdentical: alreadyIdentical.length, DIFFERING_NOT_TOUCHED: differing.length, refused: refused.length },
    THE_FIFTEEN_DIFFERING: {
      forARuling: 'a landed execution that differs from its crossed original is a question about which is authoritative. This store did not overwrite either — that would answer a question nobody asked it, and neither store can settle it from a register now. It is a reading.',
      rows: differing,
    },
    refusedWithCauses: refused,
    landedFrom: [...new Set(plan.map((p) => p.h.file))],
  };
  const lines = plan.map((p) => `${p.h.itemId}\t${canonicalJson(p.h.optionValue)}\t${sha(p.h.text).slice(0, 16)}`);
  const d = digestOverText('one line per landed execution', lines.join('\n'));
  /**
   * DIGEST WHAT SHIPS, NOT WHAT IS IN MEMORY (R88). A key set to `undefined` anywhere in the tree
   * disappears through JSON.stringify, so a digest taken over the live object cannot reproduce over
   * the delivered bytes. One round-trip makes the two the same thing by construction, rather than
   * by hunting every optional field — this is the third occurrence this week and the general fix.
   */
  const withLines = JSON.parse(JSON.stringify({ ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec }));
  const artefact = { ...withLines, ...findingsDigest(withLines, ['counts', 'THE_FIFTEEN_DIFFERING', 'refusedWithCauses', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'remaining-executions-landed' : 'remaining-executions-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  console.log(`\n  ${APPLY ? 'APPLIED' : 'DRY RUN'} — would land ${plan.length}${APPLY ? `, verified byte-identical ${identical}` : ''}`);
  console.log(`  already identical ${alreadyIdentical.length} · DIFFERING (untouched) ${differing.length} · refused ${refused.length}`);
  for (const r of refused.slice(0, 6)) console.log(`     refused  ${r.itemId}  ${r.why}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
