'use client';

/**
 * The Region Decoder (DEMAND-TEST-PACK-V2 §1.2): pick a region, get the
 * card in ten seconds — provider style, subjects, when it's sat, and the
 * registry's verified worth-knowing line — then an email capture with a
 * reason to exist (the one-page guide). This is the Atom baseline-test
 * mechanic with the prediction removed and honesty installed: the card
 * always carries the mandatory caveat, and no card ever says anything
 * about a child's chances.
 *
 * Data comes from the public read-only Region Registry endpoint (§5).
 */
import { useEffect, useState } from 'react';
import { joinWaitlistAction } from '@/lib/actions/waitlist';

interface RegionSummary {
  id: string;
  name: string;
  examFormat: string;
  formatSummary: string;
  typicalTestMonth: string;
  subjects: string[];
}

const FORMAT_LABELS: Record<string, string> = {
  'gl-style': 'GL-style multiple choice',
  csse: 'CSSE (Essex) style',
  set: 'SET (Shropshire) style',
  'school-specific': 'set by the individual school',
  mixed: 'a mix of providers',
  unknown: 'varies — check with the school',
};

const SUBJECT_LABELS: Record<string, string> = {
  VR: 'verbal reasoning',
  NVR: 'non-verbal reasoning',
  MATHS: 'maths',
  ENGLISH: 'English',
};

export function RegionDecoder({ src }: { src: string | null }) {
  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [decodedOnce, setDecodedOnce] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/regions')
      .then((response) => response.json())
      .then((data: { regions: RegionSummary[] }) => {
        if (!cancelled) setRegions(data.regions);
      })
      .catch(() => {
        // The section degrades to the email capture alone; the page never breaks.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const region = regions.find((row) => row.id === selected) ?? null;
  const notSure = selected === 'not-sure';

  function onSelect(value: string) {
    setSelected(value);
    if (value && !decodedOnce) {
      setDecodedOnce(true);
      window.plausible?.('region_decoded');
    }
  }

  return (
    <div className="fd-decoder">
      <label className="fd-decoder-pick">
        Where are you aiming?
        <select value={selected} onChange={(event) => onSelect(event.target.value)}>
          <option value="">Choose a region…</option>
          {regions.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
          <option value="not-sure">Somewhere else / not sure</option>
        </select>
      </label>

      {region ? (
        <div className="fd-decoder-card cc-card" data-testid="decoder-card">
          <h3 style={{ marginTop: 0 }}>{region.name}</h3>
          <p>
            <strong>The test:</strong> {FORMAT_LABELS[region.examFormat] ?? region.examFormat},
            covering {region.subjects.map((s) => SUBJECT_LABELS[s] ?? s).join(', ')}.
          </p>
          <p>
            <strong>When:</strong> {region.typicalTestMonth}.
          </p>
          <p>
            <strong>Worth knowing:</strong> {region.formatSummary}
          </p>
          <p className="cc-caveat">
            Schools change providers — always confirm with the school for your entry year.
          </p>
        </div>
      ) : null}

      {notSure ? (
        <div className="fd-decoder-card cc-card" data-testid="decoder-card">
          <h3 style={{ marginTop: 0 }}>The national picture</h3>
          <p>
            Most grammar-school regions use GL-style multiple-choice tests; a few set their own.
            What is tested, when it is sat, and how places are offered all differ by region — the
            guide walks the whole system in plain language.
          </p>
          <p className="cc-caveat">
            Schools change providers — always confirm with the school for your entry year.
          </p>
        </div>
      ) : null}

      {region || notSure ? (
        <form action={joinWaitlistAction} className="cc-form fd-decoder-capture">
          <label>
            Email me my region&apos;s one-page guide
            <input name="email" type="email" required autoComplete="email" />
          </label>
          {region ? <input type="hidden" name="regionCode" value={region.id} /> : null}
          <input type="hidden" name="source" value="region-decoder" />
          {src ? <input type="hidden" name="src" value={src} /> : null}
          <button className="cc-button" type="submit">
            Send my guide
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
