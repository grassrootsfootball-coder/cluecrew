/**
 * Cookieless web analytics for MARKETING pages only (BUILD-PHASE-1 §1,
 * BUILD-PHASE-5 §6). Never rendered on any child-facing route — the /crew
 * CSP independently blocks all third-party scripts regardless.
 */
export function Plausible() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  return <script defer data-domain={domain} src="https://plausible.io/js/script.js" />;
}
