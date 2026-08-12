import { describe, expect, it } from 'vitest';
import { selectItem } from './adaptivity';
import {
  DEFAULT_TIER_SPREAD,
  MOCK_CADENCE_DAYS,
  PENDING_VERIFICATION,
  blueprintFileSchema,
  burnedItemIds,
  composeMockPaper,
  isBlueprintVerified,
  nextMockAllowedAt,
  type Blueprint,
  type MockCandidateItem,
} from './blueprints';

// ---------------------------------------------------------------------------
// Pool isolation (Addendum B §1) — the guarantee everything else rests on
// ---------------------------------------------------------------------------

describe('practice selection never serves a MOCK item', () => {
  it('excludes MOCK items even when they are the only candidates', () => {
    const onlyMock = [
      { id: 'm1', tier: 3, pool: 'MOCK' as const },
      { id: 'm2', tier: 3, pool: 'MOCK' as const },
    ];
    expect(selectItem(onlyMock, 3)).toBeNull();
  });

  it('excludes MOCK items even when they are the best tier match', () => {
    const mixed = [
      { id: 'mock-perfect', tier: 3, pool: 'MOCK' as const },
      { id: 'practice-far', tier: 5, pool: 'PRACTICE' as const },
    ];
    expect(selectItem(mixed, 3)?.id).toBe('practice-far');
  });

  it('treats items without a pool field as practice (back-compat)', () => {
    expect(selectItem([{ id: 'legacy', tier: 2 }], 2)?.id).toBe('legacy');
  });
});

// ---------------------------------------------------------------------------
// Blueprint schema
// ---------------------------------------------------------------------------

const draftBlueprint: Blueprint = {
  id: 'test-standard',
  district: 'VR',
  variant: 'full',
  title: 'Test Paper',
  sections: [
    {
      instructions: 'Read each question. Choose one answer. Mark it clearly.',
      questionCount: 6,
      typeMix: { 'vr-08-move-letter': 3, 'vr-11-number-series': 3 },
      minutes: 8,
    },
    {
      instructions: 'Same rules as before. Work steadily to the end of the section.',
      questionCount: 4,
      typeMix: { 'vr-11-number-series': 4 },
      minutes: 6,
    },
  ],
  notes: 'test blueprint',
  verifiedBy: PENDING_VERIFICATION,
  verifiedAt: null,
  sourceRef: 'test',
};

