import { redirect } from 'next/navigation';
import { PRICING, REGION_CAVEAT, UNKNOWN_REGION, formatPence, recommendTier } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import {
  createChildProfileAction,
  saveRegionAction,
  startTrialAction,
} from '@/lib/actions/onboarding';

/**
 * Onboarding wizard (BUILD-PHASE-2 §3). Step 1 (email verification) happens
 * before this page. The current step is derived from account state, so a
 * parent can leave and return without losing their place.
 */
export default async function OnboardingPage() {
  const parent = await currentParent();
  if (!parent) redirect('/login');
  if (!parent.emailVerified) {
    return (
      <main className="cc-container">
        <h1>One step first</h1>
        <p>Please open the verification link we emailed you, then come back here.</p>
      </main>
    );
  }

  const children = await prisma.childProfile.findMany({
    where: { parentId: parent.id, deletedAt: null },
  });
  const subscription = await prisma.subscription.findUnique({ where: { parentId: parent.id } });

  if (children.length === 0) return <ChildStep />;
  if (!parent.regionCode) return <RegionStep yearGroup={children[0]!.yearGroup} />;
  if (!subscription)
    return <TrialStep yearGroup={children[0]!.yearGroup} regionCode={parent.regionCode} />;
  redirect('/parent');
}

function ChildStep() {
  return (
    <main className="cc-container">
      <p className="cc-muted">Step 2 of 5</p>
      <h1>Set up your child&apos;s profile</h1>
      <form className="cc-form" action={createChildProfileAction}>
        <label>
          First name or nickname (this is all we ask for — no surname, ever)
          <input name="crewName" type="text" required maxLength={40} />
        </label>
        <label>
          School year group
          <select name="yearGroup" required defaultValue="5">
            <option value="4">Year 4</option>
            <option value="5">Year 5</option>
            <option value="6">Year 6</option>
          </select>
        </label>
        <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
          <legend style={{ fontWeight: 600 }}>Make it comfortable (you can change these any time)</legend>
          <label className="cc-checkbox">
            <input type="checkbox" name="dyslexiaFont" />
            <span>Use dyslexia-friendly text settings</span>
          </label>
          <label className="cc-checkbox">
            <input type="checkbox" name="audioDefault" />
            <span>Read instructions aloud by default</span>
          </label>
          <label className="cc-checkbox">
            <input type="checkbox" name="reducedMotion" />
            <span>Reduce animation and movement</span>
          </label>
        </fieldset>
        <div className="cc-card">
          <p style={{ marginTop: 0 }}>
            <strong>What we collect, and what we never do:</strong> we store your child&apos;s first
            name or nickname, year group and practice progress — nothing else. No surname, no date
            of birth, no school records, no photos, no location. See the{' '}
            <a href="/privacy">plain-English privacy page</a>.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Looking ahead:</strong> later in the programme, ClueCrew adds a Writing Room
            where your child can practise longer answers. Their writing is screened automatically,
            and anything the screen flags is read by our trained safeguarding lead. We are telling
            you now so there are no surprises later.
          </p>
        </div>
        <button className="cc-button" type="submit">
          Create profile
        </button>
      </form>
    </main>
  );
}

