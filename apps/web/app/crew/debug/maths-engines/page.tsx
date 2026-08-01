'use client';

/**
 * Maths district gate #1 harness (BUILD-DISTRICT-MATHS §10.1): all five
 * engines rendered Case-mode AND Plain-mode from the SAME fixture rows,
 * with the Bar Model Builder's stage/corner/absent fade on show. Dev and
 * staging only — these fixtures are engineering scaffolding, not authored
 * content, and no child route links here.
 */
import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { EngineProps } from '@/components/crew/engines/shared';

const ENGINES = {
  forge: dynamic(() => import('@/components/crew/engines/maths/number-forge')),
  workshop: dynamic(() => import('@/components/crew/engines/maths/workshop')),
  markhomework: dynamic(() => import('@/components/crew/engines/maths/mark-homework')),
  datadesk: dynamic(() => import('@/components/crew/engines/maths/data-desk')),
  shapeshop: dynamic(() => import('@/components/crew/engines/maths/shape-shop')),
} as const;

type EngineKey = keyof typeof ENGINES;

interface Fixture {
  title: string;
  stem: Record<string, unknown>;
  options: Array<{ id: string; content: string }>;
}

const FIXTURES: Record<EngineKey, Fixture> = {
  forge: {
    title: 'NUMBER FORGE — estimation duel',
    stem: { prompt: 'Without working it out: is 298 + 154 closer to 400 or 500?', duel: true, numberLine: { min: 300, max: 600, marks: [400, 500] } },
    options: [
      { id: 'a', content: '400' },
      { id: 'b', content: '500' },
    ],
  },
  workshop: {
    title: 'THE WORKSHOP — word problem with the Builder',
    stem: {
      prompt:
        'The Workshop packs 3 crates with 4 tools each, and one more crate holds the rest. There are 20 tools altogether. How many tools are in the last crate?',
      barModel: { reference: [{ parts: 3, partValue: 4 }, { parts: 1, unknown: true }] },
    },
    options: [
      { id: 'a', content: '8' },
      { id: 'b', content: '12' },
      { id: 'c', content: '5' },
      { id: 'd', content: '7' },
    ],
  },
  markhomework: {
    // Deliberately money-free: the D7 scanner bans £ in child scope, and the
    // money strand's collision with that pattern is a gate decision for
    // David + reviewer — fixtures don't get to pre-empt it.
    title: 'MARK THE HOMEWORK — find the slip',
    stem: {
      prompt: 'A shelf job used 3 packs of 6 screws, and 5 spare screws. Check the working.',
      working: ['3 × 6 = 18', '18 + 5 = 24', 'So 24 screws in all'],
    },
    options: [
      { id: 'a', content: '3 × 6 = 18' },
      { id: 'b', content: '18 + 5 = 24' },
      { id: 'c', content: 'So 24 screws in all' },
    ],
  },
  datadesk: {
    title: 'DATA DESK — read the chart',
    stem: {
      prompt: 'The chart shows tools sold each day. Which day sold exactly 30?',
      chart: {
        kind: 'bar',
        categories: [
          { label: 'Mon', value: 20, optionIndex: 0 },
          { label: 'Tue', value: 30, optionIndex: 1 },
          { label: 'Wed', value: 25, optionIndex: 2 },
          { label: 'Thu', value: 35, optionIndex: 3 },
        ],
      },
    },
    options: [
      { id: 'a', content: 'Monday' },
      { id: 'b', content: 'Tuesday' },
      { id: 'c', content: 'Wednesday' },
      { id: 'd', content: 'Thursday' },
    ],
  },
  shapeshop: {
    title: 'SHAPE SHOP — the stretchy rectangle',
    stem: {
      prompt: 'A 6 by 4 workshop floor needs skirting all the way round. How many metres of skirting?',
      shape: { kind: 'rect', width: 6, height: 4, unit: 'm' },
    },
    options: [
      { id: 'a', content: '20 m' },
      { id: 'b', content: '24 m' },
      { id: 'c', content: '10 m' },
      { id: 'd', content: '12 m' },
    ],
  },
};

function EngineCard({ engine, fixture, plain }: { engine: EngineKey; fixture: Fixture; plain: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const Engine = ENGINES[engine] as React.ComponentType<EngineProps>;
  return (
    <section className="crew-panel" data-testid={`engine-${engine}${plain ? '-plain' : ''}`}>
      <h2 style={{ marginTop: 0 }}>
        {fixture.title} — {plain ? 'Plain mode' : 'Case mode'}
      </h2>
      <Engine
        stem={fixture.stem}
        options={fixture.options}
        rail={plain ? 'none' : 'stage'}
        selected={selected}
        onSelect={setSelected}
        outcome={null}
      />
    </section>
  );
}

export default function MathsEnginesDebugPage() {
  const [plain, setPlain] = useState(false);
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_ENV !== 'staging') {
    return (
      <main className="crew-stage">
        <p>Nothing here.</p>
      </main>
    );
  }
  return (
    <main className="crew-stage">
      <h1>Maths engines (gate #1 harness)</h1>
      <p>
        <button className="crew-tap primary" data-testid="toggle-plain" onClick={() => setPlain(!plain)}>
          {plain ? 'Show Case mode' : 'Show Plain mode'}
        </button>{' '}
        Same fixture rows either way — the mode only changes the furniture.
      </p>
      {(Object.keys(FIXTURES) as EngineKey[]).map((engine) => (
        <EngineCard key={`${engine}-${plain}`} engine={engine} fixture={FIXTURES[engine]} plain={plain} />
      ))}
    </main>
  );
}
