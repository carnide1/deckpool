"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  onDelta,
  disabled,
  min = 0,
}: {
  value: number;
  onDelta: (delta: number) => void;
  disabled?: boolean;
  min?: number;
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => onDelta(-1)}
        disabled={disabled || value <= min}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--bg-inset)] bg-[var(--bg-panel)] text-[var(--ink-primary)] disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-7 text-center text-xs font-semibold tabular-nums text-[var(--ink-primary)]">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onDelta(1)}
        disabled={disabled}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--bg-inset)] bg-[var(--bg-panel)] text-[var(--ink-primary)] disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
