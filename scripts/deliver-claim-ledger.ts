/**
 * THE CLAIM LEDGER AS A DELIVERY (Annie, 2026-08-21 — R377).
 *
 * `report:claim-ledger` prints a summary. **A summary tells her the size of the job without letting
 * her start it** — R367's finding one level on: a row is not a delivery, and neither is a console
 * table. This emits the POPULATION: every claim with its kind, its item or passage, the claim text,
 * **the text it is a claim about**, and its reachability, in the order the report orders them.
 *
 * **THE WHOLE 1,092 ARE HERE, NOT THE REACHABLE 443.** Emitting the reachable subset under a name
 * that says "ledger" would be the population question in a new place — a file that reads complete
 * and is not. The tranche boundaries are marked instead, so the ordering does the work the truncation
 * would have done, and nothing is missing from the file to be surprised by later.
 *
 * **The text-it-is-a-claim-about is RESOLVED wherever the store can resolve it**: a walk script gets
 * the passage lines it cites, a misconception description gets the option values tagged with it, a
 * flag reason gets its passage named (the passages themselves are already delivered whole). Where it
 * cannot be resolved, the row says so — an unresolvable comparison is a fact she needs, not a gap to
 * paper over.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGES = join(REPO_ROOT, 'content/passages');

interface Row {
  claimId: string;
  kind: string;
  claim: string;
  aboutLabel: string;
  about: string | null;
  reachable: number;
  status: string;
}

const CITED = /\bLines?\s+(\d+)(?:\s*(?:to|-|–)\s*(\d+))?/gi;

function passageLines(file: string): Map<number, string> {
  const j = JSON.parse(readFileSync(join(PASSAGES, file), 'utf8')) as { numberedLines?: unknown };
  const out = new Map<number, string>();
  if (Array.isArray(j.numberedLines)) {
    for (const l of j.numberedLines) {
      const r = l as { n?: unknown; text?: unknown };
      if (typeof r.n === 'number' && typeof r.text === 'string') out.set(r.n, r.text);
    }
  }
  return out;
}

async function main() {
  const passageFiles = readdirSync(PASSAGES).filter((f) => f.endsWith('.json'));
  const linesByPassage = new Map<string, Map<number, string>>();
  const passageMeta = new Map<string, { file: string; flags: unknown[]; curation: string | null; bandWhy: string | null }>();
  for (const f of passageFiles) {
    const j = JSON.parse(readFileSync(join(PASSAGES, f), 'utf8')) as Record<string, unknown>;
    const id = String(j.id);
    linesByPassage.set(id, passageLines(f));
    passageMeta.set(id, {
      file: f,
      flags: Array.isArray(j.contentFlags) ? j.contentFlags : [],
      curation: typeof j.curationNotes === 'string' ? j.curationNotes : null,
      bandWhy: (j.band as { why?: string } | undefined)?.why ?? null,
    });
  }

  const items = await prisma.item.findMany({ include: { options: true } });
  const liveBehind = new Map<string, number>();
  for (const i of items) {
    if (i.status !== 'LIVE') continue;
    const seen = new Set<string>();
    for (const c of [i.stem, i.explanation]) {
      const q = (c as { quotes?: unknown })?.quotes;
      if (Array.isArray(q)) {
        for (const e of q) {
          const pr = (e as { passageRef?: unknown })?.passageRef;
          if (typeof pr === 'string') seen.add(pr);
        }
      }
    }
    for (const r of seen) liveBehind.set(r, (liveBehind.get(r) ?? 0) + 1);
  }

  const rows: Row[] = [];

  for (const [id, meta] of passageMeta) {
    const reach = liveBehind.get(id) ?? 0;
    meta.flags.forEach((f, n) => {
      const text = typeof f === 'string' ? f : ((f as { reason?: string }).reason ?? JSON.stringify(f));
      rows.push({
        claimId: `${id}#flag[${n}].reason`, kind: 'flag reason', claim: text,
        aboutLabel: `the passage ${id}`, about: null, reachable: reach, status: reach > 0 ? 'REACHABLE' : 'stored',
      });
    });
    if (meta.curation) {
      rows.push({
        claimId: `${id}#curationNotes`, kind: 'curation note', claim: meta.curation,
        aboutLabel: `the passage ${id} and the ones not chosen`, about: null,
        reachable: reach, status: reach > 0 ? 'REACHABLE' : 'stored',
      });
    }
    if (meta.bandWhy) {
      rows.push({
        claimId: `${id}#band.why`, kind: 'band justification', claim: meta.bandWhy,
        aboutLabel: `the passage ${id}`, about: null, reachable: reach, status: reach > 0 ? 'REACHABLE' : 'stored',
      });
    }
  }

  for (const i of items) {
    const w = (i.explanation as { walkScript?: unknown })?.walkScript;
    if (typeof w !== 'string' || !w.trim()) continue;
    const pr = [i.stem, i.explanation].flatMap((c) => {
      const q = (c as { quotes?: unknown })?.quotes;
      return Array.isArray(q) ? q.map((e) => (e as { passageRef?: string })?.passageRef).filter(Boolean) : [];
    })[0] as string | undefined;
    const lines = pr ? linesByPassage.get(pr) : undefined;
    let about: string | null = null;
    if (lines) {
      const cited = new Set<number>();
      for (const m of w.matchAll(CITED)) {
        const a = Number(m[1]); const b = m[2] ? Number(m[2]) : a;
        for (let n = a; n <= b && n - a < 12; n++) cited.add(n);
      }
      const resolved = [...cited].sort((a, b) => a - b).map((n) => (lines.has(n) ? `  ${n}. ${lines.get(n)}` : `  ${n}. [no such line]`));
      about = resolved.length > 0 ? resolved.join('\n') : null;
    }
    /**
     * **A WALK SCRIPT WITH NO PASSAGE IS STILL A CLAIM ABOUT A TEXT — THE ITEM'S OWN.**
     *
     * The first version resolved only cited passage lines, so 640 of 705 scripts rendered as *"not
     * resolvable"* — 86% of the whole ledger. **That is a summary wearing a delivery's name**: a
     * reader cannot compare a claim against a blank. And it was wrong on its own terms, because a
     * VR walk script (*"Fearless carries that very meaning. Cowardly is its opposite"*) is a claim
     * about the OPTIONS, which are right there on the row.
     *
     * So: cited passage lines where a passage is declared, **the item's own stem and options
     * otherwise**. Unresolvable is reserved for rows where the store genuinely holds neither.
     */
    if (about === null) {
      const stemText = [
        (i.stem as { text?: unknown })?.text,
        (i.stem as { prompt?: unknown })?.prompt,
        (i.stem as { sentence?: unknown })?.sentence,
      ].find((t): t is string => typeof t === 'string' && t.trim() !== '');
      const opts = i.options.map((o) => {
        const c = (o as { content?: { value?: unknown; label?: unknown } }).content ?? {};
        const correct = (o as { isCorrect?: boolean }).isCorrect ? '  * ' : '    ';
        return `${correct}${c.label ? `${String(c.label)}. ` : ''}${typeof c.value === 'string' ? c.value : JSON.stringify(c.value)}`;
      });
      if (stemText || opts.length > 0) {
        about = [stemText ? `  ${stemText}` : null, opts.length ? '' : null, ...opts]
          .filter((l) => l !== null).join('\n');
      }
    }
    rows.push({
      claimId: `${i.id}#explanation.walkScript`, kind: 'walk script vs cited lines', claim: w,
      aboutLabel: pr ? `the lines it cites in ${pr}` : "the item's own stem and options (* marks the key)",
      about, reachable: i.status === 'LIVE' ? 1 : 0, status: i.status,
    });
  }

  const miscs = await prisma.misconception.findMany({ select: { id: true, description: true } });
  const taggedValues = new Map<string, string[]>();
  /**
   * **REACHABILITY IS LIVE CARRIERS, NOT ALL CARRIERS.** The first version counted every tagged
   * option whatever its status and put the total in a column headed LIVE — so
   * `en-plausible-not-stated` read as **209 LIVE** when 27 of its carriers are LIVE and 182 are
   * DRAFT. **A number labelled with a qualifier it does not have**, which is the 20-against-19 fault
   * in a column heading, in the artefact that orders her whole reading queue.
   */
  const liveCarriers = new Map<string, number>();
  for (const i of items) {
    for (const o of i.options) {
      const m = (o as { misconceptionId?: string | null }).misconceptionId;
      if (!m) continue;
      const v = ((o as { content?: { value?: unknown } }).content ?? {}).value;
      taggedValues.set(m, [...(taggedValues.get(m) ?? []), `  ${i.id} (${i.status}): ${typeof v === 'string' ? v : JSON.stringify(v)}`]);
      if (i.status === 'LIVE') liveCarriers.set(m, (liveCarriers.get(m) ?? 0) + 1);
    }
  }
  for (const m of miscs) {
    if (typeof m.description !== 'string' || !m.description.trim()) continue;
    const tagged = taggedValues.get(m.id) ?? [];
    rows.push({
      claimId: `${m.id}#description`, kind: 'misconception vs tagged items', claim: m.description,
      aboutLabel: `the ${tagged.length} option(s) tagged with it, ${liveCarriers.get(m.id) ?? 0} of them LIVE`,
      about: tagged.length > 0 ? tagged.slice(0, 24).join('\n') + (tagged.length > 24 ? `\n  … and ${tagged.length - 24} more` : '') : null,
      reachable: liveCarriers.get(m.id) ?? 0,
      status: (liveCarriers.get(m.id) ?? 0) > 0 ? 'REACHABLE' : tagged.length > 0 ? 'tagged but none LIVE' : 'stored',
    });
  }

  requirePopulation('deliver:claim-ledger', { 'claim(s)': rows.length });
  rows.sort((a, b) => b.reachable - a.reachable || a.kind.localeCompare(b.kind) || a.claimId.localeCompare(b.claimId));

  const reachable = rows.filter((r) => r.reachable > 0);
  const out: string[] = [
    '# The claim ledger — the whole population, ordered for reading',
    '',
    '**21 August 2026. For Annie.**',
    '',
    `**THIS FILE CARRIES ALL ${rows.length} CLAIMS, NOT THE REACHABLE ${reachable.length}.** Emitting the reachable`,
    'subset under a name that says "ledger" would be the population question in a new place — a file',
    'that reads complete and is not. **The ordering does the work truncation would have done**: rows are',
    'sorted by reachability, so the read starts where the children are and stops wherever you stop,',
    'with nothing missing from the file to be surprised by later.',
    '',
    '**Every row is a claim about a text, paired with the text it is a claim about, resolved wherever',
    'the store can resolve it.** A walk script gets the passage lines it cites. A misconception',
    'description gets the option values tagged with it. A flag reason names its passage — those are',
    'delivered whole in their own artefacts rather than repeated here.',
    '',
    '**Where the comparison cannot be resolved, the row says so.** An unresolvable comparison is a fact',
    'you need, not a gap to paper over.',
    '',
    `**Nobody has compared any of them.** The ledger of completed comparisons is empty, so all ${rows.length} are`,
    'unread. That is the finding this artefact exists to make actionable rather than merely visible.',
    '',
    '---',
    '',
    '## How to use it',
    '',
    '**Read the claim, read the text beneath it, and ask only: does the claim describe that text?** That',
    'is the whole task. It is the one thing no instrument here can do, and the reason is on the record —',
    'a machine doing it substitutes a string test for the judgement.',
    '',
    '**The strike test applies where a claim turns out to be wrong**: strike it and read what remains. If',
    'the verdict still stands, the claim was explanation. If nothing remains, the verdict rested on it',
    'and correcting it reopens the verdict.',
    '',
    '---',
    '',
  ];

  let tranche = '';
  rows.forEach((r, n) => {
    const band = r.reachable >= 100 ? 'A · 100 or more LIVE behind it'
      : r.reachable >= 10 ? 'B · 10 to 99 LIVE behind it'
        : r.reachable > 0 ? 'C · 1 to 9 LIVE behind it'
          : 'D · nothing LIVE behind it — stored, not reachable';
    if (band !== tranche) {
      tranche = band;
      const size = rows.filter((x) => (x.reachable >= 100 ? 'A · 100 or more LIVE behind it'
        : x.reachable >= 10 ? 'B · 10 to 99 LIVE behind it'
          : x.reachable > 0 ? 'C · 1 to 9 LIVE behind it'
            : 'D · nothing LIVE behind it — stored, not reachable') === band).length;
      out.push('', `# TRANCHE ${band}`, '', `**${size} claim(s).**`, '', '---', '');
    }
    out.push(`### ${n + 1}. \`${r.claimId}\``, '');
    out.push(`*${r.kind} · ${r.status}${r.reachable > 0 ? ` · ${r.reachable} LIVE` : ''}*`, '');
    out.push('**The claim:**', '', `> ${r.claim.replace(/\n/g, '\n> ')}`, '');
    out.push(`**The text it is a claim about — ${r.aboutLabel}:**`, '');
    /**
     * **AN UNRESOLVED ROW SAYS WHICH KIND OF UNRESOLVED IT IS.** A misconception with no carriers
     * and a flag whose passage is delivered elsewhere are different facts, and one generic sentence
     * for both is the conflation this whole ledger exists to undo.
     */
    if (r.about) {
      out.push('```\n' + r.about + '\n```', '');
    } else if (r.kind === 'misconception vs tagged items') {
      out.push(
        '**NOTHING IS TAGGED WITH IT.** There is no text for this claim to be about, so it cannot be',
        'compared — and that is itself the finding: a description of how children go wrong, carried by',
        'no option a child can choose.',
        '',
      );
    } else {
      out.push(
        `*The passage is delivered whole in its own artefact — see \`${r.claimId.split('#')[0]}\`. It is`,
        'referenced rather than repeated here, because inlining it beside every claim about it would',
        'put the same 900 words in this file many times over.*',
        '',
      );
    }
    out.push('`[ ] compared`  ·  `who:` ______  ·  `when:` ______  ·  `verdict:` ______', '');
  });

  /**
   * **THE NAME CARRIES THE CONTENT HASH, AND IT DID NOT** (R386).
   *
   * This shipped as a FIXED filename delivered with no family, so three materially different
   * versions overwrote each other under one name — `cc29b834`, `7bfaf302`, `1e3b9269` — **with no
   * supersede record and no way for the receiving store to tell which it holds.** That is R88's
   * fault, and it is worst on this artefact of all: **the whole content is a reading ORDER**, so an
   * earlier version crossing sends her through the population in a sequence that has since been
   * corrected, and nothing on either side would say so.
   *
   * The recognition test got this right because its name carried a digest; this one did not, and the
   * difference was invisible precisely because overwriting in place always looks like updating.
   * Stamped over the WHOLE payload (R365), and delivered with a family so `deliver()` removes the
   * superseded file rather than leaving it alongside.
   */
  const payload = { note: 'The claim ledger: every claim about a text, ordered by reachability.', rows };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'every claim about a text in the store, with the text it is a claim about, ordered by reachability',
    ['note', 'rows']);
  const FAMILY = 'claim-ledger-full-population';
  const path = join(REPO_ROOT, 'content/exports', stampedName(FAMILY, stamp.sourceHash, 'md'));
  writeFileSync(path, `<!-- stamp ${JSON.stringify(stamp)} -->\n` + out.join('\n'));
  deliver(path, FAMILY);
  console.log(`\n${rows.length} claims emitted · ${reachable.length} reachable · ${rows.length - reachable.length} stored.`);
  await prisma.$disconnect();
}

void main();
