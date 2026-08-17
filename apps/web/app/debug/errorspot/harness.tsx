'use client';

import { useState } from 'react';
import ErrorSpotEngine from '@/components/crew/engines/errorspot';

export function ErrorSpotHarness({
  stem, options,
}: { stem: Record<string, unknown>; options: Array<{ id: string; content: unknown }> }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <ErrorSpotEngine
      stem={stem}
      options={options}
      rail="none"
      selected={selected}
      onSelect={setSelected}
      outcome={null}
    />
  );
}
