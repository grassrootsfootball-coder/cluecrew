import { notFound } from 'next/navigation';
import { REGION_CAVEAT } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { Plausible } from '@/components/plausible';

/**
 * Region landing pages generated from the Region Registry (§6). Factual,
 * sourced-and-dated, always carrying the verify-with-school caveat.
 * Process claims only (L1); exam-board names factual only (L3).
 */
export default async function RegionLandingPage({
  params,
}: {
  params: Promise<{ regionId: string }>;
}) {
  const { regionId } = await params;
  const region = await prisma.region.findUnique({ where: { id: regionId } });
  if (!region) notFound();

  return (
    <main className="cc-container">
      <Plausible />
      <h1>Preparing for the 11+ in {region.name.replace(/\s*\(.*\)$/, '')}</h1>
      <section className="cc-card">
        <p style={{ marginTop: 0 }}>{region.formatSummary}</p>
        <p>
          <strong>Typical test time:</strong> {region.typicalTestMonth}
          <br />
          <strong>Subjects tested:</strong> {region.subjects.join(', ')}
        </p>
        {region.notes ? <p>{region.notes}</p> : null}
        <p className="cc-muted">
          Source: <a href={region.sourceUrl}>{new URL(region.sourceUrl).hostname}</a> (checked{' '}
          {region.lastVerified.toLocaleDateString('en-GB')})
        </p>
        <p className="cc-caveat">{REGION_CAVEAT}</p>
      </section>

      {(region.exampleSchools as string[]).length > 0 ? (
        <section className="cc-card">
          <h2 style={{ marginTop: 0 }}>Schools families in this area often aim for</h2>
          <p>{(region.exampleSchools as string[]).join(' · ')}</p>
          <p className="cc-muted">
            Always check each school&apos;s own admissions page for your entry year.
          </p>
        </section>
      ) : null}

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>How ClueCrew prepares children here</h2>
        <p>
          Fifteen calm minutes a day: a retrieval warm-up, one detective Case teaching a question
          type your area actually uses, and one exam-format question so test formatting stays
          familiar. Every concept is taught multiple ways, and parents get a plain-English weekly
          summary with one thing to try at home.
        </p>
        <a className="cc-button" href="/signup">
          Start the free 7-day trial — no card needed
        </a>
      </section>

      <p className="cc-muted">
        <a href="/pricing">Pricing</a> · <a href="/bursary">The Crew Bursary (free, identical)</a> ·{' '}
        <a href="/casebook-sample">Read a free Casebook chapter</a>
      </p>
    </main>
  );
}
