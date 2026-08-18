"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LabelEditor } from "@/components/collection/LabelEditor";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { incrementCollectionFromProduct } from "@/lib/collection";
import { createDeckFromStarter } from "@/lib/decks";
import { loadProductContents, loadProductIndex } from "@/lib/products";
import type { ProductIndexEntry } from "@/types/product";

export function AddStarterDeckModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { cardsById } = useCatalog();
  const { ownedMap, allLabels } = useCollection();
  const [products, setProducts] = useState<ProductIndexEntry[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [alsoCreateDeck, setAlsoCreateDeck] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingProducts(true);
    void loadProductIndex()
      .then((rows) => {
        setProducts(rows);
        setSelectedId((current) => current || rows[0]?.id || "");
      })
      .catch(() => toast.error("Could not load starter products"))
      .finally(() => setLoadingProducts(false));
  }, [open]);

  const reset = () => {
    setLabels([]);
    setAlsoCreateDeck(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = async () => {
    if (!user || !selectedId) return;
    setSubmitting(true);
    try {
      const product = products.find((row) => row.id === selectedId);
      if (!product) throw new Error("Pick a starter deck");

      const contents = await loadProductContents(selectedId);
      await incrementCollectionFromProduct(
        user.uid,
        contents,
        labels,
        ownedMap,
      );

      if (alsoCreateDeck) {
        const deckId = await createDeckFromStarter(
          user.uid,
          product,
          contents,
          cardsById,
        );
        toast.success(`Added ${product.name} and created a deck`);
        handleClose();
        router.push(`/decks?created=${deckId}`);
        return;
      }

      toast.success(`Added ${product.name} to your collection`);
      handleClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add starter deck",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add starter deck"
      open={open}
      onClose={handleClose}
      footer={
        <ModalActions
          onCancel={handleClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="Add to collection"
          confirming={submitting}
          disabled={!selectedId || loadingProducts}
        />
      }
    >
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        Increments every card in the product box with real copy counts. Adding
        the same deck again stacks on what you already own.
      </p>

      <label className="mb-4 flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[var(--ink-primary)]">Product</span>
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          disabled={loadingProducts || submitting}
          className="h-10 rounded-lg border border-[var(--bg-inset)] bg-white px-3 text-[var(--ink-primary)] focus:border-[var(--accent-ocean)] focus:outline-none"
        >
          {loadingProducts ? (
            <option value="">Loading…</option>
          ) : (
            products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))
          )}
        </select>
      </label>

      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-[var(--ink-primary)]">
          Labels for every card (optional)
        </p>
        <LabelEditor
          labels={labels}
          suggestions={allLabels}
          onChange={setLabels}
          disabled={submitting}
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-[var(--ink-primary)]">
        <input
          type="checkbox"
          checked={alsoCreateDeck}
          onChange={(event) => setAlsoCreateDeck(event.target.checked)}
          disabled={submitting}
          className="mt-0.5"
        />
        <span>
          Also create a deck named after this product with a{" "}
          <strong>Main</strong> variation prefilled from the 50-card list.
        </span>
      </label>
    </Modal>
  );
}
