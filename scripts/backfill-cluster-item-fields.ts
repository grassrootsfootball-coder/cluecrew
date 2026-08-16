/**
 * RESTORE THE FIELDS THE OLD CLUSTER IMPORTER DROPPED — `pnpm backfill:cluster-fields [--write]`
 *
 * The importer that landed ENG-005..012 named six fields and wrote five, so `passageRef`,
 * `lineRefs` and `orderAnchor` were read out of the source and written nowhere. All 86 items it
 * landed are missing all three. The door is fixed (`cowork-item-keys.ts` refuses an unrecognised
 * key); this repairs what it already let through.
 *
 * SECOND PASS, 2026-08-16: the carriage rule widened — everything Cowork holds crosses unless a
 * reason can be named — so `tierRationale`, `sourcedFrom`, `mechanismLedger` and per-option
 * `misconceptionExecution` now have columns and are restored here too. Options are matched by
 * LABEL, not by position: position is what the letter is derived FROM, so matching on it would
 * make the check circular.
 *
 * THE LABEL ITSELF CAN BE THE THING THAT IS MISSING. Two of 715 stored options carry NO label —
 * the letter is derived at render time from position, so both items read perfectly and no gate
 * had anything to object to. Neither carries an attribution event, no script in this repo writes
 * a single option's content except the normalisation pass (which always writes a label), and no
 * commit references either id: the write is UNATTRIBUTABLE from the repo. That is the case the
 * write-boundary record exists for, and it is now an instance rather than a hypothetical.
 *
 * So the matcher falls back to an EXACT TEXT match when the label does not resolve, restores the
 * missing label from the source, and REPORTS every fallback by name. A fallback that matched more
 * than one option, or none, refuses — matching by position there would be guessing at identity.
 *
 * NOT A CORRECTION OF COWORK'S CONTENT. Every value here comes from the source file unchanged —
 * the fault was carriage, not authoring, so nothing is recomputed or inferred on this side.
 *
 * IT REFUSES RATHER THAN OVERWRITES. If the database already holds one of these fields and
 * disagrees with the file, both sides have moved and the merge is a ruling, not a backfill
 * (CLAUDE.md: the gate-forced side exports first). Measured before writing: 0 disagreements.
 *
 * THE HASH IS NAMED, NOT ASSUMED (David's standing rule, 2026-08-13). Every comparison states the
 * hash of the artefact it ran against, so a later run against a different delivery is visible as a
 * different hash rather than as a silent re-read.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { unknownCoworkKeys } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const DIR = '/Users/davidb/Downloads/11+/from-cluecrew';
const CLUSTERS = ['005', '006', '007', '008', '009', '010', '011', '012'];
/** Item-level fields carried onto the stem, because no column holds them yet. */
const CARRIED = ['passageRef', 'lineRefs', 'orderAnchor'] as const;
/** Item-level fields with columns of their own. */
const COLUMNS = ['tierRationale', 'sourcedFrom', 'mechanismLedger'] as const;
/** Option-level fields with columns of their own. */
const OPTION_COLUMNS = ['misconceptionExecution', 'senseTarget'] as const;

/**
 * ORDER-INSENSITIVE COMPARISON, because Postgres JSONB does not preserve object key order.
 * A raw JSON.stringify diff reports PERMANENT FALSE DRIFT on any structured field — CLAUDE.md
 * says so explicitly and this script did it anyway: the first --write run reported 31 of 86 items
 * matching, and the 55 "failures" were exactly the items carrying a mechanismLedger, every one of
 * them stored correctly with its keys in a different order.
 */
const canonical = (v: unknown): string => {
  const walk = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(walk);
    if (x && typeof x === 'object') {
      return Object.fromEntries(Object.keys(x as object).sort().map((k) => [k, walk((x as Record<string, unknown>)[k])]));
    }
    return x;
  };
  return JSON.stringify(walk(v));
};

/** The option's text under either envelope, so both sides are read the same way. */
const textOf = (c: unknown): string =>
  typeof c === 'string' ? c
    : c && typeof c === 'object' && 'value' in c ? String((c as { value: unknown }).value) : '';
const DAVID = 'human:david@cluecrew.test';

