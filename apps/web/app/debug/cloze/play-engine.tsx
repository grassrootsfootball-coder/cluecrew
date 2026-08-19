'use client';

import { useState } from 'react';
import WordWebEngine from '@/components/crew/engines/wordweb';

/** Minimal client shell: the real engine, selectable options, no outcome plumbing. */
export default function PlayEngine({ stem, options }: {
  stem: Record<string, unknown>;
  options: Array<{ id: string; content: unknown }>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <WordWebEngine
      stem={stem}
      options={options}
      selected={selected}
      onSelect={setSelected}
      outcome={null}
      rail="none"
    />
  );
}
