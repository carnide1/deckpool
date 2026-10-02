"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { useFriends } from "@/contexts/FriendsContext";

export function RequestList() {
  const { incoming, outgoing, acceptRequest, declineRequest, cancelRequest } =
    useFriends();
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (id: string, action: () => Promise<void>, ok: string) => {
    setBusyId(id);
    try {
      await action();
      toast.success(ok);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  if (incoming.length === 0 && outgoing.length === 0) return null;

  return (
    <section className="poster-panel flex flex-col gap-4 p-5">
      {incoming.length > 0 ? (
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
            Incoming requests
          </h2>
          <ul className="mt-2 flex flex-col divide-y divide-[var(--bg-inset)]">
            {incoming.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--ink-primary)]">
                    {row.fromDisplayName || `@${row.fromUsername}`}
                  </p>
                  <p className="truncate text-xs text-[var(--ink-muted)]">
                    @{row.fromUsername}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={busyId === row.id}
                    onClick={() =>
                      void run(
                        row.id,
                        () => acceptRequest(row.fromUid),
                        `You and @${row.fromUsername} are friends`,
                      )
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === row.id}
                    onClick={() =>
                      void run(
                        row.id,
                        () => declineRequest(row.fromUid),
                        "Request declined",
                      )
                    }
                  >
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {outgoing.length > 0 ? (
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
            Sent requests
          </h2>
          <ul className="mt-2 flex flex-col divide-y divide-[var(--bg-inset)]">
            {outgoing.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <p className="truncate font-semibold text-[var(--ink-primary)]">
                  @{row.toUsername}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyId === row.id}
                  onClick={() =>
                    void run(
                      row.id,
                      () => cancelRequest(row.toUid),
                      "Request canceled",
                    )
                  }
                >
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
