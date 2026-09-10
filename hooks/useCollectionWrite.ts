"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useWanted } from "@/contexts/WantedContext";
import {
  adjustCollectionQuantity,
  setCollectionLabels,
} from "@/lib/collection";
import { catchWantedCopies } from "@/lib/wanted";

export function useCollectionWrite(allowCreate: boolean) {
  const { user } = useAuth();
  const { wantedMap } = useWanted();
  const [saving, setSaving] = useState(false);

  const adjustQuantity = useCallback(
    async (cardId: string, delta: number) => {
      if (!user || delta === 0) return;
      setSaving(true);
      try {
        const wantedQty = wantedMap[cardId]?.quantity ?? 0;
        if (delta > 0 && wantedQty > 0) {
          const result = await catchWantedCopies(user.uid, cardId, delta);
          if (result.caught > 0) {
            toast.success(`Caught ×${result.caught} · ${cardId}`);
            return;
          }
        }
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
    [user, allowCreate, wantedMap],
  );

  const setLabels = useCallback(
    async (cardId: string, labels: string[]) => {
      if (!user) return;
      setSaving(true);
      try {
        await setCollectionLabels(user.uid, cardId, labels, allowCreate);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not update labels",
        );
      } finally {
        setSaving(false);
      }
    },
    [user, allowCreate],
  );

  return { saving, adjustQuantity, setLabels };
}
