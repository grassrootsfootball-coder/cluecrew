'use client';

/**
 * NVR district gate #1 harness (BUILD-DISTRICT-NVR §7.1): all four engines
 * rendered Case-mode AND Plain-mode from the SAME generated rows, with the
 * fade contract on show — every manipulative is big on stage in Case mode
 * and ABSENT in Plain (rail="none").
 *
 * The rows are generated here by calling the core templates directly with
 * fixed seeds, then passed through childPayload — the same door the serving
 * layer uses, so this page provably cannot show a key or a misconception tag
 * even by accident. Same (template, version, seed, tier) → the same item,
 * every reload.
 *
 * Dev and staging only: these are engineering scaffolding, not authored
 * content, and no child route links here.
 */
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { childPayload, seedFor, templateById } from '@cluecrew/core';
import type { EngineProps } from '@/components/crew/engines/shared';

const ENGINES = {
  machine: dynamic(() => import('@/components/crew/engines/nvr/machine')),
  lineup: dynamic(() => import('@/components/crew/engines/nvr/lineup')),
  turntable: dynamic(() => import('@/components/crew/engines/nvr/turntable')),
  foldingroom: dynamic(() => import('@/components/crew/engines/nvr/folding-room')),
} as const;

/** One row per template, tiers spread across the ladder. */
const ROWS: Array<{ templateId: string; tier: number; ordinal: number }> = [
  { templateId: 'machine-series', tier: 2, ordinal: 101 },
  { templateId: 'machine-matrix', tier: 4, ordinal: 102 },
  { templateId: 'machine-analogy', tier: 3, ordinal: 103 },
  { templateId: 'lineup-codes', tier: 3, ordinal: 104 },
  { templateId: 'lineup-like', tier: 4, ordinal: 105 },
  { templateId: 'lineup-odd', tier: 3, ordinal: 106 },
  { templateId: 'lineup-counting', tier: 2, ordinal: 107 },
  { templateId: 'turntable-rotation', tier: 3, ordinal: 108 },
  { templateId: 'turntable-reflection', tier: 4, ordinal: 109 },
  { templateId: 'folding-net', tier: 3, ordinal: 110 },
  { templateId: 'folding-punch', tier: 3, ordinal: 111 },
  { templateId: 'folding-hidden', tier: 2, ordinal: 112 },
  { templateId: 'folding-plans', tier: 4, ordinal: 113 },
];

interface Row {
  key: string;
  title: string;
  engine: keyof typeof ENGINES;
  stem: Record<string, unknown>;
  options: Array<{ id: string; content: unknown }>;
}

function buildRows(): Row[] {
  return ROWS.flatMap((entry) => {
    const template = templateById(entry.templateId);
    if (!template) return [];
    const seed = seedFor('practice', entry.ordinal);
    const payload = childPayload(template.generate(seed, entry.tier));
    return [
      {
        key: `${payload.templateId}-${payload.seed}-${payload.tier}`,
        title: `${payload.templateId}@${payload.templateVersion} · seed ${payload.seed} · T${payload.tier}`,
        engine: payload.engineFamily,
        stem: {
          prompt: payload.prompt,
          panels: payload.panels,
          panelLabels: payload.panelLabels,
          stemDecoration: payload.stemDecoration,
          optionDecoration: payload.optionDecoration,
          sectionType: payload.sectionType,
        },
        options: payload.options.map((option) => ({
          id: option.id,
          content: { visual: option.visual, codeLabel: option.codeLabel },
        })),
      },
    ];
  });
}

/** One row, one mode. The rail is the whole difference between the modes. */
function EngineCard({ row, plain, corner }: { row: Row; plain: boolean; corner: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const Engine = ENGINES[row.engine] as React.ComponentType<EngineProps>;
  const rail = plain ? 'none' : corner ? 'corner' : 'stage';
  return (
    <section
      className={plain ? 'crew-plain' : 'crew-panel'}
      data-testid={`nvr-engine-${row.engine}-${row.key}${plain ? '-plain' : ''}`}
    >
      <h2 style={{ marginTop: 0, fontSize: '1rem' }}>
        {row.title} — {plain ? 'Plain mode' : 'Case mode'} · rail {rail}
      </h2>
      <Engine
        stem={row.stem}
        options={row.options}
        rail={rail}
        selected={selected}
        onSelect={setSelected}
        outcome={null}
      />
    </section>
  );
}

export default function NvrEnginesDebugPage() {
  const [plain, setPlain] = useState(false);
  const [corner, setCorner] = useState(false);
  const rows = useMemo(buildRows, []);

  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_ENV !== 'staging') {
    return (
      <main className="crew-stage">
        <p>Nothing here.</p>
      </main>
    );
  }

  return (
    <main className="crew-stage">
      <h1>NVR engines (gate #1 harness)</h1>
      <p>
        <button className="crew-tap primary" data-testid="toggle-plain" onClick={() => setPlain(!plain)}>
          {plain ? 'Show Case mode' : 'Show Plain mode'}
        </button>{' '}
        <button className="crew-tap" data-testid="toggle-corner" onClick={() => setCorner(!corner)} disabled={plain}>
          {corner ? 'Tool on stage' : 'Tool in the corner'}
        </button>{' '}
        Same generated rows either way — the mode only changes the furniture.
      </p>
      {rows.map((row) => (
        <EngineCard key={`${row.key}-${plain}-${corner}`} row={row} plain={plain} corner={corner} />
      ))}
    </main>
  );
}
