import { PRICING, formatPence } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { Plausible } from '@/components/plausible';

/** Marketing home (BUILD-PHASE-5 §6). Process claims only — never outcomes (L1). */
export default async function HomePage() {
  const regions = await prisma.region.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } });

  return (
    <main className="cc-container">
      <Plausible />
      <img src="/cluecrew-logo.svg" alt="ClueCrew" width={320} height={81} />
      <p style={{ fontSize: '1.15rem' }}>
        ClueCrew makes the 11+ make sense — for every child and every parent — through clear
        teaching, calm design, and a price any family can reach.
      </p>
      <p>
        <a className="cc-button" href="/signup">
          Start your free 7-day trial — no card needed
        </a>
      </p>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>How it works</h2>
        <ol>
          <li>
            <strong>15 calm minutes a day.</strong> A warm-up, one detective Case, one exam-style
            question. Sessions end on time, every time — we never reward bingeing.
          </li>
          <li>
            <strong>Every concept, multiple ways.</strong> Watch it, walk it, see it, hear it, try
            it — your child chooses how it clicks, and the engine notices what needs another way in.
          </li>
          <li>
            <strong>You always know what to do.</strong> A plain-English dashboard and one short
            Sunday email: the win, the one thing to try at home, the runway.
          </li>
        </ol>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>Honest pricing</h2>
        <p>
          {PRICING.TWO_YEAR.displayName}: {formatPence(PRICING.TWO_YEAR.amountPence)}/month over{' '}
          {PRICING.TWO_YEAR.commitmentMonths} months — total{' '}
          {formatPence(PRICING.TWO_YEAR.totalContractValuePence)}, shown before you ever pay.
          Cancelling takes two clicks. <a href="/pricing">Full pricing</a>.
        </p>
        <p>
          Receiving free school meals or pupil premium?{' '}
          <a href="/bursary">The Crew Bursary is free — and identical.</a>
        </p>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>Preparing in your area?</h2>
        <p>
          {regions.map((region, index) => (
            <span key={region.id}>
              {index > 0 ? ' · ' : ''}
              <a href={`/11-plus/${region.id}`}>{region.name}</a>
            </span>
          ))}
        </p>
      </section>

      <p className="cc-muted">
        Already a member? <a href="/login">Sign in</a> · <a href="/casebook-sample">Read a free
        Casebook chapter</a> · <a href="/faq">FAQ</a> · <a href="/safeguarding">Safety &amp;
        safeguarding</a> · <a href="/privacy">Privacy in plain English</a> ·{' '}
        <a href="/accessibility">Accessibility</a>
      </p>
    </main>
  );
}
