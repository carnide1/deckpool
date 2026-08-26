"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import {
  copyTextToClipboard,
  createDeckShare,
  shareAbsoluteUrl,
} from "@/lib/shares";
import type { Deck } from "@/types/deck";
import type { Variation } from "@/types/deck";

export function ShareLinkButton({
  uid,
  deck,
  variation,
  preferredImages,
}: {
  uid: string;
  deck: Deck;
  variation: Variation | null;
  preferredImages: Record<string, string>;
}) {
  const [busy, setBusy] = useState(false);

  const onShare = async () => {
    if (!variation) {
      toast.error("Pick a variation to share.");
      return;
    }
    if (Object.keys(variation.cards).length === 0) {
      toast.error("Add cards before sharing this list.");
      return;
    }

    setBusy(true);
    try {
      const share = await createDeckShare({
        ownerUid: uid,
        deckId: deck.id,
        variationId: variation.id,
        deckName: deck.name,
        leaderId: deck.leaderId,
        variationName: variation.name,
        cards: variation.cards,
        preferredImages,
      });
      const origin =
        typeof window !== "undefined" ? window.location.origin : undefined;
      const url = shareAbsoluteUrl(share.id, origin);
      try {
        await copyTextToClipboard(url);
        toast.success("Share link copied — paste it in a text.");
      } catch {
        toast.success(`Link ready: ${url}`, { duration: 12000 });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create share link",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => void onShare()}
      disabled={busy || !variation}
      aria-label="Copy share link"
    >
      <Link2 className="h-4 w-4" aria-hidden />
      {busy ? "Creating…" : "Copy share link"}
    </Button>
  );
}
