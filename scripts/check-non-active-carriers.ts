/**
 * IS ANY OPTION TAGGED WITH A NON-ACTIVE ENTRY? (R618's check, approved with the design.)
 *
 * The resolver now refuses to serve a RETIRED/REJECTED wording (`resolveLibraryHint`), so a carrier
 * of one is a child who gets NOTHING where the tagger intended a hint — not a served fault, but a
 * silent hole this names before anyone wonders why an option went quiet.
 *
 * **The population CAN legitimately be empty — it is today — so the R582 shape applies**: the
 * SCREENED denominator (tagged options) is asserted non-empty, the OUTPUT population is declared
 * possibly-empty with its reason printed on every run, and the two cannot be read as one line.
 */
import { prisma } from '../packages/db/src/index';
import { declareMayBeEmpty, requirePopulation } from './lib/population';

async function main() {
  const lib = await prisma.misconception.findMany({ select: { id: true, status: true, childHint: true } });
  const byId = new Map(lib.map((m) => [m.id, m]));
  const items = await prisma.item.findMany({ include: { options: { orderBy: { id: 'asc' } } } });

  let tagged = 0;
  const findings: string[] = [];
  for (const i of items) {
    for (const o of i.options) {
      const mid = (o as { misconceptionId?: string | null }).misconceptionId;
      if (!mid) continue;
      tagged++;
      const m = byId.get(mid);
      const status = m?.status ?? 'NO SUCH ENTRY';
      if (status === 'ACTIVE') continue;
      findings.push(
        `  ${i.status.padEnd(7)} ${i.id}  option ${JSON.stringify(String(((o.content ?? {}) as { value?: unknown }).value ?? '')).slice(0, 44)}`
        + `\n          tag ${mid} -> ${status}. The child gets NOTHING here by design (resolveLibraryHint); `
        + 'retag or reactivate is a reviewer decision, not this check\'s.',
      );
    }
  }

  requirePopulation('check:non-active-carriers', { 'tagged option(s) screened — THE DENOMINATOR': tagged });
  declareMayBeEmpty('check:non-active-carriers', 'option(s) tagged with a non-ACTIVE entry', findings.length,
    'A clean bank legitimately has none: both non-ACTIVE English entries had zero carriers on the day '
    + 'this was written. The screened denominator above is asserted non-empty separately, so a broken '
    + 'query cannot produce this line.');

  for (const f of findings) console.error(f);
  if (findings.length > 0) process.exitCode = 1;
}

void main();
