"use client";

import { WantedBoard } from "@/components/wanted/WantedBoard";

export default function WantedPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
          Wanted
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Copies to hunt — extra cards to buy, not a deck list.
        </p>
      </div>

      <WantedBoard />
    </div>
  );
}
