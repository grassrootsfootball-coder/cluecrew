import { REGION_CAVEAT } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { updateRegionAction } from '@/lib/actions/admin-libraries';

export default async function AdminRegionsPage() {
  const regions = await prisma.region.findMany({ orderBy: { name: 'asc' } });

  return (
    <main className="cc-container">
      <h1>Region Registry</h1>
      <p className="cc-muted">
        Sourced-and-dated (§3.3). Every parent-facing result carries the caveat: &ldquo;
        {REGION_CAVEAT}&rdquo;
      </p>
      {regions.map((region) => (
        <div className="cc-card" key={region.id}>
          <h2 style={{ marginTop: 0 }}>
            {region.name} <span className="cc-muted">({region.examFormat})</span>
          </h2>
          <form className="cc-form" action={updateRegionAction} style={{ maxWidth: 640 }}>
            <input type="hidden" name="id" value={region.id} />
            <label>
              Format summary
              <textarea name="formatSummary" rows={3} required maxLength={300} defaultValue={region.formatSummary} />
            </label>
            <label>
              Typical test month
              <input name="typicalTestMonth" type="text" required maxLength={40} defaultValue={region.typicalTestMonth} />
            </label>
            <label>
              Notes (optional)
              <textarea name="notes" rows={2} maxLength={500} defaultValue={region.notes ?? ''} />
            </label>
            <label>
              Source URL (required)
              <input name="sourceUrl" type="url" required defaultValue={region.sourceUrl} />
            </label>
            <label>
              Last verified (required — update when you re-check the source)
              <input
                name="lastVerified"
                type="date"
                required
                defaultValue={region.lastVerified.toISOString().slice(0, 10)}
              />
            </label>
            <button className="cc-button-quiet" type="submit">
              Save region
            </button>
          </form>
        </div>
      ))}
    </main>
  );
}
