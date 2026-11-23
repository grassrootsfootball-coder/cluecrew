/**
 * PR-04'S FULL SERVING ROW, AS BYTES — ONE HALF OF A DIFF (David, 2026-08-22).
 *
 * The bank's 16 August repair replaced BOTH the stem and the hint (delivery 101's two-halves walk,
 * write n=2, with an assert before the write). This store demonstrably missed the hint move — its
 * `hintCore` is still the pre-repair string — **so whether it missed the STEM move is open, the item
 * is LIVE, and a stem serves to every child, not only to a child who misses.**
 *
 * **NOTHING IS CONCLUDED FROM ONE DISK.** This artefact is this store's half, verbatim, every field
 * with its read address. Cowork emits the bank's half; the diff is computed where both halves lie.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAMILY = 'pr04-serving-row';

async function main() {
  const i = await prisma.item.findUniqueOrThrow({ where: { id: 'ENG-028-PR-04' }, include: { options: { orderBy: { id: 'asc' } } } });
  const e = (i.explanation ?? {}) as Record<string, unknown>;

  const payload = {
    what: "ENG-028-PR-04 as this store would SERVE it now, verbatim, one field per row with its read address. One half of a diff; the bank's half is Cowork's to emit; nothing is concluded from one disk.",
    itemId: i.id,
    status: { value: i.status, readFrom: 'Item.status, row ENG-028-PR-04 (packages/db/prisma/schema.prisma:251)' },
    stem: {
      value: i.stem,
      readFrom: 'Item.stem, row ENG-028-PR-04 — served whole to EVERY child via the session payload, not only on a miss',
    },
    hintCore: {
      value: e.hintCore ?? null,
      readFrom: 'Item.explanation.hintCore — served on a miss via orchestrator.ts:951 -> hintToServe only when authorship fields are set; they are null here, so the LIBRARY hint of the missed option serves instead',
    },
    hintAuthorship: {
      hintAuthoredBy: e.hintAuthoredBy ?? null,
      hintAuthority: e.hintAuthority ?? null,
      readFrom: 'Item.explanation — both null: the hint is UNSERVED and PR-04 is not in the drain\'s done column',
    },
    previousHintCore: {
      value: e._previousHintCore ?? null,
      readFrom: 'Item.explanation._previousHintCore — the bank stamps its repair here; this store has NO stamp, consistent with never having received the 16 August rewrite',
    },
    options: i.options.map((o) => ({
      label: ((o.content ?? {}) as { label?: unknown }).label ?? null,
      value: ((o.content ?? {}) as { value?: unknown }).value ?? null,
      isCorrect: o.isCorrect,
      tag: (o as { misconceptionId?: string | null }).misconceptionId ?? null,
      readFrom: `ItemOption row ${o.id}`,
    })),
    theOpenQuestion: 'The bank replaced stem AND hint on 16 August under a named ruling. This store holds the PRE-repair hint. If the stem above is also the pre-repair stem, a LIVE item is serving a stem a ruling replaced six days ago — to every child, not only on a miss. The bank half decides it.',
  };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'PR-04 as served from this store, verbatim, every field with its read address — one half of the two-store diff',
    ['what', 'itemId', 'status', 'stem', 'hintCore', 'hintAuthorship', 'previousHintCore', 'options', 'theOpenQuestion']);
  const path = join(REPO, 'content/exports', stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);
  await prisma.$disconnect();
}

void main();
