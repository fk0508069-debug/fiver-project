export function KpiCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded border p-5 ${accent ? "border-accent bg-accent-soft" : "border-line bg-surface"}`}>
      <p className={`text-xs font-medium uppercase tracking-wider ${accent ? "text-accent-dark" : "text-ink-muted"}`}>{label}</p>
      <p className={`mt-2 font-display text-2xl ${accent ? "text-accent-dark" : "text-ink"}`}>{value}</p>
    </div>
  );
}