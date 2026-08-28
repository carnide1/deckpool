"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useWanted } from "@/contexts/WantedContext";
import {
  adjustWantedQuantity,
  catchWantedCopies,
  nextToggleWanted,
  raiseWantedGaps,
  setWantedQuantity,
  type CatchRequest,
} from "@/lib/wanted";

export function useWantedWrite() {
  const { user } = useAuth();
  const { wantedMap } = useWanted();
  const [saving, setSaving] = useState(false);

  const setQuantity = useCallback(
    async (cardId: string, quantity: number) => {
      if (!user) return;
      setSaving(true);
      try {
        await setWantedQuantity(user.uid, cardId, quantity);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not update bounty",
        );
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  const adjustQuantity = useCallback(
    async (cardId: string, delta: number) => {
      if (!user || delta === 0) return;
      setSaving(true);
      try {
        await adjustWantedQuantity(user.uid, cardId, delta);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not update bounty",
        );
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  const togglePosted = useCallback(
    async (cardId: string) => {
      if (!user) return;
      const current = wantedMap[cardId]?.quantity ?? 0;
      await setQuantity(cardId, nextToggleWanted(current));
    },
    [user, wantedMap, setQuantity],
  );

  const catchCopies = useCallback(
    async (cardId: string, requested: CatchRequest) => {
      if (!user) return;
      setSaving(true);
      try {
        const result = await catchWantedCopies(user.uid, cardId, requested);
        if (result.caught > 0) {
          toast.success(`Caught ×${result.caught} · ${cardId}`);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not catch bounty",
        );
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  const postGaps = useCallback(
    async (gaps: Record<string, number>) => {
      if (!user) return;
      setSaving(true);
      try {
        const updated = await raiseWantedGaps(user.uid, gaps);
        if (updated === 0) {
          toast.success("Already on the board");
        } else {
          toast.success(
            `Posted ${updated} ${updated === 1 ? "bounty" : "bounties"}`,
          );
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not post unowned copies",
        );
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  return {
    saving,
    setQuantity,
    adjustQuantity,
    togglePosted,
    catchCopies,
    postGaps,
  };
}
