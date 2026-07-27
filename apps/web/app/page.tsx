export default function HomePage() {
  return (
    <main className="cc-container">
      <img src="/cluecrew-logo.svg" alt="ClueCrew" width={320} height={81} />
      <p>
        ClueCrew makes the 11+ make sense — for every child and every parent — through clear
        teaching, calm design, and a price any family can reach.
      </p>
      <p>
        <a className="cc-button" href="/signup">
          Start your free 7-day trial — no card needed
        </a>
      </p>
      <p className="cc-muted">
        Already a member? <a href="/login">Sign in</a> · Receiving free school meals or pupil
        premium? <a href="/bursary">The Crew Bursary is free, and identical.</a>
      </p>
      <p className="cc-muted">
        <a href="/privacy">Privacy in plain English</a>
      </p>
    </main>
  );
}
