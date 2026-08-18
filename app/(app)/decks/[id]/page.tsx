"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BuilderView } from "@/components/builder/BuilderView";
import { useCatalog } from "@/contexts/CatalogContext";
import { useDecks } from "@/contexts/DecksContext";

export default function BuilderPage() {
  const params = useParams<{ id: string }>();
  const deckId = params.id;
  const { loading: catalogLoading } = useCatalog();
  const { decks, loading: decksLoading } = useDecks();

  const deck = decks.find((row) => row.id === deckId) ?? null;

  if (decksLoading || catalogLoading) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">Loading builder…</p>
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

  return <BuilderView deck={deck} />;
}
