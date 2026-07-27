'use client';

/**
 * Placeholder mascot rig (BUILD-PHASE-4 §7): the full state machine with
 * simple SVG poses. Phase 5 swaps this for the Rive rig (drop /mascot.riv
 * into public/ and wire RiveMascot) — the states and controller stay put.
 * Reduced motion renders static poses (no bounce transitions).
 */
import { useMascotState, type MascotState } from './mascot-controller';

const POSES: Record<MascotState, { eyes: string; brow: number; body: string; tag: string }> = {
  idle: { eyes: '• •', brow: 0, body: '#1B2A4A', tag: 'idle' },
  curious: { eyes: '● •', brow: -3, body: '#1B2A4A', tag: 'curious' },
  thinking: { eyes: '¬ ¬', brow: -5, body: '#1B2A4A', tag: 'thinking' },
  celebrating: { eyes: '^ ^', brow: 4, body: '#F5A623', tag: 'celebrating' },
  encouraging: { eyes: '◠ ◠', brow: 2, body: '#2A9D8F', tag: 'encouraging' },
  sleeping: { eyes: '− −', brow: 0, body: '#1B2A4A', tag: 'sleeping' },
  pointing: { eyes: '• ●', brow: -2, body: '#7B6FA8', tag: 'pointing' },
  proud: { eyes: '★ ★', brow: 5, body: '#F5A623', tag: 'proud' },
};

export function Mascot({ size = 96 }: { size?: number }) {
  const state = useMascotState();
  const pose = POSES[state];

  return (
    <div aria-label={`Your detective friend is ${pose.tag}`} role="img" data-mascot-state={state}>
      <svg viewBox="0 0 100 110" width={size} height={size * 1.1}>
        <ellipse cx="50" cy="66" rx="34" ry="38" fill={pose.body} opacity="0.9" />
        <circle cx="50" cy="30" r="22" fill={pose.body} />
        {/* detective hat brim */}
        <ellipse cx="50" cy="14" rx="24" ry="5" fill="#1B2A4A" />
        <rect x="38" y="2" width="24" height="13" rx="5" fill="#1B2A4A" />
        <text
          x="50"
          y={34 + pose.brow}
          textAnchor="middle"
          fontSize="13"
          fill="#FAF6EF"
          fontFamily="system-ui"
        >
          {pose.eyes}
        </text>
        {state === 'pointing' ? (
          <path d="M78 60 L96 48" stroke={pose.body} strokeWidth="8" strokeLinecap="round" />
        ) : null}
        {state === 'sleeping' ? (
          <text x="80" y="24" fontSize="12" fill="#1B2A4A">
            z z
          </text>
        ) : null}
      </svg>
    </div>
  );
}
