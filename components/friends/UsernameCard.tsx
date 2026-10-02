"use client";

import { useState } from "react";
import { Copy, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { UsernameClaimForm } from "@/components/friends/UsernameClaimForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { copyTextToClipboard } from "@/lib/shares";

export function UsernameCard({ username }: { username: string }) {
  const [changing, setChanging] = useState(false);

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(username);
      toast.success("Username copied");
    } catch {
      toast(`Your username: @${username}`);
    }
  };

  return (
    <section className="poster-panel p-5">
      <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
        Your username
      </h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Share it so friends can add you.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-semibold text-[var(--ink-primary)]">
          @{username}
        </span>
        <Button variant="secondary" size="sm" onClick={() => void handleCopy()}>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setChanging(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Change
        </Button>
      </div>

      <Modal
        title="Change username"
        open={changing}
        onClose={() => setChanging(false)}
        closeOnOverlayClick={false}
      >
        <p className="mb-3 text-sm text-[var(--ink-muted)]">
          Your old username frees up right away. Friends stay friends.
        </p>
        <UsernameClaimForm
          initialValue={username}
          submitLabel="Change username"
          onDone={() => setChanging(false)}
        />
      </Modal>
    </section>
  );
}
