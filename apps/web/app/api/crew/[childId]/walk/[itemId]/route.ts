/**
 * THE WALK CONTENT DOOR — the first path in the product that reads `walkScript` for a child.
 *
 * **THIS ROUTE IS WHAT `check:walkscript-reach` EXISTS TO CATCH**, and its arrival is that check
 * working rather than failing: the check asserted no child-reachable path read the field, and this
 * is the commit that makes the assertion false on purpose. The check now asserts the narrower and
 * more useful property — that only APPROVED scripts leave the server.
 *
 * **APPROVAL IS CHECKED HERE, AT THE DOOR, NOT IN THE COMPONENT.** A client-side gate is a
 * suggestion. Today `WALK_APPROVED_ITEM_IDS` is empty by design, so this route serves nothing and
 * says why in a field a person can read — never an empty array that a caller would render as "no
 * content authored" (R98: unknown is not absent).
 */
import { NextResponse } from 'next/server';
import { WALK_APPROVAL_STATE, walkScriptMayServe } from '@cluecrew/core';
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

  if (!walkScriptMayServe(itemId)) {
    return NextResponse.json({
      itemId,
      sentences: [],
      withheld: WALK_APPROVAL_STATE.approvedCount === 0
        ? `NO SCRIPT HAS BEEN READ BY A REVIEWER YET. ${WALK_APPROVAL_STATE.reasonWhenEmpty}`
        : 'This item\'s walk script is not in the approved set.',
    });
  }

  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { explanation: true, status: true } });
  if (!item) return NextResponse.json({ error: 'no such item' }, { status: 404 });
  if (item.status !== 'LIVE') {
    return NextResponse.json({ itemId, sentences: [], withheld: `item status is ${item.status}, not LIVE` });
  }

  const script = ((item.explanation ?? {}) as Record<string, unknown>).walkScript;
  if (typeof script !== 'string' || script.trim() === '') {
    // Approved but empty is a CONTRADICTION, not a quiet no-content case: something approved a
    // script that is not there. Say so rather than returning a clean empty.
    return NextResponse.json(
      { error: `item ${itemId} is in the approved walk set but carries no walkScript` },
      { status: 500 },
    );
  }
  return NextResponse.json({ itemId, sentences: sentences(script) });
}
