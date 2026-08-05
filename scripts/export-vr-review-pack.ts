/**
 * THE VR FREE-TEN REVIEWER PACK — `pnpm export:vr-review-pack`
 *
 * The ten free-tier Cases and every item behind them, in the same printed
 * format as the English pack (see lib/review-pack-format.ts — one format,
 * because two packs that look different are two packs a reviewer has to
 * learn).
 *
 * GROUPED BY CASE, not by question type, because a Case is what a child sits
 * down to and what the reviewer is being asked to sign off. Each group opens
 * with what the case teaches — its question type, its interaction mechanic and
 * its engine family — so the reviewer can judge the items against the thing
 * they are meant to practise rather than one at a time in the abstract.
 *
 * Every count is QUERIED. A pack that claims 277 items and prints 240 is worse
 * than no pack, and the reviewer only finds out at the table.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { familyForType } from '@cluecrew/core';
import { deliver, freshnessStamp } from './lib/export-destination';
import { DECISION_BOXES, PRINT_CSS, esc, renderPdf, writingSpace } from './lib/review-pack-format';
import { buildFreeTenSource } from './lib/vr-free-ten-source';
import { prisma } from '../packages/db/src/index';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const ROOT = resolve(import.meta.dirname, '..');
const TODAY = new Date().toISOString().slice(0, 10);

/**
 * A stem or option field, printed whatever its shape. Scalars as themselves,
 * arrays as a spaced list (a series or a word pair reads as one), a code
 * object as `A=2 B=3`. The pack MUST be able to print anything an item can
 * store, or it silently hides the question — which is exactly the bug this
 * replaces.
 */
