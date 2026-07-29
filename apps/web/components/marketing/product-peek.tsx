/**
 * A look at the real thing, built from the real design tokens.
 *
 * There is no illustration set yet, and screenshots would go stale the moment
 * the app moved, cost image weight against the CI budget, and need provenance
 * entries in the asset manifest. Rendering the actual patterns in real DOM
 * costs nothing, cannot drift out of date, and is honest: this is what a
 * child sees, not a mock-up of it.
 *
 * Nothing here claims an outcome (L1). It shows how a miss is handled and
 * what a word card is — process, not promises.
 */
export function ProductPeek() {
  return (
    <div className="mk-peek" aria-label="A look at what your child sees" role="img">
      <div className="mk-peek-screen">
        <p className="mk-peek-stem">Move one letter from PLANT to RAIN so both make new words.</p>
        <div className="mk-peek-tiles" aria-hidden>
          {'PLANT'.split('').map((letter, index) => (
            <span className="mk-peek-tile" key={`a-${index}`}>
              {letter}
            </span>
          ))}
          <span className="mk-peek-arrow">→</span>
          {'RAIN'.split('').map((letter, index) => (
            <span className="mk-peek-tile" key={`b-${index}`}>
              {letter}
            </span>
          ))}
        </div>

        <div className="mk-peek-notyet">
          <strong>Not yet.</strong>
          <span> You went forwards. This code runs backwards.</span>
        </div>
        <p className="mk-peek-caption">
          A miss is met with the hint for that exact mix-up — never a red cross, never the word
          &ldquo;wrong&rdquo;.
        </p>
      </div>
    </div>
  );
}
