'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
// `family` and `rail` are computed on the SERVER and passed in: importing @cluecrew/core here
// drags node:crypto into the client bundle through the fingerprint modules.


const engines = {
  code: dynamic(() => import('@/components/crew/engines/code')),
  bridge: dynamic(() => import('@/components/crew/engines/bridge')),
};

/**
 * The card as a child meets it after a wrong answer: the engine (with its rail, if the family
 * has one) above, the not-yet panel with the hint below. Everything inside `data-capture` is the
 * child's surface and nothing else is.
 */
export default function HintSurface({ captureId, stem, family, rail, options, hint }: {
  captureId: string;
  stem: Record<string, unknown>;
  family: string;
  rail: 'stage' | 'corner' | 'none';
  options: Array<{ id: string; content: unknown }>;
  hint: string;
}) {
  const [selected, setSelected] = useState<string | null>(options[1]?.id ?? null);
  const Engine = engines[family as 'code' | 'bridge'];

  return (
    <div data-capture={captureId} style={{ background: 'var(--cc-paper, #fffdf8)', padding: '0.8rem', borderRadius: 10 }}>
      {Engine ? (
        <Engine
          stem={stem}
          options={options}
          selected={selected}
          onSelect={setSelected}
          outcome={{ correct: false, optionId: selected ?? '' }}
          rail={rail}
        />
      ) : null}
      <section className="crew-notyet" role="status" data-testid="beat-not-yet">
        <p style={{ margin: 0, fontSize: '1.2rem' }}>Not yet — have another look.</p>
        <p style={{ marginBottom: 0 }}>{hint}</p>
      </section>
    </div>
  );
}