async function main(): Promise<void> {
  const write = process.argv.includes('--write');

  const drafts: Array<Record<string, unknown>> = [];
  for (const c of CLUSTERS) {
    const raw = readFileSync(`${DIR}/eng${c}-draft.json`, 'utf8');
    console.log(`  eng${c}-draft.json  sha256 ${createHash('sha256').update(raw).digest('hex').slice(0, 16)}`);
    drafts.push(...(JSON.parse(raw).items as Array<Record<string, unknown>>));
  }

  // Same refusal as the import door. A source carrying a key nobody has decided about is not a
  // source this script may read three fields out of and call the rest someone else's problem.
  const unknown = drafts.flatMap((d) => unknownCoworkKeys(d));
  if (unknown.length > 0) {
    console.error(`\nREFUSED — ${unknown.length} unrecognised key(s) in the source; see cowork-item-keys.ts.`);
    for (const u of [...new Set(unknown.map((u2) => `${u2.level}.${u2.key}`))]) console.error(`  x ${u}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const rows = await prisma.item.findMany({
    where: { id: { in: drafts.map((d) => String(d.itemId)) } },
    select: {
      id: true, stem: true, status: true, tierRationale: true, sourcedFrom: true, mechanismLedger: true,
      options: { select: { id: true, content: true, senseTarget: true, misconceptionExecution: true } },
    },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));

  const updates: Array<{
    id: string; stem: Record<string, unknown>; added: string[];
    cols: Record<string, unknown>;
  }> = [];
  const optionUpdates: Array<{ id: string; data: Record<string, unknown>; added: string[] }> = [];
  const unmatchedOptions: string[] = [];
  const labelRestored: string[] = [];
  const disagreeing: string[] = [];
  const absentFromDb: string[] = [];
  let alreadyComplete = 0;

  for (const d of drafts) {
    const id = String(d.itemId);
    const row = byId.get(id);
    if (!row) { absentFromDb.push(id); continue; }
    const stem = { ...((row.stem ?? {}) as Record<string, unknown>) };
    const added: string[] = [];
    for (const k of CARRIED) {
      const src = d[k];
      if (src === undefined || src === null) continue;
      if (stem[k] === undefined) { stem[k] = src; added.push(k); }
      else if (canonical(stem[k]) !== canonical(src)) {
        disagreeing.push(`${id}.${k}: db=${JSON.stringify(stem[k])} file=${JSON.stringify(src)}`);
      }
    }
    // Columns of their own. Same rule: absent here and present there is a repair; present and
    // disagreeing is a merge ruling and refuses.
    const cols: Record<string, unknown> = {};
    for (const k of COLUMNS) {
      const src = d[k];
      if (src === undefined || src === null) continue;
      const cur = (row as unknown as Record<string, unknown>)[k];
      if (cur === null || cur === undefined) { cols[k] = src; added.push(k); }
      else if (canonical(cur) !== canonical(src)) {
        disagreeing.push(`${id}.${k}: db=${JSON.stringify(cur)} file=${JSON.stringify(src)}`);
      }
    }

    // OPTIONS MATCHED BY LABEL. Position is what the stored label is derived from, so matching on
    // position would be checking the derivation against itself.
    const byLabel = new Map(row.options.map((o) => [
      String((o.content as { label?: unknown })?.label ?? ''), o,
    ]));
    for (const [i, src] of (d.options as Array<Record<string, unknown>> ?? []).entries()) {
      const label = String(src.label ?? ['A', 'B', 'C', 'D', 'E', 'F'][i] ?? i);
      let opt = byLabel.get(label);
      const data: Record<string, unknown> = {};
      const oAdded: string[] = [];

      if (!opt) {
        // FALLBACK: exact text. Only accepted when it resolves to EXACTLY ONE stored option.
        const byText = row.options.filter((o) => textOf(o.content) === textOf(src.content));
        if (byText.length !== 1) {
          unmatchedOptions.push(
            `${id} option ${label}: no label match and ${byText.length} text match(es)`,
          );
          continue;
        }
        opt = byText[0]!;
        const stored = String((opt.content as { label?: unknown })?.label ?? '');
        if (stored === '') {
          data.content = { ...(opt.content as object), label };
          oAdded.push('content.label');
          labelRestored.push(`${id} option ${label} — matched on exact text, label restored`);
        } else {
          unmatchedOptions.push(`${id} option ${label}: text matches an option labelled ${stored}`);
          continue;
        }
      }
      for (const k of OPTION_COLUMNS) {
        const v = src[k];
        if (v === undefined || v === null) continue;
        const cur = (opt as unknown as Record<string, unknown>)[k];
        if (cur === null || cur === undefined) { data[k] = v; oAdded.push(k); }
        else if (cur !== v) disagreeing.push(`${id}/${label}.${k}: db=${JSON.stringify(cur)} file=${JSON.stringify(v)}`);
      }
      if (oAdded.length) optionUpdates.push({ id: opt.id, data, added: oAdded });
    }

    if (added.length) updates.push({ id, stem, added, cols });
    else alreadyComplete += 1;
  }

  if (labelRestored.length > 0) {
    console.log(`\n${labelRestored.length} option(s) matched by TEXT because the stored label was absent:`);
    for (const l of labelRestored) console.log(`  · ${l}`);
    console.log('  Unattributable writes — see the header. Reported, not passed over.');
  }
  if (unmatchedOptions.length > 0) {
    console.error(`\nREFUSED — ${unmatchedOptions.length} source option(s) matched no stored option by label:`);
    for (const u of unmatchedOptions.slice(0, 10)) console.error(`  x ${u}`);
    console.error('Writing these by position would guess at an identity. Nothing written.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(
    `\n${drafts.length} drafted · ${rows.length} present in the database · ` +
      `${updates.length} to repair · ${alreadyComplete} already complete · ${absentFromDb.length} not imported`,
  );
  const perField = [...CARRIED, ...COLUMNS]
    .map((k) => `${k}=${updates.filter((u) => u.added.includes(k)).length}`).join(' ');
  console.log(`  item fields to restore:   ${perField}`);
  console.log(`  option fields to restore: ` + OPTION_COLUMNS
    .map((k) => `${k}=${optionUpdates.filter((u) => u.added.includes(k)).length}`).join(' ')
    + ` (over ${optionUpdates.length} option row(s))`);

  if (disagreeing.length > 0) {
    console.error(`\nREFUSED — ${disagreeing.length} field(s) present on BOTH sides and disagreeing:`);
    for (const m of disagreeing) console.error(`  x ${m}`);
    console.error('Both sides have moved. That is a merge ruling, not a backfill. Nothing written.');
    await prisma.$disconnect();
    process.exit(1);
  }

  if (updates.length === 0 && optionUpdates.length === 0) {
    console.log(`\nNothing to repair: ${rows.length} rows were read and every field the source carries is present.`);
    await prisma.$disconnect();
    return;
  }
  if (!write) {
    console.log('\nDry run. Re-run with --write to apply.');
    await prisma.$disconnect();
    return;
  }

  // ONE TRANSACTION, then the attribution. A half-applied repair is the fault being repaired.
  await prisma.$transaction([
    ...updates.map((u) => prisma.item.update({
      where: { id: u.id }, data: { stem: u.stem as object, ...u.cols },
    })),
    ...optionUpdates.map((u) => prisma.itemOption.update({ where: { id: u.id }, data: u.data })),
  ]);
  for (const u of updates) {
    await prisma.attributionEvent.create({
      data: {
        recordType: 'item', recordId: u.id, action: 'AMENDED',
        // No reviewerId: an operational repair of a carriage fault, not a reviewer ruling.
        actor: DAVID, recordedBy: DAVID, field: u.added.map((a) => `stem.${a}`).join(', '),
        method: 'Cowork source re-read, 2026-08-16',
        note:
          `Restored ${u.added.join(', ')} from the Cowork draft file unchanged. The original import ` +
          'door enumerated its own field list and dropped these three; no value here was recomputed ' +
          'or inferred, and no child-facing text changed.',
      },
    });
  }

  // VERIFY BY RE-READING THE ROWS ACTED ON, never by counting what is left.
  const after = await prisma.item.findMany({
    where: { id: { in: updates.map((u) => u.id) } },
    select: {
      id: true, stem: true, tierRationale: true, sourcedFrom: true, mechanismLedger: true,
      options: { select: { content: true, misconceptionExecution: true, senseTarget: true } },
    },
  });
  const srcById = new Map(drafts.map((d) => [String(d.itemId), d]));
  const matches = (a: unknown, b: unknown): boolean => canonical(a) === canonical(b);
  let optionsChecked = 0;
  let optionsMatching = 0;
  const complete = after.filter((r) => {
    const st = (r.stem ?? {}) as Record<string, unknown>;
    const src = srcById.get(r.id)!;
    const row = r as unknown as Record<string, unknown>;
    const itemOk = CARRIED.every((k) => src[k] == null || matches(st[k], src[k]))
      && COLUMNS.every((k) => src[k] == null || matches(row[k], src[k]));
    const byLabel = new Map(r.options.map((o) => [String((o.content as { label?: unknown })?.label ?? ''), o]));
    let optOk = true;
    for (const [i, so] of (src.options as Array<Record<string, unknown>> ?? []).entries()) {
      const opt = byLabel.get(String(so.label ?? ['A', 'B', 'C', 'D', 'E', 'F'][i] ?? i));
      for (const k of OPTION_COLUMNS) {
        if (so[k] == null) continue;
        optionsChecked += 1;
        if (opt && matches((opt as unknown as Record<string, unknown>)[k], so[k])) optionsMatching += 1;
        else optOk = false;
      }
    }
    return itemOk && optOk;
  });
  console.log(`\nVERIFIED by re-reading all ${after.length} repaired rows:`);
  console.log(`  items matching the source on every carried field: ${complete.length} of ${after.length}`);
  console.log(`  option fields matching the source: ${optionsMatching} of ${optionsChecked}`);
  await prisma.$disconnect();
}

void main();
