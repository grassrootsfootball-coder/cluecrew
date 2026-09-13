/**
 * A SEAT HAS THREE STATES, NOT TWO (Annie's 234th): OCCUPIED, OWED, ACCOUNTED FOR.
 *
 * **THE THIRD EXISTS BECAUSE A SCREEN THAT READS A RULED EMPTINESS AS A DEBT WOULD AUTHOR SEATS TO
 * UNDO THE RULE THAT EMPTIED THEM.** Her 198th removes the second same-act seat of a symmetric pair:
 * the seat is empty because the mechanism has no third input, and it is empty ON PURPOSE. A
 * wholeness screen counting occupancy reads that as a gap, and filling the gap reverses the ruling
 * — **which is exactly what this store did on four rows before the state existed.**
 *
 * So the third state **carries its ruling on its face**, and no screen has to infer it. That is
 * R604's test applied to a seat rather than a field: an emptiness with a reason is a decision, an
 * emptiness without one is a debt, and nothing but the reason separates them.
 *
 * **AND IT IS NOT A SOFTENING.** ACCOUNTED_FOR requires a NAMED ruling. A seat emptied with no
 * record is OWED, because absence is not approval (R98) — the state cannot be reached by silence.
 */

export type SeatState = 'OCCUPIED' | 'OWED' | 'ACCOUNTED_FOR';

export interface RuledEmpty { itemId: string; seat: string; ruling: string; withdrawnOn: string }

export interface SeatVerdict {
  state: SeatState;
  /** Present only for ACCOUNTED_FOR. The ruling the seat states on its face. */
  ruling: string | null;
  /** True when a wholeness screen should count this seat as work outstanding. */
  countsAsADebt: boolean;
}

export function seatState(
  hasExecution: boolean, itemId: string, seat: string, ruledEmpty: readonly RuledEmpty[],
): SeatVerdict {
  if (hasExecution) return { state: 'OCCUPIED', ruling: null, countsAsADebt: false };
  const ruled = ruledEmpty.find((r) => r.itemId === itemId && r.seat === seat);
  if (ruled) return { state: 'ACCOUNTED_FOR', ruling: ruled.ruling, countsAsADebt: false };
  return { state: 'OWED', ruling: null, countsAsADebt: true };
}

/** The seat's own value, as the screens name it. A row id names five seats (R1008). */
export const seatOf = (content: unknown): string => {
  const v = (content as { value?: unknown })?.value;
  return Array.isArray(v) ? v.join(',') : String(v);
};
