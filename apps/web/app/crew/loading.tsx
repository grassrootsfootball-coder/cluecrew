/** Themed loading state (§8): in-world, never technical. */
export default function CrewLoading() {
  return (
    <div className="crew-shimmer" role="status" aria-label="Opening the case file">
      <span className="glass" aria-hidden>
        🔍
      </span>
      <p>Dusting for clues…</p>
    </div>
  );
}
