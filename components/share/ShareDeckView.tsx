"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CardImage } from "@/components/CardImage";
import { CardGrid } from "@/components/cards/CardGrid";
import { Modal } from "@/components/ui/Modal";
import { ColorPills } from "@/components/decks/ColorPills";
import { useCatalog } from "@/contexts/CatalogContext";
import { mainDeckCount } from "@/lib/builder";
import { imageCandidates, imageForCard } from "@/lib/cardPrefs";
import { sortCards } from "@/lib/search/sortCards";
import type { CardCategory, DeckPoolCard } from "@/types/catalog";
import type { DeckShare } from "@/types/share";

const VIEW_GROUPS: CardCategory[] = ["Character", "Event", "Stage"];

function ShareCardDetail({
  card,
  open,
  onClose,
  preferredImageUrl,
  qty,
}: {
  card: DeckPoolCard | null;
  open: boolean;
  onClose: () => void;
  preferredImageUrl: string | null;
  qty: number;
}) {
  if (!card) return null;

  const preferred = preferredImageUrl ?? card.images[0] ?? null;
  const fallbacks = preferred
    ? card.images.filter((url) => url !== preferred)
    : card.images.slice(1);

  return (
    <Modal title={card.name} open={open} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--ink-muted)]">
          {card.id}
          {qty > 0 ? (
            <span className="ml-2 tabular-nums font-semibold text-[var(--ink-primary)]">
              ×{qty}
            </span>
          ) : null}
        </p>
        {preferred ? (
          <CardImage
            src={preferred}
            fallbackSrcs={fallbacks}
            alt={card.name}
            width={240}
            height={336}
            className="mx-auto"
            priority
          />
        ) : null}
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[var(--ink-muted)]">Category</dt>
            <dd className="font-medium">{card.category}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Rarity</dt>
            <dd className="font-medium">{card.rarity}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Cost</dt>
            <dd className="font-medium tabular-nums">{card.cost ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Power</dt>
            <dd className="font-medium tabular-nums">{card.power ?? "—"}</dd>
          </div>
        </dl>
        {card.types.length > 0 ? (
          <div>
            <p className="mb-1 text-sm text-[var(--ink-muted)]">Types</p>
            <p className="text-sm">{card.types.join(" · ")}</p>
          </div>
        ) : null}
        {card.effect ? (
          <div>
            <p className="mb-1 text-sm text-[var(--ink-muted)]">Effect</p>
            <p className="text-sm leading-relaxed">{card.effect}</p>
          </div>
        ) : null}
        {card.trigger ? (
          <div>
            <p className="mb-1 text-sm text-[var(--ink-muted)]">Trigger</p>
            <p className="text-sm leading-relaxed">{card.trigger}</p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export function ShareDeckView({ share }: { share: DeckShare }) {
  const { cardsById, loading, error } = useCatalog();
  const [selectedCard, setSelectedCard] = useState<DeckPoolCard | null>(null);

  const leader = cardsById.get(share.leaderId) ?? null;
  const leaderPreferredUrl = share.preferredImages[share.leaderId] ?? null;
  const [leaderImage, ...leaderFallbacks] = leader
    ? imageCandidates(leader, share.preferredImages)
    : leaderPreferredUrl
      ? [leaderPreferredUrl]
      : [];

  const grouped = useMemo(() => {
    return VIEW_GROUPS.map((category) => {
      const rows = Object.entries(share.cards)
        .filter(([, qty]) => qty > 0)
        .map(([cardId, qty]) => {
          const card = cardsById.get(cardId);
          return card && card.category === category ? { card, qty } : null;
        })
        .filter(
          (row): row is { card: DeckPoolCard; qty: number } => row !== null,
        );

      const sorted = sortCards(
        rows.map((row) => row.card),
        "cost",
      );
      const quantityById: Record<string, number> = {};
      for (const row of rows) quantityById[row.card.id] = row.qty;

      return { category, cards: sorted, quantityById };
    }).filter((group) => group.cards.length > 0);
  }, [share.cards, cardsById]);

  const deckCount = mainDeckCount(share.cards);
  const cardIds = Object.keys(share.cards).filter(
    (id) => (share.cards[id] ?? 0) > 0,
  );
  const unknownIds = cardIds.filter((id) => !cardsById.has(id));
  const leaderUnknown = !leader;

  if (loading) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">Loading catalog…</p>
    );
  }

  if (error) {
    return <p className="text-sm text-[var(--badge-illegal)]">{error}</p>;
  }

  const emptyMessage =
    deckCount === 0
      ? "This shared list has no cards."
      : unknownIds.length === cardIds.length
        ? "None of these cards are in this catalog version yet."
        : "No matching cards to show from this catalog version.";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
      <div className="poster-panel p-4">
        <div className="flex flex-wrap items-start gap-4">
          {leaderImage ? (
            <CardImage
              src={leaderImage}
              fallbackSrcs={leaderFallbacks}
              alt={leader?.name ?? share.leaderId}
              width={96}
              height={134}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-ocean)]">
              Shared deck
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold text-[var(--ink-primary)]">
              {share.deckName}
            </h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {leader?.name ?? share.leaderId}
              <span className="mx-1.5 text-[var(--bg-inset)]">·</span>
              {share.variationName}
            </p>
            {leader ? (
              <div className="mt-2">
                <ColorPills colors={leader.colors} />
              </div>
            ) : null}
            <p className="mt-3 text-sm tabular-nums text-[var(--ink-muted)]">
              {deckCount}/50 cards
            </p>
            {leaderUnknown ? (
              <p className="mt-2 text-xs text-[var(--ink-muted)]">
                Leader {share.leaderId} is not in this catalog version.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="poster-panel p-8 text-center text-sm text-[var(--ink-muted)]">
          {emptyMessage}
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.category} className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
              {group.category}s
            </h2>
            <CardGrid
              cards={group.cards}
              quantityById={group.quantityById}
              preferredImages={share.preferredImages}
              onSelect={setSelectedCard}
            />
          </section>
        ))
      )}

      {unknownIds.length > 0 ? (
        <p className="text-xs text-[var(--ink-muted)]">
          {unknownIds.length} card id
          {unknownIds.length === 1 ? "" : "s"} not in this catalog version.
        </p>
      ) : null}

      <p className="pb-8 text-center text-sm text-[var(--ink-muted)]">
        Built with{" "}
        <Link
          href="/"
          className="font-semibold text-[var(--accent-ocean)] hover:underline"
        >
          DeckPool
        </Link>
      </p>

      <ShareCardDetail
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        preferredImageUrl={
          selectedCard
            ? imageForCard(selectedCard, share.preferredImages)
            : null
        }
        qty={selectedCard ? share.cards[selectedCard.id] ?? 0 : 0}
      />
    </div>
  );
}
