import { FAMILY_BY_TYPE, MECHANIC_FAMILIES, type MechanicFamily } from '@cluecrew/core';

/**
 * The VR District as a neighbourhood of quarters (BUILD-PHASE-4 §6).
 *
 * The map used to be a flat list of whichever cases happened to be authored,
 * which read as a broken sequence — Nº3, Nº4, Nº8, Nº9… Grouping every one of
 * the 21 question types under its mechanic family gives the district a shape
 * that is true whether six cases are written or all twenty-one, and shows a
 * child what kind of detective work lives where.
 *
 * Child-facing copy only: reading age ≤9, in-world, short (Addendum A §1.1).
 */

export interface Quarter {
  family: MechanicFamily;
  /** The place, not the mechanic's internal name. */
  name: string;
  /** One line a nine-year-old can read at a glance. */
  blurb: string;
}

export const QUARTERS: Record<MechanicFamily, Quarter> = {
  code: {
    family: 'code',
    name: 'Codebreaker Lane',
    blurb: 'Codes, number trails and letter jumps.',
  },
  stowaway: {
    family: 'stowaway',
    name: 'Stowaway Alley',
    blurb: 'Words hiding inside other words.',
  },
  wordweb: {
    family: 'wordweb',
    name: 'The Word Web',
    blurb: 'Meanings that match, and meanings that trick you.',
  },
  bridge: {
    family: 'bridge',
    name: 'Bridge Street',
    blurb: 'Two words joined by a rule. Build the same bridge again.',
  },
  deduction: {
    family: 'deduction',
    name: 'The Deduction Den',
    blurb: 'Clues on the table. Cross off what they rule out.',
  },
  // The English district. Child-facing copy: reading age <=9, in-world, short (Addendum A §1.1).
  comprehension: {
    family: 'comprehension',
    name: 'The Reading Room',
    blurb: 'A story on the desk. Every answer is somewhere in the lines.',
  },
  cloze: {
    family: 'cloze',
    name: 'The Gap Yard',
    blurb: 'One word missing. Only one of them sounds right.',
  },
  errorspot: {
    family: 'errorspot',
    name: 'The Fix-It Shop',
    blurb: 'One part of the sentence may have a slip in it. Find it, or say it is all fine.',
  },
};

/**
 * Quarter order across the map — gentlest work first.
 *
 * **A QUARTER DECLARED IN `QUARTERS` AND ABSENT FROM HERE RENDERS NOWHERE** — `groupIntoQuarters`
 * maps over THIS array, not over `QUARTERS`. The Reading Room, the Gap Yard and the Fix-It Shop
 * were all declared on 2026-08-16 and none of them was ever ordered, so the English half of the map
 * did not exist however many items were LIVE (R171, stop 3).
 *
 * `comprehension` is ordered now, last: the VR district is the established one and English arrives
 * after it. `cloze` and `errorspot` stay OUT, and that is a decision rather than the same oversight
 * repeated — ENG-003's 34 SpaG items are all DRAFT, so both quarters would be an empty room with a
 * name on the door. They are ordered the day their items publish.
 */
/*
 * STATUS 2026-08-19: `case-en-05` now exists for `en-spag-punct-spot`, so the Fix-It Shop HAS a
 * door. Its nine items are still DRAFT, so the rule above is unchanged and `errorspot` stays out:
 * ordering it today would put a named, empty room on the map. It joins the day those nine publish,
 * which is one CMS pass away — the signature is transcribed and nothing else blocks them.
 */
export const QUARTER_ORDER: MechanicFamily[] = [
  'stowaway',
  'wordweb',
  'code',
  'bridge',
  'deduction',
  // THE TWO ENGLISH QUARTERS SIT AFTER THE FIVE VR ONES, which is the rule the paragraph above
  // states and my first insertion broke: I anchored `errorspot` on the line that was convenient
  // and put an English quarter SECOND, between two VR quarters. The map is ordered gentlest-first
  // and English-after-VR; an anchor chosen for the edit is not an argument about the order.
  'comprehension',
  // ORDERED 2026-08-19, in the same act that published the nine en-spag-punct-spot items.
  // The Fix-It Shop has a door (case-en-05) and nine LIVE items behind it; before this it would
  // have been a named, empty room. The Gap Yard stays out until the sixteen cloze items publish.
  'errorspot',
];

export interface Location {
  questionTypeId: string;
  /** The authored case title where one exists, else the question type's name. */
  label: string;
  /** Null until a Case has been authored for this type. */
  caseId: string | null;
  cracked: boolean;
  taughtBack: boolean;
  isCurrent: boolean;
}

export function quarterFor(questionTypeId: string): MechanicFamily {
  return FAMILY_BY_TYPE[questionTypeId] ?? 'wordweb';
}

export function groupIntoQuarters(locations: Location[]): Array<{
  quarter: Quarter;
  locations: Location[];
  openCount: number;
  crackedCount: number;
}> {
  return QUARTER_ORDER.map((family) => {
    const inQuarter = locations.filter((location) => quarterFor(location.questionTypeId) === family);
    return {
      quarter: QUARTERS[family],
      locations: inQuarter,
      openCount: inQuarter.filter((location) => location.caseId !== null).length,
      crackedCount: inQuarter.filter((location) => location.cracked).length,
    };
  }).filter((group) => group.locations.length > 0);
}

export const FAMILY_COUNT = MECHANIC_FAMILIES.length;
