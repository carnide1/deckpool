"use client";

import { useMemo } from "react";
import { CardImage } from "@/components/CardImage";
import { ColorPills } from "@/components/decks/ColorPills";
import { TextInput } from "@/components/ui/TextInput";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { imageCandidates } from "@/lib/cardPrefs";
import { filterLeaderChoices } from "@/lib/leaderChoices";
import type { DeckPoolCard } from "@/types/catalog";

export function LeaderPicker({
  leaders,
  ownedIds,
  excludeId,
  selectedId,
  onSelect,
  query,
  onQueryChange,
  ownedOnly,
  onOwnedOnlyChange,
  emptyOwnedMessage,
}: {
  leaders: DeckPoolCard[];
  ownedIds: ReadonlySet<string>;
  excludeId?: string;
  selectedId: string;
  onSelect: (leader: DeckPoolCard) => void;
  query: string;
  onQueryChange: (next: string) => void;
  ownedOnly: boolean;
  onOwnedOnlyChange: (next: boolean) => void;
  emptyOwnedMessage: string;
}) {
  const { preferredByCardId } = useCardPrefs();

  const ownedPool = useMemo(
    () =>
      filterLeaderChoices(leaders, {
        query: "",
        ownedOnly,
        ownedIds,
        excludeId,
      }),
    [leaders, ownedOnly, ownedIds, excludeId],
  );

  const visible = useMemo(
    () =>
      filterLeaderChoices(leaders, {
        query,
        ownedOnly,
        ownedIds,
        excludeId,
      }),
    [leaders, query, ownedOnly, ownedIds, excludeId],
  );

  const noOwnedLeaders = ownedOnly && ownedPool.length === 0;

  return (
    <div className="space-y-4">
      <button
        type="button"
        role="switch"
        aria-checked={ownedOnly}
        onClick={() => onOwnedOnlyChange(!ownedOnly)}
        className="inline-flex shrink-0 items-center gap-2 text-xs font-medium text-[var(--ink-primary)]"
      >
        <span
          className={[
            "relative h-5 w-9 rounded-full transition-colors",
            ownedOnly ? "bg-[var(--accent-ocean)]" : "bg-[var(--bg-inset)]",
          ].join(" ")}
          aria-hidden
        >
          <span
            className={[
              "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
              ownedOnly ? "translate-x-4" : "translate-x-0",
            ].join(" ")}
          />
        </span>
        Owned
      </button>

      {noOwnedLeaders ? (
        <div className="poster-panel p-4 text-sm text-[var(--ink-muted)]">
          {emptyOwnedMessage}
        </div>
      ) : (
        <>
          <TextInput
            label="Search Leaders"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Name or id"
          />

          <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {visible.map((leader) => {
              const selected = leader.id === selectedId;
              const [image, ...fallbacks] = imageCandidates(
                leader,
                preferredByCardId,
              );
              return (
                <div
                  key={leader.id}
                  onClick={() => onSelect(leader)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(leader);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  className={[
                    "rounded-xl border-2 p-2 text-left transition-colors",
                    selected
                      ? "border-[var(--accent-pirate-red)] bg-[var(--bg-inset)]"
                      : "border-[var(--bg-inset)] hover:border-[var(--accent-ocean)]",
                  ].join(" ")}
                >
                  {image ? (
                    <CardImage
                      src={image}
                      fallbackSrcs={fallbacks}
                      alt={leader.name}
                      width={96}
                      height={134}
                      className="mx-auto"
                    />
                  ) : null}
                  <p className="mt-2 truncate text-xs font-semibold text-[var(--ink-primary)]">
                    {leader.name}
                  </p>
                  <p className="truncate text-[0.625rem] text-[var(--ink-muted)]">
                    {leader.id}
                  </p>
                  {ownedIds.has(leader.id) ? null : (
                    <p className="truncate text-[0.625rem] font-semibold text-[var(--ink-muted)]">
                      Unowned
                    </p>
                  )}
                  <div className="mt-1">
                    <ColorPills colors={leader.colors} />
                  </div>
                </div>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">
              {ownedOnly
                ? "No owned Leaders match that search."
                : "No Leaders match that search."}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
