/**
 * The voice (Addendum A Part 1). Every repeated child-facing beat is authored
 * in /content/voice/*.json with ≥6 variants and selected here without
 * immediate repeats, so nothing feels canned by day three (§1.4).
 *
 * Rules this module exists to keep: talk to a capable kid; short, concrete,
 * active; praise the method, never the child; in-world always; never frame a
 * limit as a restriction.
 */
import beatsPack from '../../../../content/voice/beats.json';
import correctPack from '../../../../content/voice/correct.json';
import loadingPack from '../../../../content/voice/loading.json';
import notYetPack from '../../../../content/voice/not-yet.json';
import windDownPack from '../../../../content/voice/wind-down.json';

type Family = keyof typeof correctPack.byFamily;
type Beat = keyof typeof beatsPack.beats;

const lastPicked = new Map<string, number>();

/** Rotate without immediate repeats (§1.4). */
function pick(key: string, variants: readonly string[]): string {
  if (variants.length === 0) return '';
  if (variants.length === 1) return variants[0]!;
  const previous = lastPicked.get(key);
  let index = Math.floor(Math.random() * variants.length);
  if (index === previous) index = (index + 1) % variants.length;
  lastPicked.set(key, index);
  return variants[index]!;
}

/** Method-specific praise for a correct answer — never praise of the child. */
export function correctLine(family: string): string {
  const variants =
    (correctPack.byFamily as Record<string, string[]>)[family] ?? correctPack.byFamily.wordweb;
  return pick(`correct:${family}`, variants);
}

/** The opener only. The distractor's authored childHint follows it verbatim. */
export function notYetLine(): string {
  return pick('not-yet', notYetPack.variants);
}

export function loadingLine(): string {
  return pick('loading', loadingPack.variants);
}

/**
 * The first loading variant, chosen deterministically.
 *
 * pick() uses Math.random(), so calling it while rendering a client component
 * produces one string on the server and a different one during hydration —
 * React then discards and regenerates the whole tree. Anything rendered on the
 * FIRST render of a client component must use this; rotate afterwards from an
 * effect, once only the client is rendering.
 */
export const FIRST_LOADING_LINE: string = loadingPack.variants[0]!;

export function windDownLine(): string {
  return pick('wind-down', windDownPack.variants);
}

export function beatLine(beat: Beat): string {
  return pick(`beat:${beat}`, (beatsPack.beats as Record<string, string[]>)[beat] ?? []);
}

/** Fixed strings from the §1.2 table that do not rotate. */
export const VOICE = {
  hqReturning: (cases: number) => `You're back. ${countWord(cases, 'case')} on the board.`,
  hqFirstVisit: "Your board's empty. Let's fix that.",
  hqStartShift: "Start today's shift",
  streakAlive: "Lantern's still lit.",
  streakRekindled: "Lantern's lit again.",
  lockedDistrict: 'Locked. Not your patch yet.',
  // A case whose file has not been written yet. In-world and honest — never
  // "coming soon", and never framed as something being withheld (§1.5).
  caseNotWritten: "Still on the Chief's desk.",
  districtIntro: 'Five corners. Every door is a case you can take.',
  // Orientation — open on a first visit, tucked away after that. Reading age
  // ≤9, ≤30 seconds, and it never gates anything (D5).
  // The child's own case file. Self-referential only — no other child is ever
  // mentioned, and nothing on the page can go down (D2/D3).
  caseFileLede: 'Everything you have worked out so far. Nothing here ever goes backwards.',
  caseFileNoStamps: 'No stamps yet. Crack your first case and it lands here for good.',
  caseFileNoWords: 'The vault is empty for now. Every warm-up brings you three new words.',
  caseFileWeeks: (weeks: number) =>
    weeks === 1 ? 'One good week so far.' : `${weeks} good weeks so far.`,
  caseFileLanternNew: 'Show up a few days this week and it stays lit.',
  caseFileLink: 'Your case file',
  howHeading: 'What happens in a shift?',
  howSteps: [
    'Warm-up: a quick look at old cases, so they stay yours.',
    "Today's case: one kind of puzzle, taught the way that suits you.",
    'One big question: exam rules, just like the real day.',
  ] as const,
  howClose: 'Crack a case and it gets stamped. Enough stamps and you go up a rank.',
  hqFirstBoard:
    "This is your board. Cases land here, and the ones you crack stay stamped.",
  districtNothingCracked:
    "Nothing stamped yet — that's just the start of the shift. Take any door.",
  quarterProgress: (cracked: number, open: number) =>
    cracked === 0 ? `${open} open here.` : `${cracked} of ${open} cracked here.`,
  modeShelfHeader: 'How do you want to crack this one?',
  modeLabels: {
    watch: 'Watch me solve one',
    walk: 'Walk through it with me',
    see: 'Show me with pictures',
    hear: 'Read it to me',
    try: 'Just let me try',
  } as const,
  missAgain: 'Have another go',
  missWayIn: 'Show me a way in',
  crackedStamp: 'CRACKED.',
  rankUp: (rank: string) => `You made ${rank}. Badge is yours.`,
  shelfComplete: (family: string) => `Whole ${family} family. That's the shelf finished.`,
  bossIntro: 'Big one today. Real exam rules: no tools, just you.',
  bossEnd: 'Time. Pens down, Detective.',
  offline: "Lost the signal. We'll wait here a sec.",
  vaultEmpty: "Vault's bare. Every warm-up brings three new cards.",
  hqLocked: "HQ's shut for the moment. Your grown-up can open it up.",
  hqNoProfile: 'Ask your grown-up to pick your name, and this door opens.',
} as const;

const NUMBER_WORDS = [
  'No',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
];

/** "Three cases", not "3 cases" — §1.1 register. */
export function countWord(count: number, noun: string): string {
  const word = count < NUMBER_WORDS.length ? NUMBER_WORDS[count]! : String(count);
  return `${word} ${noun}${count === 1 ? '' : 's'}`;
}

export type { Family };
