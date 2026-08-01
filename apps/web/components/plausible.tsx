/**
 * Cookieless web analytics for MARKETING pages only (BUILD-PHASE-1 §1,
 * BUILD-PHASE-5 §6). Never rendered on any child-facing route — the /crew
 * CSP independently blocks all third-party scripts regardless.
 *
 * The inline stub is Plausible's official queue snippet: goal calls made
 * before the deferred script arrives are queued and drained, not lost —
 * the demand-test thanks page fires its goal on mount, which is exactly
 * that window (DEMAND-TEST-PACK §4).
 */
export function Plausible() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html:
            'window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}',
        }}
      />
      <script defer data-domain={domain} src="https://plausible.io/js/script.js" />
    </>
  );
}
