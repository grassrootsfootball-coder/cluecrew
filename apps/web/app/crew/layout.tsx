import { childFromCookie, childHasAccess, childSettings } from '@/lib/crew/server';
import { SwRegister } from '@/components/crew/sw-register';
import { MuteButton } from '@/components/crew/mute-button';
import { TapRipple } from '@/components/crew/ripple';
import { OfflineNotice } from '@/components/crew/offline-notice';
import { VOICE } from '@/lib/voice';
import './crew.css';

/**
 * The child app shell. Everything under /crew carries the self-only CSP
 * (next.config). Dyslexia and reduced-motion settings apply app-wide from
 * the profile — core features, not add-ons (D4).
 */
export default async function CrewLayout({ children }: { children: React.ReactNode }) {
  const child = await childFromCookie();

  if (!child) {
    return (
      <main className="cc-container">
        <h1>Crew HQ</h1>
        <p>{VOICE.hqNoProfile}</p>
      </main>
    );
  }

  const access = await childHasAccess(child);
  if (!access) {
    // Warm and generic — the child app NEVER shows payment state (§2).
    return (
      <main className="cc-container">
        <h1>HQ&apos;s quiet today</h1>
        <p>{VOICE.hqLocked}</p>
      </main>
    );
  }

  const settings = childSettings(child);
  const classes = [
    'crew-app',
    settings.dyslexiaFont ? 'dyslexia' : '',
    settings.reducedMotion ? 'reduced-motion' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <SwRegister />
      <TapRipple />
      <OfflineNotice />
      <MuteButton soundEnabled={settings.soundEnabled !== false} />
      {children}
    </div>
  );
}
