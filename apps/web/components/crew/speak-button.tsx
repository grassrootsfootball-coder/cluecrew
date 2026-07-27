'use client';

/**
 * Tap-to-hear (BUILD-PHASE-4 §8). Phase 4 uses the device's built-in voice —
 * no network, CSP-safe. Pre-generated TTS from authored text is the Phase 5
 * upgrade path (provider decision recorded in the DPIA).
 */
export function SpeakButton({ text, autoPlay = false }: { text: string; autoPlay?: boolean }) {
  function speak() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  }

  if (autoPlay && typeof window !== 'undefined') {
    // audioDefault profiles hear instructions without tapping.
    setTimeout(speak, 300);
  }

  return (
    <button
      type="button"
      className="crew-tap"
      onClick={speak}
      aria-label="Hear it read aloud"
      title="Hear it"
    >
      🔊
    </button>
  );
}
