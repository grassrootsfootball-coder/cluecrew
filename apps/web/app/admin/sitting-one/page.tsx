import { prisma } from '@cluecrew/db';
import batchMix from '../../../../../content/batch-mix.json';
import nvrConfig from '../../../../../content/nvr-generator-config.json';
import { currentStaff } from '@/lib/staff';

/**
 * Reviewer sitting #1 — everything on one screen (ingestion contract 4,
 * 2026-08-01): the blueprint drafts to verify, the batch-mix proposal to
 * co-ratify, the misconception queue to work, and the demo items awaiting
 * sign-off. Raw evidence files stay in the private corpus folder (Addendum
 * E firewall); this page carries decisions and derived values only.
 */
export default async function SittingOnePage() {
  const staff = await currentStaff();
  if (!staff) return null;

  const proposed = await prisma.misconception.count({ where: { status: 'PROPOSED' } });
  const reviewedItems = await prisma.item.count({ where: { status: 'REVIEWED' } });
  const draftItems = await prisma.item.count({ where: { status: 'DRAFT' } });
  // Pools carry different shapes now that the NVR and English pools have
  // landed (some are composition notes, not tier mixes), so the cast reads
  // the one pool this card is about and treats the mix as optional.
  const pools = (
    batchMix as unknown as {
      pools: Record<
        string,
        { tierMixPct?: { specDefault: number[]; proposed?: number[]; ratified?: number[] } }
      >;
    }
  ).pools;
  const mathsPractice = pools['gl-maths-practice']!;
  const vrPractice = pools['gl-vr-practice']!;
  const vrMock = pools['gl-vr-mock']!;
  const nvr = nvrConfig as { optionCount: { value: number; specDefault: number } };

  return (
    <main className="cc-container">
      <h1>Reviewer sitting #1</h1>
      <p className="cc-muted">
        One screen, four jobs. Evidence lives in the private corpus folder (inventory-cited);
        everything here is a decision or a derived value.
      </p>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>1 · Blueprints to verify</h2>
        <p>
          <strong>gl-vr-standard</strong> and <strong>gl-vr-half</strong> — verify against the
          pass-1 evidence (SCP-VR-1/2: 80q, 13–14 type-sections of 7–8, codes in the final third,
          50-minute GL standard). <strong>gl-nvr-standard</strong> — authored FROM the pass-2
          evidence (4×20 from the six-pool, codes mandatory, 5 options); your signature makes it
          real. <strong>gl-maths-standard</strong> — verify against SCP-M-1 (50q/50min, single
          section, 1-mark MC).
        </p>
      </div>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>2 · The batch-mix co-ratification (SCP-M-2)</h2>
        <p>
          GL-maths tier mix, spec default {mathsPractice.tierMixPct?.specDefault.join('/')} →
          proposed {mathsPractice.tierMixPct?.proposed?.join('/')}. The corpus centres GL maths on
          T2; the proposal shifts the practice-pool centre of mass to the T2/T3 boundary while tier
          definitions stay put. Your calibration confirms or corrects the analyst&apos;s provisional
          tier mapping — this is the one decision David holds jointly with you, and the only tier
          mix still waiting.
        </p>
        <p className="cc-muted">
          For contrast, VR is settled: David ratified practice{' '}
          {vrPractice.tierMixPct?.ratified?.join('/')} and mock{' '}
          {vrMock.tierMixPct?.ratified?.join('/')} (SCP-VR-5), plus per-type tier envelopes
          constrained to observed ranges (SCP-VR-6). Three observed VR types have no unambiguous
          registry home and are recorded as pending — those need a decision from you or David
          before they constrain anything.
        </p>
      </div>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>3 · The misconception queue</h2>
        <p>
          <strong>{proposed} PROPOSED</strong> entries (18 VR + 19 NVR from the corpus passes)
          await your approval in <a href="/admin/misconceptions">the misconception queue</a>.
          Unapproved entries are structurally unusable by any item.
        </p>
      </div>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>4 · Items and the shop window</h2>
        <p>
          {draftItems} DRAFT / {reviewedItems} REVIEWED in <a href="/admin/items">the item queue</a>.
          The three public demo items (letter-code TARTS, hidden-word CHIN, fence-packs) and the
          five-ways Walk steps + Hear transcript are marketing-surface content awaiting your
          sign-off before public DNS.
        </p>
        <p className="cc-muted">
          NVR generator note: option count is {nvr.optionCount.value} (spec assumed{' '}
          {nvr.optionCount.specDefault}; corrected by corpus evidence, ratified). The generator
          build consumes the rest of the config when the district engineering starts.
        </p>
      </div>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>5 · NVR generator sign-off</h2>
        <p>
          The NVR district reviews GENERATORS, not items (BUILD-DISTRICT-NVR §4). Thirteen
          templates, <strong>30 stratified samples per tier</strong>, keys marked and every
          distractor&apos;s misconception id on the page:{' '}
          <a href="/admin/nvr-samples">the sample sheets</a>. Each sheet prints for signing and
          carries its own contentHash plus the templateFingerprint, so what you signed stays
          provable — and any later change to a template moves that fingerprint, voids the
          signature and stops it serving.
        </p>
      </div>
    </main>
  );
}
