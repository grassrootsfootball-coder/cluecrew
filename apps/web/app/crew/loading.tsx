import { loadingLine } from '@/lib/voice';

/** Themed loading state — in-world, never technical (Addendum A §1.1 rule 4). */
export default function CrewLoading() {
  return (
    <div className="crew-shimmer" role="status">
      <span className="glass" aria-hidden>
        🔍
      </span>
      <p>{loadingLine()}</p>
    </div>
  );
}
