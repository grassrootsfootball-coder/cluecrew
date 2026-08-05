/**
 * The automated fairness checks (BUILD-DISTRICT-NVR gates #5 and #6): run
 * over sampled items in CI and over every item the serving layer builds.
 * A template that cannot pass these for every seed cannot be signed, and a
 * deliberately over-dense or hue-only template version fails CI (the tests
 * carry exactly such fixtures).
 */
import { NVR_CONFIG } from './config';
import { canonical, elementCount, visualKey, type Visual } from './grammar';
import { isNvrMisconceptionId } from './misconceptions';
import type { GeneratedNvrItem } from './templates';

export interface NvrCheckFailure {
  check:
    | 'density-cap'
    | 'colour-only-meaning'
    | 'single-answer'
    | 'option-count'
    | 'misconception-mapping'
    | 'misconception-distinctness'
    | 'duplicate-option';
  detail: string;
}

/**
 * Templates whose wrong options legitimately repeat a misconception, and why —
 * the parameterised / set-level families (reviewer + corpus, 2026-08-05). Every
 * OTHER template must give its four wrong options four DISTINCT executed errors;
 * these are the honest exceptions, not a licence to tag by slot.
 *
 *   lineup-odd       set-level — the four members ARE the group; one shared mode
 *   lineup-counting  one estimate error, magnitude a parameter (count-by-glance ×3)
 *   lineup-like@T1–3 three modes at low tiers; the relational fourth only exists T4–5
 */
function distinctnessExempt(templateId: string, tier: number): boolean {
  if (templateId === 'lineup-odd' || templateId === 'lineup-counting') return true;
  if (templateId === 'lineup-like' && tier <= 3) return true;
  return false;
}

/**
 * Gate #4 follow-up (reviewer audit): a distractor must BE a distinct executed
 * error, so a template's wrong options carry distinct misconception tags — no
 * fixed-slot duplicate. The parameterised/set-level families above are exempt.
 */
export function checkMisconceptionDistinctness(item: GeneratedNvrItem): NvrCheckFailure[] {
  if (distinctnessExempt(item.templateId, item.tier)) return [];
  const wrongTags = item.options.filter((o) => !o.isCorrect).map((o) => o.misconceptionId);
  const distinct = new Set(wrongTags);
  if (distinct.size < wrongTags.length) {
    const counts = wrongTags.reduce<Record<string, number>>((acc, t) => ((acc[t ?? '∅'] = (acc[t ?? '∅'] ?? 0) + 1), acc), {});
    const dup = Object.entries(counts).filter(([, n]) => n > 1).map(([t, n]) => `${t}×${n}`).join(', ');
    return [{
      check: 'misconception-distinctness',
      detail: `${item.templateId}@${item.templateVersion} seed ${item.seed} T${item.tier}: wrong options repeat a misconception (${dup}) — each must be a distinct executed error`,
    }];
  }
  return [];
}

/** SCP-NVR-2, adopted verbatim: no visual may exceed its tier's element cap. */
export function checkDensity(item: GeneratedNvrItem): NvrCheckFailure[] {
  const cap = NVR_CONFIG.densityCaps.maxElementsByTier[item.tier];
  if (!cap) return [{ check: 'density-cap', detail: `no cap configured for tier ${item.tier}` }];
  const failures: NvrCheckFailure[] = [];
  const visuals: Array<[string, Visual]> = [
    ...item.panels.map((panel, index) => [`panel ${index}`, panel] as [string, Visual]),
    ...item.options.map((option, index) => [`option ${index}`, option.visual] as [string, Visual]),
  ];
  for (const [where, visual] of visuals) {
    const count = elementCount(visual);
    if (count > cap) {
      failures.push({
        check: 'density-cap',
        detail: `${item.templateId}@${item.templateVersion} seed ${item.seed} T${item.tier}: ${where} holds ${count} elements (cap ${cap})`,
      });
    }
  }
  return failures;
}

