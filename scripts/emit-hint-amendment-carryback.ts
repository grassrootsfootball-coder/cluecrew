/**
 * FIVE ITEM HINTS: THE ROWS CARRY HER AMENDMENT, THE AUTHORED FILES CARRY THE PRE-AMENDMENT TEXT
 * (R816). The reverse-drop class again (R786) — a repair that reached the row and not the source —
 * this time twelve times on one field, of which five are carry-backs and seven are hers to read.
 *
 * **Crossed as the stem-level corrections were: id, before, after, field named, NOTHING ELSE
 * PROPOSED.** No rewording is suggested, no authored text is judged, and the seven genuine rewrites
 * are not in this file at all.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
/**
    * **RESOLVED, NEVER HARDCODED** (R787). A frozen filename breaks the moment the artefact it
    * names is re-emitted — which is exactly what happened when the serving half gained its cut
    * stamp. The current emission is found by family prefix, and the file actually read is reported.
    */
   const OUT = '/Users/davidb/Downloads/11+/from-cluecrew';
   const SERVING = (() => {
     const hits = require('node:fs').readdirSync(OUT).filter((f: string) => f.startsWith('serving-hint-half-') && f.endsWith('.json'));
     if (hits.length !== 1) throw new Error(`expected exactly one serving-hint-half at the door, found ${hits.length}: ${hits.join(', ')} — refusing rather than guessing which (R173)`);
     return join(OUT, hits[0]!);
   })();
const DOWN = '/Users/davidb/Downloads';

/** What the amendment did, derived from the two strings rather than asserted. */
function faultsRepaired(before: string, after: string): string[] {
  const f: string[] = [];
  if (/[—–]/.test(before) && !/[—–]/.test(after)) f.push('EM DASH removed — a dash does not end or break a child-facing sentence (CLAUDE.md house rule)');
  const sentences = (s: string) => s.split(/[.!?]\s+/).filter(Boolean).length;
  if (sentences(after) > sentences(before)) f.push('SENTENCE SPLIT — one sentence became two');
  const shout = (s: string) => [...s.matchAll(/\b[A-Z]{1,}\b/g)].map((m) => m[0]).filter((w) => w.length <= 2 && w !== 'I' && w !== 'A');
  const lost = shout(before).filter((w) => !shout(after).includes(w));
  if (lost.length) f.push(`BARE CAPITAL expanded — ${lost.join(', ')} no longer stands alone as a token a child must decode`);
  if (/\bN\b/.test(before) && /No mistake/i.test(after)) f.push('N → "No mistake" — the answer named in words rather than by its option letter');
  return f.length ? f : ['REWORDING — no mechanical fault class matches; the difference is authorial'];
}

