"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DeckPoolCard } from "@/types/catalog";

type CatalogContextValue = {
  cards: DeckPoolCard[];
  cardsById: Map<string, DeckPoolCard>;
  loading: boolean;
  error: string | null;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<DeckPoolCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import("@/data/cards.json")
      .then((mod) => {
        if (cancelled) return;
        const rows = mod.default as DeckPoolCard[];
        setCards(rows);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError("Could not load the card catalog.");
          setCards([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cardsById = useMemo(
    () => new Map(cards.map((card) => [card.id, card])),
    [cards],
  );

  const value = useMemo(
    () => ({ cards, cardsById, loading, error }),
    [cards, cardsById, loading, error],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return ctx;
}
