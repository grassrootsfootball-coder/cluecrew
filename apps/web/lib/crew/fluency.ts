/**
 * The fluency thread (BUILD-DISTRICT-MATHS §6): times tables to 12×12,
 * number bonds, doubling and halving. Questions are GENERATED, not authored
 * — facts are facts — and generation is seeded per child per day, so a
 * refresh never re-rolls an easier round. Progress is by questions, never a
 * countdown (D-laws: nothing here may feel timed), and the round is sized
 * to sit inside 60–90 seconds of a warm-up without ever measuring seconds.
 */

export interface FluencyQuestion {
  prompt: string;
  answer: number;
}

/** Mulberry32 — tiny, deterministic, good enough for shuffling facts. */
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const FLUENCY_ROUND_SIZE = 8;

export function fluencyRound(childId: string, dayKey: string): FluencyQuestion[] {
  const random = seededRandom(hashSeed(`${childId}:${dayKey}`));
  const questions: FluencyQuestion[] = [];
  const kinds = ['table', 'table', 'table', 'bond', 'bond', 'double', 'half', 'table'] as const;
  for (const kind of kinds) {
    if (kind === 'table') {
      const a = 2 + Math.floor(random() * 11);
      const b = 2 + Math.floor(random() * 11);
      questions.push({ prompt: `${a} × ${b}`, answer: a * b });
    } else if (kind === 'bond') {
      const target = random() < 0.5 ? 20 : 100;
      const part = 1 + Math.floor(random() * (target - 1));
      questions.push({ prompt: `${part} + ? = ${target}`, answer: target - part });
    } else if (kind === 'double') {
      const value = 6 + Math.floor(random() * 45);
      questions.push({ prompt: `Double ${value}`, answer: value * 2 });
    } else {
      const value = 2 * (4 + Math.floor(random() * 46));
      questions.push({ prompt: `Half of ${value}`, answer: value / 2 });
    }
  }
  return questions.slice(0, FLUENCY_ROUND_SIZE);
}
