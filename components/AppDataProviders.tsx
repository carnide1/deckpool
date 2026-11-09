"use client";

import { CatalogProvider } from "@/contexts/CatalogContext";
import { CardPrefsProvider } from "@/contexts/CardPrefsContext";
import { CollectionProvider } from "@/contexts/CollectionContext";
import { DecksProvider } from "@/contexts/DecksContext";
import { FriendsProvider } from "@/contexts/FriendsContext";
import { RivalsProvider } from "@/contexts/RivalsContext";
import { WantedProvider } from "@/contexts/WantedContext";

/** Static catalog + Firestore collection/decks/friends — authenticated shell only. */
export function AppDataProviders({ children }: { children: React.ReactNode }) {
  return (
    <CatalogProvider>
      <CollectionProvider>
        <WantedProvider>
          <CardPrefsProvider>
            <DecksProvider>
              <RivalsProvider>
                <FriendsProvider>{children}</FriendsProvider>
              </RivalsProvider>
            </DecksProvider>
          </CardPrefsProvider>
        </WantedProvider>
      </CollectionProvider>
    </CatalogProvider>
  );
}
