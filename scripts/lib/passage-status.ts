/**
 * PASSAGE STATUS, AS ITEMS HAVE IT (David's ruling on Annie's 109th shape, 2026-08-23 — R657).
 *
 * **The serve path reads the status and nothing else** — it never evaluates flags and it has
 * nothing that can throw. A judge's disposition on a serving passage moves the status THROUGH THIS
 * PATH with the authority recorded, exactly as the item gate records every ruling: the write path
 * is the strongest reader a decision field can have (her R644 line, proven on a word card).
 *
 * **Fails closed, like Item.status**: a passage without an explicit SERVABLE status does not
 * serve. The migration derives all 29 — never types them.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * UNRECORDED minted by David, 2026-08-23, distinct from WITHHELD: **withheld means judged and
 * stopped; unrecorded means never judged.** Neither serves — the serve path admits SERVABLE alone.
 */
export type PassageServingStatus = 'SERVABLE' | 'WITHHELD' | 'UNRECORDED';

export interface PassageStatusRecord {
  status: PassageServingStatus;
  /** Who moved it — a MAY_JUDGE name, or the migration's derivation. */
  movedBy: string;
  /** The return/document and digest carrying the disposition, or the derivation record. */
  authority: string;
  at: string;
  /** The disposition that moved it, where a judge did (CUT, REFER, a lifted refer…). */
  disposition?: string;
}

/**
 * Move a passage's status through the standing path. Asserts the expected prior status (a move
 * that lands on an unexpected state refuses — the byte-guard discipline, R87's family), stamps the
 * displaced record, writes the new one with its authority.
 */
export function movePassageStatus(
  passagesDir: string,
  passageId: string,
  expectPrior: PassageServingStatus | 'UNSET',
  next: PassageStatusRecord,
): void {
  const path = join(passagesDir, `${passageId}.json`);
  const p = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const prior = (p.passageStatus ?? null) as PassageStatusRecord | null;
  const priorStatus = prior?.status ?? 'UNSET';
  if (priorStatus !== expectPrior) {
    throw new Error(
      `movePassageStatus REFUSED — ${passageId} holds ${priorStatus}, expected ${expectPrior}. `
      + 'A move that lands on an unexpected state is a move about a different passage history.',
    );
  }
  if (prior) p._previousPassageStatus = prior;
  p.passageStatus = next;
  writeFileSync(path, JSON.stringify(p, null, 1));
}
