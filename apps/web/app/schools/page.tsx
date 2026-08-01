import { Plausible } from '@/components/plausible';
import { registerSchoolInterestAction } from '@/lib/actions/schools';

/**
 * Schools: register-interest ONLY (AMENDMENT-1 §1). A year-two intention —
 * this page measures demand and builds nothing else, and says so.
 */
export default function SchoolsPage() {
  return (
    <main className="cc-container">
      <Plausible />
      <h1>ClueCrew for schools</h1>
      <p>
        A schools programme is planned for next year. Nothing exists yet — this page only takes an
        email address so we can tell you when it does.
      </p>
      <form className="cc-form" action={registerSchoolInterestAction} style={{ maxWidth: 420 }}>
        <label>
          School email address
          <input name="email" type="email" required maxLength={200} />
        </label>
        <label>
          School name (optional)
          <input name="school" type="text" maxLength={200} />
        </label>
        <button className="cc-button" type="submit">
          Register interest
        </button>
      </form>
    </main>
  );
}
