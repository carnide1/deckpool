"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CardImage } from "@/components/CardImage";
import { FilterPanel } from "@/components/search/FilterPanel";
import { NameSearchBar } from "@/components/search/NameSearchBar";
import { SortSelect } from "@/components/search/SortSelect";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useCardPrefs } from "@/contexts/CardPrefsContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { filterRivalReferenceUniverse } from "@/lib/builder";
import { imageCandidates } from "@/lib/cardPrefs";
import { getConstructionRules } from "@/lib/construction";
import { assignCardBucket } from "@/lib/rivals";
import {
  applySearchFilters,
  EMPTY_FILTERS,
  type SearchFilters,
} from "@/lib/search/filters";
import { sortCards, type SortKey } from "@/lib/search/sortCards";
import type { DeckPoolCard } from "@/types/catalog";

const MAX_RESULTS = 96;
const PICKER_SORTS: SortKey[] = ["newest", "serial", "name", "cost", "category"];

export function RivalCardPickerModal({
  open,
  onClose,
  title,
  leader,
  selectedIds,
  otherBucketIds,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  leader: DeckPoolCard;
  selectedIds: readonly string[];
  otherBucketIds: readonly string[];
  onSave: (nextIds: string[]) => Promise<void> | void;
}) {
  const { cards } = useCatalog();
  const { preferredByCardId } = useCardPrefs();
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("newest");
  const [draft, setDraft] = useState<string[]>(() => [...selectedIds]);
  const [saving, setSaving] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft([...selectedIds]);
      setFilters(EMPTY_FILTERS);
      setSort("newest");
    }
  }

  const constructionRules = useMemo(() => getConstructionRules(), []);

  const legalPool = useMemo(
    () => filterRivalReferenceUniverse(cards, leader, constructionRules),
    [cards, leader, constructionRules],
  );

  const visible = useMemo(() => {
    const filtered = applySearchFilters(legalPool, filters);
    return sortCards(filtered, sort).slice(0, MAX_RESULTS);
  }, [legalPool, filters, sort]);

  const draftSet = useMemo(() => new Set(draft), [draft]);
  const otherSet = useMemo(() => new Set(otherBucketIds), [otherBucketIds]);
  const legalIds = useMemo(
    () => new Set(legalPool.map((card) => card.id)),
    [legalPool],
  );

  const toggle = (card: DeckPoolCard) => {
    if (!legalIds.has(card.id)) return;
    if (otherSet.has(card.id) && !draftSet.has(card.id)) return;
    setDraft((prev) => {
      if (prev.includes(card.id)) return prev.filter((id) => id !== card.id);
      return [...prev, card.id];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const legalDraft = draft.filter((id) => legalIds.has(id));
      const { target } = assignCardBucket(
        selectedIds,
        otherBucketIds,
        legalDraft,
      );
      await onSave(target);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save cards",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="wide"
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void handleSave()}
          confirmLabel="Save cards"
          confirming={saving}
        />
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-[var(--ink-muted)]">
          Same color and construction rules as building under{" "}
          {leader.name}. Banned cards are hidden. Tap to select; a card cannot
          sit in both Key pieces and Tech.
        </p>
        <NameSearchBar
          value={filters.text}
          onChange={(text) => setFilters((prev) => ({ ...prev, text }))}
          textField={filters.textField}
          onTextFieldChange={(textField) =>
            setFilters((prev) => ({ ...prev, textField }))
          }
          inputClassName="h-9 rounded-lg text-sm shadow-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            cards={legalPool}
            allowedColors={leader.colors}
            allowedCategories={["Character", "Event", "Stage"]}
            showHeading={false}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[var(--ink-muted)]">
            {visible.length.toLocaleString()} shown
            {visible.length >= MAX_RESULTS ? "+" : ""}. Selected: {draft.length}
          </p>
          <SortSelect
            value={sort}
            onChange={setSort}
            options={PICKER_SORTS}
            compact
          />
        </div>
        <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
          {visible.map((card) => {
            const selected = draftSet.has(card.id);
            const inOther = !selected && otherSet.has(card.id);
            const [src, ...fallbacks] = imageCandidates(
              card,
              preferredByCardId,
            );
            return (
              <button
                key={card.id}
                type="button"
                disabled={inOther}
                aria-pressed={selected}
                onClick={() => toggle(card)}
                className={[
                  "overflow-hidden rounded-md border-2 text-left",
                  selected
                    ? "border-[var(--accent-ocean)]"
                    : inOther
                      ? "border-[var(--bg-inset)] opacity-40"
                      : "border-transparent hover:border-[var(--bg-inset)]",
                ].join(" ")}
              >
                <CardImage
                  src={src}
                  fallbackSrcs={fallbacks}
                  alt={card.name}
                  width={100}
                  height={140}
                  className="h-auto w-full object-cover"
                />
                <span className="block truncate px-1 py-0.5 text-[10px] text-[var(--ink-muted)]">
                  {card.id}
                  {inOther ? " · other" : ""}
                </span>
              </button>
            );
          })}
        </div>
        {visible.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">No cards match.</p>
        ) : null}
      </div>
    </Modal>
  );
}
