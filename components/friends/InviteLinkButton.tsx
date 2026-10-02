"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  createInvite,
  inviteAbsoluteUrl,
  inviteShareText,
} from "@/lib/invites";
import { copyTextToClipboard } from "@/lib/shares";

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Makes a fresh 7-day invite link and opens the share sheet (or copies it). */
export function InviteLinkButton() {
  const { publicProfile } = useUserProfile();
  const [busy, setBusy] = useState(false);

  if (!publicProfile?.username) return null;

  const onInvite = async () => {
    setBusy(true);
    try {
      const code = await createInvite(publicProfile);
      const url = inviteAbsoluteUrl(code, window.location.origin);

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: "DeckPool invite",
            text: inviteShareText(publicProfile.username),
            url,
          });
          return;
        } catch (error) {
          if (isAbort(error)) return;
          console.error(error);
        }
      }

      try {
        await copyTextToClipboard(url);
        toast.success(
          "Invite link copied — paste it in a text. It works for 7 days.",
        );
      } catch {
        toast.success(`Invite link: ${url}`, { duration: 12000 });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create invite link",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => void onInvite()}
      disabled={busy}
    >
      <Send className="h-3.5 w-3.5" aria-hidden />
      {busy ? "Creating…" : "Invite link"}
    </Button>
  );
}
