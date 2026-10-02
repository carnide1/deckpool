"use client";

import { CatalogProvider } from "@/contexts/CatalogContext";
import { CardPrefsProvider } from "@/contexts/CardPrefsContext";
import { CollectionProvider } from "@/contexts/CollectionContext";
import { DecksProvider } from "@/contexts/DecksContext";
import { FriendsProvider } from "@/contexts/FriendsContext";
import { WantedProvider } from "@/contexts/WantedContext";

/** Static catalog + Firestore collection/decks/friends — authenticated shell only. */
export function AppDataProviders({ children }: { children: React.ReactNode }) {
  return (
    <CatalogProvider>
      <CollectionProvider>
        <WantedProvider>
          <CardPrefsProvider>
            <DecksProvider>
              <FriendsProvider>{children}</FriendsProvider>
            </DecksProvider>
          </CardPrefsProvider>
        </WantedProvider>
      </CollectionProvider>
    </CatalogProvider>
  );
}
