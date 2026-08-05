/**
 * THE VR AUDIT SAMPLE SOURCE — shared by the exporter and the freshness checker
 * so both hash the SAME sample (David's ruling, 2026-08-02).
 *
 * This is not a sign-off pack: the VR free-ten is already LIVE and signed off.
 * It is an INDEPENDENT re-check for the incoming reviewer — 50 items drawn from
 * all ten live cases, deliberately weighted toward the four MEANING-based types
 * no automated gate can verify:
 *
 *   closest-meaning (vr-04) · related-words (vr-03) · missing-word (vr-06) ·
 *   reading-information (vr-15)
 *
 * A letter series or a code sum has a computed key the word-puzzle and solution
 * gates already prove; "which word is closest in meaning" has no such check —
 * only a person can confirm the key is right and each distractor is honestly
 * wrong. So those four carry the weight (8 each = 32); the six formal types are
 * represented for completeness (3 each = 18). All ten cases appear.
 *
 * Sampling is deterministic: LIVE items sorted by id, then an even stride across
 * the case, so the sample is reproducible and its freshness hash is meaningful.
 */
import type { PrismaClient } from '@prisma/client';
import { shuffleOptionsForChild } from '../../apps/web/lib/crew/shuffle';

/** The four types whose correctness is a meaning judgement, not a computation. */
export const SEMANTIC_CASES = new Set(['case-vr-04', 'case-vr-03', 'case-vr-06', 'case-vr-15']);
const SEMANTIC_SAMPLE = 8;
const FORMAL_SAMPLE = 3;

export interface AuditOption {
  label: string | null;
  value: unknown;
  isKey: boolean;
  misconceptionId: string | null;
  misconception: string | null;
}

export interface AuditItem {
  itemId: string;
  tier: number | null;
  stem: Record<string, unknown>;
  options: AuditOption[];
}

export interface AuditCase {
  caseId: string;
  title: string;
  questionTypeId: string;
  mechanic: string | null;
  semantic: boolean;
  liveTotal: number;
  sampled: AuditItem[];
}

export interface VrAuditSample {
  cases: AuditCase[];
  total: number;
  semanticTotal: number;
}

/** Even stride across a sorted list — endpoints included, deterministic. */
function strideSample<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  if (count <= 1) return items.slice(0, Math.max(count, 0));
  const picked: T[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < count; i += 1) {
    let index = Math.round((i * (items.length - 1)) / (count - 1));
    while (seen.has(index)) index = (index + 1) % items.length; // collision-safe
    seen.add(index);
    picked.push(items[index]!);
  }
  return picked;
}

export async function buildVrAuditSample(prisma: PrismaClient): Promise<VrAuditSample> {
  const cases = await prisma.case.findMany({
    where: { freeTier: true },
    orderBy: { orderInDistrict: 'asc' },
    include: { questionType: true },
  });

  const out: AuditCase[] = [];
  for (const kase of cases) {
    const semantic = SEMANTIC_CASES.has(kase.id);
    const live = await prisma.item.findMany({
      where: { questionTypeId: kase.questionTypeId, status: 'LIVE' },
      include: { options: { include: { misconception: true }, orderBy: { id: 'asc' } } },
      orderBy: { id: 'asc' },
    });
    const sampled = strideSample(live, semantic ? SEMANTIC_SAMPLE : FORMAL_SAMPLE).map((item) => {
      // Present options in the SAME shuffle a child is served (seeded, stable),
      // NOT stored order — stored is key-first by generator convention, and
      // printing that made the reviewer see the key as option A on every item.
      const options = shuffleOptionsForChild(item.options, 'vr-audit-sample', item.id).map((option) => {
        const content = (option.content ?? {}) as Record<string, unknown>;
        return {
          label: (content.label as string) ?? null,
          value: content.value,
          isKey: option.isCorrect,
          misconceptionId: option.misconceptionId,
          misconception: option.misconception?.description ?? null,
        };
      });
      return {
        itemId: item.id,
        tier: item.difficultyTier,
        stem: (item.stem ?? {}) as Record<string, unknown>,
        options,
      };
    });
    out.push({
      caseId: kase.id,
      title: kase.title,
      questionTypeId: kase.questionTypeId,
      mechanic: kase.questionType.mechanic,
      semantic,
      liveTotal: live.length,
      sampled,
    });
  }

  const total = out.reduce((s, c) => s + c.sampled.length, 0);
  const semanticTotal = out.filter((c) => c.semantic).reduce((s, c) => s + c.sampled.length, 0);
  return { cases: out, total, semanticTotal };
}

/** The light source the freshness stamp hashes — the sampled content itself, so
 * the stamp goes stale if a sampled item's stem, options, key or tags change. */
export async function buildVrAuditSource(prisma: PrismaClient): Promise<unknown> {
  const sample = await buildVrAuditSample(prisma);
  return sample.cases.map((c) => ({
    caseId: c.caseId,
    semantic: c.semantic,
    items: c.sampled.map((i) => ({
      itemId: i.itemId,
      tier: i.tier,
      stem: i.stem,
      options: i.options.map((o) => ({ label: o.label, value: o.value, isKey: o.isKey, misconceptionId: o.misconceptionId })),
    })),
  }));
}
