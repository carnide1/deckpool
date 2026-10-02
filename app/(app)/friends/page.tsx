"use client";

import { AddFriendForm } from "@/components/friends/AddFriendForm";
import { FriendList } from "@/components/friends/FriendList";
import { PrivacyToggles } from "@/components/friends/PrivacyToggles";
import { RequestList } from "@/components/friends/RequestList";
import { UsernameCard } from "@/components/friends/UsernameCard";
import { UsernameClaimForm } from "@/components/friends/UsernameClaimForm";
import { useFriends } from "@/contexts/FriendsContext";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function FriendsPage() {
  const { publicProfile, publicProfileLoading } = useUserProfile();
  const { error } = useFriends();

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
          Friends
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Add crewmates by username and browse their decks, binder, and Wanted.
        </p>
      </div>

      {publicProfileLoading ? (
        <p className="text-sm text-[var(--ink-muted)]">Loading…</p>
      ) : !publicProfile?.username ? (
        <section className="poster-panel max-w-md p-5">
          <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
            Pick a username
          </h2>
          <p className="mt-1 mb-4 text-sm text-[var(--ink-muted)]">
            Pick a username so friends can find you.
          </p>
          <UsernameClaimForm />
        </section>
      ) : (
        <>
          {error ? (
            <p className="text-sm text-[var(--accent-pirate-red)]">{error}</p>
          ) : null}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div className="flex min-w-0 flex-col gap-6">
              <AddFriendForm />
              <RequestList />
              <FriendList />
            </div>
            <div className="flex flex-col gap-6">
              <UsernameCard username={publicProfile.username} />
              <PrivacyToggles />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
