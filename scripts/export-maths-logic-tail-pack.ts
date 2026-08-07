/**
 * INDEPENDENT REVIEW PACK — the sixteen LOGIC-tail maths items, for a second reviewer.
 * `pnpm --filter @cluecrew/db exec tsx ../../scripts/export-maths-logic-tail-pack.ts`
 *
 * Same shape as the VR/NVR packs: the questions come FIRST, blind — options in the served
 * shuffle (deterministic, seeded), the tier shown (pitch is one of the four judgements),
 * NO key and NO misconception tag beside the question. The answer key is on a SEPARATE
 * page; each wrong answer's tagged misconception sits there, with the key, not by the
 * question — so the reviewer forms her own view before seeing ours. Hash-named,
 * freshness-checked, delivered.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'maths-logic-tail-review-pack';

interface Opt { text: string; key?: true; tag?: string }
interface Item { id: string; tier: 4 | 5; stem: string; options: Opt[] }

const ITEMS: Item[] = [
  { id: 'L-01', tier: 4, stem: 'a ★ b means: double a, then add b. What is 5 ★ 3?', options: [
    { text: '13', key: true }, { text: '16', tag: '#100 steps-out-of-order — added first, then doubled: 2×(5+3)' }, { text: '10', tag: 'PROC-01 — doubled the 5 and stopped' }, { text: '30', tag: '#72 wrong-operation-chosen — multiplied by b where the rule adds: (2×5)×3' }] },
  { id: 'L-02', tier: 5, stem: 'a ★ b means: multiply a by 3, then subtract b. If 6 ★ b = 13, what is b?', options: [
    { text: '5', key: true }, { text: '18', tag: 'PROC-01 — worked out 6×3 and stopped' }, { text: '7', tag: '#109 ran-the-machine-forwards — took 13−6, never undoing the ×3' }, { text: '31', tag: '#72 wrong-operation — added where the rule subtracts: 18+13' }] },
  { id: 'L-03', tier: 5, stem: 'a ◆ b means: add a and b, then multiply by 2. If 3 ◆ b = 20, what is b?', options: [
    { text: '7', key: true }, { text: '10', tag: 'PROC-01 — halved the 20 and stopped' }, { text: '17', tag: '#109 ran-the-machine-forwards — took 20−3, never undoing the ×2' }, { text: '37', tag: '#72 wrong-operation — doubled instead of halving: 20×2−3' }] },
  { id: 'L-04', tier: 5, stem: 'Amy, Ben, Cara and Dan each play one sport: tennis, chess, swimming or running. Cara plays chess. Ben does not swim. Ben does not run. Dan does not swim. Which sport does Ben play?', options: [
    { text: 'tennis', key: true }, { text: 'swimming', tag: '#113 negative-clue-read-as-positive — read "Ben does not swim" as if it said he does' }, { text: 'running', tag: "#114 answered-for-the-wrong-person — solved the grid and read off Dan's row" }, { text: 'chess', tag: 'PROC-01 — took the one clue that names a sport and stopped' }] },
  { id: 'L-05', tier: 5, stem: 'Four runners finish a race. Gus finishes last. Ella is not first. Hana is not second. Hana is not first. Who finishes second?', options: [
    { text: 'Ella', key: true }, { text: 'Hana', tag: '#113 negative-clue-read-as-positive — read "Hana is not second" as if it said she was' }, { text: 'Gus', tag: 'PROC-01 — took the one clue that fixes a place and stopped' }, { text: 'Finn', tag: '#114 answered-for-the-wrong-person — worked out the order and read off first place' }] },
  { id: 'L-06', tier: 4, stem: 'Using the digits 2, 5, 7 and 9, each at most once, how many different three-digit numbers can be made?', options: [
    { text: '24', key: true }, { text: '4', tag: '#115 missed-a-branch-when-listing — one number for each starting digit and stopped: 4' }, { text: '64', tag: '#116 counted-repeats-as-allowed — a digit may repeat: 4×4×4' }, { text: '12', tag: '#72 wrong-operation-chosen — digits times slots: 4×3' }] },
  { id: 'L-07', tier: 5, stem: 'A cafe offers 3 sandwiches, 2 drinks and 2 cakes. How many different meals of one sandwich, one drink and one cake are there?', options: [
    { text: '12', key: true }, { text: '7', tag: '#72 wrong-operation — added the choices: 3+2+2' }, { text: '6', tag: 'PROC-01 — multiplied sandwiches by drinks and stopped' }, { text: '4', tag: '#71 quantity-left-out — used only the drinks and cakes' }] },
  { id: 'L-08', tier: 4, stem: 'Ravi works out 6 × 48 by doing 6 × 50 and then taking away 2. He gets 298. What is the correct answer?', options: [
    { text: '288', key: true }, { text: '298', tag: '#99 rounded-without-compensating — adjusted by 2 instead of 6×2' }, { text: '300', tag: 'PROC-01 — gave the rounded product' }, { text: '312', tag: '#72 wrong-operation — added the adjustment: 300+12' }] },
  { id: 'L-09', tier: 5, stem: 'Kai works out 25% of 60. He takes 10% of 60, which is 6. He doubles it. Then he adds half of the 10%. What answer does Kai get?', options: [
    { text: '15', key: true }, { text: '12', tag: 'PROC-01 — doubled the 10% and stopped before the last step' }, { text: '18', tag: '#82 fraction-of-the-wrong-whole — added half of the running total (12), not half of the 10%' }, { text: '30', tag: '#78 percentage-fraction-confusion — ignored the steps and took 25% as half of 60' }] },
  { id: 'L-10', tier: 4, stem: 'A jar holds 60 sweets. Maya eats 1/3 of them. Then she eats 1/4 of what is left. How many sweets are left?', options: [
    { text: '30', key: true }, { text: '25', tag: '#82 fraction-of-the-wrong-whole — took 1/4 of the original 60' }, { text: '40', tag: 'PROC-01 — stopped after the first helping' }, { text: '10', tag: '#118 gave-the-part-taken-not-the-part-left — the sweets eaten the second time' }] },
  { id: 'L-11', tier: 5, stem: 'A stall starts with 60 flowers. It sells 1/5 in the morning, then 1/4 of what is left at noon, then 1/3 of what is left in the afternoon. How many flowers are left?', options: [
    { text: '24', key: true }, { text: '13', tag: '#82 fraction-of-the-wrong-whole — each fraction of the original 60: 12+15+20' }, { text: '36', tag: 'PROC-01 — stopped after the second selling' }, { text: '12', tag: '#118 gave-the-part-taken-not-the-part-left — the number sold in the afternoon' }] },
  { id: 'L-12', tier: 5, stem: 'Nadia spends 1/3 of her money, then 1/4 of what is left. She now has £18. How much did she start with?', options: [
    { text: '£36', key: true }, { text: '£24', tag: 'PROC-01 — undid the quarter and stopped' }, { text: '£12', tag: '#109 ran-the-machine-forwards — took a third off the £18' }, { text: '£54', tag: '#82 fraction-of-the-wrong-whole — treated "spent 1/3" as "a third is left": 18×3' }] },
  { id: 'L-13', tier: 4, stem: 'A rectangle has an area of 48 cm² and one side is 6 cm. What is its perimeter?', options: [
    { text: '28 cm', key: true }, { text: '14 cm', tag: 'PROC-01 — added the two sides and stopped before doubling' }, { text: '48 cm', tag: '#87 perimeter-area swap — gave the area back' }, { text: '96 cm', tag: '#72 wrong-operation — subtracted to find the width: 48−6, then a perimeter' }] },
  { id: 'L-14', tier: 5, stem: 'A square has a perimeter of 32 cm. A rectangle has the same area as the square and is 4 cm wide. What is the rectangle\'s perimeter?', options: [
    { text: '40 cm', key: true }, { text: '32 cm', tag: '#40 area-dictates-perimeter — assumed equal areas mean equal perimeters' }, { text: '64 cm', tag: '#87 perimeter-area swap — gave the area' }, { text: '20 cm', tag: 'PROC-01 — added 4 and 16 and stopped' }] },
  { id: 'L-15', tier: 5, stem: 'A school trip costs £8 for each child and £12 for each adult. 24 children and 3 adults are going. The school has already collected £150. How much more is needed?', options: [
    { text: '£78', key: true }, { text: '£228', tag: 'PROC-01 — worked out the total cost and stopped' }, { text: '£42', tag: '#71 quantity-left-out — left the adults out of the total' }, { text: '£378', tag: '#72 wrong-operation — added the £150 instead of taking it off' }] },
  { id: 'L-16', tier: 5, stem: 'A recipe for 6 buns uses 150 g of flour. Kim wants to make 15 buns. She has 300 g of flour. How much more does she need?', options: [
    { text: '75 g', key: true }, { text: '375 g', tag: 'PROC-01 — worked out the flour needed and stopped' }, { text: '225 g', tag: '#102 scaled-by-the-difference — scaled the extra 9 buns only' }, { text: '675 g', tag: '#72 wrong-operation — added what she has: 375+300' }] },
];

/** Deterministic per-item shuffle — the served shuffle, reproducible so a signed pack
 *  regenerates identically. Seeded off the item id, no Math.random. */
