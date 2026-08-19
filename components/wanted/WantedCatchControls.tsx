"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function WantedCatchControls({
  remaining,
  disabled,
  onCatchOne,
  onCatchAll,
}: {
  remaining: number;
  disabled?: boolean;
  onCatchOne: () => void;
  onCatchAll: () => void;
}) {
  if (remaining <= 0) return null;

  return (
    <div className="mt-2 flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={onCatchOne}
        disabled={disabled}
        className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--bg-inset)] bg-[var(--bg-panel)] px-2 text-[10px] font-semibold text-[var(--ink-primary)] disabled:opacity-40"
        aria-label={`Caught 1 of ${remaining}`}
      >
        <Plus className="h-3 w-3" />
        Caught 1
      </button>
      <Button
        size="sm"
        className="h-7 px-2 text-[10px]"
        disabled={disabled}
        onClick={onCatchAll}
      >
        Caught
      </Button>
    </div>
  );
}
