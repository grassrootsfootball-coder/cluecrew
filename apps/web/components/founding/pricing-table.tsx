'use client';

/**
 * The Step-1 pricing table (LIVE-LAUNCH-PACK-V3 §2): scannable, not prose.
 * Crew + the three Full Crew terms with TCV (DMCC display as built). Until
 * checkout opens (Step 2), Full Crew rows carry "Reserve the founding rate"
 * — name + email, explicitly NOT a payment. No Plus, no Summer: absent,
 * not "coming soon".
 */
import { useState } from 'react';
import { reserveFoundingRateAction } from '@/lib/actions/waitlist';

const FULL_ROWS = [
  { tier: 'FULL_24', term: '24 months', monthly: '£8.49/mo', total: '£203.76 total' },
  { tier: 'FULL_12', term: '12 months', monthly: '£9.99/mo', total: '£119.88 total' },
  { tier: 'FULL_ROLLING', term: 'Rolling monthly', monthly: '£12.99/mo', total: 'Cancel in two clicks' },
] as const;

export function PricingTable({ src }: { src: string | null }) {
  const [reserving, setReserving] = useState<(typeof FULL_ROWS)[number] | null>(null);

  return (
    <div className="fd-pricing">
      <table className="cc-table">
        <thead>
          <tr>
            <th scope="col">Plan</th>
            <th scope="col">Price</th>
            <th scope="col">Term</th>
            <th scope="col">Total</th>
            <th scope="col">
              <span className="fd-visually-hidden">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Crew</th>
            <td>Free</td>
            <td>Forever</td>
            <td>£0 — no card, no clock</td>
            <td>
              <a className="cc-button" href="/signup">
                Start free
              </a>
            </td>
          </tr>
          {FULL_ROWS.map((row) => (
            <tr key={row.tier}>
              <th scope="row">Full Crew</th>
              <td>{row.monthly}</td>
              <td>{row.term}</td>
              <td>{row.total}</td>
              <td>
                <button
                  type="button"
                  className="cc-button-quiet"
                  onClick={() => setReserving(row)}
                  aria-expanded={reserving?.tier === row.tier}
                >
                  Reserve the founding rate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {reserving ? (
        <form action={reserveFoundingRateAction} className="cc-form cc-card fd-reserve" data-testid="reserve-form">
          <p style={{ margin: 0, fontWeight: 700 }}>
            Reserve the founding rate — Full Crew, {reserving.term} ({reserving.monthly})
          </p>
          <p className="cc-muted" style={{ margin: 0 }}>
            This is not a payment and nothing is owed. When Full Crew opens, the founding rate is
            yours to take or leave.
          </p>
          <label>
            Your first name
            <input name="name" type="text" required maxLength={80} autoComplete="given-name" />
          </label>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <input type="hidden" name="tier" value={reserving.tier} />
          {src ? <input type="hidden" name="src" value={src} /> : null}
          <button className="cc-button" type="submit">
            Reserve — not a payment
          </button>
          <p className="cc-muted" style={{ margin: 0 }}>
            We&apos;ll email you about ClueCrew&apos;s launch and nothing else. Unsubscribe anytime.{' '}
            <a href="/founding/privacy">Privacy notice</a>.
          </p>
        </form>
      ) : null}
    </div>
  );
}