function shuffled<T>(xs: T[], seed: number): T[] {
  const a = [...xs];
  let s = seed >>> 0;
  const rnd = (): number => { // mulberry32
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}
const idSeed = (id: string): number => [...id].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const LETTERS = ['A', 'B', 'C', 'D'];

function main(): void {
  // Precompute the served order once, so questions and key agree.
  const served = ITEMS.map((it) => ({ it, order: shuffled(it.options, idSeed(it.id)) }));

  const questions = served.map(({ it, order }, i) => `
    <div class="q">
      <div class="qh"><span class="n">${i + 1}</span><span class="tier">Tier ${it.tier}</span></div>
      <p class="stem">${esc(it.stem)}</p>
      <ol class="opts">${order.map((o) => `<li><b>${LETTERS[order.indexOf(o)]}.</b> ${esc(o.text)}</li>`).join('')}</ol>
    </div>`).join('');

  const key = served.map(({ it, order }, i) => {
    const keyLetter = LETTERS[order.findIndex((o) => o.key)];
    const wrongs = order.map((o, j) => (o.key ? null : `<li><b>${LETTERS[j]}.</b> ${esc(o.text)} — ${esc(o.tag ?? '')}</li>`)).filter(Boolean).join('');
    return `
    <div class="k">
      <div class="qh"><span class="n">${i + 1}</span><span class="tier">Tier ${it.tier}</span><span class="ans">answer: ${keyLetter}</span></div>
      <ul class="tags">${wrongs}</ul>
    </div>`;
  }).join('');

  const stamp = freshnessStamp({ ITEMS, v: 1 }, new Date().toISOString());
  const html = `<style>
    body{font-family:Georgia,serif;max-width:52rem;margin:0 auto;padding:2rem;color:#1a1a1a;line-height:1.5}
    h1{font-size:1.5rem} h2{border-top:2px solid #333;padding-top:1rem;margin-top:2rem}
    .intro{background:#f4f4f0;border-left:3px solid #888;padding:.75rem 1rem;font-size:.95rem}
    .q,.k{margin:1.1rem 0;padding-bottom:.6rem;border-bottom:1px solid #e6e6e6}
    .qh{display:flex;gap:.6rem;align-items:center} .n{font-weight:bold;background:#333;color:#fff;border-radius:50%;width:1.5rem;height:1.5rem;display:inline-flex;align-items:center;justify-content:center;font-size:.85rem}
    .tier{font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;color:#666;border:1px solid #ccc;border-radius:.3rem;padding:.05rem .4rem}
    .ans{margin-left:auto;font-weight:bold;color:#0a6}
    .stem{margin:.4rem 0} .opts{margin:.2rem 0 .2rem 0} .opts li{margin:.15rem 0;list-style:none}
    .tags li{list-style:none;font-size:.9rem;color:#444;margin:.2rem 0}
    .pagebreak{page-break-before:always;border:0;border-top:3px double #333;margin:2.5rem 0}
    .stop{text-align:center;font-weight:bold;color:#a00;margin:1.5rem 0}
  </style>
  <h1>Independent review — sixteen maths items</h1>
  <p class="intro">Form your own view of each item before turning to the answer key. The questions come first, blind: options in the order a child would see them, the tier shown (pitch is one of the four judgements), no key and no labels. The key and each wrong answer's tagged misconception are on a separate page. See the separate brief for the four things only you can check.</p>
  <p style="font-size:.85rem;color:#888">Stamp ${stamp.sourceHash} · ${stamp.generatedAt} · 16 items, ${ITEMS.filter((i) => i.tier === 5).length} at Tier 5, ${ITEMS.filter((i) => i.tier === 4).length} at Tier 4.</p>
  <h2>Questions</h2>
  ${questions}
  <p class="stop">— form your view before continuing —</p>
  <hr class="pagebreak">
  <h2>Answer key &amp; misconception tags</h2>
  <p class="intro">Here, not beside the question, so your read is your own. Each wrong option carries the misconception a child picking it is meant to have made — check that a child making <em>that</em> mistake would land on <em>that</em> answer.</p>
  ${key}`;

  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'html'));
  writeFileSync(path, html);
  console.log(`Logic-tail review pack: 16 items → ${stampedName(FAMILY, stamp.sourceHash, 'html')}`);
  deliver(path, FAMILY);
}

main();
