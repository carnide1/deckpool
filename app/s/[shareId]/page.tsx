"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShareDeckView } from "@/components/share/ShareDeckView";
import { getDeckShare } from "@/lib/shares";
import type { DeckShare } from "@/types/share";

function ShareNotFound({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center">
      <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
        Link not found
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">{message}</p>
    </div>
  );
}

function SharedDeckLoader({ shareId }: { shareId: string }) {
  const [share, setShare] = useState<DeckShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getDeckShare(shareId)
      .then((row) => {
        if (cancelled) return;
        if (!row) {
          setShare(null);
          setError("This share link was not found.");
          return;
        }
        setShare(row);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setShare(null);
          setError(
            err instanceof Error
              ? err.message
              : "Could not load this shared deck.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shareId]);

  if (loading) {
    return (
      <p className="px-4 py-8 text-sm text-[var(--ink-muted)]">
        Loading shared deck…
      </p>
    );
  }

  if (error || !share) {
    return (
      <ShareNotFound message={error ?? "This share link was not found."} />
    );
  }

  return <ShareDeckView share={share} />;
}

export default function SharedDeckPage() {
  const params = useParams<{ shareId: string }>();
  const shareId =
    typeof params.shareId === "string" ? params.shareId.trim() : "";

  if (!shareId) {
    return <ShareNotFound message="Missing share link." />;
  }

  return <SharedDeckLoader key={shareId} shareId={shareId} />;
}
