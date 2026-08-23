/**
 * THE NVR SERVABILITY NOTICE SLOT (David, 2026-08-23 — R666). Renders wherever NVR is offered.
 *
 * **FAILS CLOSED TO NOT-RENDERING, TWICE**: nothing renders unless (1) NVR is actually offered on
 * the surface this slot sits in — the caller derives that from its own already-fetched data, so
 * the day NVR joins the map query this flips mechanically — AND (2) an Annie-approved wording has
 * landed through the standing path (`scripts/lib/nvr-notice.ts`). The slot ships EMPTY: until her
 * CONFIRMATIONS block exists the file carries nulls and this component returns null, which is the
 * only honest render for a statement nobody has approved.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function NvrServabilityNotice({ nvrOffered }: { nvrOffered: boolean }) {
  if (!nvrOffered) return null;
  let record: { text?: unknown; approvedBy?: unknown } = {};
  try {
    record = JSON.parse(readFileSync(resolve(process.cwd(), '../../content/notices/nvr-servability.json'), 'utf8'));
  } catch {
    return null; // fails closed: an unreadable record renders nothing, never a stub
  }
  if (typeof record.text !== 'string' || record.text.trim() === '' || typeof record.approvedBy !== 'string') {
    return null;
  }
  return (
    <p role="note" style={{ border: '1px solid #d0d0d0', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.95rem' }}>
      {record.text}
    </p>
  );
}
