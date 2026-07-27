'use client';

/**
 * Placeholder mascot rig (BUILD-PHASE-4 §7) with the idle life required by
 * Addendum A §2.2: **never static**. Breathing loop, occasional blink, head
 * turns toward whatever the child last touched, small idle break every ~20s.
 *
 * Phase 5 swaps this for the Rive rig (drop /mascot.riv into public/) — the
 * states, the controller and this component's contract stay put. Reduced
 * motion stills everything (§2.5); the pose itself still carries the state.
 */
import { useEffect, useRef, useState } from 'react';
import { useMascotState, type MascotState } from './mascot-controller';

const POSES: Record<MascotState, { eyes: string; brow: number; body: string; tag: string }> = {
  idle: { eyes: '• •', brow: 0, body: '#1B2A4A', tag: 'waiting' },
  curious: { eyes: '● •', brow: -3, body: '#1B2A4A', tag: 'curious' },
  thinking: { eyes: '¬ ¬', brow: -5, body: '#1B2A4A', tag: 'thinking' },
  celebrating: { eyes: '^ ^', brow: 4, body: '#F5A623', tag: 'celebrating' },
  encouraging: { eyes: '◠ ◠', brow: 2, body: '#2A9D8F', tag: 'cheering you on' },
  sleeping: { eyes: '− −', brow: 0, body: '#1B2A4A', tag: 'dozing off' },
  pointing: { eyes: '• ●', brow: -2, body: '#7B6FA8', tag: 'pointing' },
  proud: { eyes: '★ ★', brow: 5, body: '#F5A623', tag: 'proud of you' },
};

/** Head turns toward the last thing the child touched. */
function useLastTouchTilt(): number {
  const [tilt, setTilt] = useState(0);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const fromCentre = (event.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      setTilt(Math.max(-7, Math.min(7, fromCentre * 7)));
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return tilt;
}

export function Mascot({ size = 96 }: { size?: number }) {
  const state = useMascotState();
  const pose = POSES[state];
  const tilt = useLastTouchTilt();
  const [breaking, setBreaking] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  // A small idle break every ~20s so the mascot never reads as frozen.
  useEffect(() => {
    if (state !== 'idle' && state !== 'curious') return;
    const timer = window.setInterval(() => {
      setBreaking(true);
      window.setTimeout(() => setBreaking(false), 1100);
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [state]);

  return (
    <div
      ref={wrapper}
      className={`crew-mascot${breaking ? ' idle-break' : ''}`}
      style={{ transform: `rotate(${tilt * 0.5}deg)` }}
      aria-label={`Your detective friend is ${pose.tag}`}
      role="img"
      data-mascot-state={state}
    >
      <svg viewBox="0 0 100 110" width={size} height={size * 1.1}>
        <g className="body">
          <ellipse cx="50" cy="66" rx="34" ry="38" fill={pose.body} opacity="0.9" />
          <circle cx="50" cy="30" r="22" fill={pose.body} />
          {/* detective hat brim */}
          <ellipse cx="50" cy="14" rx="24" ry="5" fill="#1B2A4A" />
          <rect x="38" y="2" width="24" height="13" rx="5" fill="#1B2A4A" />
          <g transform={`rotate(${tilt} 50 30)`}>
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
            {state !== 'sleeping' ? (
              <rect className="lid" x="38" y="24" width="24" height="9" rx="3" fill={pose.body} />
            ) : null}
          </g>
        </g>
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
