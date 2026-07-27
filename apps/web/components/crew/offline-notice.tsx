'use client';

/** Offline beat (Addendum A §1.2) — calm, in-world, never technical. */
import { useEffect, useState } from 'react';
import { VOICE } from '@/lib/voice';

export function OfflineNotice() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <p
      role="status"
      className="crew-panel"
      style={{ position: 'sticky', top: 0, zIndex: 25, textAlign: 'center', margin: 0 }}
    >
      {VOICE.offline}
    </p>
  );
}
