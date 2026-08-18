"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCollection } from "@/contexts/CollectionContext";
import {
  adjustCollectionQuantity,
  setCollectionQuantity,
} from "@/lib/collection";

export function useCollectionWrite(allowCreate: boolean) {
  const { user } = useAuth();
  const { ownedMap } = useCollection();
  const [saving, setSaving] = useState(false);

  const adjustQuantity = useCallback(
    async (cardId: string, delta: number) => {
      if (!user || delta === 0) return;
      setSaving(true);
      try {
        await adjustCollectionQuantity(user.uid, cardId, delta, allowCreate);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not update collection",
        );
      } finally {
        setSaving(false);
      }
    },
    [user, allowCreate],
  );

  const setLabels = useCallback(
    async (cardId: string, labels: string[]) => {
      if (!user) return;
      const currentQty = ownedMap[cardId]?.quantity ?? 0;
      const quantity =
        currentQty <= 0 && labels.length > 0 && allowCreate ? 1 : currentQty;
      if (quantity <= 0) return;
      setSaving(true);
      try {
        await setCollectionQuantity(user.uid, cardId, quantity, labels);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not update labels",
        );
      } finally {
        setSaving(false);
      }
    },
    [user, ownedMap, allowCreate],
  );

  return { saving, adjustQuantity, setLabels };
}
