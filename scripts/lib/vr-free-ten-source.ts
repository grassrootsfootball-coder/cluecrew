/**
 * THE VR FREE-TEN SOURCE — built in one place so the export and the freshness
 * checker hash the SAME thing (David's ruling, 2026-08-02). A checker that
 * rebuilt the source differently from the export would report false staleness;
 * sharing the builder is what makes `sourceHash` meaningful.
 */
import { checkChildFacingText, isBlocking, roleForItemStem } from '@cluecrew/core';
import type { PrismaClient } from '@prisma/client';

export interface FreeTenCase {
  caseId: string;
  title: string;
  questionTypeId: string;
  itemCount: number;
  failingCount: number;
  items: unknown[];
}

export async function buildFreeTenSource(prisma: PrismaClient): Promise<FreeTenCase[]> {
  const cases = await prisma.case.findMany({ where: { freeTier: true }, orderBy: { orderInDistrict: 'asc' } });
  const out: FreeTenCase[] = [];

  for (const kase of cases) {
    const items = await prisma.item.findMany({
      where: { questionTypeId: kase.questionTypeId },
      include: { questionType: true, options: { include: { misconception: true } } },
      orderBy: { id: 'asc' },
    });
    const records = items.map((item) => {
      const stem = (item.stem ?? {}) as Record<string, unknown>;
      const explanation = (item.explanation ?? {}) as Record<string, unknown>;
      const role = roleForItemStem(item.questionType.mechanic);
      const faults = [
        ...checkChildFacingText({ role, label: `${item.id} stem`, text: (stem.prompt as string) ?? '' }).filter(isBlocking),
        ...item.options.flatMap((option) =>
          checkChildFacingText({
            role: 'item-option',
            label: `${item.id} option`,
            text: String((option.content as { value?: unknown }).value ?? ''),
          }).filter(isBlocking),
        ),
      ].map((fault) => fault.detail);
      return {
        itemId: item.id,
        questionTypeId: item.questionTypeId,
        tier: item.difficultyTier,
        status: item.status,
        stem,
        options: item.options.map((option) => {
          const content = (option.content ?? {}) as Record<string, unknown>;
          return {
            label: (content.label as string) ?? null,
            value: content.value,
            isKey: option.isCorrect,
            misconceptionId: option.misconceptionId,
            misconception: option.misconception?.description ?? null,
          };
        }),
        explanation,
        gateFaults: faults,
        rewrittenStem: '',
      };
    });
    out.push({
      caseId: kase.id,
      title: kase.title,
      questionTypeId: kase.questionTypeId,
      itemCount: records.length,
      failingCount: records.filter((r) => r.gateFaults.length > 0).length,
      items: records,
    });
  }
  return out;
}