/**
 * Manifesto §6 / gate #5: hue never carries meaning alone. Two options whose
 * canonical forms (which exclude tone) collide while their raw specs differ
 * only in tone would be distinguishable by colour and nothing else — refused.
 * The same rule catches a panel set that only varies by tone.
 */
export function checkColourblindSafe(item: GeneratedNvrItem): NvrCheckFailure[] {
  const failures: NvrCheckFailure[] = [];
  const seen = new Map<string, number>();
  item.options.forEach((option, index) => {
    const key = option.codeLabel ?? visualKey(option.visual);
    const earlier = seen.get(key);
    if (earlier !== undefined) {
      failures.push({
        check: 'colour-only-meaning',
        detail: `${item.templateId}@${item.templateVersion} seed ${item.seed} T${item.tier}: options ${earlier} and ${index} are identical once hue is ignored`,
      });
    } else {
      seen.set(key, index);
    }
  });
  // Within any single visual, elements may differ by tone only if they also
  // differ by pattern, shape, size or position — otherwise the item is
  // drawing a distinction a colourblind child cannot see.
  const visuals = [...item.panels, ...item.options.map((option) => option.visual)];
  for (const visual of visuals) {
    const canonicalKeys = new Set(visual.elements.map((element) => JSON.stringify(canonical(element))));
    const withToneKeys = new Set(
      visual.elements.map((element) => JSON.stringify({ ...canonical(element), tone: element.tone })),
    );
    if (withToneKeys.size > canonicalKeys.size) {
      failures.push({
        check: 'colour-only-meaning',
        detail: `${item.templateId}@${item.templateVersion} seed ${item.seed} T${item.tier}: a visual distinguishes elements by hue alone`,
      });
      break;
    }
  }
  return failures;
}

/** Exactly one key, five options, every option visually distinct. */
export function checkSingleAnswer(item: GeneratedNvrItem): NvrCheckFailure[] {
  const failures: NvrCheckFailure[] = [];
  if (item.options.length !== NVR_CONFIG.optionCount) {
    failures.push({
      check: 'option-count',
      detail: `${item.templateId}@${item.templateVersion} seed ${item.seed} T${item.tier}: ${item.options.length} options (SCP-NVR-1 requires ${NVR_CONFIG.optionCount})`,
    });
  }
  const correct = item.options.filter((option) => option.isCorrect).length;
  if (correct !== 1) {
    failures.push({
      check: 'single-answer',
      detail: `${item.templateId}@${item.templateVersion} seed ${item.seed} T${item.tier}: ${correct} keyed options`,
    });
  }
  const keys = item.options.map((option) => option.codeLabel ?? visualKey(option.visual));
  if (new Set(keys).size !== keys.length) {
    failures.push({
      check: 'duplicate-option',
      detail: `${item.templateId}@${item.templateVersion} seed ${item.seed} T${item.tier}: two options show the same picture`,
    });
  }
  return failures;
}

/** P3: every wrong option executes one of the 19 corpus-proposed entries. */
export function checkMisconceptionMapping(item: GeneratedNvrItem): NvrCheckFailure[] {
  const failures: NvrCheckFailure[] = [];
  item.options.forEach((option, index) => {
    if (option.isCorrect) {
      if (option.misconceptionId !== null) {
        failures.push({
          check: 'misconception-mapping',
          detail: `${item.templateId}@${item.templateVersion} seed ${item.seed} T${item.tier}: the key carries a misconception tag`,
        });
      }
      return;
    }
    if (!option.misconceptionId || !isNvrMisconceptionId(option.misconceptionId)) {
      failures.push({
        check: 'misconception-mapping',
        detail: `${item.templateId}@${item.templateVersion} seed ${item.seed} T${item.tier}: option ${index} tag "${option.misconceptionId}" is not one of the 19 proposed entries`,
      });
    }
  });
  return failures;
}

export function checkItem(item: GeneratedNvrItem): NvrCheckFailure[] {
  return [
    ...checkDensity(item),
    ...checkColourblindSafe(item),
    ...checkSingleAnswer(item),
    ...checkMisconceptionMapping(item),
    ...checkMisconceptionDistinctness(item),
  ];
}
