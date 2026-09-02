/**
 * NAME EVERY SIGNATURE'S SUBJECT — DERIVED, UNKNOWN, NEVER INVENTED (Annie's 216th — R973).
 *
 * Her ruling: every signature declares its subject by name and by spec in a field that travels
 * with it; **where the subject is derivable from the stored hash by re-derivation it is recorded
 * as derived, and where it is not the field says UNKNOWN and the signature keeps whatever
 * standing it had.** This is not a change to what any stored signature asserted — it is the
 * statement of what each one always asserted, made legible.
 *
 * AND IT COUNTS THE POPULATION NOBODY HAD COUNTED: how many stored signatures came through the
 * in-platform admin review surface, whose subject is the one the PRODUCT writes when a reviewer
 * signs. Two independent measures are reported and their difference is itself the finding.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { draftAssessmentSubjectHash, deriveSubject, SIGNATURE_SUBJECTS, type SignatureSubjectName } from '../packages/core/src/index';
import { pinHashes } from './lib/pin-projection';
import { requirePopulation } from './lib/population';
import { findingsDigest } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const APPLY = process.argv.includes('--apply');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
/** The note the admin surface writes itself — the METHOD is typed by a person and cannot be trusted for this. */
const SURFACE_NOTE = 'Signed in-platform on the comprehension review surface by';

