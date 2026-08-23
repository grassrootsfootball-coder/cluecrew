/**
 * THE CLOZE GAP, NAMED IN THE EAR (Annie's cloze rulings via the 119th thread — R668).
 *
 * A gap marker prints as `___(4)___`, which a screen reader renders as underscore noise. Her
 * ruling: **every gap names itself in the accessibility channel by the ITEM'S OWN gapIndex** — the
 * ear hears "gap 4" where the eye sees the marker. Pure, so it is testable without a harness; the
 * renderer consumes the segments.
 */
export type CarrierSegment =
  | { kind: 'text'; text: string }
  | { kind: 'gap'; marker: string; printedIndex: number };

export function splitCarrierAtGaps(carrier: string): CarrierSegment[] {
  const out: CarrierSegment[] = [];
  let last = 0;
  for (const m of carrier.matchAll(/___\((\d+)\)___/g)) {
    if (m.index! > last) out.push({ kind: 'text', text: carrier.slice(last, m.index) });
    out.push({ kind: 'gap', marker: m[0], printedIndex: Number(m[1]) });
    last = m.index! + m[0].length;
  }
  if (last < carrier.length) out.push({ kind: 'text', text: carrier.slice(last) });
  return out;
}
