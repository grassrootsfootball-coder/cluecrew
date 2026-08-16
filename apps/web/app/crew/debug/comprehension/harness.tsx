'use client';

/** Client half of the comprehension harness: selection state, so the engine behaves as it will in play. */
import { useState } from 'react';
import ComprehensionEngine, { type PassageView } from '@/components/crew/engines/comprehension';

interface Case {
  id: string;
  note: string;
  stem: Record<string, unknown>;
  options: Array<{ id: string; content: unknown }>;
  passage?: PassageView;
}

export function ComprehensionHarness({ cases }: { cases: Case[] }) {
  return (
    <>
      {cases.map((c) => (
        <section key={c.id} style={{ margin: '1.5rem 0', paddingTop: '1rem', borderTop: '2px solid #eee' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{c.id}</h2>
          <p className="cc-muted" style={{ fontSize: '0.88rem', marginTop: 0 }}>{c.note}</p>
          <OneCase item={c} />
        </section>
      ))}
    </>
  );
}

function OneCase({ item }: { item: Case }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <ComprehensionEngine
      stem={item.stem}
      options={item.options}
      rail="none"
      selected={selected}
      onSelect={setSelected}
      outcome={null}
      passage={item.passage}
    />
  );
}
