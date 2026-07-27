'use client';

import { useState } from 'react';

const TIER_COLORS = ['#F5A623', '#2A9D8F', '#7B6FA8', '#5B9A68', '#C76B7E'];

export function VaultCard({
  headword,
  definitionChild,
  sentence,
  tier,
  gilded,
}: {
  headword: string;
  definitionChild: string;
  sentence: string;
  tier: number;
  gilded: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      className={`crew-card${gilded ? ' gilded' : ''}`}
      style={{ ['--tier-color' as never]: TIER_COLORS[(tier - 1) % TIER_COLORS.length] }}
      onClick={() => setFlipped((value) => !value)}
      aria-label={`Word card: ${headword}. Tap to flip.`}
    >
      {flipped ? (
        <>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{definitionChild}</p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', fontStyle: 'italic' }}>{sentence}</p>
        </>
      ) : (
        <>
          <strong style={{ fontSize: '1.15rem' }}>{headword}</strong>
          <p className="cc-muted" style={{ margin: '0.4rem 0 0', fontSize: '0.8rem' }}>
            Tier {tier}
            {gilded ? ' · gilded ✨' : ''}
          </p>
        </>
      )}
    </button>
  );
}
