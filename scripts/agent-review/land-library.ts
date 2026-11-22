/**
 * LIBRARY ATTESTATION under the agent-review regime (R1021). Reads every
 * `content/agent-review/library/verdicts-*.json` and, for refused entries, the INDEPENDENT check of the
 * proposed transforms in `transform-review-*.json`.
 *
 *   ATTEST                                  → stamp `reviewer:rev-agent-01`, text untouched.
 *   REFUSE + transforms + a second ATTEST    → apply each transform (its `from` must occur EXACTLY ONCE —
 *                                             R87), gate the new text, refuse a cut to approved text
 *                                             unless it is the reviewer's own redraft (R213), then stamp.
 *   anything else                           → left as it is, and listed.
 *
 * Library text is DB-authored; a transform survives a stale copy where a rewrite does not (CLAUDE.md).
 * Provenance records that the approver is a MACHINE (R98); a person's name is never written (R94).
 *   tsx scripts/agent-review/land-library.ts [--apply]
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { checkChildFacingText, checkMisconceptionProposal, isBlocking } from '../../packages/core/src/content-gates';
import { refuseApprovedTrim } from '../../packages/core/src/approved-text-guard';

const DIR = pjoin(__dirname, '..', '..', 'content', 'agent-review', 'library');
const APPLY = process.argv.includes('--apply');
const AGENT = 'rev-agent-01';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
type Transform = { field: 'childHint' | 'description'; from: string; to: string };
type Verdict = { id: string; verdict: string; reason?: string; transforms?: Transform[] };

async function main() {
  const files = readdirSync(DIR);
  const read = (prefix: string) => files.filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
    .map((f) => { const t = readFileSync(pjoin(DIR, f), 'utf8'); return { f, sha: sha(t), body: JSON.parse(t) as { entries: Verdict[] } }; });
  const verdicts = read('verdicts-');
  // R1037: A CHECK ATTESTS THE TRANSFORMS OF ITS OWN ROUND, NOT WHATEVER TRANSFORMS SHARE ITS ENTRY ID.
  // Keyed by id alone, round L2's ATTEST would have applied round L's REFUSED transforms (verdicts-L is
  // read first and finds an ATTEST under the same id). So `transform-review-<S>` pairs with
  // `verdicts-<S>`; the id-only fallback survives only where exactly ONE verdict file proposes
  // transforms for the entry (the older rounds, whose check files are named for several rounds).
  const suffix = (f: string, prefix: string) => f.slice(prefix.length, -'.json'.length);
  const checkFiles = read('transform-review-');
  const checksBySuffix = new Map(checkFiles.flatMap((x) => x.body.entries.map((e) => [`${suffix(x.f, 'transform-review-')}|${e.id}`, { ...e, file: x.f, sha: x.sha }] as const)));
  const checksById = new Map(checkFiles.flatMap((x) => x.body.entries.map((e) => [e.id, { ...e, file: x.f, sha: x.sha }] as const)));
  const proposers = new Map<string, number>();
  for (const vf of verdicts) for (const v of vf.body.entries) if (v.verdict === 'REFUSE' && v.transforms?.length) proposers.set(v.id, (proposers.get(v.id) ?? 0) + 1);
  const checkFor = (vfile: string, id: string) => checksBySuffix.get(`${suffix(vfile, 'verdicts-')}|${id}`) ?? (proposers.get(id) === 1 ? checksById.get(id) : undefined);
  const out: Array<Record<string, unknown>> = [];
  for (const vf of verdicts) for (const v of vf.body.entries) {
    const m = await prisma.misconception.findUnique({ where: { id: v.id } });
    if (!m) { out.push({ id: v.id, outcome: 'NOT FOUND' }); continue; }
    if (m.status !== 'ACTIVE') { out.push({ id: v.id, outcome: `skipped: ${m.status}` }); continue; }
    if (m.approvedBy === `reviewer:${AGENT}`) { out.push({ id: v.id, outcome: 'already attested' }); continue; }
    const next = { description: m.description, childHint: m.childHint };
    let method: string;
    if (v.verdict === 'ATTEST') {
      method = `ATTESTED unchanged by the machine reviewer ${AGENT} on a two-pass reading (assertion, then generality) against every carrier; ${vf.f} sha256 ${vf.sha.slice(0, 16)}.`;
    } else if (v.verdict === 'REFUSE' && v.transforms?.length) {
      const c = checkFor(vf.f, v.id);
      if (c?.verdict !== 'ATTEST') { out.push({ id: v.id, outcome: `held: transform not independently attested (${c?.verdict ?? 'no check'})` }); continue; }
      const bad: string[] = [];
      for (const t of v.transforms) {
        const cur = next[t.field];
        const n = cur.split(t.from).length - 1;
        if (n !== 1) { bad.push(`${t.field}: "${t.from}" occurs ${n} times`); continue; }
        next[t.field] = cur.replace(t.from, t.to);
      }
      const gate = [...checkMisconceptionProposal({ id: m.id, ...next }),
        ...checkChildFacingText({ role: 'hint', label: `${m.id}.childHint`, text: next.childHint }).filter(isBlocking)];
      const trim = refuseApprovedTrim({ id: m.id, before: m.childHint, after: next.childHint, row: m,
        approverRedraft: { approvedBy: `reviewer:${AGENT}`, authority: `${c.file} sha256 ${c.sha}` } });
      if (bad.length || gate.length || trim) { out.push({ id: v.id, outcome: 'held', bad, gate: gate.map((g) => `${g.rule}: ${g.detail}`), trim }); continue; }
      method = `TRANSFORMED then ATTESTED by the machine reviewer ${AGENT}: refused in ${vf.f} (sha256 ${vf.sha.slice(0, 16)}) with transform(s), the transform(s) independently attested in ${c.file} (sha256 ${c.sha.slice(0, 16)}), gated before the write.`;
    } else { out.push({ id: v.id, outcome: `held: ${v.verdict} with no transform` }); continue; }

    const prov = (m.textProvenance && typeof m.textProvenance === 'object' ? m.textProvenance : {}) as Record<string, unknown>;
    const textChanged = next.childHint !== m.childHint || next.description !== m.description;
    out.push({ id: v.id, outcome: textChanged ? 'TRANSFORMED + ATTESTED' : 'ATTESTED', before: textChanged ? { childHint: m.childHint, description: m.description } : undefined, after: textChanged ? next : undefined });
    if (!APPLY) continue;
    // R1037: each entry is its own transaction, so one refused write must not abort the entries after it.
    // The write-level approved-text guard (R213) is stricter than refuseApprovedTrim above; when it refuses,
    // the entry is HELD and reported, never retried in another shape here.
    try { await prisma.$transaction(async (tx) => {
      await tx.misconception.update({ where: { id: m.id }, data: { ...next, approvedBy: `reviewer:${AGENT}`, approvalMethod: method,
        textProvenance: { ...prov, agentAttestation: { approvedBy: `reviewer:${AGENT}`, approverKind: 'MACHINE', textChanged, method, date: new Date().toISOString().slice(0, 10),
          previousApprovedBy: m.approvedBy ?? null } } } });
      if (textChanged) for (const f of ['childHint', 'description'] as const) if (next[f] !== m[f])
        await tx.attributionEvent.create({ data: { recordType: 'misconception', recordId: m.id, action: 'AMENDED', reviewerId: AGENT, actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: f, method,
          note: `before sha256 ${sha(m[f]).slice(0, 16)}; after sha256 ${sha(next[f]).slice(0, 16)}` } });
      await tx.attributionEvent.create({ data: { recordType: 'misconception', recordId: m.id, action: 'APPROVED', reviewerId: AGENT, actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: 'approvedBy', method,
        note: `previous approvedBy ${m.approvedBy ?? 'none'} — not rewritten in history (R65)` } });
    }); } catch (e) {
      out[out.length - 1] = { id: v.id, outcome: 'held: refused at write', error: String((e as Error).message).slice(0, 400) };
      console.error(`  ${v.id}: REFUSED AT WRITE — ${String((e as Error).message).slice(0, 200)}`);
      process.exitCode = 1;
    }
  }
  const tally = out.reduce<Record<string, number>>((a, o) => { const k = String(o.outcome).split(':')[0] ?? ''; a[k] = (a[k] ?? 0) + 1; return a; }, {});
  console.log(`library — ${APPLY ? 'APPLY' : 'DRY RUN'}: ${JSON.stringify(tally)}`);
  for (const o of out) if (!String(o.outcome).startsWith('ATTESTED') && o.outcome !== 'TRANSFORMED + ATTESTED') console.log(`  ${o.id}: ${JSON.stringify(o).slice(0, 300)}`);
  writeFileSync(pjoin(DIR, `landed-${APPLY ? 'apply' : 'dry'}.json`), JSON.stringify(out, null, 1));
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
