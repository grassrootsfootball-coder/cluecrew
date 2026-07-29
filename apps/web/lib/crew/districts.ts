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
};

/** Quarter order across the map — gentlest work first. */
export const QUARTER_ORDER: MechanicFamily[] = [
  'stowaway',
  'wordweb',
  'code',
  'bridge',
  'deduction',
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
