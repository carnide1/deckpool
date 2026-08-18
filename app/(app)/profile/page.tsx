"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { EditDisplayNameForm } from "@/components/profile/EditDisplayNameForm";
import { ProfileStatsPoster } from "@/components/profile/ProfileStatsPoster";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { useCollection } from "@/contexts/CollectionContext";
import { useDecks } from "@/contexts/DecksContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { computeProfileStats } from "@/lib/profileStats";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { profile, profileLoading, profileError } = useUserProfile();
  const { ownedMap, loading: collectionLoading } = useCollection();
  const { decks, variationsByDeckId, loading: decksLoading } = useDecks();
  const { cardsById } = useCatalog();

  const ownedQtyById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [cardId, item] of Object.entries(ownedMap)) {
      map[cardId] = item.quantity;
    }
    return map;
  }, [ownedMap]);

  const stats = useMemo(
    () =>
      computeProfileStats(ownedQtyById, decks, variationsByDeckId, cardsById),
    [ownedQtyById, decks, variationsByDeckId, cardsById],
  );

  const displayName =
    profile?.displayName?.trim() ||
    user?.displayName?.trim() ||
    "Anonymous pirate";

  const statsLoading = collectionLoading || decksLoading;

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log out");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
          Profile
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Your wanted poster, binder stats, and account settings.
        </p>
      </div>

      {profileError ? (
        <p className="text-sm text-[var(--accent-pirate-red)]">{profileError}</p>
      ) : null}

      <ProfileStatsPoster
        displayName={displayName}
        stats={stats}
        loading={profileLoading || statsLoading}
      />

      <section className="poster-panel p-5">
        <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
          Account
        </h2>
        {profileLoading ? (
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Loading account…
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            <EditDisplayNameForm />

            <div>
              <p className="text-sm font-medium text-[var(--ink-primary)]">
                Email
              </p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {profile?.email || user?.email || "—"}
              </p>
            </div>

            <Button variant="secondary" onClick={() => void handleLogout()}>
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
