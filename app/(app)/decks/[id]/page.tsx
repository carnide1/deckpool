"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BuilderView } from "@/components/builder/BuilderView";
import { DeckView } from "@/components/builder/DeckView";
import { useCatalog } from "@/contexts/CatalogContext";
import { useDecks } from "@/contexts/DecksContext";

function DeckPageContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const deckId = params.id;
  const mode = searchParams.get("mode") === "edit" ? "edit" : "view";
  const { loading: catalogLoading } = useCatalog();
  const { decks, loading: decksLoading } = useDecks();

  const deck = decks.find((row) => row.id === deckId) ?? null;

  if (decksLoading || catalogLoading) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">Loading deck…</p>
    );
  }

  if (!deck) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/decks"
          className="inline-flex items-center gap-2 text-sm text-[var(--accent-ocean)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to decks
        </Link>
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          Deck not found.
        </p>
      </div>
    );
  }

  return mode === "edit" ? (
    <BuilderView deck={deck} />
  ) : (
    <DeckView deck={deck} />
  );
}

export default function DeckPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[var(--ink-muted)]">Loading deck…</p>
      }
    >
      <DeckPageContent />
    </Suspense>
  );
}