async function main() {
  console.log(`SIGNATURE SUBJECTS — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

  // Every option order any crossed artefact records, so "the recorded order" is evidence not memory.
  const recorded = new Map<string, string[]>();
  for (const f of readdirSync(LANE).filter((x) => x.endsWith('.json'))) {
    let doc: unknown;
    try { doc = JSON.parse(readFileSync(pjoin(LANE, f), 'utf8')); } catch { continue; }
    const walk = (o: unknown): void => {
      if (Array.isArray(o)) { for (const x of o) walk(x); return; }
      if (!o || typeof o !== 'object') return;
      const r = o as Record<string, unknown>;
      if (typeof r.itemId === 'string' && Array.isArray(r.options) && !recorded.has(r.itemId)) {
        const vals = (r.options as Array<Record<string, unknown>>)
          .map((x) => String(x.value ?? (x.content as Record<string, unknown>)?.value ?? '')).filter(Boolean);
        if (vals.length) recorded.set(r.itemId, vals);
      }
      for (const v of Object.values(r)) walk(v);
    };
    walk(doc);
  }

  const sigs = await prisma.attributionEvent.findMany({ where: { action: 'SIGNED', subjectHash: { not: null } },
    select: { id: true, recordType: true, recordId: true, subjectHash: true, note: true, method: true, subjectKind: true } });
  requirePopulation('backfill:subjects', { 'signature(s) carrying a subjectHash': sigs.length });
  /**
   * NOT-APPLICABLE IS NOT UNKNOWN (R98, one turn further on). 33 of these signatures are over
   * TEMPLATE FAMILIES, not items — `maths-template-family` and `spag-template-family`. No row
   * projection could ever reproduce them and their failing to is not a finding about them. They
   * are named as their own state rather than swelling the UNKNOWN class, which would have read as
   * a third of the estate's signatures being unreadable when the true figure is far smaller.
   */
  const NON_ITEM = new Set(['maths-template-family', 'spag-template-family']);

  const rows = new Map((await prisma.item.findMany({ where: { id: { in: [...new Set(sigs.map((s) => s.recordId))] } },
    select: { id: true, stem: true, explanation: true, difficultyTier: true, status: true,
      options: { select: { content: true, isCorrect: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } }))
    .map((r) => [r.id, r]));

  const results: Array<Record<string, unknown>> = [];
  for (const s of sigs) {
    if (NON_ITEM.has(s.recordType)) {
      results.push({ signatureId: s.id, itemId: s.recordId, recordType: s.recordType, subject: null,
        classification: 'NOT AN ITEM SUBJECT', derivedBy: `this signature is over a ${s.recordType}; the item projections do not apply to it and its own spec is not declared here` });
      continue;
    }
    const r = rows.get(s.recordId);
    if (!r) { results.push({ signatureId: s.id, itemId: s.recordId, recordType: s.recordType, subject: null, classification: 'UNKNOWN', derivedBy: 'UNKNOWN — the signed row is not in this store' }); continue; }
    const val = (o: { content: unknown }) => String((o.content as { value?: unknown })?.value ?? '');
    const candidates: Array<{ subject: SignatureSubjectName; hash: string }> = [];

    // row projection, in the order recorded at signing and in the current ordered read
    const orders: Array<[string, typeof r.options]> = [['current', r.options]];
    const rec = recorded.get(r.id);
    if (rec && rec.length === r.options.length) {
      const reordered = rec.map((v) => r.options.find((o) => val(o) === v)).filter(Boolean) as typeof r.options;
      if (reordered.length === r.options.length) orders.unshift(['recorded', reordered]);
    }
    for (const [, opts] of orders) {
      const h = pinHashes({ stem: r.stem, explanation: r.explanation, options: opts });
      candidates.push({ subject: 'ROW_PROJECTION_RETENTION_EXCLUDED', hash: h.retentionExcluded });
      candidates.push({ subject: 'ROW_PROJECTION_RETENTION_INCLUDED', hash: h.retentionIncluded });
    }
    // the canonical (value-sorted) form, so a signature already in it is named as such
    const canon = pinHashes({ stem: r.stem, explanation: r.explanation, options: [...r.options].sort((a, b) => val(a).localeCompare(val(b))) });
    candidates.push({ subject: 'ROW_PROJECTION_CANONICAL_ORDER', hash: canon.retentionExcluded });
    // execution texts on the row
    for (const o of r.options) if (o.misconceptionExecution) candidates.push({ subject: 'EXECUTION_TEXT', hash: sha(o.misconceptionExecution) });
    // the admin surface's own subject, both prompt readings
    const stem = r.stem as Record<string, unknown>;
    const optText = r.options.map((o) => ({ text: typeof o.content === 'string' ? o.content : val(o), isCorrect: o.isCorrect }));
    for (const key of ['text', 'prompt']) {
      candidates.push({ subject: 'DRAFT_ASSESSMENT', hash: draftAssessmentSubjectHash({ prompt: (stem[key] as string) ?? null, tier: r.difficultyTier, options: optText }) });
    }

    const d = deriveSubject(s.subjectHash!, candidates);
    results.push({ signatureId: s.id, itemId: s.recordId, recordType: s.recordType, status: r.status,
      subject: d.subject, kind: d.kind, spec: d.spec, derivedBy: d.derivedBy,
      classification: d.subject ? 'DERIVED' : 'UNKNOWN',
      writtenByTheAdminSurface: (s.note ?? '').startsWith(SURFACE_NOTE) });
    if (APPLY && d.subject) {
      await prisma.attributionEvent.update({ where: { id: s.id }, data: { subjectKind: d.kind, subjectSpec: d.spec } });
    }
  }

  // ---- THE POPULATION NOBODY HAD COUNTED -------------------------------------------------------
  const byNote = results.filter((x) => x.writtenByTheAdminSurface);
  const byDerivation = results.filter((x) => x.subject === 'DRAFT_ASSESSMENT');
  const noteButNotDerived = byNote.filter((x) => x.subject !== 'DRAFT_ASSESSMENT');
  const derivedButNotNote = byDerivation.filter((x) => !x.writtenByTheAdminSurface);
  const tally = results.reduce<Record<string, number>>((a, x) => { const k = (x.subject as string) ?? (x.classification as string) ?? 'UNKNOWN'; a[k] = (a[k] ?? 0) + 1; return a; }, {});

  const report = {
    kind: 'SIGNATURE-SUBJECTS-DERIVED-AND-THE-SURFACE-POPULATION-COUNTED',
    TO: 'Annie; David; the authoring store by relay', date: '2026-09-02', mode: APPLY ? 'APPLIED' : 'DRY RUN',
    HER_RULING: 'every signature declares its subject by name and by spec in a field that travels with it; derived where derivable, UNKNOWN where not, invented never (her 216th).',
    andWHATTHISISNOT: 'not a change to what any stored signature asserted. It is the statement of what each one always asserted, made legible. No hash was recomputed into a row, no signature re-issued, and canonical order binds only signatures made or re-made from here (her 216th withdraws A as a migration).',
    THE_DECLARED_SUBJECTS: SIGNATURE_SUBJECTS,
    THE_POPULATION: { signaturesCarryingASubjectHash: sigs.length, distinctItems: rows.size },
    DERIVED: tally,
    THE_ADMIN_SURFACE_POPULATION: {
      theQuestion: 'how many stored signatures came through the in-platform admin review surface — the subject the PRODUCT writes when a reviewer signs?',
      byTheSurfacesOwnNote: byNote.length,
      byReDerivationOfItsSubject: byDerivation.length,
      andWHYBOTHAREREPORTED: 'the METHOD on a signature is typed by a person and cannot identify a path; the NOTE is written by the code itself, so it marks the path. Re-derivation is the stronger evidence but it fails where a hashed field has since moved. Reporting one figure would have hidden the difference.',
      signedThereButItsSubjectNoLongerReproduces: noteButNotDerived.map((x) => ({ itemId: x.itemId, status: x.status, subject: x.subject ?? 'UNKNOWN' })),
      reproducesTheSurfacesSubjectWithoutItsNote: derivedButNotNote.map((x) => ({ itemId: x.itemId, status: x.status })),
      THE_READING: `${byNote.length} signature(s) carry the surface's own marker. ${byDerivation.length} reproduce its subject by re-derivation. The ${noteButNotDerived.length} that carry the marker and no longer reproduce are the population this field exists for: signed through the product's own path, and unreadable to any verifier that assumes the row projection.`,
    },
    UNKNOWN_AND_WHY_THAT_IS_A_STATE: {
      count: tally.UNKNOWN ?? 0,
      andNOTTOBECONFUSEDWITH: `${tally['NOT AN ITEM SUBJECT'] ?? 0} signature(s) over template families, whose own spec is simply not declared in this set. Not applicable is not unknown, and folding them together would have reported a third of the estate's signatures as unreadable.`,
      rule: 'a signature whose hash no declared subject reproduces keeps whatever standing it had. The field says UNKNOWN; nothing is invented to fill it (R98, and her rule for before-images all week).',
      rows: results.filter((x) => x.classification === 'UNKNOWN').map((x) => ({ itemId: x.itemId, status: x.status, writtenByTheAdminSurface: x.writtenByTheAdminSurface })),
    },
    PER_SIGNATURE: results,
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  Object.assign(clean, findingsDigest(clean, ['PER_SIGNATURE', 'DERIVED', 'THE_ADMIN_SURFACE_POPULATION', 'THE_DECLARED_SUBJECTS']));
  const p = pjoin(REPO, 'content/exports', stampedName('signature-subjects-derived', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'signature-subjects-derived').split('/').pop()!;
    const b = readFileSync(pjoin(LANE, name));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${sha(b)}  ${name}\n`);
    writeFileSync(pjoin(DL, name), b);
    console.log(`\n  crossed: ${name} (${sha(b).slice(0, 16)})`);
  }
  console.log(`  derived: ${JSON.stringify(tally)}`);
  console.log(`  admin surface — by its own note: ${byNote.length} | by re-derivation: ${byDerivation.length} | marked but no longer reproducing: ${noteButNotDerived.length}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