async function RegionStep({ yearGroup }: { yearGroup: number }) {
  const regions = await prisma.region.findMany({ orderBy: { name: 'asc' } });
  const now = new Date();
  const defaultExamYear = now.getFullYear() + Math.max(0, 6 - yearGroup) + (now.getMonth() >= 8 ? 1 : 0);
  const examYears = [0, 1, 2, 3].map((offset) => now.getFullYear() + offset);

  return (
    <main className="cc-container">
      <p className="cc-muted">Step 3 of 5</p>
      <h1>Which area or schools are you aiming for?</h1>
      <p className="cc-muted">
        This sets what we practise and when. Not decided yet? That is completely fine — pick
        &ldquo;{UNKNOWN_REGION.name}&rdquo; and we cover everything.
      </p>
      <form className="cc-form" action={saveRegionAction}>
        <label>
          Area
          <select name="regionCode" required defaultValue="">
            <option value="" disabled>
              Choose an area…
            </option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
            <option value="unknown">{UNKNOWN_REGION.name}</option>
          </select>
        </label>
        <label>
          Which year will they sit the test?
          <select name="examYear" required defaultValue={String(defaultExamYear)}>
            {examYears.map((year) => (
              <option key={year} value={year}>
                September {year}
              </option>
            ))}
          </select>
        </label>
        <label>
          Target schools, if you know them (separate with commas — optional)
          <input name="targetSchools" type="text" maxLength={400} />
        </label>
        <p className="cc-caveat">{REGION_CAVEAT}</p>
        <button className="cc-button" type="submit">
          Save and continue
        </button>
      </form>
    </main>
  );
}

async function TrialStep({ yearGroup, regionCode }: { yearGroup: number; regionCode: string }) {
  const region =
    regionCode === 'unknown' ? null : await prisma.region.findUnique({ where: { id: regionCode } });
  const regionView = region ?? {
    name: UNKNOWN_REGION.name,
    formatSummary: UNKNOWN_REGION.formatSummary,
    typicalTestMonth: UNKNOWN_REGION.typicalTestMonth,
    subjects: UNKNOWN_REGION.subjects,
    sourceUrl: UNKNOWN_REGION.sourceUrl,
    lastVerified: new Date(UNKNOWN_REGION.lastVerified),
    notes: null as string | null,
  };
  const recommendation = recommendTier(yearGroup, new Date());

  return (
    <main className="cc-container">
      <p className="cc-muted">Steps 4 and 5 of 5</p>
      <h1>Your programme</h1>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>{regionView.name}</h2>
        <p>{regionView.formatSummary}</p>
        <p className="cc-muted">
          Typical test time: {regionView.typicalTestMonth} · Subjects: {regionView.subjects.join(', ')}
        </p>
        {regionView.notes ? <p className="cc-muted">{regionView.notes}</p> : null}
        <p className="cc-muted">
          Source: <a href={regionView.sourceUrl}>{new URL(regionView.sourceUrl).hostname}</a>{' '}
          (checked {regionView.lastVerified.toLocaleDateString('en-GB')})
        </p>
        <p className="cc-caveat">{REGION_CAVEAT}</p>
      </div>

      <h2>Pick a plan to try</h2>
      <p className="cc-muted">
        Every plan starts with a 7-day free trial — no card, nothing to cancel. Our suggestion for
        Year {yearGroup} is the {PRICING[recommendation.tier].displayName}, but all three are shown
        and the choice is entirely yours.{recommendation.note ? ` ${recommendation.note}` : ''}
      </p>

      {(['TWO_YEAR', 'ONE_YEAR', 'SUMMER'] as const).map((tier) => {
        const pricing = PRICING[tier];
        return (
          <div className="cc-card" key={tier}>
            <h3 style={{ marginTop: 0 }}>
              {pricing.displayName}
              {tier === recommendation.tier ? ' · our suggestion' : ''}
            </h3>
            <p>
              {pricing.billing === 'monthly'
                ? `${formatPence(pricing.amountPence)} per month for ${pricing.commitmentMonths} months — total ${formatPence(pricing.totalContractValuePence)}.`
                : `${formatPence(pricing.amountPence)} one-off for the 8-week programme.`}
            </p>
            <form action={startTrialAction}>
              <input type="hidden" name="tier" value={tier} />
              <button className="cc-button" type="submit">
                Start free trial — no card needed
              </button>
            </form>
          </div>
        );
      })}

      <p className="cc-muted">
        A bursary place (free, identical product) is available for families receiving free school
        meals or pupil premium — <a href="/bursary">read about the Crew Bursary</a>.
      </p>
    </main>
  );
}
