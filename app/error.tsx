"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
        Something went wrong
      </h1>
      <p className="text-sm text-[var(--ink-muted)]">
        The page hit an unexpected error. You can try again, or go back to your
        decks.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/decks"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] px-4 text-sm font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-inset)]"
        >
          Open Decks
        </Link>
      </div>
    </div>
  );
}