async function run() {
  assertFixture('hint-amendment-carryback', [
    { name: 'an em dash removed is a repaired fault', input: JSON.stringify(['a — b', 'a. b']), mustBeCaught: true },
    { name: 'a bare N expanded is a repaired fault', input: JSON.stringify(['N is a real answer', 'No mistake is a real answer']), mustBeCaught: true },
    { name: 'an identical pair repairs nothing mechanical', input: JSON.stringify(['same text', 'same text']), mustBeCaught: false },
    { name: 'a plain rewording repairs nothing mechanical', input: JSON.stringify(['one wording here', 'another wording here']), mustBeCaught: false },
  ], (raw) => { const [b, a] = JSON.parse(raw) as [string, string]; return !faultsRepaired(b, a)[0]!.startsWith('REWORDING'); });

  const serving = JSON.parse(readFileSync(SERVING, 'utf8')) as { ROWS: Array<{ source: string; rowId: string; text: string }> };
  const serves = new Map(serving.ROWS.filter((r) => r.source === 'ITEM').map((r) => [r.rowId, r.text]));

  const authored = new Map<string, Map<string, string[]>>(); // itemId -> text -> files
  const walk = (dir: string, n = 0): string[] => n > 3 ? [] : (() => { try { return require('node:fs').readdirSync(dir, { withFileTypes: true }).flatMap((e: { isDirectory(): boolean; name: string }) => e.isDirectory() ? walk(join(dir, e.name), n + 1) : (e.name.endsWith('.json') ? [join(dir, e.name)] : [])); } catch { return []; } })();
  for (const f of walk(DOWN)) {
    let d: unknown; try { d = JSON.parse(readFileSync(f, 'utf8')); } catch { continue; }
    const items = (d as { items?: unknown })?.items;
    if (!Array.isArray(items)) continue;
    for (const it of items as Array<{ itemId?: string; explanation?: { hintCore?: unknown } }>) {
      if (!it?.itemId || !serves.has(it.itemId)) continue;
      const h = it.explanation?.hintCore;
      if (typeof h !== 'string' || !h.trim()) continue;
      const m = authored.get(it.itemId) ?? new Map<string, string[]>();
      m.set(h.trim(), [...(m.get(h.trim()) ?? []), f.replace(`${DOWN}/`, '~/Downloads/')]);
      authored.set(it.itemId, m);
    }
  }
  requirePopulation('emit:hint-amendment-carryback', { 'serving item hints also found in authored files': authored.size });

  const carryBack = [];
  for (const [itemId, texts] of [...authored.entries()].sort()) {
    const after = serves.get(itemId)!;
    if ([...texts.keys()].includes(after)) continue; // an authored file already carries it
    carryBack.push({
      itemId, field: 'explanation.hintCore',
      before: [...texts.entries()].map(([text, files]) => ({ text, sha256: sha(text), inFiles: files })),
      after: { text: after, sha256: sha(after) },
      whatTheAmendmentDID: faultsRepaired([...texts.keys()][0]!, after),
      NOTHING_ELSE_PROPOSED: 'no rewording is suggested and no authored text is judged. This names a field, a before and an after.',
    });
  }

  /**
   * **RECLASSIFIED BY HER 176th: WIW-13 and WIW-20 are house-rule amendments, not rewrites**, and
   * join the carry-back — seven, not five. **This store holds no authored text for either**, so
   * the `before` cannot be supplied from here. That is stated per row rather than left blank: a
   * missing before and an empty before are different facts (R779).
   */
  for (const itemId of ['ENG-001-WIW-13', 'ENG-001-WIW-20']) {
    const after = serves.get(itemId);
    if (!after) continue;
    if (carryBack.some((c) => c.itemId === itemId)) continue;
    carryBack.push({
      itemId, field: 'explanation.hintCore',
      before: [{ text: 'NOT HELD ON THIS DISK — no authored file here carries a hintCore for this item. The pre-amendment text exists at the desk; it cannot be quoted from this side.', sha256: null as unknown as string, inFiles: [] }],
      after: { text: after, sha256: sha(after) },
      whatTheAmendmentDID: ['HOUSE-RULE AMENDMENT — reclassified by her 176th from rewrite to carriage. The class is hers; this store cannot derive it, having no before to compare.'],
      NOTHING_ELSE_PROPOSED: 'no rewording is suggested and no authored text is judged. This names a field and an after; the before is not available from this side.',
    });
  }
  carryBack.sort((a, b) => a.itemId.localeCompare(b.itemId));

  const payload = {
    kind: 'hint-amendment-carryback',
    HER_RECLASSIFICATION: 'her 176th: seven carriage rows, five rewrites. WIW-13 and WIW-20 move from rewrite to house-rule amendment and join this file. Of her five rewrites, four keep the serving text and WIW-22 takes the authored text — landed separately under her amendment block, not here.',
    THE_CLASS: 'THE REVERSE-DROP CLASS (R786) — a repair that reached the row and never reached the source. R758 was a field authored at the source and dropped at this store\'s door; this is its mirror, on `explanation.hintCore`.',
    WHAT_IS_HERE_AND_WHAT_IS_NOT: {
      here: 'rows where THIS store serves her amended text and NO authored file on this disk carries it. Those are carry-backs: the amendment exists, it simply never travelled.',
      notHere: 'the genuine rewrites, where the two texts differ by authorship rather than by a repair. **Those are Annie\'s to read, not this store\'s to reconcile**, and none is in this file.',
      alsoNotHere: 'rows where at least one authored file already carries the serving text — the amendment reached the source and nothing is owed.',
    },
    theServingHalfRead: SERVING.split('/').pop(),
    THE_DERIVATION: 'the serving half named in theServingHalfRead, intersected with every authored file on this disk carrying an `explanation.hintCore` for the same item id. A row qualifies only when NO authored text equals what serves. The fault classes are derived from the two strings, not asserted.',
    AND_A_BOUND_ON_IT: 'this compares against authored files ON THIS DISK, which are not the authoring store (R794). A row absent here may be carried in a file this store has never seen. **These five are owed on the evidence available; they are not a claim that only five are owed.**',
    CARRY_BACK: carryBack,
  };
  const lines = carryBack.map((c) => `${c.itemId}\t${c.field}\t${c.after.sha256}`);
  const d = digestOverText('the CARRY_BACK lines joined by \\n, each "<itemId>\\t<field>\\t<sha256 of the after text>"', lines.join('\n'));
  const full = { ...payload, CARRY_BACK_LINES: lines, carryBackSha256: d.value, carryBackSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['THE_CLASS', 'WHAT_IS_HERE_AND_WHAT_IS_NOT', 'CARRY_BACK', 'CARRY_BACK_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('hint-carriage-seven-third-crossing', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'hint-carriage-seven-third-crossing');
  console.log(`carry-backs: ${carryBack.map((c) => c.itemId).join(', ')}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
