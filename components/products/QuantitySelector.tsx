"use client";

export function QuantitySelector({
  value, onChange, max = 99, min = 1,
}: { value: number; onChange: (v: number) => void; max?: number; min?: number }) {
  return (
    <div className="inline-flex items-center rounded-sm border border-line-strong">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="px-3.5 py-2 text-ink-muted hover:text-ink disabled:opacity-40"
      >−</button>
      <span className="min-w-[2.5rem] text-center text-sm font-semibold">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="px-3.5 py-2 text-ink-muted hover:text-ink disabled:opacity-40"
      >+</button>
    </div>
  );
}