function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(renderValue).join(' · ');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${key}=${renderValue(entry)}`)
      .join(' ');
  }
  return String(value);
}

/** What each family asks a child to DO, in the reviewer's language. */
const FAMILY_BLURB: Record<string, string> = {
  code: 'a rule turns letters or numbers into other letters or numbers, and the child works it back',
  stowaway: 'something is hidden inside, between or missing from words, and the child finds it',
  wordweb: 'words are sorted by meaning — matched, opposed or grouped',
  bridge: 'a relationship holds between one pair, and the child carries it to another',
  deduction: 'facts are given and the child reasons to what must follow',
};

/**
 * The three cases NOT in the pack, and why. Carried as context rather than
 * left out: a reviewer signing off ten cases should know which ones were held
 * back and on what evidence, or the ten look like the whole district.
 */
const REBUILD_CONTEXT = [
  {
    id: 'case-vr-02',
    title: "Two Don't Belong",
    detail:
      'Unanswerable as first served — every option carried no answer value at all, so no choice could be scored. The bank has since been rebuilt and is answerable, but it is NOT returning to the free ten: vr-12 already holds that slot, meets the floor and works, and swapping back would cost another script run for no gain. vr-02 ships in the paid tier.',
  },
  {
    id: 'case-vr-05',
    title: 'The Hidden Word',
    detail:
      'Nineteen of its items admit a second real word at the join, so a child who reads correctly can be marked wrong. Held out and replaced by vr-06; it returns once rebuilt with single-answer items.',
  },
  {
    id: 'case-vr-10',
    title: 'The Missing Link',
    detail:
      'Folded into vr-03: it drew from the identical analogy bank — the same stems, answers and distractor pairings, differing only in tag names — so it added no distinct content. Its free-ten slot went to vr-14 by the derivation rule.',
  },
];

/**
 * WHERE THE REVIEWER'S ATTENTION IS WORTH SPENDING. Some cases have a
 * machine-checkable answer; the rest turn on judgement no gate can make. Saying
 * which is which up front lets her read the verified ones quickly and the
 * unverifiable ones closely.
 */
const VERIFICATION = {
  verified: [
    ['vr-09, vr-11', 'Series — the next term is DERIVED from the given ones and the key is checked against it.'],
    ['vr-07', 'Letters-for-numbers — the arithmetic is computed and the key must match.'],
    ['vr-15', 'Reading information — the answer is deduced from the clues and must be the unique one they force.'],
    ['vr-01', 'Insert-letter — every offered letter is tested against both words; a second answer is a blocked defect.'],
    ['vr-12', 'Compound words — a distractor that also forms a real compound with the base is a blocked defect (see caveat below).'],
  ],
  judgement: [
    ['vr-04', 'Closest meaning — "is this the closest synonym" has no wordlist that settles it.'],
    ['vr-03', 'Related words — the analogy relationship is a matter of meaning.'],
    ['vr-06', 'Missing word — the key is gate-checked to be a real word, but whether a distractor is genuinely wrong-in-context is yours.'],
  ],
};

/**
 * The vr-12 caveat, stated plainly because it is a real limit on what the gate
 * guarantees.
 */
const VR12_CAVEAT =
  'The compound-words gate rejects a distractor only when base+distractor is a word IN THE LEXICON. Three real compounds — toothpaste, gameplay, sunday — were invisible to it until the words were added by hand, because a general dictionary under-covers closed compounds. Until a curated compound list exists, your eye is the backstop on this case: if a distractor plausibly joins the base into a word a child knows, trust that over the gate.';

async function main(): Promise<void> {
  const cases = await prisma.case.findMany({ where: { freeTier: true }, orderBy: { orderInDistrict: 'asc' } });

  const groups: Array<{ html: string; count: number; id: string; title: string }> = [];
  let itemTotal = 0;
  let walkTotal = 0;
  let untagged = 0;

  for (const kase of cases) {
    const type = await prisma.questionType.findUnique({ where: { id: kase.questionTypeId } });
    const items = await prisma.item.findMany({
      where: { questionTypeId: kase.questionTypeId },
      include: { options: { include: { misconception: true } } },
      orderBy: [{ difficultyTier: 'asc' }, { id: 'asc' }],
    });
    itemTotal += items.length;
    const family = familyForType(kase.questionTypeId);

    const blocks = items
      .map((item, index) => {
        const stem = (item.stem ?? {}) as Record<string, unknown>;
        const explanation = (item.explanation ?? {}) as Record<string, unknown>;
        const walk = (explanation.walkScript ?? explanation.walk) as string | undefined;
        if (walk) walkTotal += 1;

        // These types carry the question in structured fields, and a stem
        // printed without them cannot be checked. The first version dropped
        // everything that was not a scalar — which is most of them: a series
        // is an array, a pair is an array, a code is an object, and the
        // odd-one-out words are an array. Rendering only scalars printed the
        // scaffolding and hid the question. Every field is shown now,
        // whatever its shape.
        const payload = Object.entries(stem)
          .filter(([key]) => key !== 'prompt')
          .map(([key, value]) => `<span class="tag">${esc(key)}</span> ${esc(renderValue(value))}`)
          .join(' &nbsp; ');

        const options = item.options
          .map((option) => {
            const content = (option.content ?? {}) as Record<string, unknown>;
            const label = (content.label as string) ?? '';
            if (!option.isCorrect && !option.misconceptionId) untagged += 1;
            // An option is not always `{value}`: the odd-one-out options are
            // `{pair: [w1, w2]}`, and printing `content.value` left them blank.
            // Show whatever shape the option actually has.
            const shown = 'value' in content ? renderValue(content.value) : renderValue(content.pair ?? content);
            return `<li class="${option.isCorrect ? 'correct' : ''}">
              <span class="mark">${option.isCorrect ? '✔' : '☐'}</span>
              <span class="opt">${esc(label ? `${label}. ` : '')}${esc(shown)}</span>
              <span class="mis">${
                option.isCorrect
                  ? '<em>key</em>'
                  : option.misconception
                    ? `${esc(option.misconception.description)} <code>${esc(option.misconceptionId)}</code>`
                    : '<strong>NO MISCONCEPTION TAGGED</strong>'
              }</span>
            </li>`;
          })
          .join('');

        return `<div class="block${item.answerFlaggedAt ? ' flagged' : ''}">
          <div class="block-head">
            <span class="num">${index + 1} of ${items.length}</span>
            <span class="tag">tier ${item.difficultyTier}</span>
            <code>${esc(item.id)}</code>
            ${item.answerFlaggedAt ? '<span class="flag">NO DERIVABLE ANSWER</span>' : ''}
          </div>
          <p class="stem">${esc(stem.prompt)}</p>
          ${payload ? `<p class="passage">${payload}</p>` : ''}
          <ul class="options">${options}</ul>
          ${walk ? `<p class="walk">${esc(walk)}</p>` : '<p class="muted">No walk script authored for this item.</p>'}
          ${DECISION_BOXES}
          ${writingSpace(2, 'notes')}
        </div>`;
      })
      .join('\n');

    groups.push({
      id: kase.id,
      title: kase.title,
      count: items.length,
      html: `<section>
        <h2>${esc(kase.title)}</h2>
        <p class="desc"><strong>${esc(type?.name ?? kase.questionTypeId)}</strong> — ${esc(FAMILY_BLURB[family] ?? '')}.</p>
        <p class="muted">
          Case <code>${esc(kase.id)}</code> ·
          question type <code>${esc(kase.questionTypeId)}</code> ·
          interaction <code>${esc(type?.mechanic ?? 'unknown')}</code> ·
          engine family <code>${esc(family)}</code> ·
          ${items.length} item${items.length === 1 ? '' : 's'}
        </p>
        ${items.length === 0 ? '<p><strong>No items in this case.</strong></p>' : blocks}
      </section>`,
    });
  }

  const decisionsPage = `<section>
    <h2>Decisions</h2>

    <div class="decision">
      <p class="desc"><strong>1 · The three cases held out of the free ten</strong></p>
      <p>The free tier is ten cases out of twenty-one. Three were held back, and you
      should know which and why before you sign off the ten — otherwise the ten read
      as the whole district.</p>
      ${REBUILD_CONTEXT.map(
        (entry) => `<div class="block">
          <div class="block-head">
            <span class="num">${esc(entry.title)}</span>
            <code>${esc(entry.id)}</code>
          </div>
          <p>${esc(entry.detail)}</p>
        </div>`,
      ).join('')}
      <p class="muted">None of the three is in this pack — listed so the scope of
      what you are signing is visible, not because they need a decision today.</p>
    </div>

    <div class="decision">
      <p class="desc"><strong>2 · Where to spend your attention</strong></p>
      <p>Some cases have a machine-checkable answer; the rest turn on judgement no gate
      can make. Read the verified ones quickly and the others closely.</p>
      <p class="lab">Machine-verified — the key is checked by a gate</p>
      <ul>${VERIFICATION.verified.map(([c, d]) => `<li><strong>${esc(c)}</strong> — ${esc(d)}</li>`).join('')}</ul>
      <p class="lab">Human judgement — no gate can settle these</p>
      <ul>${VERIFICATION.judgement.map(([c, d]) => `<li><strong>${esc(c)}</strong> — ${esc(d)}</li>`).join('')}</ul>
      <div class="block">
        <p class="lab">Caveat on vr-12 (compound words)</p>
        <p>${esc(VR12_CAVEAT)}</p>
      </div>
    </div>

    <div class="decision">
      <p class="desc"><strong>3 · Sign-off</strong></p>
      <p>Signing here confirms that you have reviewed the items in this pack and
      that those you have not marked otherwise are fit to serve a child.</p>
      <p class="muted">Nothing is published from a signature alone. Your decision is
      typed into the decisions file and recorded against your name, with whoever
      entered it recorded separately — the two are never merged. Items with
      outstanding marks stay unpublished until those are resolved.</p>
      ${writingSpace(1, 'reviewer name')}
      ${writingSpace(1, 'date')}
      ${writingSpace(3, 'confirmation, in your own words — this is quoted verbatim in the record')}
    </div>
  </section>`;

  const html = `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8">
