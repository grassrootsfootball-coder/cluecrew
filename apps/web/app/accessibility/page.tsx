/** Public accessibility statement (BUILD-PHASE-5 §7). */
export default function AccessibilityPage() {
  return (
    <main className="cc-container">
      <h1>Accessibility statement</h1>
      <p>
        ClueCrew is built for every child, including dyslexic children, children who prefer
        listening to reading, and children using keyboards or assistive technology. Accessibility
        is a core feature here, not an add-on — several of our accessibility rules are design laws
        that fail our automated tests when broken.
      </p>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>What is built in</h2>
        <ul>
          <li>Target: WCAG 2.2 AA across every page, checked by automated audits in CI and by manual review.</li>
          <li>Dyslexia-aware setting: wider spacing and a clearer typeface, app-wide, one toggle.</li>
          <li>Tap-to-hear on instructions, questions and word cards.</li>
          <li>Full keyboard operation of every activity; visible focus everywhere.</li>
          <li>Reduced-motion setting that stills all animation, including the mascot.</li>
          <li>Colour never carries meaning alone — every state pairs colour with a symbol or words.</li>
          <li>Cream backgrounds rather than pure white, and no justified text, everywhere.</li>
        </ul>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>Known limitations</h2>
        <ul>
          <li>Audio uses your device&apos;s built-in voice for now; recorded audio is planned.</li>
          <li>The current audit log lives at docs/a11y-audit.md in our repository; formal third-party certification is planned before launch.</li>
        </ul>
      </section>

      <p>
        Found something we missed? Tell us and we will fix it — accessibility reports jump our
        queue. Email us via the address on your account emails.
      </p>
      <p className="cc-muted">This statement was last reviewed on 27 July 2026.</p>
    </main>
  );
}
