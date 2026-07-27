export default function PrivacyPage() {
  return (
    <main className="cc-container">
      <h1>Privacy, in plain English</h1>
      <p className="cc-muted">
        The full legal notice will sit alongside this page. This version says the same things in
        ordinary words, because that is how we think privacy notices should read.
      </p>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>What we collect about your child</h2>
        <p>
          A first name or nickname, their school year, the exam year you are aiming for, their
          accessibility preferences, and their practice progress. That is the whole list.
        </p>
        <p>
          There is deliberately nowhere to put a surname, date of birth, school name or photo — the
          fields do not exist in our system.
        </p>
      </div>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>What we never do</h2>
        <ul>
          <li>No location tracking — your region comes from what you tell us, nothing else.</li>
          <li>No advertising trackers anywhere near your child. None on their pages at all.</li>
          <li>No selling or sharing data. Our analytics are our own and hold IDs, not words.</li>
          <li>No chat, no public profiles, no child-to-child contact of any kind.</li>
        </ul>
      </div>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>Your controls</h2>
        <ul>
          <li>Export everything from Parent HQ → Account, any time.</li>
          <li>Delete your account; everything is permanently removed within 30 days.</li>
          <li>Questions? Reply to any of our emails and a human answers.</li>
        </ul>
      </div>
    </main>
  );
}