<title>ClueCrew reviewer pack — VR free ten — ${TODAY}</title>
<style>
${PRINT_CSS}
</style></head>
<body>

<div class="cover">
  <h1>Reviewer pack — VR, the free ten</h1>
  <p>Generated ${TODAY}. Print single-sided; there is writing space on every item.</p>
  <dl>
    <dt>What this is</dt>
    <dd>The ten free-tier Cases and every item behind them — ${itemTotal} in all,
        grouped by case. Each case opens with what it teaches.</dd>
    <dt>What to do</dt>
    <dd>Tick approve, reject or amend beside each item. Write in the ruled space;
        it is sized for a pen.</dd>
    <dt>Walk scripts</dt>
    <dd>${walkTotal} of ${itemTotal} items carry one. Where none exists the item
        says so rather than leaving a gap you have to interpret.</dd>
    <dt>The last page</dt>
    <dd>The three cases held out of the free ten and why, where to spend your
        attention (verified vs judgement), and the sign-off line.</dd>
  </dl>
  <p class="muted">Nothing in this pack is LIVE. No VR item has ever been published,
  and none will be until a decision recorded against your name says so.</p>
</div>

${groups.map((group) => group.html).join('\n')}
${decisionsPage}
</body></html>`;

  // Hash the free-ten SOURCE (the same builder the item bank and the freshness
  // checker use), so the pack is stale the moment the items it prints change —
  // and the hash goes in every filename so copies self-identify.
  const stamp = freshnessStamp(await buildFreeTenSource(prisma), new Date().toISOString());
  mkdirSync(OUT_DIR, { recursive: true });
  const FAMILY = 'review-pack-vr-free-ten';
  const base = `${FAMILY}-${stamp.sourceHash}`;

  const htmlPath = join(OUT_DIR, `${base}.html`);
  writeFileSync(htmlPath, html);
  console.log(`Review pack → ${htmlPath}`);
  console.log(`  cases: ${groups.length} · items: ${itemTotal} · walk scripts: ${walkTotal} · sourceHash ${stamp.sourceHash}`);
  for (const group of groups) console.log(`    ${group.id.padEnd(11)} ${String(group.count).padStart(3)}  ${group.title}`);
  if (untagged > 0) console.log(`  wrong options with no misconception tagged: ${untagged}`);

  const pdfPath = await renderPdf(html, OUT_DIR, base, ROOT);

  const template = {
    kind: 'review-decisions',
    district: 'VR',
    pack: base,
    reviewer: 'human:REPLACE@example.com',
    recordedBy: 'human:REPLACE@example.com',
    method: `written review — VR sign-off, ${TODAY}`,
    note: 'REPLACE — the reviewer\'s confirmation, in their words.',
    itemAmendments: [] as Array<{ itemId: string; note: string; stem?: string }>,
    misconceptions: { approve: [] as string[], reject: [] as Array<{ id: string; note: string }> },
  };
  const templatePath = join(OUT_DIR, `${base}-decisions.json`);
  writeFileSync(templatePath, JSON.stringify(template, null, 2));

  // A manifest carrying the stamp, so `check:export-freshness` can verify the
  // PACK the same way it verifies the item bank — an HTML/PDF cannot hold a
  // hash the checker parses, this JSON can, and it names the artifacts it
  // vouches for.
  const manifestPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(
    manifestPath,
    JSON.stringify(
      { kind: 'vr-review-pack', ...stamp, itemCount: itemTotal, artifacts: [`${base}.html`, `${base}.pdf`, `${base}-decisions.json`] },
      null,
      2,
    ),
  );

  // Deliver everything, superseding any older pack of this family.
  for (const p of [htmlPath, pdfPath, templatePath, manifestPath]) if (p) deliver(p, FAMILY);
  console.log(`Decisions template → ${templatePath}`);
  await prisma.$disconnect();
}

void main();
