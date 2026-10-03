"use client";

import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { cleanCardsMap } from "@/lib/decks";
import { formatOptcgSimList } from "@/lib/deckList";
import { copyTextToClipboard } from "@/lib/shares";
import type { Variation } from "@/types/deck";

export function ExportSimButton({
  leaderId,
  variation,
}: {
  leaderId: string;
  variation: Variation | null;
}) {
  const cardCount = variation
    ? Object.keys(cleanCardsMap(variation.cards)).length
    : 0;
  const empty = cardCount === 0;

  const onExport = async () => {
    if (!variation || empty) {
      toast.error("Add cards before copying this list.");
      return;
    }
    try {
      await copyTextToClipboard(formatOptcgSimList(leaderId, variation.cards));
      toast.success("Copied for OPTCGSim.");
    } catch {
      toast.error("Could not copy. Allow clipboard access and try again.");
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => void onExport()}
      disabled={empty}
      aria-label="Copy to Clipboard"
    >
      Copy to Clipboard
    </Button>
  );
}
