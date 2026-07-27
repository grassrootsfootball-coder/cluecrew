'use client';

/**
 * The Alphabet Rail (BUILD-PHASE-4 §3) — the signature tool. Tap two letters
 * to see the jump between them; mirror mode shows the reverse alphabet.
 * Big on stage first, corner tool later, absent in Plain mode: scaffold
 * fading built into the UI itself.
 *
 * Juice (Addendum A §2.2): letters lift and glow as the finger passes; the
 * selected pair is connected by a drawn amber arc; scrubbing feels notched
 * rather than smooth (short spring transitions, not glides).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface Arc {
  d: string;
  length: number;
}

export function AlphabetRail({ stage }: { stage: 'stage' | 'corner' }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [mirror, setMirror] = useState(false);
  const [arc, setArc] = useState<Arc | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  function tap(letter: string) {
    setPicked((current) => {
      if (current.includes(letter)) return current.filter((candidate) => candidate !== letter);
      return [...current.slice(-1), letter];
    });
  }

  const drawArc = useCallback(() => {
    const rail = railRef.current;
    if (!rail || picked.length !== 2) {
      setArc(null);
      return;
    }
    const bounds = rail.getBoundingClientRect();
    const points = picked.map((letter) => {
      const node = rail.querySelector<HTMLElement>(`[data-letter="${letter}"]`);
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return { x: box.left - bounds.left + box.width / 2, y: box.top - bounds.top };
    });
    const [from, to] = points;
    if (!from || !to) {
      setArc(null);
      return;
    }
    const midX = (from.x + to.x) / 2;
    const lift = Math.min(46, Math.max(18, Math.abs(to.x - from.x) * 0.3));
    const midY = Math.min(from.y, to.y) - lift;
    const d = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
    // Rough length for the draw-on animation; precision is not needed.
    const length = Math.hypot(to.x - from.x, to.y - from.y) + lift;
    setArc({ d, length });
  }, [picked]);

  useLayoutEffect(() => {
    drawArc();
  }, [drawArc]);

  useEffect(() => {
    window.addEventListener('resize', drawArc);
    return () => window.removeEventListener('resize', drawArc);
  }, [drawArc]);

  const jump =
    picked.length === 2
      ? Math.abs(LETTERS.indexOf(picked[1]!) - LETTERS.indexOf(picked[0]!))
      : null;

  return (
    <div
      ref={railRef}
      className={`crew-rail${stage === 'corner' ? ' corner' : ''}`}
      aria-label="Alphabet Rail tool"
    >
      {arc ? (
        <svg className="arc" aria-hidden>
          <path d={arc.d} style={{ ['--len' as never]: `${Math.round(arc.length)}` }} />
        </svg>
      ) : null}
      {LETTERS.map((letter, index) => (
        <button
          key={letter}
          type="button"
          data-letter={letter}
          className={`letter${picked.includes(letter) ? ' picked' : ''}`}
          onClick={() => tap(letter)}
          aria-pressed={picked.includes(letter)}
        >
          {letter}
          {mirror ? (
            <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.7 }}>
              {LETTERS[25 - index]}
            </span>
          ) : null}
        </button>
      ))}
      <div className="jump" role="status">
        {jump !== null
          ? `${picked[0]} to ${picked[1]}: ${jump} jump${jump === 1 ? '' : 's'}`
          : 'Tap two letters to count the jump'}
        {' · '}
        <button
          type="button"
          className="letter"
          style={{ minWidth: 84 }}
          onClick={() => setMirror((value) => !value)}
        >
          {mirror ? 'mirror on' : 'mirror off'}
        </button>
      </div>
    </div>
  );
}
