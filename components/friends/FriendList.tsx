"use client";

import { useState } from "react";
import Link from "next/link";
import { UserMinus } from "lucide-react";
import { RemoveFriendModal } from "@/components/friends/RemoveFriendModal";
import { useFriends } from "@/contexts/FriendsContext";
import type { PublicProfile } from "@/types/friends";

export function FriendList() {
  const { friends, loading } = useFriends();
  const [removing, setRemoving] = useState<PublicProfile | null>(null);

  return (
    <section className="poster-panel p-5">
      <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
        Friends
      </h2>
      {loading ? (
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Loading friends…</p>
      ) : friends.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          No friends yet. Add someone by their username.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-[var(--bg-inset)]">
          {friends.map((friend) => (
            <li
              key={friend.uid}
              className="flex items-center justify-between gap-2 py-2"
            >
              <Link
                href={`/friends/${friend.uid}`}
                className="group min-w-0 flex-1"
              >
                <p className="truncate font-semibold text-[var(--ink-primary)] group-hover:text-[var(--accent-ocean)]">
                  {friend.displayName || `@${friend.username}`}
                </p>
                <p className="truncate text-xs text-[var(--ink-muted)]">
                  @{friend.username}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => setRemoving(friend)}
                className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--accent-pirate-red)]"
                aria-label={`Remove @${friend.username}`}
                title="Remove friend"
              >
                <UserMinus className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <RemoveFriendModal
        friend={removing}
        open={removing !== null}
        onClose={() => setRemoving(null)}
      />
    </section>
  );
}
