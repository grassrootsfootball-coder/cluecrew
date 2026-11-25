/**
 * THE WALK CONTENT DOOR — the first path in the product that reads `walkScript` for a child.
 *
 * **THIS ROUTE IS WHAT `check:walkscript-reach` EXISTS TO CATCH**, and its arrival is that check
 * working rather than failing: the check asserted no child-reachable path read the field, and this
 * is the commit that makes the assertion false on purpose. The check now asserts the narrower and
 * more useful property — that only APPROVED scripts leave the server.
 *
 * **APPROVAL IS CHECKED HERE, AT THE DOOR, NOT IN THE COMPONENT.** A client-side gate is a
 * suggestion. Since R1067 the approval travels ON THE ROW (`walkApprovalOf`): a reviewer id, the
 * place the reading is recorded, and the digest of the exact script read. The row is read to answer
 * that, but the script itself leaves the server only after `walkApprovalOf` (and so the declared
 * `walkScriptMayServe` list it includes) has passed. A withheld script says why in a field a person
 * can read — never an empty array that a caller would render as "no content authored" (R98).
 */
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { walkApprovalOf, walkScriptMayServe } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';

/**
 * Sentence split for presentation only. It changes no words: the pieces rejoined are the script
 * character for character, and a script that does not split simply shows as one piece.
 */
function sentences(script: string): string[] {
  return script.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ childId: string; itemId: string }> },
) {
  const { itemId } = await params;

  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { explanation: true, status: true } });
  if (!item) return NextResponse.json({ error: 'no such item' }, { status: 404 });
  if (item.status !== 'LIVE') {
    return NextResponse.json({ itemId, sentences: [], withheld: `item status is ${item.status}, not LIVE` });
  }

  const explanation = (item.explanation ?? {}) as Record<string, unknown>;
  const script = explanation.walkScript;
  const digest = typeof script === 'string' ? createHash('sha256').update(script, 'utf8').digest('hex') : null;
  const approval = walkApprovalOf(itemId, explanation, digest);
  if (!approval.serves) {
    return NextResponse.json({ itemId, sentences: [], withheld: `Not read by a reviewer: ${approval.why}.` });
  }

  if (typeof script !== 'string' || script.trim() === '') {
    // Approved but empty is a CONTRADICTION, not a quiet no-content case: something approved a
    // script that is not there. Say so rather than returning a clean empty. (Only the declared list
    // can reach here — a row approval is bound to a digest of a non-empty script.)
    return NextResponse.json(
      { error: `item ${itemId} is in the approved walk set but carries no walkScript (declared list: ${walkScriptMayServe(itemId)})` },
      { status: 500 },
    );
  }
  return NextResponse.json({ itemId, sentences: sentences(script) });
}