describe('blueprint schema', () => {
  it('accepts a well-formed draft and knows it is unverified', () => {
    const parsed = blueprintFileSchema.parse({ kind: 'blueprint', blueprint: draftBlueprint });
    expect(isBlueprintVerified(parsed.blueprint)).toBe(false);
  });

  it('a verified blueprint carries a reviewer and a date', () => {
    expect(
      isBlueprintVerified({ ...draftBlueprint, verifiedBy: 'Jane Doe', verifiedAt: '2026-08-01' }),
    ).toBe(true);
    // A signature without a date is still a draft — gate 3 wants both.
    expect(isBlueprintVerified({ ...draftBlueprint, verifiedBy: 'Jane Doe' })).toBe(false);
  });

  it('rejects a section whose typeMix does not sum to questionCount', () => {
    const bad = {
      ...draftBlueprint,
      sections: [{ ...draftBlueprint.sections[0]!, questionCount: 5 }],
    };
    expect(blueprintFileSchema.safeParse({ kind: 'blueprint', blueprint: bad }).success).toBe(false);
  });

  it('default tier spread is centred on T3', () => {
    const entries = Object.entries(DEFAULT_TIER_SPREAD).map(([t, w]) => [Number(t), w] as const);
    const max = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
    expect(max[0]).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

/** A mock pool: `perType` LIVE MOCK items per type, tiers cycling 1..5. */
function pool(perType: number, types: string[]): MockCandidateItem[] {
  const items: MockCandidateItem[] = [];
  for (const questionTypeId of types) {
    for (let index = 0; index < perType; index++) {
      items.push({
        id: `${questionTypeId}-mock-${String(index).padStart(3, '0')}`,
        questionTypeId,
        tier: (index % 5) + 1,
        pool: 'MOCK',
        status: 'LIVE',
      });
    }
  }
  return items;
}

const TYPES = ['vr-08-move-letter', 'vr-11-number-series'];

describe('composeMockPaper', () => {
  it('composes strictly to blueprint: counts, order, and only LIVE MOCK items', () => {
    const composed = composeMockPaper({
      blueprint: draftBlueprint,
      candidates: pool(30, TYPES),
      burnedItemIds: new Set(),
      seed: 'child-1:0',
    });
    if (!composed.ok) throw new Error('expected composition to succeed');
    expect(composed.sections).toHaveLength(2);
    expect(composed.sections[0]!.itemIds).toHaveLength(6);
    expect(composed.sections[1]!.itemIds).toHaveLength(4);
    const all = composed.sections.flatMap((section) => section.itemIds);
    expect(new Set(all).size).toBe(all.length); // no reuse inside one paper
  });

  it('never composes a PRACTICE item into a paper, whatever the shortfall', () => {
    const practiceOnly: MockCandidateItem[] = pool(30, TYPES).map((item) => ({
      ...item,
      pool: 'PRACTICE',
    }));
    const composed = composeMockPaper({
      blueprint: draftBlueprint,
      candidates: practiceOnly,
      burnedItemIds: new Set(),
      seed: 'child-1:0',
    });
    expect(composed.ok).toBe(false);
  });

  it('never re-serves a burned item, and three papers compose without reuse', () => {
    // Exactly enough for three papers: section demand is 3+7 per type… the
    // blueprint wants vr-08×3 and vr-11×7 per paper, so 3 papers need 9 and 21.
    const candidates = pool(21, TYPES);
    const burned = new Set<string>();
    for (let paper = 0; paper < 3; paper++) {
      const composed = composeMockPaper({
        blueprint: draftBlueprint,
        candidates,
        burnedItemIds: burned,
        seed: `child-1:${paper}`,
      });
      if (!composed.ok) throw new Error(`paper ${paper + 1} failed to compose`);
      for (const id of composed.sections.flatMap((section) => section.itemIds)) {
        expect(burned.has(id)).toBe(false);
        burned.add(id);
      }
    }
    // The fourth composition fails with a clear per-type shortfall (gate #2).
    const fourth = composeMockPaper({
      blueprint: draftBlueprint,
      candidates,
      burnedItemIds: burned,
      seed: 'child-1:3',
    });
    expect(fourth.ok).toBe(false);
    if (!fourth.ok) {
      expect(fourth.shortfalls.length).toBeGreaterThan(0);
      expect(fourth.shortfalls[0]).toHaveProperty('needed');
      expect(fourth.shortfalls[0]).toHaveProperty('available');
    }
  });

  it('two children draw different papers from the same pool', () => {
    const candidates = pool(30, TYPES);
    const first = composeMockPaper({
      blueprint: draftBlueprint,
      candidates,
      burnedItemIds: new Set(),
      seed: 'child-a:0',
    });
    const second = composeMockPaper({
      blueprint: draftBlueprint,
      candidates,
      burnedItemIds: new Set(),
      seed: 'child-b:0',
    });
    if (!first.ok || !second.ok) throw new Error('expected both to compose');
    expect(first.sections[0]!.itemIds.join(',')).not.toBe(second.sections[0]!.itemIds.join(','));
  });

  it('the same seed reproduces the same paper', () => {
    const candidates = pool(30, TYPES);
    const compose = () =>
      composeMockPaper({
        blueprint: draftBlueprint,
        candidates,
        burnedItemIds: new Set(),
        seed: 'child-a:0',
      });
    const one = compose();
    const two = compose();
    if (!one.ok || !two.ok) throw new Error('expected both to compose');
    expect(one.sections).toEqual(two.sections);
  });

  it('tier distribution centres on T3', () => {
    // One section of 10 questions from a wide single-type pool.
    const blueprint: Blueprint = {
      ...draftBlueprint,
      sections: [
        {
          instructions: 'Read each question. Choose one answer. Mark it clearly.',
          questionCount: 10,
          typeMix: { 'vr-11-number-series': 10 },
          minutes: 10,
        },
      ],
    };
    const composed = composeMockPaper({
      blueprint,
      candidates: pool(50, ['vr-11-number-series']),
      burnedItemIds: new Set(),
      seed: 'child-1:0',
    });
    if (!composed.ok) throw new Error('expected composition to succeed');
    const byId = new Map(pool(50, ['vr-11-number-series']).map((item) => [item.id, item.tier]));
    const tiers = composed.sections[0]!.itemIds.map((id) => byId.get(id)!);
    const t3 = tiers.filter((tier) => tier === 3).length;
    // DEFAULT_TIER_SPREAD gives T3 a 0.4 weight → 4 of 10.
    expect(t3).toBe(4);
  });

  // -------------------------------------------------------------------------
  // R49 — technique-repetition capping. An open-set tag, not a linked pair
  // (unlike the comma family's pairId): any two items sharing a technique
  // must never land in the same paper, whether the collision is across two
  // different type-mix slots or two picks within the SAME slot.
  // -------------------------------------------------------------------------
  describe('technique-repetition capping (R49)', () => {
    const techBlueprint: Blueprint = {
      ...draftBlueprint,
      district: 'ENGLISH',
      sections: [
        {
          instructions: 'Read each question. Choose one answer. Mark it clearly.',
          questionCount: 2,
          typeMix: { 'en-comp-technique': 2 },
          minutes: 8,
        },
      ],
    };

    it('never draws two items sharing a techniqueKey into one paper', () => {
      // Every candidate at the SAME tier so the tier-nearest sort cannot be the reason only one
      // of each pair gets picked — the exclusion has to be doing the work.
      const candidates: MockCandidateItem[] = [
        { id: 't-anthro-1', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', techniqueKey: 'anthropomorphism-gap' },
        { id: 't-anthro-2', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', techniqueKey: 'anthropomorphism-gap' },
        { id: 't-blindspot-1', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', techniqueKey: 'character-blind-spot' },
      ];
      const composed = composeMockPaper({ blueprint: techBlueprint, candidates, burnedItemIds: new Set(), seed: 'child-1:0' });
      if (!composed.ok) throw new Error('expected composition to succeed');
      const drawn = composed.sections[0]!.itemIds;
      expect(drawn).toHaveLength(2);
      // The two anthropomorphism-gap items can never BOTH appear.
      expect(drawn.includes('t-anthro-1') && drawn.includes('t-anthro-2')).toBe(false);
      // With exactly one non-colliding item per technique available, the draw must be one of each.
      expect(new Set(drawn.map((id) => (id.startsWith('t-anthro') ? 'anthropomorphism-gap' : 'character-blind-spot'))).size).toBe(2);
    });

    it('technique exhaustion is a loud shortfall, never a silent same-technique substitution', () => {
      // Two candidates, but they share a technique — a paper needing 2 distinct items cannot be
      // built honestly from this pool. Composition must refuse, not quietly serve the collision.
      const candidates: MockCandidateItem[] = [
        { id: 't-a', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', techniqueKey: 'register-mismatch' },
        { id: 't-b', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', techniqueKey: 'register-mismatch' },
      ];
      const composed = composeMockPaper({ blueprint: techBlueprint, candidates, burnedItemIds: new Set(), seed: 'child-1:0' });
      expect(composed.ok).toBe(false);
      if (composed.ok) return;
      expect(composed.shortfalls).toEqual([{ sectionIndex: 0, questionTypeId: 'en-comp-technique', needed: 2, available: 2 }]);
    });

    it('a technique already used in an earlier section excludes a match in a later one', () => {
      const twoSectionBlueprint: Blueprint = {
        ...techBlueprint,
        sections: [
          { instructions: 'Read each question. Choose one answer. Mark it clearly.', questionCount: 1, typeMix: { 'en-comp-technique': 1 }, minutes: 4 },
          { instructions: 'Same rules as before. Work steadily to the end of the section.', questionCount: 1, typeMix: { 'en-comp-technique': 1 }, minutes: 4 },
        ],
      };
      const candidates: MockCandidateItem[] = [
        { id: 't-1', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', techniqueKey: 'register-mismatch' },
        { id: 't-2', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', techniqueKey: 'register-mismatch' },
      ];
      const composed = composeMockPaper({ blueprint: twoSectionBlueprint, candidates, burnedItemIds: new Set(), seed: 'child-1:0' });
      // The first section takes one register-mismatch item; the second section's only remaining
      // candidate collides, so it comes up short even though an item of the right TYPE exists.
      expect(composed.ok).toBe(false);
      if (composed.ok) return;
      expect(composed.shortfalls).toEqual([{ sectionIndex: 1, questionTypeId: 'en-comp-technique', needed: 1, available: 0 }]);
    });

    it('never draws both halves of a linked pair into one paper (R19 #2 / R59)', () => {
      // The comma family's mirrored pair: same clause fronted (keyed) and trailing (keyed N).
      // Same tier throughout, so the tier sort cannot be what separates them.
      const candidates: MockCandidateItem[] = [
        { id: 'c0-although', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', pairId: 'mp-race' },
        { id: 'c1-nt3', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', pairId: 'mp-race' },
        { id: 'c0-once', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', pairId: 'mp-film' },
      ];
      const composed = composeMockPaper({ blueprint: techBlueprint, candidates, burnedItemIds: new Set(), seed: 'child-1:0' });
      if (!composed.ok) throw new Error('expected composition to succeed');
      const drawn = composed.sections[0]!.itemIds;
      expect(drawn).toHaveLength(2);
      expect(drawn.includes('c0-although') && drawn.includes('c1-nt3')).toBe(false);
    });

    it('a linked pair exhausting a slot is a loud shortfall, not a silent both-halves draw', () => {
      const candidates: MockCandidateItem[] = [
        { id: 'c0-while', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', pairId: 'mp-book' },
        { id: 'c1-nt2', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', pairId: 'mp-book' },
      ];
      const composed = composeMockPaper({ blueprint: techBlueprint, candidates, burnedItemIds: new Set(), seed: 'child-1:0' });
      expect(composed.ok).toBe(false);
      if (composed.ok) return;
      expect(composed.shortfalls).toEqual([{ sectionIndex: 0, questionTypeId: 'en-comp-technique', needed: 2, available: 2 }]);
    });

    it('the two dimensions are independent — a technique match and a pair match both exclude', () => {
      // Distinct pairIds but a shared technique, and vice versa: each dimension bites on its own.
      const candidates: MockCandidateItem[] = [
        { id: 'a', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', pairId: 'p1', techniqueKey: 'shared' },
        { id: 'b', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', pairId: 'p2', techniqueKey: 'shared' },
        { id: 'c', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE', pairId: 'p3', techniqueKey: 'distinct' },
      ];
      const composed = composeMockPaper({ blueprint: techBlueprint, candidates, burnedItemIds: new Set(), seed: 'child-1:0' });
      if (!composed.ok) throw new Error('expected composition to succeed');
      const drawn = composed.sections[0]!.itemIds;
      // a and b share a technique, so they cannot co-occur even though their pairIds differ.
      expect(drawn.includes('a') && drawn.includes('b')).toBe(false);
      expect(drawn).toContain('c');
    });

    it('items with no techniqueKey are never constrained by it', () => {
      // The overwhelming majority of items (every non-whole-text-purpose shape, every other
      // district): techniqueKey is absent, and absence must never collide with itself.
      const candidates: MockCandidateItem[] = [
        { id: 'plain-1', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE' },
        { id: 'plain-2', questionTypeId: 'en-comp-technique', tier: 4, pool: 'MOCK', status: 'LIVE' },
      ];
      const composed = composeMockPaper({ blueprint: techBlueprint, candidates, burnedItemIds: new Set(), seed: 'child-1:0' });
      if (!composed.ok) throw new Error('expected composition to succeed — no techniqueKey means nothing to collide on');
      expect(composed.sections[0]!.itemIds).toHaveLength(2);
    });
  });
});

// ---------------------------------------------------------------------------
// Burn rule and cadence
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Per-cycle-policy sections (BUILD-DISTRICT-ENGLISH §7): CSSE's writing
// allocation is the exam setter's policy for a cycle, not a fixed property of
// the format — one observed cycle carried none. Composition must be told.
// ---------------------------------------------------------------------------

describe('per-cycle-policy sections', () => {
  const policyBlueprint: Blueprint = {
    id: 'policy-test',
    district: 'ENGLISH',
    variant: 'full',
    title: 'Policy test paper',
    sections: [
      {
        instructions: 'Read the story first. Then answer the questions about it.',
        questionCount: 2,
        typeMix: { [TYPES[0]!]: 2 },
        minutes: 10,
      },
      {
        instructions: 'Now the writing task. Plan for five minutes before you start.',
        questionCount: 2,
        typeMix: { [TYPES[1]!]: 2 },
        minutes: 20,
        perCyclePolicy: true,
        perCyclePolicyNote: 'One observed cycle carried no writing task at all.',
      },
    ],
    notes: 'test fixture',
    verifiedBy: PENDING_VERIFICATION,
    verifiedAt: null,
    sourceRef: 'test',
  };

  it('a policy-variable section without a note cannot even parse', () => {
    const parsed = blueprintFileSchema.safeParse({
      kind: 'blueprint',
      blueprint: {
        ...policyBlueprint,
        sections: [{ ...policyBlueprint.sections[1]!, perCyclePolicyNote: undefined }],
      },
    });
    expect(parsed.success).toBe(false);
  });

  it('composition REFUSES when it has not been told about the policy section', () => {
    const composed = composeMockPaper({
      blueprint: policyBlueprint,
      candidates: pool(10, TYPES),
      burnedItemIds: new Set(),
      seed: 'child-1',
    });
    expect(composed.ok).toBe(false);
    if (composed.ok) return;
    expect(composed.undecidedPolicySections).toEqual([1]);
  });

  it('told the cycle carries it, the section composes normally', () => {
    const composed = composeMockPaper({
      blueprint: policyBlueprint,
      candidates: pool(10, TYPES),
      burnedItemIds: new Set(),
      seed: 'child-1',
      policySections: { 1: true },
    });
    expect(composed.ok).toBe(true);
    if (!composed.ok) return;
    expect(composed.sections[1]!.itemIds).toHaveLength(2);
  });

  it('told the cycle does NOT carry it, the section stays empty and nothing is burned for it', () => {
    const composed = composeMockPaper({
      blueprint: policyBlueprint,
      candidates: pool(10, TYPES),
      burnedItemIds: new Set(),
      seed: 'child-1',
      policySections: { 1: false },
    });
    expect(composed.ok).toBe(true);
    if (!composed.ok) return;
    expect(composed.sections).toHaveLength(2);
    expect(composed.sections[0]!.itemIds).toHaveLength(2);
    expect(composed.sections[1]!.itemIds).toEqual([]);
  });
});

describe('burnedItemIds', () => {
  const sections = [{ itemIds: ['a', 'b'] }, { itemIds: ['c', 'd'] }];

  it('a completed sitting burns every served item', () => {
    const burned = burnedItemIds([
      { status: 'COMPLETED', servedSections: sections, sectionTimings: [{}, {}] },
    ]);
    expect([...burned].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('an abandoned sitting burns only the sections the child opened', () => {
    const burned = burnedItemIds([
      {
        status: 'ABANDONED',
        servedSections: sections,
        sectionTimings: [{ startedAt: '2026-08-01T10:00:00Z' }, {}],
      },
    ]);
    expect([...burned].sort()).toEqual(['a', 'b']);
  });

  it('scheduled and in-progress sittings hold their items', () => {
    const burned = burnedItemIds([
      { status: 'SCHEDULED', servedSections: [sections[0]!], sectionTimings: [{}] },
      { status: 'IN_PROGRESS', servedSections: [sections[1]!], sectionTimings: [{}] },
    ]);
    expect([...burned].sort()).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('nextMockAllowedAt', () => {
  const now = new Date('2026-08-10T09:00:00Z');

  it('a child with no sittings in the district can sit now', () => {
    expect(nextMockAllowedAt([], now)).toEqual(now);
  });

  it('a sitting three days ago blocks until day seven', () => {
    const threeDaysAgo = new Date('2026-08-07T09:00:00Z');
    const allowed = nextMockAllowedAt([threeDaysAgo], now);
    expect(allowed.getTime()).toBe(
      threeDaysAgo.getTime() + MOCK_CADENCE_DAYS * 24 * 60 * 60 * 1000,
    );
    expect(allowed.getTime()).toBeGreaterThan(now.getTime());
  });

  it('a sitting eight days ago does not block', () => {
    const allowed = nextMockAllowedAt([new Date('2026-08-01T09:00:00Z')], now);
    expect(allowed.getTime()).toBeLessThan(now.getTime());
  });
});
