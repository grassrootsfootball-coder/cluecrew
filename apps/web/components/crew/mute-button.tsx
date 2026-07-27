'use client';

/** Global mute: one tap from anywhere in the child app (§3). */
import { useEffect, useState } from 'react';
import { configureSound, isMuted, toggleMute } from './sound-controller';

export function MuteButton({ soundEnabled }: { soundEnabled: boolean }) {
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    configureSound(soundEnabled);
    setMuted(isMuted());
  }, [soundEnabled]);

  if (!soundEnabled) return null;

  return (
    <button
      type="button"
      className="crew-tap"
      style={{ position: 'fixed', top: '0.5rem', right: '0.5rem', zIndex: 20 }}
      aria-pressed={muted}
      aria-label={muted ? 'Sound is off. Tap to turn sound on.' : 'Sound is on. Tap to turn sound off.'}
      onClick={() => setMuted(toggleMute())}
    >
      {muted ? '🔇' : '🔉'}
    </button>
  );
}
